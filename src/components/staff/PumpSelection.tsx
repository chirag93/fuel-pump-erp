
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PumpSelectionProps {
  selectedPump: string;
  onPumpSelect: (value: string) => void;
  onAddPump: () => void;
  onRemovePump: (pump: string) => void;
  assignedPumps: string[];
}

export function PumpSelection({
  selectedPump,
  onPumpSelect,
  onAddPump,
  onRemovePump,
  assignedPumps
}: PumpSelectionProps) {
  return (
    <div className="space-y-2">
      <Label>Assigned Pumps</Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={selectedPump} onValueChange={onPumpSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select pump" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pump-1">Pump 1 - Petrol</SelectItem>
            <SelectItem value="Pump-2">Pump 2 - Diesel</SelectItem>
            <SelectItem value="Pump-3">Pump 3 - Premium Petrol</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={onAddPump}>Add</Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {assignedPumps.map((pump: string) => (
          <div key={pump} className="bg-muted px-3 py-1 rounded-full flex items-center gap-1">
            <span>{pump}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 rounded-full"
              onClick={() => onRemovePump(pump)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
