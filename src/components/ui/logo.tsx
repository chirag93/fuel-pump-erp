
import { getLogoUrl } from "@/integrations/storage";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto"
  };

  return (
    <img
      src={getLogoUrl()}
      alt="Fuel Pro 360 Logo"
      className={className || sizes[size]}
      onError={(e) => {
        // Fallback to lovable uploads if Supabase storage fails
        const target = e.target as HTMLImageElement;
        console.warn('Failed to load logo from Supabase, falling back to Lovable uploads');
        target.src = "/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png";
      }}
    />
  );
}
