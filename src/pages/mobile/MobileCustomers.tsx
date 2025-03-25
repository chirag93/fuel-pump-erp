
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, UserRound, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const MobileCustomers = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Customers</h1>
      </div>
      
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
          className="pl-9"
        />
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <UserRound className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Recent Customers</h2>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">Customer {index + 1}</p>
                  <p className="text-sm text-muted-foreground">Vehicle: XYZ-{1000 + index}</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileCustomers;
