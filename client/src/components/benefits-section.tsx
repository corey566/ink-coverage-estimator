import { TrendingUp, DollarSign, File, Zap, Download, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BenefitsSection() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Boost Productivity",
      description: "Streamline your printing workflow with instant ink coverage analysis. No more guesswork or manual calculations.",
      color: "bg-secondary"
    },
    {
      icon: DollarSign,
      title: "Cost Optimization",
      description: "Accurately estimate ink costs before printing. Optimize your pricing and reduce waste with precise calculations.",
      color: "bg-cyan-ink"
    },
    {
      icon: File,
      title: "Multiple Formats",
      description: "Support for PDF, EPS, Excel, images, and all printable document formats. One tool for all your needs.",
      color: "bg-magenta-ink"
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Advanced processing engine analyzes documents quickly. Get results in seconds, not minutes.",
      color: "bg-yellow-ink"
    },
    {
      icon: Download,
      title: "Detailed Reports",
      description: "Generate comprehensive reports in PDF, Excel, or image formats. Perfect for client presentations and cost analysis.",
      color: "bg-black-ink"
    },
    {
      icon: Shield,
      title: "Enterprise Ready",
      description: "Built for professional use with batch processing, secure file handling, and reliable performance.",
      color: "bg-primary"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Ink Coverage Estimator?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Designed specifically for print professionals who need accurate, reliable ink usage calculations
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${benefit.color} rounded-lg flex items-center justify-center mb-4`}>
                  <benefit.icon className="text-white text-xl" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
