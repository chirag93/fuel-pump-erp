
import { supabase } from './supabase/client';

const ASSETS_BUCKET = 'assets';
const LOGO_PATH = 'logo/fuel-pro-360-logo.png';
const PUBLIC_LOGO_URL = `https://svuritdhlgaonfefphkz.supabase.co/storage/v1/object/public/${ASSETS_BUCKET}/${LOGO_PATH}`;

/**
 * Uploads a logo file to Supabase storage
 * @param file The logo file to upload
 * @returns Promise with the file path if successful
 */
export const uploadLogo = async (file: File): Promise<string | null> => {
  try {
    // Create the directory structure if needed
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(LOGO_PATH, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading logo:', error);
      return null;
    }

    console.log('Logo uploaded successfully:', data.path);
    return data.path;
  } catch (error) {
    console.error('Error in uploadLogo:', error);
    return null;
  }
};

/**
 * Gets the public URL for the logo
 * @returns The public URL for the logo
 */
export const getLogoUrl = (): string => {
  return PUBLIC_LOGO_URL;
};

/**
 * Checks if the logo exists in Supabase storage
 * @returns Promise with boolean indicating if logo exists
 */
export const checkLogoExists = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .list('logo');
    
    if (error) {
      console.error('Error checking if logo exists:', error);
      return false;
    }
    
    return data.some(file => file.name === 'fuel-pro-360-logo.png');
  } catch (error) {
    console.error('Error in checkLogoExists:', error);
    return false;
  }
};

// Initial upload function for development purposes
// This can be used to upload the logo from the existing path to Supabase storage
export const migrateLogoToSupabase = async (): Promise<void> => {
  try {
    // First check if logo already exists in Supabase
    const logoExists = await checkLogoExists();
    if (logoExists) {
      console.log('Logo already exists in Supabase storage, skipping migration');
      return;
    }
    
    // Fetch the existing logo from lovable uploads
    const response = await fetch('/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], 'fuel-pro-360-logo.png', { type: 'image/png' });
    
    // Upload to Supabase storage
    const path = await uploadLogo(file);
    
    if (path) {
      console.log('Logo successfully migrated to Supabase storage:', path);
    } else {
      console.error('Failed to migrate logo to Supabase storage');
    }
  } catch (error) {
    console.error('Error in migrateLogoToSupabase:', error);
  }
};
