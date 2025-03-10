
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, TestTube, Calendar, Clipboard, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FuelTest {
  id: string;
  fuel_type: 'Petrol' | 'Diesel';
  test_date: string;
  test_time: string;
  temperature: number;
  density: number;
  appearance: string;
  litres_tested: number; // Added field for litres tested
  notes: string;
  tested_by: string;
  created_at: string;
  tested_by_name?: string;
}

const TestingDetails = () => {
  const [tests, setTests] = useState<FuelTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState<{id: string, name: string}[]>([]);
  
  const [newTest, setNewTest] = useState<Partial<FuelTest>>({
    fuel_type: 'Petrol',
    test_date: new Date().toISOString().split('T')[0],
    test_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    temperature: 25,
    density: 0.75,
    appearance: 'Clear',
    litres_tested: 1, // Default value for litres tested
    notes: '',
    tested_by: ''
  });
  
  // Fetch staff list for the dropdown
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
        console.error('Error fetching staff data:', error);
      }
    };
    
    fetchStaff();
  }, []);
  
  // Fetch test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setIsLoading(true);
        
        // Use the fuel_tests table
        const { data, error } = await supabase
          .from('fuel_tests')
          .select('*')
          .order('test_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // For each test, get the staff name
          const testsWithStaffNames = await Promise.all(
            data.map(async (test) => {
              const { data: staffData } = await supabase
                .from('staff')
                .select('name')
                .eq('id', test.tested_by)
                .single();
                
              return {
                ...test,
                tested_by_name: staffData?.name || 'Unknown Staff',
                litres_tested: test.litres_tested || 1 // Default value if not exists
              };
            })
          );
          
          setTests(testsWithStaffNames as FuelTest[]);
        }
      } catch (error) {
        console.error('Error fetching test data:', error);
        toast({
          title: "Error",
          description: "Failed to load fuel test data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTestData();
  }, []);
  
  const handleAddTest = async () => {
    try {
      if (!newTest.fuel_type || !newTest.test_date || !newTest.tested_by || !newTest.litres_tested) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('fuel_tests')
        .insert([{
          fuel_type: newTest.fuel_type,
          test_date: newTest.test_date,
          test_time: newTest.test_time,
          temperature: newTest.temperature,
          density: newTest.density,
          appearance: newTest.appearance,
          litres_tested: newTest.litres_tested,
          notes: newTest.notes,
          tested_by: newTest.tested_by
        }])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get the staff name for the added test
        const staffName = staffList.find(s => s.id === newTest.tested_by)?.name || 'Unknown Staff';
        
        const newTestWithStaffName = {
          ...data[0],
          tested_by_name: staffName
        };
        
        setTests([newTestWithStaffName as FuelTest, ...tests]);
        toast({
          title: "Success",
          description: "Fuel test record added successfully"
        });
        setIsDialogOpen(false);
        setNewTest({
          fuel_type: 'Petrol',
          test_date: new Date().toISOString().split('T')[0],
          test_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          temperature: 25,
          density: 0.75,
          appearance: 'Clear',
          litres_tested: 1,
          notes: '',
          tested_by: ''
        });
      }
    } catch (error) {
      console.error('Error adding fuel test:', error);
      toast({
        title: "Error",
        description: "Failed to add fuel test record. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const todayTests = tests.filter(test => test.test_date === new Date().toISOString().split('T')[0]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fuel Testing Details</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Record New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Fuel Test</DialogTitle>
              <DialogDescription>
                Enter the details of the fuel quality test.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fuel_type">Fuel Type*</Label>
                  <Select 
                    value={newTest.fuel_type}
                    onValueChange={(value) => setNewTest({...newTest, fuel_type: value as 'Petrol' | 'Diesel'})}
                  >
                    <SelectTrigger id="fuel_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tested_by">Tested By*</Label>
                  <Select 
                    value={newTest.tested_by}
                    onValueChange={(value) => setNewTest({...newTest, tested_by: value})}
                  >
                    <SelectTrigger id="tested_by">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="test_date">Test Date*</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={newTest.test_date}
                    onChange={(e) => setNewTest({...newTest, test_date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="test_time">Test Time*</Label>
                  <Input
                    id="test_time"
                    type="time"
                    value={newTest.test_time}
                    onChange={(e) => setNewTest({...newTest, test_time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="temperature">Temperature (°C)*</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={newTest.temperature?.toString()}
                    onChange={(e) => setNewTest({...newTest, temperature: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="density">Density (g/cm³)*</Label>
                  <Input
                    id="density"
                    type="number"
                    step="0.001"
                    value={newTest.density?.toString()}
                    onChange={(e) => setNewTest({...newTest, density: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="appearance">Appearance*</Label>
                  <Select 
                    value={newTest.appearance}
                    onValueChange={(value) => setNewTest({...newTest, appearance: value})}
                  >
                    <SelectTrigger id="appearance">
                      <SelectValue placeholder="Select appearance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clear">Clear</SelectItem>
                      <SelectItem value="Slightly Cloudy">Slightly Cloudy</SelectItem>
                      <SelectItem value="Cloudy">Cloudy</SelectItem>
                      <SelectItem value="Contaminated">Contaminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="litres_tested">Litres Tested*</Label>
                  <Input
                    id="litres_tested"
                    type="number"
                    min="1"
                    step="0.1"
                    value={newTest.litres_tested?.toString()}
                    onChange={(e) => setNewTest({...newTest, litres_tested: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={newTest.notes}
                  onChange={(e) => setNewTest({...newTest, notes: e.target.value})}
                  placeholder="Enter any additional observations or notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTest}>Save Test Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading test records...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Today's Tests</CardTitle>
                <CardDescription>Tests conducted today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{todayTests.length}</div>
                <p className="text-sm text-muted-foreground">test records</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Petrol Tests</CardTitle>
                <CardDescription>Total petrol quality tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{tests.filter(test => test.fuel_type === 'Petrol').length}</div>
                <p className="text-sm text-muted-foreground">test records</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Diesel Tests</CardTitle>
                <CardDescription>Total diesel quality tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{tests.filter(test => test.fuel_type === 'Diesel').length}</div>
                <p className="text-sm text-muted-foreground">test records</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Test Records</CardTitle>
                <TestTube className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Fuel quality test records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No test records found. Add a new test record to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Temp. (°C)</TableHead>
                        <TableHead>Density (g/cm³)</TableHead>
                        <TableHead>Litres Tested</TableHead>
                        <TableHead>Appearance</TableHead>
                        <TableHead>Tested By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>
                            {new Date(test.test_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <br />
                            <span className="text-muted-foreground text-sm">{test.test_time}</span>
                          </TableCell>
                          <TableCell className="font-medium">{test.fuel_type}</TableCell>
                          <TableCell>{test.temperature}°C</TableCell>
                          <TableCell>{test.density}</TableCell>
                          <TableCell>{test.litres_tested || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              test.appearance === 'Clear' ? 'bg-green-100 text-green-800' :
                              test.appearance === 'Slightly Cloudy' ? 'bg-yellow-100 text-yellow-800' :
                              test.appearance === 'Cloudy' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {test.appearance}
                            </span>
                          </TableCell>
                          <TableCell>{test.tested_by_name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {test.notes || <span className="text-muted-foreground">No notes</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TestingDetails;
