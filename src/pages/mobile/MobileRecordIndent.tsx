
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FuelTransactionForm from '@/components/indent/FuelTransactionForm';

const MobileRecordIndent = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Record Indent</h1>
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">New Transaction</h2>
          </div>
          
          <FuelTransactionForm isMobile={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileRecordIndent;
