
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  CalendarCheck, 
  BarChart3, 
  CalendarDays, 
  Users, 
  Package, 
  TrendingUp,
  Truck
} from "lucide-react";
import { migrateAllData } from "@/utils/seedDatabase";
import { getFuelLevels } from "@/utils/fuelCalculations";
import FuelTankDisplay from "@/components/fuel/FuelTankDisplay";

export default function Home() {
  const navigate = useNavigate();
  const [hasSeededData, setHasSeededData] = useState(false);
  const [fuelLevels, setFuelLevels] = useState<{ [key: string]: { capacity: number, current: number, price: number } }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Check local storage if database has been seeded
  useEffect(() => {
    const seeded = localStorage.getItem("fuelPumpDbSeeded");
    setHasSeededData(seeded === "true");

    // Fetch fuel levels
    const fetchFuelLevels = async () => {
      try {
        const levels = await getFuelLevels();
        setFuelLevels(levels);
      } catch (error) {
        console.error("Error fetching fuel levels:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFuelLevels();
  }, []);

  const handleSeedDatabase = async () => {
    const success = await migrateAllData();
    if (success) {
      localStorage.setItem("fuelPumpDbSeeded", "true");
      setHasSeededData(true);
    }
  };

  const QuickActionButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/daily-readings")}
      >
        <CalendarDays className="h-6 w-6" />
        <span>Daily Readings</span>
      </Button>
      
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/tank-unload")}
      >
        <Truck className="h-6 w-6" />
        <span>Tank Unload</span>
      </Button>
      
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/testing-details")}
      >
        <TrendingUp className="h-6 w-6" />
        <span>Testing Details</span>
      </Button>
      
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/staff-management")}
      >
        <Users className="h-6 w-6" />
        <span>Staff Management</span>
      </Button>
      
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/consumables")}
      >
        <Package className="h-6 w-6" />
        <span>Consumables</span>
      </Button>
      
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate("/settings")}
      >
        <BarChart3 className="h-6 w-6" />
        <span>Settings</span>
      </Button>
    </div>
  );

  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {!hasSeededData && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          You need to seed the database with sample data to use the application.
                        </p>
                        <div className="mt-2">
                          <Button size="sm" onClick={handleSeedDatabase}>
                            Seed Database
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {!isLoading && Object.entries(fuelLevels).map(([fuelType, data]) => (
                <FuelTankDisplay 
                  key={fuelType}
                  fuelType={fuelType}
                  capacity={data.capacity}
                  lastUpdated={new Date().toLocaleDateString()}
                  showTankIcon={true}
                />
              ))}
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Quick Actions</h3>
                  <QuickActionButtons />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            {/* Add analytics content here */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Stay tuned for detailed analytics and reporting features.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
