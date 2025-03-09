
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus, ClipboardList, DollarSign, Loader2 } from 'lucide-react';
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  shift_type: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed';
  date: string;
  pump_id: string;
  opening_reading: number;
  closing_reading: number | null;
  cash_given: number;
  cash_remaining: number | null;
  card_sales: number | null;
  upi_sales: number | null;
  cash_sales: number | null;
  created_at?: string | null;
}

interface Staff {
  id: string;
  name: string;
}

const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    date: new Date().toISOString().split('T')[0],
    start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    staff_id: '',
    pump_id: '',
    cash_given: 0,
    opening_reading: 0,
    status: 'active',
    shift_type: 'day' // Default shift type
  });

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setStaffList(data);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff data",
          description: "Failed to load staff data from the database.",
          variant: "destructive"
        });
      }
    };
    
    fetchStaff();
  }, []);

  // Fetch shifts data
  useEffect(() => {
    const fetchShifts = async () => {
      setIsLoading(true);
      try {
        // First get all shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select(`
            id,
            staff_id,
            shift_type,
            start_time,
            end_time,
            status,
            created_at
          `);
          
        if (shiftsError) {
          throw shiftsError;
        }
        
        if (!shiftsData) {
          setShifts([]);
          setIsLoading(false);
          return;
        }
        
        // Get staff names for each shift
        const shiftsWithStaffNames = await Promise.all(
          shiftsData.map(async (shift) => {
            const { data: staffData } = await supabase
              .from('staff')
              .select('name')
              .eq('id', shift.staff_id)
              .single();
              
            // Get the shift's readings for additional details
            const { data: readingsData } = await supabase
              .from('readings')
              .select('*')
              .eq('shift_id', shift.id)
              .single();
              
            return {
              ...shift,
              staff_name: staffData?.name || 'Unknown Staff',
              date: readingsData?.date || new Date().toISOString().split('T')[0],
              pump_id: readingsData?.pump_id || 'Unknown',
              opening_reading: readingsData?.opening_reading || 0,
              closing_reading: readingsData?.closing_reading || null,
              cash_given: 0, // Default values for fields not in database
              cash_remaining: null,
              card_sales: null,
              upi_sales: null,
              cash_sales: null
            } as Shift;
          })
        );
        
        setShifts(shiftsWithStaffNames);
      } catch (error) {
        console.error('Error fetching shifts:', error);
        toast({
          title: "Error loading shifts",
          description: "Failed to load shift data from the database.",
          variant: "destructive"
        });
        
        // Initialize with an empty array if there's an error
        setShifts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShifts();
  }, []);

  const activeShifts = shifts.filter(shift => shift.status === 'active');
  const completedShifts = shifts.filter(shift => shift.status === 'completed');

  const handleAddShift = async () => {
    try {
      if (!newShift.staff_id || !newShift.pump_id || !newShift.opening_reading) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Get staff name
      const staffName = staffList.find(s => s.id === newShift.staff_id)?.name || 'Unknown Staff';
      
      // First create the shift record
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert([{
          staff_id: newShift.staff_id,
          shift_type: newShift.shift_type || 'day',  // Add shift_type to comply with database schema
          start_time: newShift.start_time,
          status: 'active'
        }])
        .select();
        
      if (shiftError) {
        throw shiftError;
      }
      
      if (!shiftData || shiftData.length === 0) {
        throw new Error("Failed to create shift record");
      }
      
      // Then create a reading record linked to the shift
      const { error: readingError } = await supabase
        .from('readings')
        .insert([{
          shift_id: shiftData[0].id,
          staff_id: newShift.staff_id,
          pump_id: newShift.pump_id,
          date: newShift.date,
          opening_reading: newShift.opening_reading,
          closing_reading: null
        }]);
        
      if (readingError) {
        throw readingError;
      }
      
      // Create the full shift object for the UI
      const newShiftWithName: Shift = {
        ...shiftData[0],
        staff_name: staffName,
        date: newShift.date || new Date().toISOString().split('T')[0],
        pump_id: newShift.pump_id || '',
        opening_reading: newShift.opening_reading || 0,
        closing_reading: null,
        cash_given: newShift.cash_given || 0,
        cash_remaining: null,
        card_sales: null,
        upi_sales: null,
        cash_sales: null
      };
      
      setShifts([...shifts, newShiftWithName]);
      toast({
        title: "Success",
        description: "New shift started successfully"
      });
      
      setNewShift({
        date: new Date().toISOString().split('T')[0],
        start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        staff_id: '',
        pump_id: '',
        cash_given: 0,
        opening_reading: 0,
        status: 'active',
        shift_type: 'day'
      });
      setFormOpen(false);
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({
        title: "Error",
        description: "Failed to start new shift. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndShift = async (id: string) => {
    try {
      // Generate random values for demonstration
      // In a real app, these would be entered by the user
      const currentShift = shifts.find(s => s.id === id);
      if (!currentShift) {
        throw new Error("Shift not found");
      }
      
      const closingReading = currentShift.opening_reading + Math.floor(Math.random() * 500);
      const cashRemaining = Math.floor(Math.random() * (currentShift.cash_given));
      const cardSales = Math.floor(Math.random() * 15000);
      const upiSales = Math.floor(Math.random() * 12000);
      const cashSales = Math.floor(Math.random() * 18000);
      
      // Update the shift record
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          status: 'completed',
          end_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        })
        .eq('id', id);
        
      if (shiftError) {
        throw shiftError;
      }
      
      // Update the reading record
      const { error: readingError } = await supabase
        .from('readings')
        .update({
          closing_reading: closingReading
        })
        .eq('shift_id', id);
        
      if (readingError) {
        throw readingError;
      }
      
      // Update local state
      setShifts(shifts.map(shift => 
        shift.id === id ? 
          {
            ...shift, 
            status: 'completed', 
            end_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            closing_reading: closingReading,
            cash_remaining: cashRemaining,
            card_sales: cardSales,
            upi_sales: upiSales,
            cash_sales: cashSales
          } : 
          shift
      ));
      
      toast({
        title: "Success",
        description: "Shift ended successfully"
      });
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
    }
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
                  value={newShift.staff_id}
                  onValueChange={(value) => setNewShift({...newShift, staff_id: value})}
                >
                  <SelectTrigger id="staffId">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pumpId">Pump</Label>
                <Select 
                  value={newShift.pump_id}
                  onValueChange={(value) => setNewShift({...newShift, pump_id: value})}
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
                    value={newShift.opening_reading?.toString()}
                    onChange={(e) => setNewShift({...newShift, opening_reading: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cashGiven">Cash Given</Label>
                  <Input
                    id="cashGiven"
                    type="number"
                    value={newShift.cash_given?.toString()}
                    onChange={(e) => setNewShift({...newShift, cash_given: parseFloat(e.target.value)})}
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading shifts data...</span>
        </div>
      ) : (
        <>
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
                    .reduce((sum, shift) => sum + (shift.card_sales || 0) + (shift.upi_sales || 0) + (shift.cash_sales || 0), 0)
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
                            <TableCell className="font-medium">{shift.staff_name}</TableCell>
                            <TableCell>{shift.pump_id}</TableCell>
                            <TableCell>{shift.date}</TableCell>
                            <TableCell>{shift.start_time}</TableCell>
                            <TableCell>{shift.opening_reading.toLocaleString()}</TableCell>
                            <TableCell>₹{shift.cash_given.toLocaleString()}</TableCell>
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
                          const totalVolume = (shift.closing_reading || 0) - shift.opening_reading;
                          const totalSales = (shift.card_sales || 0) + (shift.upi_sales || 0) + (shift.cash_sales || 0);
                          
                          return (
                            <TableRow key={shift.id}>
                              <TableCell className="font-medium">{shift.staff_name}</TableCell>
                              <TableCell>{shift.date}</TableCell>
                              <TableCell>{`${shift.start_time}-${shift.end_time || 'N/A'}`}</TableCell>
                              <TableCell>{shift.pump_id}</TableCell>
                              <TableCell>{totalVolume.toFixed(2)}L</TableCell>
                              <TableCell>₹{(shift.card_sales || 0).toLocaleString()}</TableCell>
                              <TableCell>₹{(shift.upi_sales || 0).toLocaleString()}</TableCell>
                              <TableCell>₹{(shift.cash_sales || 0).toLocaleString()}</TableCell>
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
        </>
      )}
    </div>
  );
};

export default ShiftManagement;
