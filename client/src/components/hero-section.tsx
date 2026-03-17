import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function HeroSection() {
  const scrollToEstimator = () => {
    const element = document.getElementById('estimator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="bg-gradient-to-br from-primary to-blue-700 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Boost Your Print Shop Productivity with Accurate Ink Coverage Analysis
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Professional ink coverage estimator designed for print shops, mass printing centers, and businesses. 
              Analyze any document format and get precise CMYK ink usage reports to optimize your printing costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToEstimator}
                className="bg-white text-primary px-8 py-3 hover:bg-gray-100"
                size="lg"
              >
                Start Analysis
              </Button>
              <Button 
                variant="outline" 
                className="border-2 border-white text-white px-8 py-3 hover:bg-white hover:text-primary"
                size="lg"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-3">
                  <div className="h-4 bg-cyan-ink rounded opacity-80"></div>
                  <div className="h-4 bg-magenta-ink rounded opacity-80"></div>
                  <div className="h-4 bg-yellow-ink rounded opacity-80"></div>
                  <div className="h-4 bg-black-ink rounded opacity-80"></div>
                </div>
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                  <p className="text-sm text-blue-200">Analyze Any Document</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
