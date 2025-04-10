
import { SelectedShiftData } from '@/types/shift';

interface ShiftDetailsSectionProps {
  shiftData: SelectedShiftData;
}

export function ShiftDetailsSection({ shiftData }: ShiftDetailsSectionProps) {
  return (
    <div className="grid gap-2">
      <h3 className="font-semibold text-lg">Shift Details</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Staff:</p>
          <p className="font-medium">{shiftData.staff_name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pump:</p>
          <p className="font-medium">{shiftData.pump_id || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
