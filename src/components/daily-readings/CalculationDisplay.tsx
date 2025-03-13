
import React from 'react';

interface CalculationDisplayProps {
  label: string;
  value: number;
  description?: string;
  valueClassName?: string;
}

const CalculationDisplay: React.FC<CalculationDisplayProps> = ({ 
  label, 
  value, 
  description,
  valueClassName
}) => {
  return (
    <div className="p-3 bg-muted rounded-md">
      <div className="flex items-center">
        <span className="font-medium mr-2">{label} =</span>
        <span className={valueClassName}>{value}</span>
        {description && (
          <span className="ml-2 text-sm text-muted-foreground">({description})</span>
        )}
      </div>
    </div>
  );
};

export default CalculationDisplay;
