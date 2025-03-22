
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/hooks/use-toast';
import { Calculator, DownloadCloud, Upload, FileText } from 'lucide-react';

const TaxCalculation = () => {
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [taxType, setTaxType] = useState<string>('gst');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Tax Report Generated",
        description: "Your GST tax report has been generated successfully.",
      });
    }, 1500);
  };
  
  return (
    <AccountingPageLayout 
      title="Tax Calculation" 
      description="Calculate taxes and generate tax reports for compliance."
    >
      <Tabs defaultValue="gst" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="gst">GST Returns</TabsTrigger>
          <TabsTrigger value="tds">TDS Calculation</TabsTrigger>
          <TabsTrigger value="tax-planning">Tax Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gst" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GST Return Calculator</CardTitle>
                <CardDescription>
                  Generate GST reports for filing returns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Type</label>
                  <Select value={taxType} onValueChange={setTaxType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select return type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gst">GSTR-1 (Sales)</SelectItem>
                      <SelectItem value="gstr2">GSTR-2 (Purchases)</SelectItem>
                      <SelectItem value="gstr3b">GSTR-3B (Summary)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <DatePicker date={fromDate} setDate={setFromDate} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <DatePicker date={toDate} setDate={setToDate} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isGenerating || !fromDate || !toDate}
                  className="w-full"
                >
                  {isGenerating ? 
                    "Generating..." : 
                    "Generate GST Report"
                  }
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>GST Calculations Summary</CardTitle>
                <CardDescription>
                  Current quarter GST calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Total Taxable Sales</span>
                    <span className="font-medium">₹125,680.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Output CGST</span>
                    <span className="font-medium">₹11,311.20</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Output SGST</span>
                    <span className="font-medium">₹11,311.20</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Input Tax Credit</span>
                    <span className="font-medium">₹8,750.00</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-medium">Net GST Payable</span>
                    <span className="font-medium">₹13,872.40</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TDS Calculation</CardTitle>
              <CardDescription>
                Calculate TDS for various payment types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax-planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Planning</CardTitle>
              <CardDescription>
                Tools to help with tax planning and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AccountingPageLayout>
  );
};

export default TaxCalculation;
