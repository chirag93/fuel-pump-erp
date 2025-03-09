
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

// Sample inventory data
const sampleInventory = [
  {
    fuel_type: 'Petrol',
    quantity: 5000,
    price_per_unit: 102.5,
    date: new Date().toISOString().split('T')[0]
  },
  {
    fuel_type: 'Diesel',
    quantity: 8000,
    price_per_unit: 89.7,
    date: new Date().toISOString().split('T')[0]
  },
  {
    fuel_type: 'CNG',
    quantity: 3000,
    price_per_unit: 65.3,
    date: new Date().toISOString().split('T')[0]
  }
];

// Sample customer data
const sampleCustomers = [
  {
    name: 'ABC Logistics',
    gst: 'GST123456789',
    email: 'accounts@abclogistics.com',
    phone: '9988776655',
    contact: 'Vikram Mehta',
    balance: 50000
  },
  {
    name: 'XYZ Transport',
    gst: 'GST987654321',
    email: 'finance@xyztransport.com',
    phone: '8877665544',
    contact: 'Sunita Verma',
    balance: 75000
  }
];

// Master function to migrate all data
export const migrateAllData = async () => {
  try {
    // Start showing the migration is in progress
    toast({
      title: "Migration started",
      description: "Beginning database migration process..."
    });
    
    // Run all migrations sequentially
    const staffMigrated = await migrateStaffData();
    const inventoryMigrated = await migrateInventoryData();
    const customersMigrated = await migrateCustomerData();
    
    // If all migrations were successful (or already migrated)
    if (staffMigrated !== false && inventoryMigrated !== false && customersMigrated !== false) {
      toast({
        title: "Migration completed",
        description: "All data has been successfully migrated to your database."
      });
      return true;
    } else {
      // If any migration failed
      toast({
        title: "Migration partially completed",
        description: "Some tables could not be migrated. Check the console for details.",
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error('Error during migration:', error);
    toast({
      title: "Migration failed",
      description: error.message || "An unexpected error occurred during migration.",
      variant: "destructive"
    });
    return false;
  }
};

// Function to migrate staff data
const migrateStaffData = async () => {
  try {
    // Check if table is already populated
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id')
      .limit(1);
    
    if (checkError) throw checkError;
    
    // If data already exists, return "already migrated"
    if (existingStaff && existingStaff.length > 0) {
      console.log("Staff data already migrated");
      return "already migrated";
    }
    
    // Insert sample staff data
    const { error: insertError } = await supabase
      .from('staff')
      .insert(sampleStaff);
    
    if (insertError) throw insertError;
    
    console.log("Staff data migrated successfully");
    return true;
  } catch (error) {
    console.error('Error migrating staff data:', error);
    return false;
  }
};

// Function to migrate inventory data
const migrateInventoryData = async () => {
  try {
    // Check if table is already populated
    const { data: existingInventory, error: checkError } = await supabase
      .from('inventory')
      .select('id')
      .limit(1);
    
    if (checkError) throw checkError;
    
    // If data already exists, return "already migrated"
    if (existingInventory && existingInventory.length > 0) {
      console.log("Inventory data already migrated");
      return "already migrated";
    }
    
    // Insert sample inventory data
    const { error: insertError } = await supabase
      .from('inventory')
      .insert(sampleInventory);
    
    if (insertError) throw insertError;
    
    console.log("Inventory data migrated successfully");
    return true;
  } catch (error) {
    console.error('Error migrating inventory data:', error);
    return false;
  }
};

// Function to migrate customer data
const migrateCustomerData = async () => {
  try {
    // Check if table is already populated
    const { data: existingCustomers, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (checkError) throw checkError;
    
    // If data already exists, return "already migrated"
    if (existingCustomers && existingCustomers.length > 0) {
      console.log("Customer data already migrated");
      return "already migrated";
    }
    
    // Insert sample customer data
    const { error: insertError } = await supabase
      .from('customers')
      .insert(sampleCustomers);
    
    if (insertError) throw insertError;
    
    console.log("Customer data migrated successfully");
    return true;
  } catch (error) {
    console.error('Error migrating customer data:', error);
    return false;
  }
};

// For backward compatibility
export const seedStaffData = async () => {
  try {
    const result = await migrateAllData();
    return result;
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
