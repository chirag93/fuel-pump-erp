
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Sample staff data
const sampleStaff = [
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    role: 'Pump Operator',
    salary: 15000,
    joining_date: '2023-01-15',
    assigned_pumps: ['Pump-1', 'Pump-2']
  },
  {
    name: 'Priya Sharma',
    phone: '8765432109',
    email: 'priya@example.com',
    role: 'Cashier',
    salary: 12000,
    joining_date: '2023-02-20',
    assigned_pumps: ['Pump-3']
  },
  {
    name: 'Amit Singh',
    phone: '7654321098',
    email: 'amit@example.com',
    role: 'Manager',
    salary: 25000,
    joining_date: '2022-11-10',
    assigned_pumps: ['Pump-1', 'Pump-2', 'Pump-3']
  }
];

// Function to seed staff data
export const seedStaffData = async () => {
  try {
    // Check if table is already populated
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id')
      .limit(1);
    
    if (checkError) throw checkError;
    
    // If data already exists, don't seed
    if (existingStaff && existingStaff.length > 0) {
      toast({
        title: "Database already seeded",
        description: "Your database already contains staff data."
      });
      return;
    }
    
    // Insert sample staff data
    const { error: insertError } = await supabase
      .from('staff')
      .insert(sampleStaff);
    
    if (insertError) throw insertError;
    
    toast({
      title: "Database seeded successfully",
      description: "Sample staff data has been added to your database."
    });
    
    // Return true if seeding was successful
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    toast({
      title: "Seeding failed",
      description: error.message || "Could not add sample data to the database.",
      variant: "destructive"
    });
    return false;
  }
};

// More seeding functions can be added here for other tables
