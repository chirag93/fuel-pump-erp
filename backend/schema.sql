
-- This SQL file contains the schema for user management with password hashing

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sample function to create a new user with hashed password
CREATE OR REPLACE FUNCTION create_user(
  p_username VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_role VARCHAR DEFAULT 'staff'
) RETURNS UUID AS $$
DECLARE
  v_salt VARCHAR;
  v_hash VARCHAR;
  v_user_id UUID;
BEGIN
  -- Generate salt and hash (this would be done in your app, shown here for demonstration)
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_hash := encode(digest(p_password || v_salt, 'sha256'), 'hex');
  
  -- Insert the new user
  INSERT INTO app_users (
    username,
    email,
    password_hash,
    password_salt,
    role
  ) VALUES (
    p_username,
    p_email,
    v_hash,
    v_salt,
    p_role
  ) RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data initialization (would be handled by your app)
-- SELECT create_user('admin', 'admin@example.com', 'admin123', 'admin');
