
-- Create a function to get tank unloads for a specific pump
CREATE OR REPLACE FUNCTION public.get_tank_unloads_for_pump(pump_id_param UUID)
RETURNS SETOF tank_unloads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.tank_unloads
  WHERE fuel_pump_id = pump_id_param
  ORDER BY date DESC;
END;
$$;
