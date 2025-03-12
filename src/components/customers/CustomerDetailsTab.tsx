
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Customer } from '@/integrations/supabase/client';

interface CustomerDetailsTabProps {
  customer: Customer;
}

const CustomerDetailsTab = ({ customer }: CustomerDetailsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Information</CardTitle>
          <Button variant="outline" size="sm" className="gap-1">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Business Name</h3>
            <p className="font-semibold">{customer.name}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">GST Number</h3>
            <p className="font-semibold">{customer.gst}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Contact Person</h3>
            <p className="font-semibold">{customer.contact}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Phone Number</h3>
            <p className="font-semibold">{customer.phone}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Email Address</h3>
            <p className="font-semibold">{customer.email}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Customer Since</h3>
            <p className="font-semibold">
              {customer.created_at 
                ? new Date(customer.created_at).toLocaleDateString() 
                : 'Unknown'}
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Credit Balance</h3>
            <p className={`font-semibold ${customer.balance > 0 ? 'text-orange-600' : customer.balance < 0 ? 'text-green-600' : ''}`}>
              ₹{customer.balance !== null ? customer.balance.toLocaleString() : 0}
              <span className="text-xs font-normal ml-2 text-muted-foreground">
                {customer.balance > 0 ? '(Outstanding)' : customer.balance < 0 ? '(Advance)' : ''}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {customer.balance > 0 
                ? 'Positive balance indicates credit given to customer' 
                : customer.balance < 0 
                  ? 'Negative balance indicates advance payment from customer'
                  : 'No outstanding balance'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDetailsTab;
