
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TankReadingsForm from './TankReadingsForm';
import CalculationDisplay from './CalculationDisplay';
import { ReadingFormData } from './TankReadingsForm';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReadingFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isEditing: boolean;
  readingFormData: ReadingFormData;
  tankCount: number;
  fuelTypes: string[];
  calculatedValues: {
    opening_stock: number;
    sales_per_tank_stock: number;
    stock_variation: number;
  };
  handleInputChange: (field: string, value: string) => void;
  handleTankInputChange: (tankNumber: number, field: string, value: string) => void;
  addTank: () => void;
  removeTank: (tankNumber: number) => void;
  handleSaveReading: () => Promise<void>;
}

const ReadingFormDialog = ({
  isOpen,
  setIsOpen,
  isEditing,
  readingFormData,
  tankCount,
  fuelTypes,
  calculatedValues,
  handleInputChange,
  handleTankInputChange,
  addTank,
  removeTank,
  handleSaveReading
}: ReadingFormDialogProps) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={isMobile ? "max-w-[95vw] p-4" : "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Reading' : 'New Daily Reading'}</DialogTitle>
          <DialogDescription>
            {isMobile ? 'Enter daily readings' : 'Enter the daily sales readings for each fuel type.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={readingFormData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select 
                value={readingFormData.fuel_type} 
                onValueChange={(value) => handleInputChange('fuel_type', value)}
              >
                <SelectTrigger id="fuel_type">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TankReadingsForm
            readingFormData={readingFormData}
            tankCount={tankCount}
            handleTankInputChange={handleTankInputChange}
            addTank={addTank}
            removeTank={removeTank}
            calculatedValues={calculatedValues}
          />
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            <div className="grid gap-2">
              <Label htmlFor="receipt_quantity">Receipt Quantity</Label>
              <Input
                type="number"
                id="receipt_quantity"
                value={readingFormData.receipt_quantity === 0 && readingFormData.id ? '' : readingFormData.receipt_quantity}
                onChange={(e) => handleInputChange('receipt_quantity', e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closing_stock">Closing Stock</Label>
              <Input
                type="number"
                id="closing_stock"
                value={readingFormData.closing_stock === 0 && readingFormData.id ? '' : readingFormData.closing_stock}
                onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                placeholder="Enter closing stock"
              />
            </div>
          </div>
          
          <CalculationDisplay
            label="Sales Per Tank"
            value={calculatedValues.sales_per_tank_stock}
            description={isMobile ? "" : "Opening + Receipt - Closing"}
          />
          
          <div className="grid gap-2">
            <Label htmlFor="actual_meter_sales">Actual Meter Sales</Label>
            <Input
              type="number"
              id="actual_meter_sales"
              value={readingFormData.actual_meter_sales === 0 && readingFormData.id ? '' : readingFormData.actual_meter_sales}
              onChange={(e) => handleInputChange('actual_meter_sales', e.target.value)}
              placeholder="Enter actual meter sales"
            />
          </div>
          
          <CalculationDisplay
            label="Stock Variation"
            value={calculatedValues.stock_variation}
            description={isMobile ? "" : "Actual Meter - Sales Per Tank"}
            valueClassName={calculatedValues.stock_variation > 0 
              ? "text-green-700" 
              : calculatedValues.stock_variation < 0 
                ? "text-[#ea384c]" 
                : ""}
          />
        </div>
        <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
          <Button variant="secondary" onClick={() => setIsOpen(false)} className={isMobile ? "w-full" : ""}>
            Cancel
          </Button>
          <Button onClick={handleSaveReading} className={isMobile ? "w-full" : ""}>
            {isEditing ? 'Update' : 'Add'} Reading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingFormDialog;
