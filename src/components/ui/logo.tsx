
import { useState, useEffect } from "react";
import { getLogoUrl, getFallbackLogoUrl, uploadDefaultLogo } from "@/integrations/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  textClassName?: string;
}

export function Logo({ className, size = "md", textClassName }: LogoProps) {
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
    return <Skeleton className={cn(className || sizes[size], "bg-white/20")} />;
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center", 
        className || sizes[size], 
        "bg-white/10 rounded-lg"
      )}>
        <span className={cn(
          "text-white text-xs font-medium", 
          textClassName
        )}>
          Fuel Pro 360
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl || getFallbackLogoUrl()}
      alt="Fuel Pro 360 Logo"
      className={cn(
        "object-contain", 
        className || sizes[size],
        "drop-shadow-lg"
      )}
    />
  );
}
