
-- Add password_updated_at column to staff table to track password changes
ALTER TABLE IF EXISTS public.staff 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN public.staff.password_updated_at IS 'Timestamp of when the staff member password was last updated';
