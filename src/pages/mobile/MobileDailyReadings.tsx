import React, { useState, useEffect } from 'react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getFuelPumpId } from '@/integrations/utils';
import { Loader2 } from 'lucide-react';

const MobileDailyReadings = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fuel_type: '',
    dip_reading: '',
    net_stock: '',
    receipt_quantity: '',
    closing_stock: '',
    actual_meter_sales: ''
  });

  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "Please sign in to record daily readings",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      try {
        // Get fuel pump ID
        const pumpId = await getFuelPumpId();
        if (pumpId) {
          setFuelPumpId(pumpId);
          await fetchFuelTypes(pumpId);
        } else {
          toast({
            title: "Error",
            description: "Could not determine fuel pump ID",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast({
          title: "Error",
          description: "Failed to initialize form",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeForm();
  }, [isAuthenticated]);

  const fetchFuelTypes = async (pumpId: string) => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type')
        .eq('fuel_pump_id', pumpId);

      if (error) throw error;

      if (data && data.length > 0) {
        const types = data.map(item => item.fuel_type);
        setFuelTypes(types);
        // Set default fuel type
        if (types.length > 0) {
          setFormData(prev => ({
            ...prev,
            fuel_type: types[0]
          }));
        }
      } else {
        // Default fuel types if none found
        setFuelTypes(['Petrol', 'Diesel']);
      }
    } catch (error) {
      console.error("Error fetching fuel types:", error);
      // Default fuel types on error
      setFuelTypes(['Petrol', 'Diesel']);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDerivedValues = () => {
    const openingStock = parseFloat(formData.net_stock) || 0;
    const receiptQuantity = parseFloat(formData.receipt_quantity) || 0;
    const closingStock = parseFloat(formData.closing_stock) || 0;
    const actualMeterSales = parseFloat(formData.actual_meter_sales) || 0;
    
    // Calculate derived values
    const salesPerTankStock = openingStock + receiptQuantity - closingStock;
    const stockVariation = actualMeterSales - salesPerTankStock;
    
    return { openingStock, salesPerTankStock, stockVariation };
  };

  const validateForm = () => {
    if (!formData.fuel_type) {
      toast({
        title: "Missing information",
        description: "Please select a fuel type",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.dip_reading || !formData.net_stock || !formData.closing_stock || !formData.actual_meter_sales) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const calculations = calculateDerivedValues();
      
      // Get fuel pump ID if not already set
      const pumpId = fuelPumpId || await getFuelPumpId();
      
      if (!pumpId) {
        throw new Error("Could not determine fuel pump ID");
      }
      
      // Create the reading entry without sales_per_tank_stock and stock_variation fields
      const readingEntry = {
        date: formData.date,
        fuel_type: formData.fuel_type,
        dip_reading: parseFloat(formData.dip_reading),
        net_stock: parseFloat(formData.net_stock),
        tank_number: 1,
        opening_stock: calculations.openingStock,
        receipt_quantity: formData.receipt_quantity ? parseFloat(formData.receipt_quantity) : null,
        closing_stock: parseFloat(formData.closing_stock),
        actual_meter_sales: parseFloat(formData.actual_meter_sales),
        // Don't include the sales_per_tank_stock field as it's generated
        // Don't include the stock_variation field as it's generated
        fuel_pump_id: pumpId
      };
      
      // Insert entry
      const { error } = await supabase
        .from('daily_readings')
        .insert([readingEntry]);
        
      if (error) throw error;
      
      // Update fuel settings with the new closing stock
      const updateQuery = supabase
        .from('fuel_settings')
        .update({
          current_level: parseFloat(formData.closing_stock),
          updated_at: new Date().toISOString()
        })
        .eq('fuel_type', formData.fuel_type.trim());
        
      if (pumpId) {
        updateQuery.eq('fuel_pump_id', pumpId);
      }
      
      const { error: updateError } = await updateQuery;
      
      if (updateError) {
        console.error('Error updating fuel settings:', updateError);
        toast({
          title: "Warning",
          description: "Reading saved but failed to update tank level",
          variant: "destructive"
        });
      } else {
        console.log(`Updated tank level for ${formData.fuel_type} to ${formData.closing_stock}`);
      }
      
      toast({
        title: "Success",
        description: "Daily reading saved successfully"
      });
      
      // Reset form after successful save
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fuel_type: formData.fuel_type, // Keep the same fuel type
        dip_reading: '',
        net_stock: '',
        receipt_quantity: '',
        closing_stock: '',
        actual_meter_sales: ''
      });
      
    } catch (error) {
      console.error('Error saving reading:', error);
      toast({
        title: "Error",
        description: "Failed to save reading. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
        <MobileHeader title="Daily Readings" />
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Daily Readings" />
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select
                  value={formData.fuel_type}
                  onValueChange={(value) => handleInputChange('fuel_type', value)}
                >
                  <SelectTrigger id="fuel_type">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dip_reading">Dip Reading</Label>
              <Input
                id="dip_reading"
                type="number"
                value={formData.dip_reading}
                onChange={(e) => handleInputChange('dip_reading', e.target.value)}
                placeholder="Enter dip reading"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="net_stock">Net Stock (Opening)</Label>
              <Input
                id="net_stock"
                type="number"
                value={formData.net_stock}
                onChange={(e) => handleInputChange('net_stock', e.target.value)}
                placeholder="Enter net stock"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receipt_quantity">Receipt Quantity</Label>
              <Input
                id="receipt_quantity"
                type="number"
                value={formData.receipt_quantity}
                onChange={(e) => handleInputChange('receipt_quantity', e.target.value)}
                placeholder="Enter receipt quantity (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="closing_stock">Closing Stock</Label>
              <Input
                id="closing_stock"
                type="number"
                value={formData.closing_stock}
                onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                placeholder="Enter closing stock"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="actual_meter_sales">Actual Meter Sales</Label>
              <Input
                id="actual_meter_sales"
                type="number"
                value={formData.actual_meter_sales}
                onChange={(e) => handleInputChange('actual_meter_sales', e.target.value)}
                placeholder="Enter actual meter sales"
              />
            </div>
            
            <Button 
              type="button" 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Reading"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDailyReadings;
