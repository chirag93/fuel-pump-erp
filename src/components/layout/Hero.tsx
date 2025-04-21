
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/custom/FadeIn";
import { getBusinessSettings } from "@/integrations/businessSettings";
import { Logo } from "@/components/ui/logo";

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
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 pt-20 pb-24 sm:pt-28 md:pt-32 md:pb-40 w-full min-w-0">
      {/* Remove container max-width/paddings to ensure full-bleed */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <div className="absolute inset-0 h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-background pointer-events-none" />

      {/* Remove container class, use w-full and px-0 to prevent bands */}
      <div className="relative w-full max-w-none px-0 mx-0">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="flex flex-col items-center mb-6">
              <Logo size="xl" className="h-32 w-auto mb-3" />
              <h2 className="text-2xl font-semibold mt-2">{businessName}</h2>
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
        
          <FadeIn delay="300ms" className="mt-16 sm:mt-24">
            <div className="relative mx-auto overflow-hidden rounded-xl border border-border/40 bg-card shadow-medium w-full max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-card opacity-50 pointer-events-none" />
              
              <img
                src="https://images.unsplash.com/photo-1611288875785-9ef0f98d45c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                alt="Fuel Master Dashboard"
                className="w-full h-auto object-cover opacity-90"
                style={{ minHeight: "300px" }}
              />
              
              {/* Overlay reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20 backdrop-blur-[1px] pointer-events-none" />
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
