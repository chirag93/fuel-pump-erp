
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Consumable {
  id: string;
  name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  date: string;
  created_at?: string;
}

const Consumables = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price_per_unit: '',
  });
  const { isAuthenticated } = useAuth();

  // Fetch consumables from Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchConsumables = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('consumables')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setConsumables(data || []);
      } catch (error) {
        console.error('Error fetching consumables:', error);
        toast({
          title: 'Failed to load consumables data',
          description: 'Please try refreshing the page',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsumables();
  }, [isAuthenticated]);

  // Filter consumables based on search term
  const filteredConsumables = consumables.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddConsumable = () => {
    setEditingConsumable(null);
    setFormData({
      name: '',
      quantity: '',
      price_per_unit: '',
    });
    setFormOpen(true);
  };

  const handleEditConsumable = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    setFormData({
      name: consumable.name,
      quantity: consumable.quantity.toString(),
      price_per_unit: consumable.price_per_unit.toString(),
    });
    setFormOpen(true);
  };

  const handleSaveConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.quantity || !formData.price_per_unit) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const price_per_unit = parseFloat(formData.price_per_unit);
    const total_price = quantity * price_per_unit;
    
    try {
      if (editingConsumable) {
        // Update existing consumable
        const { error } = await supabase
          .from('consumables')
          .update({
            name: formData.name,
            quantity: quantity,
            price_per_unit: price_per_unit,
            total_price: total_price,
            date: new Date().toISOString().split('T')[0]
          })
          .eq('id', editingConsumable.id);
          
        if (error) throw error;
        
        setConsumables(consumables.map(c => c.id === editingConsumable.id ? {
          ...c,
          name: formData.name,
          quantity: quantity,
          price_per_unit: price_per_unit,
          total_price: total_price,
          date: new Date().toISOString().split('T')[0]
        } : c));
        
        toast({ title: "Consumable updated", description: `${formData.name} has been updated` });
      } else {
        // Add new consumable
        const newConsumable = {
          name: formData.name,
          quantity: quantity,
          price_per_unit: price_per_unit,
          total_price: total_price,
          date: new Date().toISOString().split('T')[0]
        };
        
        const { data, error } = await supabase
          .from('consumables')
          .insert(newConsumable)
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          setConsumables([...consumables, data[0]]);
          toast({ title: "Consumable added", description: `${formData.name} has been added` });
        }
      }
      
      setFormOpen(false);
    } catch (error) {
      console.error('Error saving consumable:', error);
      toast({
        title: 'Error',
        description: 'Failed to save consumable information',
        variant: 'destructive'
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
        
        setConsumables(consumables.filter(c => c.id !== id));
        toast({ title: "Consumable removed", description: "Item has been removed" });
      } catch (error) {
        console.error('Error deleting consumable:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete consumable',
          variant: 'destructive'
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
            placeholder="Search by name"
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
            <div className="py-8 text-center">Loading consumables data...</div>
          ) : filteredConsumables.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No consumables found. Add your first item using the "Add Consumable" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price/Unit</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumables.map((consumable) => (
                  <TableRow key={consumable.id}>
                    <TableCell className="font-medium">{consumable.name}</TableCell>
                    <TableCell>{consumable.quantity}</TableCell>
                    <TableCell>₹{consumable.price_per_unit}</TableCell>
                    <TableCell>₹{consumable.total_price}</TableCell>
                    <TableCell>{new Date(consumable.date).toLocaleDateString()}</TableCell>
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
                <Label htmlFor="pricePerUnit">Price Per Unit (₹)</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  value={formData.price_per_unit}
                  onChange={(e) => handleInputChange('price_per_unit', e.target.value)}
                  placeholder="Enter price per unit"
                />
              </div>
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
