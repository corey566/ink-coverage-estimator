import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Play, Layers, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

interface FileUploadProps {
  onAnalysisStart: (documentId: number, mode: "cmyk" | "color_black") => void;
}

type AnalysisMode = "cmyk" | "color_black";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ onAnalysisStart }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<Document | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("cmyk");
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json() as Promise<Document>;
    },
    onSuccess: (document: Document) => {
      setUploadedFile(document);
      toast({ title: "File uploaded", description: `${document.originalName} is ready for analysis.` });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ documentId, mode }: { documentId: number; mode: AnalysisMode }) => {
      const response = await apiRequest('POST', `/api/documents/${documentId}/analyze`, { mode });
      return response.json();
    },
    onSuccess: (analysis) => {
      onAnalysisStart(analysis.id, mode);
    },
    onError: () => {
      toast({ title: "Analysis failed to start", description: "Please try again.", variant: "destructive" });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) uploadMutation.mutate(acceptedFiles[0]);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/postscript': ['.eps'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const handleStartAnalysis = () => {
    if (!uploadedFile) {
      toast({ title: "No file selected", description: "Please upload a file first.", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate({ documentId: uploadedFile.id, mode });
  };

  return (
    <section id="estimator" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ink Coverage Estimator</h2>
          <p className="text-lg text-gray-600">Upload your document to get instant ink coverage and cost analysis</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">

            {/* Mode Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Analysis Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("cmyk")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    mode === "cmyk"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Layers className={`w-5 h-5 flex-shrink-0 ${mode === "cmyk" ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <div className="font-semibold text-sm">CMYK Mode</div>
                    <div className="text-xs text-gray-500 mt-0.5">Separate Cyan, Magenta, Yellow, Black</div>
                  </div>
                </button>
                <button
                  onClick={() => setMode("color_black")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    mode === "color_black"
                      ? "border-purple-600 bg-purple-50 text-purple-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Printer className={`w-5 h-5 flex-shrink-0 ${mode === "color_black" ? "text-purple-600" : "text-gray-400"}`} />
                  <div>
                    <div className="font-semibold text-sm">Color + Black</div>
                    <div className="text-xs text-gray-500 mt-0.5">Combined color cartridge + black</div>
                  </div>
                </button>
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Upload Document</h3>
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    {isDragActive ? "Drop your file here" : "Drag & drop or click to browse"}
                  </p>
                  <p className="text-sm text-gray-500">PDF, PNG, JPG, TIFF, EPS — up to 50MB</p>
                  {uploadMutation.isPending && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.originalName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.fileSize)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <div className="text-center">
              <Button
                onClick={handleStartAnalysis}
                disabled={!uploadedFile || analyzeMutation.isPending}
                size="lg"
                className="px-10 py-4 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Analyze Ink Coverage
                  </>
                )}
              </Button>
              {uploadedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Mode: <span className="font-medium">{mode === "cmyk" ? "CMYK (4 channels)" : "Color + Black (2 cartridges)"}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
