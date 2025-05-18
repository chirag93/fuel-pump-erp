
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/utils/formatUtils';

interface Indent {
  id: string;
  date: string;
  indent_number: string;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  source?: string;
  fuel_pump_id?: string;
}

interface IndentsTableProps {
  indents: Indent[];
  isLoading: boolean;
  onApprove: (indent: Indent) => void;
  onReject: (indent: Indent) => void;
  showFuelPumpInfo?: boolean;
}

const IndentsTable = ({ 
  indents, 
  isLoading, 
  onApprove, 
  onReject,
  showFuelPumpInfo = false
}: IndentsTableProps) => {
  const [fuelPumpNames, setFuelPumpNames] = useState<Record<string, string>>({});
  
  // Fetch fuel pump names for super admin view
  useEffect(() => {
    if (showFuelPumpInfo && indents.length > 0) {
      const fetchFuelPumpNames = async () => {
        // Get unique fuel pump IDs
        const uniquePumpIds = [...new Set(indents.map(i => i.fuel_pump_id).filter(Boolean))];
        
        if (uniquePumpIds.length > 0) {
          const { data } = await supabase
            .from('fuel_pumps')
            .select('id, name')
            .in('id', uniquePumpIds);
            
          if (data) {
            const pumpMap: Record<string, string> = {};
            data.forEach(pump => {
              pumpMap[pump.id] = pump.name;
            });
            setFuelPumpNames(pumpMap);
          }
        }
      };
      
      fetchFuelPumpNames();
    }
  }, [indents, showFuelPumpInfo]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (indents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending indent approvals
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Indent #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Fuel</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Source</TableHead>
          {showFuelPumpInfo && <TableHead>Fuel Pump</TableHead>}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indents.map((indent) => (
          <TableRow key={indent.id}>
            <TableCell>{formatDate(indent.date)}</TableCell>
            <TableCell>{indent.indent_number}</TableCell>
            <TableCell>{indent.customer_name || 'Unknown'}</TableCell>
            <TableCell>{indent.vehicle_number || 'N/A'}</TableCell>
            <TableCell>{indent.fuel_type}</TableCell>
            <TableCell>{indent.quantity} L</TableCell>
            <TableCell>{formatMoney(indent.amount)}</TableCell>
            <TableCell>
              <Badge variant={indent.source === 'mobile' ? 'secondary' : 'outline'}>
                {indent.source || 'web'}
              </Badge>
            </TableCell>
            {showFuelPumpInfo && (
              <TableCell>
                {indent.fuel_pump_id ? 
                  fuelPumpNames[indent.fuel_pump_id] || 'Unknown' : 
                  'N/A'
                }
              </TableCell>
            )}
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onApprove(indent)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => onReject(indent)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default IndentsTable;
