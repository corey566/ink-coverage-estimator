import { Printer, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavLinks = () => (
    <>
      <button 
        onClick={() => scrollToSection('home')}
        className="text-primary font-medium hover:text-primary/80 transition-colors"
      >
        Home
      </button>
      <button 
        onClick={() => scrollToSection('estimator')}
        className="text-gray-600 hover:text-primary transition-colors"
      >
        Estimator
      </button>
      <button 
        onClick={() => scrollToSection('results')}
        className="text-gray-600 hover:text-primary transition-colors"
      >
        Reports
      </button>
      <button 
        onClick={() => scrollToSection('support')}
        className="text-gray-600 hover:text-primary transition-colors"
      >
        Support
      </button>
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sterling Carter Technology</h1>
              <p className="text-sm text-gray-600">Ink Coverage Estimator</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <NavLinks />
          </nav>
          
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
