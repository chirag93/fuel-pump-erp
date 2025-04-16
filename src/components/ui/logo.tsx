
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <img
      src="/lovable-uploads/aee43f29-debb-417a-8bb0-ccc9fc0ec77b.png"
      alt="Fuel Pro 360 Logo"
      className={cn(sizes[size], "w-auto", className)}
    />
  );
}
