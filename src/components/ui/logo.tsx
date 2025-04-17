
import { useState, useEffect } from "react";
import { getLogoUrl, getFallbackLogoUrl, uploadDefaultLogo } from "@/integrations/storage";
import { Skeleton } from "@/components/ui/skeleton";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const sizes = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto"
  };

  // Attempt to load the logo on component mount
  useEffect(() => {
    // Reset states
    setIsLoading(true);
    setError(false);
    
    const loadLogo = async () => {
      try {
        // Attempt to upload the default logo if it doesn't exist
        await uploadDefaultLogo();
        
        // Get the Supabase logo URL
        const supabaseLogoUrl = getLogoUrl();
        
        // Pre-load the image to check if it exists
        const img = new Image();
        
        img.onload = () => {
          setLogoUrl(supabaseLogoUrl);
          setIsLoading(false);
        };
        
        img.onerror = () => {
          console.warn('Failed to load logo from Supabase');
          setError(true);
          setIsLoading(false);
        };
        
        img.src = supabaseLogoUrl;
      } catch (error) {
        console.error('Error loading logo:', error);
        setError(true);
        setIsLoading(false);
      }
    };
    
    loadLogo();
  }, []);

  if (isLoading) {
    return <Skeleton className={className || sizes[size]} />;
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-primary/10 ${className || sizes[size]}`}>
        <span className="text-primary text-xs font-medium">Fuel Pro 360</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl || getFallbackLogoUrl()}
      alt="Fuel Pro 360 Logo"
      className={className || sizes[size]}
    />
  );
}
