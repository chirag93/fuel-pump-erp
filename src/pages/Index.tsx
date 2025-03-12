
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardFeature } from '@/components/ui/custom/CardFeature';
import { FadeIn } from '@/components/ui/custom/FadeIn';
import Navbar from '@/components/layout/Navbar';

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <FadeIn>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Fuel Pump Management System
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Efficiently manage your fuel station operations with our comprehensive solution.
                </p>
              </FadeIn>
              <div className="space-x-4">
                <Link to="/login">
                  <Button>Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our system provides everything you need to run your fuel station efficiently.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <CardFeature 
                  title="Inventory Management" 
                  description="Track fuel stock levels in real-time with accurate reporting."
                  icon="inventory"
                />
                <CardFeature 
                  title="Customer Management" 
                  description="Maintain customer records, vehicles, and credit accounts."
                  icon="users"
                />
                <CardFeature 
                  title="Transaction Processing" 
                  description="Record and manage all fuel transactions securely."
                  icon="receipt"
                />
                <CardFeature 
                  title="Staff Management" 
                  description="Manage staff shifts, roles, and performance tracking."
                  icon="staff"
                />
                <CardFeature 
                  title="Financial Reports" 
                  description="Generate comprehensive financial reports and analytics."
                  icon="chart"
                />
                <CardFeature 
                  title="Mobile Support" 
                  description="Access system features on any device with a responsive interface."
                  icon="mobile"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
