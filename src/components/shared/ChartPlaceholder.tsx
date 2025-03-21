
import { LucideIcon } from 'lucide-react';

interface ChartPlaceholderProps {
  message: string;
  icon?: LucideIcon;
  height?: number | string;
}

const ChartPlaceholder = ({
  message,
  icon: Icon,
  height = 300
}: ChartPlaceholderProps) => {
  return (
    <div 
      className="flex flex-col items-center justify-center text-muted-foreground"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {Icon && <Icon className="h-8 w-8 mb-2 opacity-50" />}
      <p>{message}</p>
    </div>
  );
};

export default ChartPlaceholder;
