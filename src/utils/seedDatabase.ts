
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

    // Enable RLS bypassing for this operation using service role
    const { data: { session } } = await supabase.auth.getSession();
    
    // First check if tables are already populated before running migrations
    const staffCheckRes = await checkTableHasData('staff');
    const inventoryCheckRes = await checkTableHasData('inventory');
    const customersCheckRes = await checkTableHasData('customers');
    
    // Only run migrations for empty tables
    const results = await Promise.allSettled([
      staffCheckRes ? "already migrated" : migrateStaffData(),
      inventoryCheckRes ? "already migrated" : migrateInventoryData(),
      customersCheckRes ? "already migrated" : migrateCustomerData()
    ]);
    
    // Check results to determine success
    const errors = results.filter(r => r.status === 'rejected');
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== false);
    
    if (errors.length === 0) {
      toast({
        title: "Migration completed",
        description: `${successful.length} ${successful.length === 1 ? 'table' : 'tables'} were successfully migrated.`,
      });
      return true;
    } else {
      // Show partial success or failure message
      toast({
        title: errors.length === results.length ? "Migration failed" : "Migration partially completed",
        description: `${successful.length} of ${results.length} tables migrated. ${errors.length} failed.`,
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

// Helper to check if a table already has data
const checkTableHasData = async (tableName) => {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) throw error;
    return count > 0;
  } catch (error) {
    console.error(`Error checking ${tableName} data:`, error);
    // If we can't check, assume there's no data to be safe
    return false;
  }
};

// Function to migrate staff data
const migrateStaffData = async () => {
  try {
    // Insert sample staff data using upsert to avoid duplicates
    const { error: insertError, data } = await supabase
      .from('staff')
      .upsert(sampleStaff, { onConflict: 'email' });
    
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
    // For inventory, we need a unique constraint that makes sense for upsert
    // We'll use fuel_type + date as our "key"
    const { error: insertError } = await supabase
      .from('inventory')
      .upsert(sampleInventory, { onConflict: 'fuel_type, date' });
    
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
    // Use upsert with email as the unique constraint for customers
    const { error: insertError } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { onConflict: 'email' });
    
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
