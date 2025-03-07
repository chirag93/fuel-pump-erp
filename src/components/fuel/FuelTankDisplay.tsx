
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Fuel, Droplets } from 'lucide-react';

interface FuelTankProps {
  fuelType: 'Petrol' | 'Diesel';
  capacity: number;
  currentLevel: number;
  lastUpdated?: string;
}

const FuelTankDisplay = ({ fuelType, capacity, currentLevel, lastUpdated }: FuelTankProps) => {
  const fillPercentage = Math.round((currentLevel / capacity) * 100);
  const isLow = fillPercentage < 20;
  
  const color = fuelType === 'Petrol' ? 'bg-orange-500' : 'bg-blue-600';
  const colorText = fuelType === 'Petrol' ? 'text-orange-500' : 'text-blue-600';
  const colorBg = fuelType === 'Petrol' ? 'bg-orange-100' : 'bg-blue-100';
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorBg} ${colorText}`}>
              {fuelType === 'Petrol' ? <Fuel size={20} /> : <Droplets size={20} />}
            </div>
            <CardTitle>{fuelType} Tank</CardTitle>
          </div>
          <div className={`text-sm font-semibold rounded-full py-1 px-2 ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {isLow ? 'Low' : 'Normal'}
          </div>
        </div>
        <CardDescription>
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'Current storage status'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Storage Level</span>
            <span className="font-bold">{fillPercentage}%</span>
          </div>
          <Progress value={fillPercentage} className="h-3" />
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div>
              <span className="text-muted-foreground">Capacity</span>
              <p className="font-semibold">{capacity.toLocaleString()} liters</p>
            </div>
            <div>
              <span className="text-muted-foreground">Available</span>
              <p className="font-semibold">{currentLevel.toLocaleString()} liters</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FuelTankDisplay;
