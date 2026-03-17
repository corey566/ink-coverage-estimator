import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema } from "@shared/schema";
import type { CostEstimate, CostResult } from "@shared/schema";
import { DocumentAnalysisEngine } from "./analysis-engine";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const analysisEngine = new DocumentAnalysisEngine();

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/postscript',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/gif',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

function calculateCost(estimate: CostEstimate): CostResult {
  const { coverage, wastePercent, mode } = estimate;

  // Formula from documentation:
  // effective_yield = rated_yield × (5 / actual_coverage)
  // cost_per_page = price / effective_yield
  // adjusted_cost = base_cost × (1 + waste% / 100)

  const wasteFactor = 1 + (wastePercent / 100);
  const breakdown: CostResult['breakdown'] = {};
  let totalBase = 0;

  if (mode === 'cmyk') {
    const channels = [
      { name: 'cyan', coverage: coverage.cyan, yield: estimate.cyanYield, price: estimate.cyanPrice },
      { name: 'magenta', coverage: coverage.magenta, yield: estimate.magentaYield, price: estimate.magentaPrice },
      { name: 'yellow', coverage: coverage.yellow, yield: estimate.yellowYield, price: estimate.yellowPrice },
      { name: 'black', coverage: coverage.black, yield: estimate.blackYield, price: estimate.blackPrice },
    ] as const;

    for (const ch of channels) {
      if (!ch.yield || !ch.price || !ch.coverage) continue;
      const effectiveYield = ch.yield * (5 / Math.max(ch.coverage, 0.1));
      const costPerPage = ch.price / effectiveYield;
      (breakdown as any)[ch.name] = Math.round(costPerPage * 10000) / 10000;
      totalBase += costPerPage;
    }
  } else {
    // Color + Black mode
    // color load = average of C, M, Y
    const colorLoad = (coverage.cyan + coverage.magenta + coverage.yellow) / 3;
    const blackLoad = coverage.black;

    if (estimate.colorYield && estimate.colorPrice && colorLoad > 0) {
      const effectiveColorYield = estimate.colorYield * (5 / Math.max(colorLoad, 0.1));
      const colorCost = estimate.colorPrice / effectiveColorYield;
      breakdown.color = Math.round(colorCost * 10000) / 10000;
      totalBase += colorCost;
    }

    if (estimate.blackYield && estimate.blackPrice && blackLoad > 0) {
      const effectiveBlackYield = estimate.blackYield * (5 / Math.max(blackLoad, 0.1));
      const blackCost = estimate.blackPrice / effectiveBlackYield;
      breakdown.black = Math.round(blackCost * 10000) / 10000;
      totalBase += blackCost;
    }
  }

  const adjusted = totalBase * wasteFactor;
  const variationBand = 0.08; // ±8% default variation

  return {
    mode,
    baseCostPerPage: Math.round(totalBase * 10000) / 10000,
    adjustedCostPerPage: Math.round(adjusted * 10000) / 10000,
    rangeMin: Math.round(adjusted * (1 - variationBand) * 10000) / 10000,
    rangeMax: Math.round(adjusted * (1 + variationBand) * 10000) / 10000,
    breakdown
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload document
  app.post("/api/documents/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const document = await storage.createDocument({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      });

      res.json(document);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Start analysis - accepts optional mode parameter
  app.post("/api/documents/:id/analyze", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const mode = (req.body?.mode === 'color_black') ? 'color_black' : 'cmyk';

      const document = await storage.getDocument(documentId);
      if (!document) return res.status(404).json({ message: "Document not found" });

      let analysis = await storage.getAnalysisByDocumentId(documentId);
      if (analysis) {
        return res.json(analysis);
      }

      analysis = await storage.createAnalysis({
        documentId,
        status: "processing",
        mode,
        totalPages: null,
        overallCoverage: null,
        pageBreakdown: null,
        errorMessage: null
      });

      setImmediate(async () => {
        try {
          const filePath = path.join(uploadDir, document.filename);
          console.log(`Starting analysis for ${document.originalName} (mode: ${mode})`);
          const results = await analysisEngine.analyzeDocument(filePath, document.mimeType);

          await storage.updateAnalysis(analysis.id, {
            status: "completed",
            totalPages: results.totalPages,
            overallCoverage: results.overallCoverage,
            pageBreakdown: results.pageBreakdown,
            completedAt: new Date()
          });

          console.log(`Analysis complete for ${document.originalName}`);
        } catch (error) {
          console.error("Analysis error:", error);
          await storage.updateAnalysis(analysis.id, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Analysis failed",
            completedAt: new Date()
          });
        }
      });

      res.json(analysis);
    } catch (error) {
      console.error("Analysis start error:", error);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  // Get analysis status/results
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) return res.status(404).json({ message: "Analysis not found" });
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Cost estimation endpoint
  app.post("/api/estimate", async (req, res) => {
    try {
      const estimate: CostEstimate = req.body;

      if (!estimate.coverage || !estimate.mode) {
        return res.status(400).json({ message: "Missing required fields: coverage and mode" });
      }

      const result = calculateCost(estimate);
      res.json(result);
    } catch (error) {
      console.error("Estimate error:", error);
      res.status(500).json({ message: "Cost estimation failed" });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
