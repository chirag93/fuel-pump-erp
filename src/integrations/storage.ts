
import { supabase } from './supabase/client';
import { decode } from 'base64-arraybuffer';

const ASSETS_BUCKET = 'assets';
const LOGO_PATH = 'logo/fuel-pro-360-logo.png';
const PUBLIC_LOGO_URL = `https://svuritdhlgaonfefphkz.supabase.co/storage/v1/object/public/${ASSETS_BUCKET}/${LOGO_PATH}`;
const FALLBACK_LOGO_URL = "/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png";

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
 * Upload a base64 image to Supabase storage as the logo
 * @param base64Image The base64 encoded image
 * @returns Promise with the file path if successful
 */
export const uploadBase64Logo = async (base64Image: string): Promise<string | null> => {
  try {
    // Remove the data:image/xyz;base64, prefix
    const base64WithoutPrefix = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = decode(base64WithoutPrefix);
    
    const { data, error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(LOGO_PATH, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading base64 logo:', error);
      return null;
    }

    console.log('Base64 logo uploaded successfully:', data.path);
    return data.path;
  } catch (error) {
    console.error('Error in uploadBase64Logo:', error);
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
 * Gets the fallback URL for the logo
 * @returns The fallback URL for the logo
 */
export const getFallbackLogoUrl = (): string => {
  return FALLBACK_LOGO_URL;
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

// This is the built-in logo that will be used if the one above doesn't exist
const defaultLogo = "data:image/png;base64,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";

// Upload the default logo to Supabase when initializing
export const uploadDefaultLogo = async (): Promise<boolean> => {
  try {
    const logoExists = await checkLogoExists();
    
    if (!logoExists) {
      console.log('Default logo not found in Supabase, uploading...');
      await uploadBase64Logo(defaultLogo);
      return true;
    }
    
    console.log('Logo already exists in Supabase storage');
    return true;
  } catch (error) {
    console.error('Error uploading default logo:', error);
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
    
    await uploadDefaultLogo();
    console.log('Logo successfully migrated to Supabase storage');
  } catch (error) {
    console.error('Error in migrateLogoToSupabase:', error);
  }
};
