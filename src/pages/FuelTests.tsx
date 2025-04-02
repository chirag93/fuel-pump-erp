
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Beaker, ClipboardCheck, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';

const FuelTests = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [fuelType, setFuelType] = useState<string>('petrol');
  const [testType, setTestType] = useState<string>('density');
  const [result, setResult] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tests, setTests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('new-test');
  const [staffId, setStaffId] = useState<string>('');

  // Fetch tests on component mount
  useEffect(() => {
    fetchTests();
    fetchCurrentStaffId();
  }, []);

  const fetchCurrentStaffId = async () => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Try to find staff record associated with this auth ID
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (staffData) {
        setStaffId(staffData.id);
      }
    } catch (error) {
      console.error("Error fetching staff ID:", error);
    }
  };

  const fetchTests = async () => {
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view fuel tests",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('fuel_tests')
        .select('*, staff:tested_by(name)')
        .eq('fuel_pump_id', fuelPumpId)
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      
      setTests(data || []);
    } catch (error) {
      console.error("Error fetching fuel tests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch fuel tests",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !fuelType || !testType || !result || !staffId) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Error",
          description: "Please log in to record fuel tests",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Convert the result to a number for density test type
      const numericResult = testType === 'density' ? parseFloat(result) : 0;
      const formattedTime = new Date().toTimeString().split(' ')[0];
      
      // Create an object with the correct structure for the fuel_tests table
      const newTest = {
        fuel_pump_id: fuelPumpId,
        fuel_type: fuelType,
        test_date: date.toISOString().split('T')[0],
        test_time: formattedTime,
        temperature: 25, // Default temperature
        density: testType === 'density' ? numericResult : 0,
        appearance: testType === 'color' ? result : 'Normal',
        litres_tested: 1,
        notes: remarks,
        tested_by: staffId
      };
      
      const { error } = await supabase
        .from('fuel_tests')
        .insert([newTest]);
      
      if (error) throw error;
      
      toast({
        title: "Test Recorded",
        description: "Fuel test has been successfully recorded",
      });
      
      // Reset form
      setResult('');
      setRemarks('');
      
      // Refresh the tests list
      fetchTests();
      
      // Switch to history tab
      setActiveTab('test-history');
    } catch (error: any) {
      console.error("Error recording fuel test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record fuel test",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Tests</h1>
          <p className="text-muted-foreground">Manage and record fuel quality tests</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button variant="outline" onClick={fetchTests} className="gap-2">
            <ClipboardCheck size={16} />
            Refresh Tests
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-test">New Test</TabsTrigger>
          <TabsTrigger value="test-history">Test History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record New Fuel Test</CardTitle>
              <CardDescription>
                Record quality tests for your fuel inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Test Date</Label>
                    <DatePicker date={date} setDate={setDate} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fuel-type">Fuel Type</Label>
                    <Select value={fuelType} onValueChange={setFuelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="premium_petrol">Premium Petrol</SelectItem>
                        <SelectItem value="premium_diesel">Premium Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-type">Test Type</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="density">Density Test</SelectItem>
                        <SelectItem value="water_content">Water Content</SelectItem>
                        <SelectItem value="flash_point">Flash Point</SelectItem>
                        <SelectItem value="viscosity">Viscosity</SelectItem>
                        <SelectItem value="color">Color Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="result">Test Result</Label>
                    <Input 
                      id="result" 
                      value={result} 
                      onChange={(e) => setResult(e.target.value)} 
                      placeholder="Enter test result" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input 
                    id="remarks" 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    placeholder="Additional notes (optional)" 
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="w-full gap-2"
              >
                <Beaker size={16} />
                {isLoading ? "Recording Test..." : "Record Test"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="test-history">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                Review past fuel quality tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Tested By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => {
                      // Determine test type and result based on which field has a non-zero/non-default value
                      let testType = "Density";
                      let testResult = test.density.toString();
                      
                      if (test.appearance !== "Normal") {
                        testType = "Color";
                        testResult = test.appearance;
                      }
                      
                      return (
                        <TableRow key={test.id}>
                          <TableCell>{new Date(test.test_date).toLocaleDateString()}</TableCell>
                          <TableCell className="capitalize">{test.fuel_type.replace('_', ' ')}</TableCell>
                          <TableCell>{testType}</TableCell>
                          <TableCell>{testResult}</TableCell>
                          <TableCell>{test.staff?.name || 'Unknown'}</TableCell>
                          <TableCell>{test.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Beaker className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No tests recorded</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Record your first fuel test to see it here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('new-test')}
                  >
                    Record New Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelTests;
