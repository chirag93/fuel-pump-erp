
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardFeatureProps {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
}

export function CardFeature({ title, description, icon, className }: CardFeatureProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl p-4 shadow-soft transition-all duration-300 hover:shadow-medium bg-white dark:bg-black/20 border border-border/60 aspect-square flex flex-col",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      
      <h3 className="mb-1 text-base font-semibold transition-colors duration-300">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
