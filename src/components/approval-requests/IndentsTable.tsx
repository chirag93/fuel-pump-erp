
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Indent } from '@/integrations/supabase/client';

interface IndentsTableProps {
  indents: Indent[];
  isLoading: boolean;
  onApprove: (indent: Indent) => void;
  onReject: (indent: Indent) => void;
}

const IndentsTable: React.FC<IndentsTableProps> = ({ 
  indents, 
  isLoading, 
  onApprove, 
  onReject 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (indents.length === 0) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">No pending indents found</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indent #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indents.map((indent) => (
            <TableRow key={indent.id}>
              <TableCell className="font-medium">{indent.indent_number || 'No Number'}</TableCell>
              <TableCell>{indent.customer_name || 'Unknown'}</TableCell>
              <TableCell>{indent.vehicle_number || 'Unknown'}</TableCell>
              <TableCell>{indent.date ? format(new Date(indent.date), 'dd/MM/yyyy') : 'Unknown'}</TableCell>
              <TableCell>{indent.fuel_type}</TableCell>
              <TableCell>₹{indent.amount?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <Badge variant="outline">{indent.source || 'web'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => onApprove(indent)} 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => onReject(indent)} 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default IndentsTable;
