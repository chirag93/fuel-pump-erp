
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportData } from '@/utils/reportUtils';

interface ReportDisplayProps {
  reportData: ReportData;
  onExportReport: () => void;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({
  reportData,
  onExportReport
}) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{reportData.title}</CardTitle>
        <CardDescription>{reportData.date}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.summary.map((item, index) => (
                  <TableRow key={index} className={item.value === '' ? 'bg-muted/50 font-semibold' : ''}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell className="text-right">{item.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {reportData.details && reportData.details.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Detailed Transactions</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.details.slice(0, 10).map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{detail.date}</TableCell>
                        <TableCell>{detail.customerName}</TableCell>
                        <TableCell>{detail.fuelType}</TableCell>
                        <TableCell>{detail.quantity}</TableCell>
                        <TableCell className="text-right">{detail.amount}</TableCell>
                      </TableRow>
                    ))}
                    {reportData.details.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          <Button variant="link" className="gap-1">
                            View all {reportData.details.length} transactions
                            <ChevronRight size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
