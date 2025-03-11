
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/integrations/supabase/client';

interface CustomerHeaderProps {
  customer: Customer | null;
  isLoading: boolean;
}

const CustomerHeader = ({ customer, isLoading }: CustomerHeaderProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customer data...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button asChild>
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center">
        <Link to="/customers">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">{customer.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Contact Person</CardTitle>
            <CardDescription>Primary contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">{customer.contact}</div>
            <div className="text-sm text-muted-foreground">{customer.phone}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Email</CardTitle>
            <CardDescription>Communication channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">{customer.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Balance</CardTitle>
            <CardDescription>Available credit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₹{customer.balance?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CustomerHeader;
