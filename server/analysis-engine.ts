import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { AnalysisResult, PageAnalysis, CMYKCoverage } from '../shared/schema.js';

const execAsync = promisify(exec);

export class DocumentAnalysisEngine {

  async analyzeDocument(filePath: string, mimeType: string): Promise<AnalysisResult> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.analyzePDF(filePath);
        case 'application/postscript':
          return await this.analyzeEPS(filePath);
        case 'image/jpeg':
        case 'image/png':
        case 'image/tiff':
        case 'image/gif':
          return await this.analyzeImage(filePath);
        default:
          return await this.analyzeGeneric(filePath);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * PRIMARY METHOD for PDF: Use Ghostscript inkcov device
   * This reads ink coverage DIRECTLY from the PDF's color specifications.
   * Output format: C  M  Y  K  CMYK OK  (values 0.0-1.0 per page)
   * This is what professional tools like EPS Fill use.
   */
  private async analyzePDF(filePath: string): Promise<AnalysisResult> {
    try {
      console.log(`Analyzing PDF with Ghostscript inkcov device...`);
      const { stdout } = await execAsync(
        `gs -q -dBATCH -dNOPAUSE -sDEVICE=inkcov -sOutputFile=/dev/null "${filePath}" 2>&1`
      );

      const lines = stdout.split('\n').filter(l => l.includes('CMYK'));
      if (lines.length === 0) {
        throw new Error('No CMYK data from Ghostscript, falling back');
      }

      const pageBreakdown: PageAnalysis[] = [];

      lines.forEach((line, index) => {
        // Line format: "  0.10179  0.06925  0.00000  0.08289  CMYK OK"
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const cyan = parseFloat(parts[0]) * 100;
          const magenta = parseFloat(parts[1]) * 100;
          const yellow = parseFloat(parts[2]) * 100;
          const black = parseFloat(parts[3]) * 100;

          pageBreakdown.push({
            page: index + 1,
            cyan: Math.round(cyan * 100) / 100,
            magenta: Math.round(magenta * 100) / 100,
            yellow: Math.round(yellow * 100) / 100,
            black: Math.round(black * 100) / 100,
            total: Math.round((cyan + magenta + yellow + black) * 100) / 100
          });

          console.log(`Page ${index + 1}: C=${cyan.toFixed(2)}% M=${magenta.toFixed(2)}% Y=${yellow.toFixed(2)}% K=${black.toFixed(2)}%`);
        }
      });

      if (pageBreakdown.length === 0) {
        throw new Error('Failed to parse Ghostscript output');
      }

      const overallCoverage = this.averageCoverage(pageBreakdown);
      console.log(`Overall: C=${overallCoverage.cyan}% M=${overallCoverage.magenta}% Y=${overallCoverage.yellow}% K=${overallCoverage.black}%`);

      return {
        totalPages: pageBreakdown.length,
        overallCoverage,
        pageBreakdown
      };
    } catch (gsError) {
      console.warn('Ghostscript inkcov failed, falling back to ImageMagick RGB method:', gsError);
      return await this.analyzePDFViaRGB(filePath);
    }
  }

  /**
   * FALLBACK for PDF: Render each page to RGB with white bg, then compute CMYK.
   * Formula per documentation:
   *   C = (1 - mean_R) × 100
   *   M = (1 - mean_G) × 100
   *   Y = (1 - mean_B) × 100
   *   K = (1 - mean_max(R,G,B)) × 100
   */
  private async analyzePDFViaRGB(filePath: string): Promise<AnalysisResult> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const pageCount = await this.getPDFPageCount(filePath);
    console.log(`Rendering ${pageCount} pages via RGB fallback...`);

    const pageBreakdown: PageAnalysis[] = [];

    for (let pageNum = 0; pageNum < pageCount; pageNum++) {
      const rgbImagePath = path.join(tempDir, `page_${pageNum}_${Date.now()}.png`);
      try {
        await execAsync(
          `convert -density 150 -background white -alpha remove "${filePath}[${pageNum}]" -alpha off "${rgbImagePath}"`
        );
        const coverage = await this.calculateCMYKFromRGB(rgbImagePath);
        pageBreakdown.push({
          page: pageNum + 1,
          ...coverage,
          total: Math.round((coverage.cyan + coverage.magenta + coverage.yellow + coverage.black) * 100) / 100
        });
        console.log(`Page ${pageNum + 1}: C=${coverage.cyan}% M=${coverage.magenta}% Y=${coverage.yellow}% K=${coverage.black}%`);
      } finally {
        try { await fs.unlink(rgbImagePath); } catch (_) {}
      }
    }

    const overallCoverage = this.averageCoverage(pageBreakdown);
    return { totalPages: pageCount, overallCoverage, pageBreakdown };
  }

  private async analyzeEPS(filePath: string): Promise<AnalysisResult> {
    try {
      const { stdout } = await execAsync(
        `gs -q -dBATCH -dNOPAUSE -sDEVICE=inkcov -sOutputFile=/dev/null "${filePath}" 2>&1`
      );
      const lines = stdout.split('\n').filter(l => l.includes('CMYK'));

      if (lines.length > 0) {
        const pageBreakdown: PageAnalysis[] = lines.map((line, i) => {
          const parts = line.trim().split(/\s+/);
          const cyan = parseFloat(parts[0]) * 100;
          const magenta = parseFloat(parts[1]) * 100;
          const yellow = parseFloat(parts[2]) * 100;
          const black = parseFloat(parts[3]) * 100;
          return {
            page: i + 1,
            cyan: Math.round(cyan * 100) / 100,
            magenta: Math.round(magenta * 100) / 100,
            yellow: Math.round(yellow * 100) / 100,
            black: Math.round(black * 100) / 100,
            total: Math.round((cyan + magenta + yellow + black) * 100) / 100
          };
        });

        return { totalPages: pageBreakdown.length, overallCoverage: this.averageCoverage(pageBreakdown), pageBreakdown };
      }
    } catch (_) {}

    // Fallback
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPNG = path.join(tempDir, `eps_${Date.now()}.png`);
    try {
      await execAsync(`convert -density 150 -background white -alpha remove "${filePath}" -alpha off "${tempPNG}"`);
      const coverage = await this.calculateCMYKFromRGB(tempPNG);
      return {
        totalPages: 1,
        overallCoverage: coverage,
        pageBreakdown: [{ page: 1, ...coverage, total: coverage.cyan + coverage.magenta + coverage.yellow + coverage.black }]
      };
    } finally {
      try { await fs.unlink(tempPNG); } catch (_) {}
    }
  }

  private async analyzeImage(filePath: string): Promise<AnalysisResult> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const rgbPath = path.join(tempDir, `img_${Date.now()}.png`);
    try {
      await execAsync(`convert "${filePath}" -background white -alpha remove -alpha off "${rgbPath}"`);
      const coverage = await this.calculateCMYKFromRGB(rgbPath);
      return {
        totalPages: 1,
        overallCoverage: coverage,
        pageBreakdown: [{ page: 1, ...coverage, total: coverage.cyan + coverage.magenta + coverage.yellow + coverage.black }]
      };
    } finally {
      try { await fs.unlink(rgbPath); } catch (_) {}
    }
  }

  private async analyzeGeneric(filePath: string): Promise<AnalysisResult> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tmpPNG = path.join(tempDir, `generic_${Date.now()}.png`);
    try {
      await execAsync(`convert -density 150 -background white -alpha remove "${filePath}" -alpha off "${tmpPNG}"`);
      const coverage = await this.calculateCMYKFromRGB(tmpPNG);
      return {
        totalPages: 1,
        overallCoverage: coverage,
        pageBreakdown: [{ page: 1, ...coverage, total: coverage.cyan + coverage.magenta + coverage.yellow + coverage.black }]
      };
    } catch (e) {
      throw new Error(`Cannot process this file type`);
    } finally {
      try { await fs.unlink(tmpPNG); } catch (_) {}
    }
  }

  /**
   * Core CMYK calculation from an RGB image.
   * Formula (from documentation):
   *   C = 255 - R  → coverage = (1 - mean_R) × 100
   *   M = 255 - G  → coverage = (1 - mean_G) × 100
   *   Y = 255 - B  → coverage = (1 - mean_B) × 100
   *   K = 255 - max(R,G,B) → coverage = (1 - mean_max(R,G,B)) × 100
   */
  private async calculateCMYKFromRGB(rgbImagePath: string): Promise<CMYKCoverage> {
    const [cRes, mRes, yRes, kRes] = await Promise.all([
      execAsync(`convert "${rgbImagePath}" -format "%[fx:100*(1-mean.r)]" info:`),
      execAsync(`convert "${rgbImagePath}" -format "%[fx:100*(1-mean.g)]" info:`),
      execAsync(`convert "${rgbImagePath}" -format "%[fx:100*(1-mean.b)]" info:`),
      execAsync(`convert "${rgbImagePath}" -channel RGB -separate -evaluate-sequence max -format "%[fx:100*(1-mean)]" info:`)
    ]);

    return {
      cyan: Math.round(this.parse(cRes.stdout) * 100) / 100,
      magenta: Math.round(this.parse(mRes.stdout) * 100) / 100,
      yellow: Math.round(this.parse(yRes.stdout) * 100) / 100,
      black: Math.round(this.parse(kRes.stdout) * 100) / 100
    };
  }

  private parse(stdout: string): number {
    const v = parseFloat(stdout.trim());
    return isNaN(v) ? 0 : Math.max(0, Math.min(v, 100));
  }

  private averageCoverage(pages: PageAnalysis[]): CMYKCoverage {
    if (pages.length === 0) return { cyan: 0, magenta: 0, yellow: 0, black: 0 };
    const sum = pages.reduce((a, p) => ({
      cyan: a.cyan + p.cyan,
      magenta: a.magenta + p.magenta,
      yellow: a.yellow + p.yellow,
      black: a.black + p.black
    }), { cyan: 0, magenta: 0, yellow: 0, black: 0 });
    const n = pages.length;
    return {
      cyan: Math.round((sum.cyan / n) * 100) / 100,
      magenta: Math.round((sum.magenta / n) * 100) / 100,
      yellow: Math.round((sum.yellow / n) * 100) / 100,
      black: Math.round((sum.black / n) * 100) / 100
    };
  }

  private async getPDFPageCount(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`pdfinfo "${filePath}" | grep "^Pages:"`);
      const match = stdout.match(/Pages:\s*(\d+)/);
      if (match) return parseInt(match[1]);
    } catch (_) {}
    return 1;
  }
}
