import { documents, analyses, type Document, type Analysis, type InsertDocument, type InsertAnalysis } from "@shared/schema";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  deleteDocument(id: number): Promise<void>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysisByDocumentId(documentId: number): Promise<Analysis | undefined>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined>;
  getAnalyses(): Promise<Analysis[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  private analyses: Map<number, Analysis>;
  private documentIdCounter: number;
  private analysisIdCounter: number;

  constructor() {
    this.documents = new Map();
    this.analyses = new Map();
    this.documentIdCounter = 1;
    this.analysisIdCounter = 1;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
    // Also delete associated analyses
    Array.from(this.analyses.entries()).forEach(([analysisId, analysis]) => {
      if (analysis.documentId === id) {
        this.analyses.delete(analysisId);
      }
    });
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.analysisIdCounter++;
    const analysis: Analysis = {
      id,
      createdAt: new Date(),
      completedAt: null,
      documentId: insertAnalysis.documentId,
      status: insertAnalysis.status ?? "pending",
      mode: insertAnalysis.mode ?? "cmyk",
      totalPages: insertAnalysis.totalPages ?? null,
      overallCoverage: insertAnalysis.overallCoverage ?? null,
      pageBreakdown: insertAnalysis.pageBreakdown ?? null,
      errorMessage: insertAnalysis.errorMessage ?? null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysisByDocumentId(documentId: number): Promise<Analysis | undefined> {
    return Array.from(this.analyses.values()).find(
      (analysis) => analysis.documentId === documentId
    );
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const existing = this.analyses.get(id);
    if (!existing) return undefined;
    
    const updated: Analysis = { ...existing, ...updates };
    this.analyses.set(id, updated);
    return updated;
  }

  async getAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values());
  }
}

export const storage = new MemStorage();
