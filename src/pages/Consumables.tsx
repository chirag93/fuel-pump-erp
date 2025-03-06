
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Calendar, BarChart3, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Consumable {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

interface ConsumableSale {
  id: string;
  consumableId: string;
  consumableName: string;
  quantity: number;
  amount: number;
  date: string;
  staff: string;
  paymentMethod: 'cash' | 'card' | 'upi';
}

const initialConsumables: Consumable[] = [
  {
    id: 'CONS001',
    name: 'Engine Oil 15W40',
    category: 'Oil',
    price: 450,
    stock: 25,
    unit: 'L'
  },
  {
    id: 'CONS002',
    name: 'Brake Fluid DOT3',
    category: 'Fluid',
    price: 320,
    stock: 15,
    unit: 'L'
  },
  {
    id: 'CONS003',
    name: 'Air Filter',
    category: 'Filter',
    price: 250,
    stock: 30,
    unit: 'pcs'
  },
  {
    id: 'CONS004',
    name: 'Oil Filter',
    category: 'Filter',
    price: 180,
    stock: 40,
    unit: 'pcs'
  },
  {
    id: 'CONS005',
    name: 'Coolant',
    category: 'Fluid',
    price: 290,
    stock: 20,
    unit: 'L'
  }
];

const initialSales: ConsumableSale[] = [
  {
    id: 'SALE001',
    consumableId: 'CONS001',
    consumableName: 'Engine Oil 15W40',
    quantity: 2,
    amount: 900,
    date: '2023-05-15',
    staff: 'Rahul Sharma',
    paymentMethod: 'cash'
  },
  {
    id: 'SALE002',
    consumableId: 'CONS003',
    consumableName: 'Air Filter',
    quantity: 1,
    amount: 250,
    date: '2023-05-15',
    staff: 'Priya Patel',
    paymentMethod: 'card'
  },
  {
    id: 'SALE003',
    consumableId: 'CONS002',
    consumableName: 'Brake Fluid DOT3',
    quantity: 0.5,
    amount: 160,
    date: '2023-05-14',
    staff: 'Rahul Sharma',
    paymentMethod: 'cash'
  }
];

const Consumables = () => {
  const [consumables, setConsumables] = useState<Consumable[]>(initialConsumables);
  const [sales, setSales] = useState<ConsumableSale[]>(initialSales);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [saleForm, setSaleForm] = useState({
    consumableId: '',
    quantity: '1',
    paymentMethod: 'cash',
    staff: ''
  });

  // Filter consumables based on search term
  const filteredConsumables = consumables.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate today's sales
  const todaySales = sales.filter(sale => 
    sale.date === new Date().toISOString().split('T')[0]
  );
  
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.amount, 0);

  const handleSelectConsumable = (id: string) => {
    const consumable = consumables.find(c => c.id === id) || null;
    setSelectedConsumable(consumable);
    setSaleForm({ ...saleForm, consumableId: id });
  };

  const handleChangeQuantity = (value: string) => {
    setSaleForm({ ...saleForm, quantity: value });
  };

  const handleChangePaymentMethod = (value: string) => {
    setSaleForm({ ...saleForm, paymentMethod: value as 'cash' | 'card' | 'upi' });
  };

  const handleChangeStaff = (value: string) => {
    setSaleForm({ ...saleForm, staff: value });
  };

  const handleRecordSale = () => {
    if (!selectedConsumable || !saleForm.quantity || !saleForm.staff) {
      toast({
        title: "Missing information",
        description: "Please select a consumable, enter quantity and staff name",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseFloat(saleForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    if (quantity > selectedConsumable.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${selectedConsumable.stock} ${selectedConsumable.unit} available in stock`,
        variant: "destructive"
      });
      return;
    }

    // Calculate amount
    const amount = selectedConsumable.price * quantity;

    // Add sale
    const newSale: ConsumableSale = {
      id: `SALE${sales.length + 1}`.padStart(7, '0'),
      consumableId: selectedConsumable.id,
      consumableName: selectedConsumable.name,
      quantity,
      amount,
      date: new Date().toISOString().split('T')[0],
      staff: saleForm.staff,
      paymentMethod: saleForm.paymentMethod as 'cash' | 'card' | 'upi'
    };

    setSales([newSale, ...sales]);

    // Update stock
    setConsumables(consumables.map(c => 
      c.id === selectedConsumable.id 
        ? { ...c, stock: c.stock - quantity } 
        : c
    ));

    toast({
      title: "Sale recorded",
      description: `${selectedConsumable.name} sale has been recorded successfully`
    });

    // Reset form
    setIsFormOpen(false);
    setSaleForm({
      consumableId: '',
      quantity: '1',
      paymentMethod: 'cash',
      staff: ''
    });
    setSelectedConsumable(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Consumables Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Sale
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Sales</CardTitle>
            <CardDescription>Consumables sold today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{todayTotal.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">{todaySales.length} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Inventory</CardTitle>
            <CardDescription>Current consumables in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consumables.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Different products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Low Stock Items</CardTitle>
            <CardDescription>Items that need reordering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consumables.filter(c => c.stock < 10).length}</div>
            <p className="text-sm text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search consumables by name or category"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumables.map((consumable) => (
                  <TableRow key={consumable.id}>
                    <TableCell className="font-medium">{consumable.name}</TableCell>
                    <TableCell>{consumable.category}</TableCell>
                    <TableCell>₹{consumable.price}</TableCell>
                    <TableCell className={consumable.stock < 10 ? "text-destructive font-medium" : ""}>
                      {consumable.stock} {consumable.unit}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedConsumable(consumable);
                          setSaleForm({ ...saleForm, consumableId: consumable.id });
                          setIsFormOpen(true);
                        }}
                      >
                        Sell
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sales</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 5).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.consumableName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>₹{sale.amount}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>{sale.staff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Consumable Sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="consumable">Select Consumable</Label>
              <Select
                value={saleForm.consumableId}
                onValueChange={handleSelectConsumable}
              >
                <SelectTrigger id="consumable">
                  <SelectValue placeholder="Select a consumable" />
                </SelectTrigger>
                <SelectContent>
                  {consumables.map(consumable => (
                    <SelectItem key={consumable.id} value={consumable.id}>
                      {consumable.name} - ₹{consumable.price}/{consumable.unit} ({consumable.stock} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConsumable && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity ({selectedConsumable.unit})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={saleForm.quantity}
                    onChange={(e) => handleChangeQuantity(e.target.value)}
                    min="0.1"
                    step="0.1"
                    max={selectedConsumable.stock.toString()}
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {selectedConsumable.stock} {selectedConsumable.unit}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff">Staff</Label>
                  <Select
                    value={saleForm.staff}
                    onValueChange={handleChangeStaff}
                  >
                    <SelectTrigger id="staff">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rahul Sharma">Rahul Sharma</SelectItem>
                      <SelectItem value="Priya Patel">Priya Patel</SelectItem>
                      <SelectItem value="Arun Kumar">Arun Kumar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={saleForm.paymentMethod}
                    onValueChange={handleChangePaymentMethod}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="py-2">
                  <p className="font-medium">Total Amount:</p>
                  <p className="text-2xl font-bold">
                    ₹{selectedConsumable.price * parseFloat(saleForm.quantity || '0')}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordSale}>
              Record Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Consumables;
