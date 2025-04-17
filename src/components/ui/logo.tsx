
import { useState, useEffect } from "react";
import { getLogoUrl } from "@/integrations/storage";
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
    
    const supbaseLogoUrl = getLogoUrl();
    const fallbackLogoUrl = "/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png";
    
    // Pre-load the image to check if it exists
    const img = new Image();
    
    // First try to load from Supabase
    img.onload = () => {
      setLogoUrl(supbaseLogoUrl);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.warn('Failed to load logo from Supabase, falling back to Lovable uploads');
      
      // Try the fallback
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setLogoUrl(fallbackLogoUrl);
        setIsLoading(false);
      };
      
      fallbackImg.onerror = () => {
        console.error('Failed to load logo from fallback source');
        setError(true);
        setIsLoading(false);
      };
      
      fallbackImg.src = fallbackLogoUrl;
    };
    
    img.src = supbaseLogoUrl;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
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
      src={logoUrl || "/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png"}
      alt="Fuel Pro 360 Logo"
      className={className || sizes[size]}
    />
  );
}
