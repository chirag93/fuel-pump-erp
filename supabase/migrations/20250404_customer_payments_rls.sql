
-- Enable RLS on customer_payments table if not already enabled
ALTER TABLE IF EXISTS public.customer_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting records (authenticated users can insert records for their fuel pump)
CREATE POLICY "Users can insert customer payments for their fuel pump" 
ON public.customer_payments 
FOR INSERT 
TO authenticated 
WITH CHECK (fuel_pump_id = auth.jwt() -> 'user_metadata' ->> 'fuelPumpId' OR 
           fuel_pump_id IN (
             SELECT fuel_pump_id FROM public.staff 
             WHERE auth_id = auth.uid()
           ));

-- Create policy for selecting records (authenticated users can view records for their fuel pump)
CREATE POLICY "Users can view customer payments for their fuel pump" 
ON public.customer_payments 
FOR SELECT 
TO authenticated 
USING (fuel_pump_id = auth.jwt() -> 'user_metadata' ->> 'fuelPumpId' OR 
      fuel_pump_id IN (
        SELECT fuel_pump_id FROM public.staff 
        WHERE auth_id = auth.uid()
      ));

-- Create policy for updating records (authenticated users can update records for their fuel pump)
CREATE POLICY "Users can update customer payments for their fuel pump" 
ON public.customer_payments 
FOR UPDATE 
TO authenticated 
USING (fuel_pump_id = auth.jwt() -> 'user_metadata' ->> 'fuelPumpId' OR 
      fuel_pump_id IN (
        SELECT fuel_pump_id FROM public.staff 
        WHERE auth_id = auth.uid()
      ));

-- Create policy for deleting records (authenticated users can delete records for their fuel pump)
CREATE POLICY "Users can delete customer payments for their fuel pump" 
ON public.customer_payments 
FOR DELETE 
TO authenticated 
USING (fuel_pump_id = auth.jwt() -> 'user_metadata' ->> 'fuelPumpId' OR 
      fuel_pump_id IN (
        SELECT fuel_pump_id FROM public.staff 
        WHERE auth_id = auth.uid()
      ));
