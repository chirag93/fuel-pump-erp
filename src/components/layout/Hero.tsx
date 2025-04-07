
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/custom/FadeIn";
import { Droplets } from "lucide-react";
import { getBusinessSettings } from "@/integrations/businessSettings";

export function Hero() {
  const [businessName, setBusinessName] = useState<string>('Fuel Pro 360');
  
  // Fetch business name from settings
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const businessSettings = await getBusinessSettings();
        if (businessSettings && businessSettings.business_name) {
          setBusinessName(businessSettings.business_name);
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };

    fetchBusinessName();
  }, []);
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 pt-16 pb-24 sm:pt-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      
      <div className="absolute inset-0 h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-3">
                <Droplets className="h-12 w-12 text-primary" />
                <span className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  {businessName}
                </span>
              </div>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-balance">
                Streamline Your Fuel Pump Management
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay="100ms">
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
              A beautiful, intuitive system designed with simplicity and elegance in mind. Transform how you manage your fuel station operations.
            </p>
          </FadeIn>
          
          <FadeIn delay="200ms">
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 rounded-full text-base font-medium">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="px-8 rounded-full text-base font-medium">
                Book a Demo
              </Button>
            </div>
          </FadeIn>
        </div>
        
        <FadeIn delay="300ms" className="mt-16 sm:mt-24">
          <div className="relative mx-auto overflow-hidden rounded-xl border border-border/40 bg-card shadow-medium">
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-card opacity-50" />
            
            <img
              src="https://images.unsplash.com/photo-1611288875785-9ef0f98d45c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
              alt="Fuel Master Dashboard"
              className="w-full h-auto object-cover opacity-90"
            />
            
            {/* Overlay reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20 backdrop-blur-[1px]" />
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
