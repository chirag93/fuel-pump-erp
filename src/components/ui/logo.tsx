
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLogoUrl, getFallbackLogoUrl, uploadDefaultLogo } from "@/integrations/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logoSizes, type LogoSize } from "@/config/logoConfig";

interface LogoProps {
  className?: string;
  size?: LogoSize;
  variant?: "default" | "white";
}

export function Logo({ 
  className, 
  size = "lg",
  variant = "default" 
}: LogoProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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

  const handleLogoClick = () => {
    navigate("/home");  // Updated to navigate to /home route
  };

  if (isLoading) {
    return <Skeleton className={cn(className || logoSizes[size], "bg-white/20")} />;
  }

  if (error) {
    return (
      <div 
        onClick={handleLogoClick}
        className={cn(
          "flex items-center justify-center cursor-pointer", 
          className || logoSizes[size], 
          "bg-white/10 rounded-lg"
        )}
      >
        <span className={cn(
          "text-white font-bold text-2xl"
        )}>
          Fuel Pro 360
        </span>
      </div>
    );
  }

  const textColorClass = variant === "white" ? "text-white" : "text-primary";

  return (
    <div onClick={handleLogoClick} className="flex items-center cursor-pointer">
      <img
        src={logoUrl || getFallbackLogoUrl()}
        alt="Fuel Pro 360 Logo"
        className={cn(
          "object-contain", 
          className || logoSizes[size],
          "drop-shadow-md"
        )}
        style={{ maxHeight: "100%", maxWidth: "100%" }}
      />
    </div>
  );
}
