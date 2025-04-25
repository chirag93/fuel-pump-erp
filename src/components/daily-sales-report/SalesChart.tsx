
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  chartData: Array<{
    name: string;
    sales: number;
  }>;
  isLoading: boolean;
}

const SalesChart = ({ chartData, isLoading }: SalesChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading chart data...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" name="Sales (₹)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No sales data available for the selected date range</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;
