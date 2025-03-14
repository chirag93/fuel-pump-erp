
import React from 'react';

interface CalculationDisplayProps {
  label: string;
  value: number;
  description?: string;
  valueClassName?: string;
  showPlusSign?: boolean;
}

const CalculationDisplay: React.FC<CalculationDisplayProps> = ({ 
  label, 
  value, 
  description,
  valueClassName,
  showPlusSign = false
}) => {
  // Format the value with + sign if positive and showPlusSign is true
  const displayValue = showPlusSign && value > 0 ? `+${value}` : value;
  
  return (
    <div className="p-3 bg-muted rounded-md">
      <div className="flex items-center">
        <span className="font-medium mr-2">{label} =</span>
        <span className={valueClassName}>{displayValue}</span>
        {description && (
          <span className="ml-2 text-sm text-muted-foreground">({description})</span>
        )}
      </div>
    </div>
  );
};

export default CalculationDisplay;
