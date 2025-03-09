
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface Consumable {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
  date: string;
  created_at?: string;
}

const Consumables = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    price_per_unit: '',
  });

  // Fetch consumables from the database
  useEffect(() => {
    const fetchConsumables = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('consumables')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedData: Consumable[] = data.map(item => ({
            ...item,
            category: item.category || 'General',
            unit: item.unit || 'Units'
          }));
          setConsumables(formattedData);
        }
      } catch (error) {
        console.error('Error fetching consumables:', error);
        toast({
          title: "Error loading data",
          description: "Could not load consumables. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsumables();
  }, []);

  // Filter consumables based on search term
  const filteredConsumables = consumables.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddConsumable = () => {
    setEditingConsumable(null);
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      price_per_unit: '',
    });
    setFormOpen(true);
  };

  const handleEditConsumable = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    setFormData({
      name: consumable.name,
      category: consumable.category,
      quantity: consumable.quantity.toString(),
      unit: consumable.unit || 'Units',
      price_per_unit: consumable.price_per_unit.toString(),
    });
    setFormOpen(true);
  };

  const handleSaveConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit || !formData.price_per_unit) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const quantity = parseFloat(formData.quantity);
      const pricePerUnit = parseFloat(formData.price_per_unit);
      const totalPrice = quantity * pricePerUnit;
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      if (editingConsumable) {
        // Update existing consumable
        const { error } = await supabase
          .from('consumables')
          .update({
            name: formData.name,
            category: formData.category,
            quantity: quantity,
            unit: formData.unit,
            price_per_unit: pricePerUnit,
            total_price: totalPrice,
            date: today
          })
          .eq('id', editingConsumable.id);
        
        if (error) throw error;
        
        // Update local state
        setConsumables(consumables.map(c => c.id === editingConsumable.id ? {
          ...c,
          name: formData.name,
          category: formData.category,
          quantity: quantity,
          unit: formData.unit,
          price_per_unit: pricePerUnit,
          total_price: totalPrice,
          date: today
        } : c));
        
        toast({ title: "Consumable updated", description: `${formData.name} has been updated` });
      } else {
        // Add new consumable
        const { data, error } = await supabase
          .from('consumables')
          .insert([{
            name: formData.name,
            category: formData.category,
            quantity: quantity,
            unit: formData.unit,
            price_per_unit: pricePerUnit,
            total_price: totalPrice,
            date: today
          }])
          .select();
        
        if (error) throw error;
        
        // Update local state with the returned data which includes the generated ID
        if (data && data.length > 0) {
          // Ensure the data adheres to the Consumable interface
          const newConsumable: Consumable = {
            ...data[0],
            category: data[0].category || formData.category,
            unit: data[0].unit || formData.unit
          };
          setConsumables([...consumables, newConsumable]);
          toast({ title: "Consumable added", description: `${formData.name} has been added` });
        }
      }
      
      setFormOpen(false);
    } catch (error) {
      console.error('Error saving consumable:', error);
      toast({
        title: "Error",
        description: "Failed to save consumable. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConsumable = async (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      try {
        const { error } = await supabase
          .from('consumables')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Update local state
        setConsumables(consumables.filter(c => c.id !== id));
        toast({ title: "Consumable removed", description: "Item has been removed" });
      } catch (error) {
        console.error('Error deleting consumable:', error);
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Consumables Management</h1>
        <Button onClick={handleAddConsumable}>
          <Plus className="mr-2 h-4 w-4" />
          Add Consumable
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or category"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumables Inventory</CardTitle>
              <CardDescription>Manage pump station consumables and spare parts</CardDescription>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading consumables...</span>
            </div>
          ) : filteredConsumables.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No consumables found. Add your first item using the "Add Consumable" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price/Unit</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumables.map((consumable) => (
                  <TableRow key={consumable.id}>
                    <TableCell className="font-medium">{consumable.name}</TableCell>
                    <TableCell>{consumable.category}</TableCell>
                    <TableCell>
                      {consumable.quantity} {consumable.unit}
                    </TableCell>
                    <TableCell>₹{consumable.price_per_unit}</TableCell>
                    <TableCell>₹{consumable.total_price}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditConsumable(consumable)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConsumable(consumable.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConsumable ? 'Edit Consumable' : 'Add New Consumable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConsumable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter consumable name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Enter category"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="e.g. Litres, Pieces"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price Per Unit (₹)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                value={formData.price_per_unit}
                onChange={(e) => handleInputChange('price_per_unit', e.target.value)}
                placeholder="Enter price per unit"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consumables;
