import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [mode, setMode] = useState<"cmyk" | "color_black">("cmyk");

  const handleAnalysisStart = (id: number, selectedMode: "cmyk" | "color_black") => {
    setMode(selectedMode);
    setAnalysisId(id);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Ink Coverage Estimator
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Upload any document and instantly get accurate CMYK ink coverage analysis with cost per page estimation for your print shop.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              PDF, PNG, JPG, TIFF, EPS
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              CMYK + Color/Black modes
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Cost per page calculator
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Page-by-page breakdown
            </span>
          </div>
        </div>
      </section>

      <FileUpload onAnalysisStart={handleAnalysisStart} />
      <AnalysisResults analysisId={analysisId} mode={mode} />

      <Footer />
    </div>
  );
}
