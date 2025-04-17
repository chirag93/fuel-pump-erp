
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
      src="/lovable-uploads/b39fe49b-bfda-4eab-a04c-96a833d64021.png"
      alt="Fuel Pro 360 Logo"
      className={className || sizes[size]}
    />
  );
}
