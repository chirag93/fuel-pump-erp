
import { useState } from 'react';
import TankUnloadForm from "@/components/tank-unload/TankUnloadForm";
import RecentUnloadsTable from "@/components/tank-unload/RecentUnloadsTable";

const TankUnload = () => {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleUnloadSuccess = () => {
    // Increment the counter to trigger a refresh in the table
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tank Unload</h2>
        <p className="text-muted-foreground">Record fuel delivery details when a tanker unloads at your station</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <TankUnloadForm onSuccess={handleUnloadSuccess} />
        <RecentUnloadsTable refreshTrigger={refreshCounter} />
      </div>
    </div>
  );
};

export default TankUnload;
