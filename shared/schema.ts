import { pgTable, text, serial, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  status: text("status").notNull().default("pending"),
  mode: text("mode").notNull().default("cmyk"), // "cmyk" | "color_black"
  totalPages: integer("total_pages"),
  overallCoverage: jsonb("overall_coverage").$type<CMYKCoverage>(),
  pageBreakdown: jsonb("page_breakdown").$type<PageAnalysis[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

export interface CMYKCoverage {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
}

export interface PageAnalysis {
  page: number;
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
  total: number;
}

export interface AnalysisResult {
  totalPages: number;
  overallCoverage: CMYKCoverage;
  pageBreakdown: PageAnalysis[];
}

export interface CostEstimate {
  mode: "cmyk" | "color_black";
  coverage: CMYKCoverage;
  // CMYK mode
  cyanYield?: number;
  cyanPrice?: number;
  magentaYield?: number;
  magentaPrice?: number;
  yellowYield?: number;
  yellowPrice?: number;
  blackYield?: number;
  blackPrice?: number;
  // Color+Black mode
  colorYield?: number;
  colorPrice?: number;
  // Shared
  wastePercent: number;
}

export interface CostResult {
  mode: "cmyk" | "color_black";
  baseCostPerPage: number;
  adjustedCostPerPage: number;
  rangeMin: number;
  rangeMax: number;
  breakdown: {
    cyan?: number;
    magenta?: number;
    yellow?: number;
    black?: number;
    color?: number;
  };
}
