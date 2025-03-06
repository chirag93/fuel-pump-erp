
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/custom/FadeIn";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 pt-16 pb-24 sm:pt-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      
      <div className="absolute inset-0 h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block text-balance">
                Streamline Your Business With{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  FlowERP
                </span>
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay="100ms">
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
              A beautiful, intuitive enterprise resource planning system designed with simplicity and elegance in mind. Transform how you manage your business operations.
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
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
              alt="FlowERP Dashboard"
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
