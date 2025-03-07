import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus, ClipboardList, DollarSign } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  pumpId: string;
  openingReading: number;
  closingReading: number;
  cashGiven: number;
  cashRemaining: number;
  cardSales: number;
  upiSales: number;
  cashSales: number;
  status: 'active' | 'completed';
}

const mockShifts: Shift[] = [
  {
    id: '1',
    staffId: 'S001',
    staffName: 'Rahul Sharma',
    date: '2023-05-15',
    startTime: '06:00',
    endTime: '14:00',
    pumpId: 'P001',
    openingReading: 45678.5,
    closingReading: 46123.8,
    cashGiven: 5000,
    cashRemaining: 2345.5,
    cardSales: 15678.9,
    upiSales: 12567.4,
    cashSales: 17567.8,
    status: 'completed'
  },
  {
    id: '2',
    staffId: 'S002',
    staffName: 'Priya Patel',
    date: '2023-05-15',
    startTime: '14:00',
    endTime: '22:00',
    pumpId: 'P001',
    openingReading: 46123.8,
    closingReading: 46578.2,
    cashGiven: 5000,
    cashRemaining: 3245.7,
    cardSales: 12456.3,
    upiSales: 10234.5,
    cashSales: 14578.9,
    status: 'completed'
  },
  {
    id: '3',
    staffId: 'S003',
    staffName: 'Arun Kumar',
    date: '2023-05-16',
    startTime: '06:00',
    endTime: '',
    pumpId: 'P002',
    openingReading: 34567.8,
    closingReading: 0,
    cashGiven: 5000,
    cashRemaining: 0,
    cardSales: 0,
    upiSales: 0,
    cashSales: 0,
    status: 'active'
  }
];

const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [formOpen, setFormOpen] = useState(false);
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    staffId: '',
    pumpId: '',
    cashGiven: 0,
    openingReading: 0,
    status: 'active'
  });

  const activeShifts = shifts.filter(shift => shift.status === 'active');
  const completedShifts = shifts.filter(shift => shift.status === 'completed');

  const handleAddShift = () => {
    const shift: Shift = {
      id: (shifts.length + 1).toString(),
      staffId: newShift.staffId || '',
      staffName: newShift.staffId === 'S001' ? 'Rahul Sharma' : 
                newShift.staffId === 'S002' ? 'Priya Patel' : 
                newShift.staffId === 'S003' ? 'Arun Kumar' : 'Unknown Staff',
      date: newShift.date || new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: '',
      pumpId: newShift.pumpId || '',
      openingReading: newShift.openingReading || 0,
      closingReading: 0,
      cashGiven: newShift.cashGiven || 0,
      cashRemaining: 0,
      cardSales: 0,
      upiSales: 0,
      cashSales: 0,
      status: 'active'
    };

    setShifts([...shifts, shift]);
    setNewShift({
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      staffId: '',
      pumpId: '',
      cashGiven: 0,
      openingReading: 0,
      status: 'active'
    });
    setFormOpen(false);
  };

  const handleEndShift = (id: string) => {
    setShifts(shifts.map(shift => 
      shift.id === id ? 
        {
          ...shift, 
          status: 'completed', 
          endTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          closingReading: shift.openingReading + Math.floor(Math.random() * 500),
          cashRemaining: Math.floor(Math.random() * shift.cashGiven),
          cardSales: Math.floor(Math.random() * 15000),
          upiSales: Math.floor(Math.random() * 12000),
          cashSales: Math.floor(Math.random() * 18000)
        } : 
        shift
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shift Management</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Start New Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Shift</DialogTitle>
              <DialogDescription>
                Enter the details to start a new shift.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staffId">Staff</Label>
                <Select 
                  value={newShift.staffId}
                  onValueChange={(value) => setNewShift({...newShift, staffId: value})}
                >
                  <SelectTrigger id="staffId">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S001">Rahul Sharma</SelectItem>
                    <SelectItem value="S002">Priya Patel</SelectItem>
                    <SelectItem value="S003">Arun Kumar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pumpId">Pump</Label>
                <Select 
                  value={newShift.pumpId}
                  onValueChange={(value) => setNewShift({...newShift, pumpId: value})}
                >
                  <SelectTrigger id="pumpId">
                    <SelectValue placeholder="Select pump" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P001">Pump 1 - Petrol</SelectItem>
                    <SelectItem value="P002">Pump 2 - Diesel</SelectItem>
                    <SelectItem value="P003">Pump 3 - Petrol Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="openingReading">Opening Reading</Label>
                  <Input
                    id="openingReading"
                    type="number"
                    value={newShift.openingReading?.toString()}
                    onChange={(e) => setNewShift({...newShift, openingReading: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cashGiven">Cash Given</Label>
                  <Input
                    id="cashGiven"
                    type="number"
                    value={newShift.cashGiven?.toString()}
                    onChange={(e) => setNewShift({...newShift, cashGiven: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleAddShift}>Start Shift</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Active Shifts</CardTitle>
            <CardDescription>Currently running shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{activeShifts.length}</div>
            <p className="text-sm text-muted-foreground">shifts in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Today's Completed</CardTitle>
            <CardDescription>Shifts completed today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {completedShifts.filter(shift => shift.date === new Date().toISOString().split('T')[0]).length}
            </div>
            <p className="text-sm text-muted-foreground">shifts completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Total Sales Today</CardTitle>
            <CardDescription>Combined sales from all shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ₹{completedShifts
                .filter(shift => shift.date === new Date().toISOString().split('T')[0])
                .reduce((sum, shift) => sum + shift.cardSales + shift.upiSales + shift.cashSales, 0)
                .toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">total sales amount</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">Active Shifts</TabsTrigger>
          <TabsTrigger value="completed">Completed Shifts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Shifts</CardTitle>
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {activeShifts.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No active shifts at the moment
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Pump</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Opening Reading</TableHead>
                      <TableHead>Cash Given</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.staffName}</TableCell>
                        <TableCell>{shift.pumpId}</TableCell>
                        <TableCell>{shift.date}</TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.openingReading.toLocaleString()}</TableCell>
                        <TableCell>₹{shift.cashGiven.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleEndShift(shift.id)}
                          >
                            <ClipboardList size={14} />
                            End Shift
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Completed Shifts</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {completedShifts.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No completed shifts yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Pump</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Card Sales</TableHead>
                      <TableHead>UPI Sales</TableHead>
                      <TableHead>Cash Sales</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedShifts.map((shift) => {
                      const totalVolume = shift.closingReading - shift.openingReading;
                      const totalSales = shift.cardSales + shift.upiSales + shift.cashSales;
                      
                      return (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.staffName}</TableCell>
                          <TableCell>{shift.date}</TableCell>
                          <TableCell>{`${shift.startTime}-${shift.endTime}`}</TableCell>
                          <TableCell>{shift.pumpId}</TableCell>
                          <TableCell>{totalVolume.toFixed(2)}L</TableCell>
                          <TableCell>₹{shift.cardSales.toLocaleString()}</TableCell>
                          <TableCell>₹{shift.upiSales.toLocaleString()}</TableCell>
                          <TableCell>₹{shift.cashSales.toLocaleString()}</TableCell>
                          <TableCell className="font-bold">₹{totalSales.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShiftManagement;
