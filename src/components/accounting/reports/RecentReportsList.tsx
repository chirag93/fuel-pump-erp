
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { printReport } from '@/utils/reportUtils';

interface RecentReport {
  type: string;
  date: Date;
  icon: React.ReactNode;
  data?: any; // Add data property for printing
}

interface RecentReportsListProps {
  reports: RecentReport[];
  onExportReport: () => void;
}

export const RecentReportsList: React.FC<RecentReportsListProps> = ({
  reports,
  onExportReport
}) => {
  const handlePrintReport = (report: RecentReport) => {
    if (report.data) {
      printReport(report.data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>
          Your recently generated reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {reports.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">{report.icon}</div>
                <div>
                  <h4 className="text-sm font-medium">{report.type}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(report.date, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={onExportReport}>
                  <Download size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handlePrintReport(report)}
                  disabled={!report.data}
                >
                  <Printer size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
