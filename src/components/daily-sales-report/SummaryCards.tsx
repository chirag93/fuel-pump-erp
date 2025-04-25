
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface SummaryCardsProps {
  totalSales: number;
  totalQuantity: number;
  transactionCount: number;
  dateRange: DateRange;
}

const SummaryCards = ({ totalSales, totalQuantity, transactionCount, dateRange }: SummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Quantity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity.toLocaleString('en-IN')} L</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{transactionCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium">
            {dateRange.from && dateRange.to ? (
              <>
                {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
              </>
            ) : (
              'Select date range'
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
