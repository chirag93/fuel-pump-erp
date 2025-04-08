
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MapPin, ArrowLeft, UserRound, Calendar, Car, Banknote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { useCustomerData } from '@/hooks/useCustomerData';
import { getFuelPumpId } from '@/integrations/utils';

const MobileCustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, vehicles, transactions, isLoading } = useCustomerData(id || '');
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-3 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="mt-4">Loading customer details...</span>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="container mx-auto py-4 px-3 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <UserRound className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">Customer not found</h2>
          <p className="text-muted-foreground mb-6">The customer you're looking for doesn't exist or was deleted.</p>
          <Button onClick={() => navigate('/mobile/customers')}>Back to Customers</Button>
        </div>
      </div>
    );
  }
  
  // Sort transactions by date in descending order (most recent first)
  const sortedTransactions = [...(transactions || [])].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen pb-20">
      <MobileHeader 
        title={customer.name} 
        leftAction={{
          icon: <ArrowLeft className="h-5 w-5" />,
          onClick: () => navigate('/mobile/customers')
        }}
      />
      
      {/* Customer Info Card */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="space-y-3">
            {customer.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            
            {customer.contact && (
              <div className="flex items-start">
                <UserRound className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                <span>{customer.contact}</span>
              </div>
            )}
            
            {customer.balance !== null && (
              <div className="flex items-center">
                <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-semibold">
                  Balance: ₹{customer.balance.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Vehicles Section */}
      {vehicles && vehicles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Vehicles</h2>
          <div className="space-y-3">
            {vehicles.map(vehicle => (
              <Card key={vehicle.id}>
                <CardContent className="p-3">
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{vehicle.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.type}{vehicle.capacity ? `, ${vehicle.capacity}` : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Transactions */}
      <div>
        <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
        {sortedTransactions.length > 0 ? (
          <div className="space-y-3">
            {sortedTransactions.slice(0, 5).map(transaction => (
              <Card key={transaction.id}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <p className="font-medium">
                        {transaction.fuel_type === 'PAYMENT' ? 'Payment' : transaction.fuel_type}
                      </p>
                      {transaction.fuel_type !== 'PAYMENT' && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.quantity} L
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.fuel_type === 'PAYMENT' ? 'text-green-600' : ''}`}>
                        ₹{transaction.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.payment_method}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCustomerDetails;
