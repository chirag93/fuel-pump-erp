import { CardFeature } from "@/components/ui/custom/CardFeature";
import { FadeIn } from "@/components/ui/custom/FadeIn";
import { Hero } from "@/components/layout/Hero";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ModuleIcons } from "@/assets/icons";
import { ChevronRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        
        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Designed for Business Efficiency
                </h2>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                  Streamline operations, enhance collaboration, and make better decisions with our comprehensive solution.
                </p>
              </div>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FadeIn key={feature.title} delay={`${index * 100}ms`}>
                  <CardFeature
                    title={feature.title}
                    description={feature.description}
                    icon={<feature.icon className="h-6 w-6" />}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
        
        {/* Modules Section */}
        <section id="modules" className="py-24 bg-secondary/50">
          <div className="container px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Comprehensive Management Modules
                </h2>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                  Everything you need to manage your fuel business in one integrated system.
                </p>
              </div>
            </FadeIn>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((module, index) => (
                <FadeIn key={module.title} delay={`${index * 75}ms`}>
                  <div className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:shadow-medium transition-all">
                    <div className="p-6">
                      <div className="rounded-full w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <module.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{module.description}</p>
                      <Button variant="ghost" size="sm" className="group-hover:text-primary">
                        Learn more <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-b from-background to-secondary/10">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <FadeIn>
                <h2 className="text-3xl font-bold sm:text-4xl mb-6">
                  Ready to Transform Your Business?
                </h2>
              </FadeIn>
              <FadeIn delay="100ms">
                <p className="text-xl text-muted-foreground mb-10">
                  Join thousands of businesses that use Fuel Pro 360 to streamline their operations.
                </p>
              </FadeIn>
              <FadeIn delay="200ms">
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg" className="px-8 rounded-full">
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 rounded-full">
                    Contact Sales
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted py-12 border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 mb-4">
                Fuel Pro 360
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                A beautifully designed fuel pump management system for modern businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Modules', 'Pricing', 'Updates'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Careers', 'Contact', 'Blog'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                {['Documentation', 'Help Center', 'Community', 'Partners'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Fuel Pro 360. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {['Terms', 'Privacy', 'Cookies'].map(item => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature section data
const features = [
  {
    title: "Intuitive Interface",
    description: "Clean, simple design that's easy to navigate and understand at a glance.",
    icon: ModuleIcons.Dashboard,
  },
  {
    title: "Real-time Analytics",
    description: "Monitor performance with beautiful data visualizations updated in real-time.",
    icon: ModuleIcons.Reports,
  },
  {
    title: "Cloud-based Access",
    description: "Access your ERP system from anywhere, on any device with internet connection.",
    icon: ModuleIcons.Documents,
  },
  {
    title: "Seamless Integration",
    description: "Connect with your existing tools and software for a unified workflow.",
    icon: ModuleIcons.Planning,
  },
  {
    title: "Data Security",
    description: "Enterprise-grade security to protect your sensitive business information.",
    icon: ModuleIcons.HumanResources,
  },
  {
    title: "Customizable Modules",
    description: "Tailor the system to your specific business needs and processes.",
    icon: ModuleIcons.Sales,
  },
];

// Modules section data
const modules = [
  {
    title: "Finance Management",
    description: "Manage accounts, budgets, and financial reporting.",
    icon: ModuleIcons.Finance,
  },
  {
    title: "Sales & CRM",
    description: "Track leads, manage customers, and optimize sales processes.",
    icon: ModuleIcons.Sales,
  },
  {
    title: "Inventory Control",
    description: "Monitor stock levels, manage suppliers, and optimize inventory.",
    icon: ModuleIcons.Inventory,
  },
  {
    title: "Human Resources",
    description: "Streamline HR processes from recruitment to retirement.",
    icon: ModuleIcons.HumanResources,
  },
  {
    title: "Project Management",
    description: "Plan, execute, and track projects with precision.",
    icon: ModuleIcons.Planning,
  },
  {
    title: "Business Intelligence",
    description: "Turn data into actionable insights with powerful analytics.",
    icon: ModuleIcons.Reports,
  },
  {
    title: "Document Management",
    description: "Organize, store, and share documents securely.",
    icon: ModuleIcons.Documents,
  },
  {
    title: "Executive Dashboard",
    description: "Get a bird's-eye view of your entire business operations.",
    icon: ModuleIcons.Dashboard,
  },
];

export default Index;
