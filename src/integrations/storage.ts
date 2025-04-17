
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

// Initial upload function for development purposes
// This can be used to upload the logo from the existing path to Supabase storage
export const migrateLogoToSupabase = async (): Promise<void> => {
  try {
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
