import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Analysis, CostEstimate, CostResult } from "@shared/schema";

interface AnalysisResultsProps {
  analysisId: number | null;
  mode: "cmyk" | "color_black";
}

function CoverageBar({ label, value, color, bgColor, textColor }: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`rounded-xl p-5 ${bgColor}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold text-sm ${textColor}`}>{label}</span>
        <span className={`text-2xl font-bold ${textColor}`}>{value.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ColorLoadBar({ label, value, color, bgColor, textColor }: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`rounded-xl p-5 ${bgColor}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold text-sm ${textColor}`}>{label}</span>
        <span className={`text-2xl font-bold ${textColor}`}>{value.toFixed(2)}%</span>
      </div>
      <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function AnalysisResults({ analysisId, mode }: AnalysisResultsProps) {
  const { toast } = useToast();
  const [showAllPages, setShowAllPages] = useState(false);
  const [costResult, setCostResult] = useState<CostResult | null>(null);

  // CMYK cost inputs
  const [cyanYield, setCyanYield] = useState("1000");
  const [cyanPrice, setCyanPrice] = useState("15");
  const [magentaYield, setMagentaYield] = useState("1000");
  const [magentaPrice, setMagentaPrice] = useState("15");
  const [yellowYield, setYellowYield] = useState("1000");
  const [yellowPrice, setYellowPrice] = useState("15");
  const [blackYield, setBlackYield] = useState("2000");
  const [blackPrice, setBlackPrice] = useState("12");

  // Color+Black cost inputs
  const [colorYield, setColorYield] = useState("500");
  const [colorPrice, setColorPrice] = useState("25");
  const [cbBlackYield, setCbBlackYield] = useState("1000");
  const [cbBlackPrice, setCbBlackPrice] = useState("15");

  const [wastePercent, setWastePercent] = useState("10");

  const { data: analysis, isLoading } = useQuery<Analysis>({
    queryKey: [`/api/analyses/${analysisId}`],
    enabled: !!analysisId,
    refetchInterval: (query) => {
      const a = query.state.data as Analysis;
      return a?.status === 'processing' ? 2000 : false;
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async (estimate: CostEstimate) => {
      const response = await apiRequest('POST', '/api/estimate', estimate);
      return response.json() as Promise<CostResult>;
    },
    onSuccess: (result) => {
      setCostResult(result);
    },
    onError: () => {
      toast({ title: "Estimation failed", description: "Please check your inputs.", variant: "destructive" });
    }
  });

  const handleCalculateCost = () => {
    if (!analysis?.overallCoverage) return;

    const estimate: CostEstimate = {
      mode,
      coverage: analysis.overallCoverage,
      wastePercent: parseFloat(wastePercent) || 10,
    };

    if (mode === "cmyk") {
      estimate.cyanYield = parseFloat(cyanYield);
      estimate.cyanPrice = parseFloat(cyanPrice);
      estimate.magentaYield = parseFloat(magentaYield);
      estimate.magentaPrice = parseFloat(magentaPrice);
      estimate.yellowYield = parseFloat(yellowYield);
      estimate.yellowPrice = parseFloat(yellowPrice);
      estimate.blackYield = parseFloat(blackYield);
      estimate.blackPrice = parseFloat(blackPrice);
    } else {
      estimate.colorYield = parseFloat(colorYield);
      estimate.colorPrice = parseFloat(colorPrice);
      estimate.blackYield = parseFloat(cbBlackYield);
      estimate.blackPrice = parseFloat(cbBlackPrice);
    }

    estimateMutation.mutate(estimate);
  };

  if (!analysisId) return null;

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!analysis) return null;

  if (analysis.status === 'processing') {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <Card>
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Document</h3>
              <p className="text-gray-500">Calculating ink coverage per page. This may take a few minutes for large documents.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (analysis.status === 'failed') {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-800 mb-1">Analysis Failed</h3>
              <p className="text-gray-600">{analysis.errorMessage || "Please try uploading your document again."}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (analysis.status !== 'completed' || !analysis.overallCoverage || !analysis.pageBreakdown) {
    return null;
  }

  const cov = analysis.overallCoverage;
  const pages = analysis.pageBreakdown;
  const colorLoad = (cov.cyan + cov.magenta + cov.yellow) / 3;
  const displayPages = showAllPages ? pages : pages.slice(0, 5);

  return (
    <section id="results" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h2>
          <p className="text-gray-500">
            {analysis.totalPages} page{analysis.totalPages !== 1 ? 's' : ''} analyzed
            &nbsp;·&nbsp;
            Mode: <span className="font-medium">{mode === "cmyk" ? "CMYK" : "Color + Black"}</span>
          </p>
        </div>

        {/* Coverage Overview */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Overall Ink Coverage</CardTitle>
            <p className="text-sm text-gray-500">Average across all pages</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {mode === "cmyk" ? (
              <>
                <CoverageBar label="Cyan" value={cov.cyan} color="bg-cyan-500" bgColor="bg-cyan-50" textColor="text-cyan-900" />
                <CoverageBar label="Magenta" value={cov.magenta} color="bg-pink-500" bgColor="bg-pink-50" textColor="text-pink-900" />
                <CoverageBar label="Yellow" value={cov.yellow} color="bg-yellow-400" bgColor="bg-yellow-50" textColor="text-yellow-900" />
                <CoverageBar label="Black" value={cov.black} color="bg-gray-800" bgColor="bg-gray-100" textColor="text-gray-900" />
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                    <span>Total ink load</span>
                    <span>{(cov.cyan + cov.magenta + cov.yellow + cov.black).toFixed(2)}%</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ColorLoadBar label="Color (CMY average)" value={colorLoad} color="bg-purple-500" bgColor="bg-purple-50" textColor="text-purple-900" />
                <ColorLoadBar label="Black" value={cov.black} color="bg-gray-800" bgColor="bg-gray-100" textColor="text-gray-900" />
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Color load is the average of Cyan ({cov.cyan.toFixed(2)}%), Magenta ({cov.magenta.toFixed(2)}%), Yellow ({cov.yellow.toFixed(2)}%)
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Page-by-Page Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Page-by-Page Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-left py-3 px-3 font-semibold">Page</th>
                    {mode === "cmyk" ? (
                      <>
                        <th className="text-right py-3 px-3 font-semibold text-cyan-700">Cyan %</th>
                        <th className="text-right py-3 px-3 font-semibold text-pink-700">Magenta %</th>
                        <th className="text-right py-3 px-3 font-semibold text-yellow-700">Yellow %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-700">Black %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-700">Total %</th>
                      </>
                    ) : (
                      <>
                        <th className="text-right py-3 px-3 font-semibold text-purple-700">Color %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-700">Black %</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-700">Total %</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayPages.map((page) => {
                    const pgColorLoad = (page.cyan + page.magenta + page.yellow) / 3;
                    return (
                      <tr key={page.page} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-gray-800">Page {page.page}</td>
                        {mode === "cmyk" ? (
                          <>
                            <td className="py-3 px-3 text-right text-cyan-700">{page.cyan.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right text-pink-700">{page.magenta.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right text-yellow-700">{page.yellow.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right text-gray-700">{page.black.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-900">{page.total.toFixed(2)}%</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-3 text-right text-purple-700">{pgColorLoad.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right text-gray-700">{page.black.toFixed(2)}%</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-900">{(pgColorLoad + page.black).toFixed(2)}%</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages.length > 5 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPages(!showAllPages)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showAllPages ? (
                    <><ChevronUp className="w-4 h-4 mr-1" /> Show less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4 mr-1" /> Show all {pages.length} pages</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Estimator */}
        <Card className="shadow-md border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Cost Estimator</CardTitle>
            </div>
            <p className="text-sm text-gray-500">
              Based on your ink coverage. Cartridge yield is typically rated at 5% page coverage.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "cmyk" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Cyan", yield: cyanYield, setYield: setCyanYield, price: cyanPrice, setPrice: setCyanPrice, color: "text-cyan-700" },
                  { label: "Magenta", yield: magentaYield, setYield: setMagentaYield, price: magentaPrice, setPrice: setMagentaPrice, color: "text-pink-700" },
                  { label: "Yellow", yield: yellowYield, setYield: setYellowYield, price: yellowPrice, setPrice: setYellowPrice, color: "text-yellow-700" },
                  { label: "Black", yield: blackYield, setYield: setBlackYield, price: blackPrice, setPrice: setBlackPrice, color: "text-gray-800" },
                ].map((ch) => (
                  <div key={ch.label} className="p-4 bg-gray-50 rounded-xl">
                    <p className={`font-semibold mb-3 ${ch.color}`}>{ch.label} Cartridge</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Yield (pages @ 5%)</Label>
                        <Input
                          type="number"
                          value={ch.yield}
                          onChange={(e) => ch.setYield(e.target.value)}
                          className="mt-1 h-9 text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Price ($)</Label>
                        <Input
                          type="number"
                          value={ch.price}
                          onChange={(e) => ch.setPrice(e.target.value)}
                          className="mt-1 h-9 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="font-semibold text-purple-800 mb-3">Color Cartridge</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Yield (pages @ 5%)</Label>
                      <Input type="number" value={colorYield} onChange={(e) => setColorYield(e.target.value)} className="mt-1 h-9 text-sm" min="1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Price ($)</Label>
                      <Input type="number" value={colorPrice} onChange={(e) => setColorPrice(e.target.value)} className="mt-1 h-9 text-sm" min="0" step="0.01" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-100 rounded-xl">
                  <p className="font-semibold text-gray-800 mb-3">Black Cartridge</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Yield (pages @ 5%)</Label>
                      <Input type="number" value={cbBlackYield} onChange={(e) => setCbBlackYield(e.target.value)} className="mt-1 h-9 text-sm" min="1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Price ($)</Label>
                      <Input type="number" value={cbBlackPrice} onChange={(e) => setCbBlackPrice(e.target.value)} className="mt-1 h-9 text-sm" min="0" step="0.01" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Waste Factor */}
            <div className="flex items-end gap-4 p-4 bg-orange-50 rounded-xl">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-orange-800">Waste / Variation Factor (%)</Label>
                <p className="text-xs text-orange-600 mt-0.5">Accounts for cleaning cycles, test prints, and printer waste</p>
                <Input
                  type="number"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(e.target.value)}
                  className="mt-2 h-9 text-sm max-w-xs"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <Button
              onClick={handleCalculateCost}
              disabled={estimateMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              {estimateMutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Calculating...</>
              ) : (
                <><Calculator className="w-4 h-4 mr-2" />Calculate Cost Per Page</>
              )}
            </Button>

            {/* Cost Results */}
            {costResult && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900 text-lg">Estimated Print Cost</h4>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Base Estimate</p>
                    <p className="text-2xl font-bold text-gray-900">${costResult.baseCostPerPage.toFixed(4)}</p>
                    <p className="text-xs text-gray-500">/page</p>
                  </div>
                  <div className="bg-blue-600 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-blue-200 mb-1">With Waste ({wastePercent}%)</p>
                    <p className="text-2xl font-bold text-white">${costResult.adjustedCostPerPage.toFixed(4)}</p>
                    <p className="text-xs text-blue-200">/page</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Range (±8%)</p>
                    <p className="text-sm font-bold text-gray-800">${costResult.rangeMin.toFixed(4)}</p>
                    <p className="text-xs text-gray-400">to</p>
                    <p className="text-sm font-bold text-gray-800">${costResult.rangeMax.toFixed(4)}</p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="border-t border-blue-200 pt-4">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">Cost Breakdown</p>
                  <div className="space-y-1">
                    {costResult.mode === "cmyk" ? (
                      <>
                        {costResult.breakdown.cyan !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-cyan-700">Cyan cartridge</span>
                            <span className="font-medium">${costResult.breakdown.cyan.toFixed(4)}/page</span>
                          </div>
                        )}
                        {costResult.breakdown.magenta !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-pink-700">Magenta cartridge</span>
                            <span className="font-medium">${costResult.breakdown.magenta.toFixed(4)}/page</span>
                          </div>
                        )}
                        {costResult.breakdown.yellow !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-700">Yellow cartridge</span>
                            <span className="font-medium">${costResult.breakdown.yellow.toFixed(4)}/page</span>
                          </div>
                        )}
                        {costResult.breakdown.black !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Black cartridge</span>
                            <span className="font-medium">${costResult.breakdown.black.toFixed(4)}/page</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {costResult.breakdown.color !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-700">Color cartridge</span>
                            <span className="font-medium">${costResult.breakdown.color.toFixed(4)}/page</span>
                          </div>
                        )}
                        {costResult.breakdown.black !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Black cartridge</span>
                            <span className="font-medium">${costResult.breakdown.black.toFixed(4)}/page</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic">
                  Formula: effective yield = rated yield × (5% ÷ actual coverage%). Confidence: Medium. Range shows ±8% variation from environmental and operational factors.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
