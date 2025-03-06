
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface Consumable {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  lastRestockedDate: string;
}

const initialConsumables: Consumable[] = [
  {
    id: 'C001',
    name: 'Engine Oil',
    category: 'Lubricant',
    quantity: 50,
    unit: 'Litres',
    pricePerUnit: 450,
    lastRestockedDate: '2023-04-15',
  },
  {
    id: 'C002',
    name: 'Air Filter',
    category: 'Filter',
    quantity: 25,
    unit: 'Pieces',
    pricePerUnit: 200,
    lastRestockedDate: '2023-04-10',
  },
  {
    id: 'C003',
    name: 'Coolant',
    category: 'Fluid',
    quantity: 30,
    unit: 'Litres',
    pricePerUnit: 180,
    lastRestockedDate: '2023-04-12',
  },
];

const Consumables = () => {
  const [consumables, setConsumables] = useState<Consumable[]>(initialConsumables);
  const [formOpen, setFormOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
  });

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
      pricePerUnit: '',
    });
    setFormOpen(true);
  };

  const handleEditConsumable = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    setFormData({
      name: consumable.name,
      category: consumable.category,
      quantity: consumable.quantity.toString(),
      unit: consumable.unit,
      pricePerUnit: consumable.pricePerUnit.toString(),
    });
    setFormOpen(true);
  };

  const handleSaveConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category || !formData.quantity || !formData.unit || !formData.pricePerUnit) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editingConsumable) {
      // Update existing consumable
      setConsumables(consumables.map(c => c.id === editingConsumable.id ? {
        ...c,
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
      } : c));
      toast({ title: "Consumable updated", description: `${formData.name} has been updated` });
    } else {
      // Add new consumable
      const newConsumable: Consumable = {
        id: `C${consumables.length + 1}`.padStart(3, '0'),
        name: formData.name,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        lastRestockedDate: new Date().toISOString().split('T')[0],
      };
      setConsumables([...consumables, newConsumable]);
      toast({ title: "Consumable added", description: `${formData.name} has been added` });
    }
    setFormOpen(false);
  };

  const handleDeleteConsumable = (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      setConsumables(consumables.filter(c => c.id !== id));
      toast({ title: "Consumable removed", description: "Item has been removed" });
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
          {filteredConsumables.length === 0 ? (
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
                  <TableHead>Last Restocked</TableHead>
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
                    <TableCell>₹{consumable.pricePerUnit}</TableCell>
                    <TableCell>{consumable.lastRestockedDate}</TableCell>
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
                value={formData.pricePerUnit}
                onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
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
