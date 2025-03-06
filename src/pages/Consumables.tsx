
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Consumable {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lastUpdated: string;
}

const ConsumablesPage = () => {
  const [consumables, setConsumables] = useState<Consumable[]>([
    { 
      id: '1',
      name: 'Engine Oil 5W-30',
      category: 'Oil',
      price: 549.99,
      stock: 45,
      lastUpdated: '2023-05-15'
    },
    { 
      id: '2',
      name: 'Windshield Wiper Fluid',
      category: 'Fluid',
      price: 149.99,
      stock: 78,
      lastUpdated: '2023-05-10'
    },
    { 
      id: '3',
      name: 'Air Filter',
      category: 'Filter',
      price: 299.99,
      stock: 32,
      lastUpdated: '2023-05-12'
    },
    { 
      id: '4',
      name: 'Brake Fluid DOT4',
      category: 'Fluid',
      price: 189.99,
      stock: 53,
      lastUpdated: '2023-05-14'
    },
    { 
      id: '5',
      name: 'Transmission Fluid',
      category: 'Fluid',
      price: 379.99,
      stock: 27,
      lastUpdated: '2023-05-11'
    }
  ]);

  const [newConsumable, setNewConsumable] = useState<Partial<Consumable>>({
    name: '',
    category: 'Oil',
    price: 0,
    stock: 0
  });

  const [formOpen, setFormOpen] = useState(false);

  const handleAddConsumable = () => {
    const consumable: Consumable = {
      id: (consumables.length + 1).toString(),
      name: newConsumable.name || '',
      category: newConsumable.category || 'Oil',
      price: newConsumable.price || 0,
      stock: newConsumable.stock || 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setConsumables([...consumables, consumable]);
    setNewConsumable({
      name: '',
      category: 'Oil',
      price: 0,
      stock: 0
    });
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Consumables Management</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add Consumable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Consumable</DialogTitle>
              <DialogDescription>
                Enter the details of the new consumable item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newConsumable.name}
                  onChange={(e) => setNewConsumable({...newConsumable, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newConsumable.category}
                  onValueChange={(value) => setNewConsumable({...newConsumable, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oil">Oil</SelectItem>
                    <SelectItem value="Fluid">Fluid</SelectItem>
                    <SelectItem value="Filter">Filter</SelectItem>
                    <SelectItem value="Accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={newConsumable.price?.toString()}
                  onChange={(e) => setNewConsumable({...newConsumable, price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newConsumable.stock?.toString()}
                  onChange={(e) => setNewConsumable({...newConsumable, stock: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleAddConsumable}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Total Stock</CardTitle>
            <CardDescription>Current inventory value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {consumables.reduce((sum, item) => sum + item.stock, 0)}
            </div>
            <p className="text-sm text-muted-foreground">items in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Inventory Value</CardTitle>
            <CardDescription>Total value of consumables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ₹{consumables.reduce((sum, item) => sum + (item.price * item.stock), 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">total inventory value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Low Stock Items</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {consumables.filter(item => item.stock < 30).length}
            </div>
            <p className="text-sm text-muted-foreground">items need restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Consumables Inventory</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumables.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>₹{item.price.toLocaleString()}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsumablesPage;
