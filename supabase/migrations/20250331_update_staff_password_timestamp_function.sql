
-- Create a function to update the staff password_updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_staff_password_timestamp(staff_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.staff
  SET password_updated_at = now()
  WHERE id = staff_id;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.update_staff_password_timestamp(UUID) IS 'Updates the password_updated_at field in the staff table to the current timestamp';
