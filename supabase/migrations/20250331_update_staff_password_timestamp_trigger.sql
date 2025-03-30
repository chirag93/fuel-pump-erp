
-- Create a trigger to automatically update password_updated_at field when a staff record is updated
CREATE OR REPLACE FUNCTION public.update_staff_password_timestamp_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this is a password-related update
  IF TG_OP = 'UPDATE' THEN
    NEW.password_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Add the trigger to the staff table
DROP TRIGGER IF EXISTS update_staff_password_timestamp_trigger ON public.staff;
CREATE TRIGGER update_staff_password_timestamp_trigger
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_staff_password_timestamp_trigger();
