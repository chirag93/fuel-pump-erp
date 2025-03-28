
-- Function to generate a UUID
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT uuid_generate_v4();
$$;
