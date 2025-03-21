
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Minus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Consumable {
  id: string;
  name: string;
  quantity: number;
  price_per_unit: number;
  unit: string;
  category: string;
}

interface SelectedConsumable {
  id: string;
  name: string;
  quantity: number;
  available: number;
  price_per_unit: number;
  unit: string;
}

interface ConsumableSelectionProps {
  selectedConsumables: SelectedConsumable[];
  setSelectedConsumables: React.Dispatch<React.SetStateAction<SelectedConsumable[]>>;
  mode: 'allocate' | 'return';
  allocatedConsumables?: SelectedConsumable[];
}

export function ConsumableSelection({
  selectedConsumables,
  setSelectedConsumables,
  mode,
  allocatedConsumables = []
}: ConsumableSelectionProps) {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [selectedConsumableId, setSelectedConsumableId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConsumables = async () => {
      setIsLoading(true);
      try {
        // For allocation mode, we fetch from inventory
        const { data, error } = await supabase
          .from('consumables')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        if (data) {
          setConsumables(data);
        }
      } catch (error) {
        console.error('Error fetching consumables:', error);
        toast({
          title: "Error",
          description: "Failed to load consumables data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsumables();
  }, [mode]);

  const addConsumable = () => {
    if (!selectedConsumableId || Number(quantity) <= 0) {
      toast({
        title: "Invalid selection",
        description: "Please select a consumable and a valid quantity",
        variant: "destructive"
      });
      return;
    }

    const selectedConsumable = consumables.find(c => c.id === selectedConsumableId);
    
    if (!selectedConsumable) {
      return;
    }

    const existingIndex = selectedConsumables.findIndex(c => c.id === selectedConsumableId);

    // If we're in return mode, make sure we don't return more than allocated
    if (mode === 'return') {
      const allocated = allocatedConsumables.find(c => c.id === selectedConsumableId);
      if (allocated) {
        const currentTotal = existingIndex >= 0 
          ? selectedConsumables[existingIndex].quantity 
          : 0;
          
        if (currentTotal + Number(quantity) > allocated.quantity) {
          toast({
            title: "Invalid quantity",
            description: `You cannot return more than the allocated amount (${allocated.quantity} ${allocated.unit})`,
            variant: "destructive"
          });
          return;
        }
      } else {
        toast({
          title: "Invalid selection",
          description: "You can only return consumables that were allocated",
          variant: "destructive"
        });
        return;
      }
    }

    // If we're in allocate mode, make sure we don't allocate more than available
    if (mode === 'allocate' && Number(quantity) > selectedConsumable.quantity) {
      toast({
        title: "Invalid quantity",
        description: `Only ${selectedConsumable.quantity} ${selectedConsumable.unit || 'units'} available`,
        variant: "destructive"
      });
      return;
    }

    if (existingIndex >= 0) {
      // Update existing entry
      const updatedConsumables = [...selectedConsumables];
      updatedConsumables[existingIndex] = {
        ...updatedConsumables[existingIndex],
        quantity: updatedConsumables[existingIndex].quantity + Number(quantity)
      };
      setSelectedConsumables(updatedConsumables);
    } else {
      // Add new entry
      setSelectedConsumables([
        ...selectedConsumables,
        {
          id: selectedConsumable.id,
          name: selectedConsumable.name,
          quantity: Number(quantity),
          available: selectedConsumable.quantity,
          price_per_unit: selectedConsumable.price_per_unit,
          unit: selectedConsumable.unit || 'units'
        }
      ]);
    }

    // Reset the selection
    setSelectedConsumableId('');
    setQuantity('1');
  };

  const removeConsumable = (id: string) => {
    setSelectedConsumables(selectedConsumables.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, increment: boolean) => {
    setSelectedConsumables(
      selectedConsumables.map(c => {
        if (c.id === id) {
          const newQuantity = increment ? c.quantity + 1 : Math.max(1, c.quantity - 1);
          
          // For allocation mode, check against available quantity
          if (mode === 'allocate' && increment && newQuantity > c.available) {
            toast({
              title: "Cannot increase quantity",
              description: `Only ${c.available} ${c.unit} available`,
              variant: "destructive"
            });
            return c;
          }
          
          // For return mode, check against allocated quantity
          if (mode === 'return') {
            const allocated = allocatedConsumables.find(alloc => alloc.id === id);
            if (allocated && newQuantity > allocated.quantity) {
              toast({
                title: "Cannot increase quantity",
                description: `Only ${allocated.quantity} ${c.unit} were allocated`,
                variant: "destructive"
              });
              return c;
            }
          }
          
          return { ...c, quantity: newQuantity };
        }
        return c;
      })
    );
  };

  const getTotalCost = () => {
    return selectedConsumables.reduce((total, item) => {
      return total + (item.quantity * item.price_per_unit);
    }, 0);
  };

  // Get filtered list of consumables based on mode
  const filteredConsumables = mode === 'return' 
    ? consumables.filter(c => allocatedConsumables.some(ac => ac.id === c.id))
    : consumables;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {mode === 'allocate' ? 'Allocate Consumables' : 'Return Unused Consumables'}
      </h3>
      
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <Label htmlFor="consumable">Consumable</Label>
          <Select
            value={selectedConsumableId}
            onValueChange={setSelectedConsumableId}
          >
            <SelectTrigger id="consumable">
              <SelectValue placeholder="Select consumable" />
            </SelectTrigger>
            <SelectContent>
              {filteredConsumables.map((consumable) => (
                <SelectItem 
                  key={consumable.id} 
                  value={consumable.id}
                  disabled={mode === 'allocate' && consumable.quantity <= 0}
                >
                  {consumable.name} 
                  {mode === 'allocate' && ` (${consumable.quantity} ${consumable.unit || 'units'} available)`}
                </SelectItem>
              ))}
              {filteredConsumables.length === 0 && (
                <SelectItem value="none" disabled>
                  No consumables available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-3">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>
        
        <div className="col-span-3 flex items-end">
          <Button 
            onClick={addConsumable}
            className="w-full"
            disabled={!selectedConsumableId || Number(quantity) <= 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {selectedConsumables.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {selectedConsumables.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} × ₹{item.price_per_unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, false)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConsumable(item.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <span>₹{getTotalCost().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
