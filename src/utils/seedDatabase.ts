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

// Sample consumables data
const sampleConsumables = [
  {
    name: 'Engine Oil',
    category: 'Lubricant',
    quantity: 50,
    unit: 'Litres',
    price_per_unit: 450,
    total_price: 22500,
    date: new Date().toISOString().split('T')[0]
  },
  {
    name: 'Air Filter',
    category: 'Filter',
    quantity: 25,
    unit: 'Pieces',
    price_per_unit: 200,
    total_price: 5000,
    date: new Date().toISOString().split('T')[0]
  },
  {
    name: 'Coolant',
    category: 'Fluid',
    quantity: 30,
    unit: 'Litres',
    price_per_unit: 180,
    total_price: 5400,
    date: new Date().toISOString().split('T')[0]
  }
];

// Sample vehicles data
const sampleVehicles = [
  {
    customer_id: '',  // Will be filled in during migration based on customer email
    number: 'KA-01-AB-1234',
    type: 'Truck',
    capacity: '12 Ton'
  },
  {
    customer_id: '',  // Will be filled in during migration based on customer email
    number: 'MH-12-GH-3456',
    type: 'Truck',
    capacity: '20 Ton'
  }
];

// Sample shifts data
const sampleShifts = [
  {
    staff_id: '',  // Will be filled in during migration
    shift_type: 'morning',
    start_time: '06:00',
    end_time: '14:00',
    status: 'completed',
    pump_id: 'P001',
    opening_reading: 45678.5,
    closing_reading: 46123.8,
    cash_given: 5000,
    cash_remaining: 2345.5,
    card_sales: 15678.9,
    upi_sales: 12567.4,
    cash_sales: 17567.8
  },
  {
    staff_id: '',  // Will be filled in during migration
    shift_type: 'evening',
    start_time: '14:00',
    end_time: '22:00',
    status: 'completed',
    pump_id: 'P001',
    opening_reading: 46123.8,
    closing_reading: 46578.2,
    cash_given: 5000,
    cash_remaining: 3245.7,
    card_sales: 12456.3,
    upi_sales: 10234.5,
    cash_sales: 14578.9
  },
  {
    staff_id: '',  // Will be filled in during migration
    shift_type: 'morning',
    start_time: '06:00',
    end_time: null,
    status: 'active',
    pump_id: 'P002',
    opening_reading: 34567.8,
    closing_reading: null,
    cash_given: 5000,
    cash_remaining: null,
    card_sales: null,
    upi_sales: null,
    cash_sales: null
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

    // First check if tables are already populated before running migrations
    const staffCheckRes = await checkTableHasData('staff');
    const inventoryCheckRes = await checkTableHasData('inventory');
    const customersCheckRes = await checkTableHasData('customers');
    const consumablesCheckRes = await checkTableHasData('consumables');
    const vehiclesCheckRes = await checkTableHasData('vehicles');
    const shiftsCheckRes = await checkTableHasData('shifts');
    
    console.log('Table status:', { 
      staffCheckRes, 
      inventoryCheckRes, 
      customersCheckRes,
      consumablesCheckRes,
      vehiclesCheckRes,
      shiftsCheckRes
    });
    
    // Only run migrations for empty tables
    const results = await Promise.allSettled([
      staffCheckRes ? Promise.resolve("already migrated") : migrateStaffData(),
      inventoryCheckRes ? Promise.resolve("already migrated") : migrateInventoryData(),
      customersCheckRes ? Promise.resolve("already migrated") : migrateCustomerData(),
      consumablesCheckRes ? Promise.resolve("already migrated") : migrateConsumablesData(),
      vehiclesCheckRes ? Promise.resolve("already migrated") : migrateVehiclesData(),
      shiftsCheckRes ? Promise.resolve("already migrated") : migrateShiftsData()
    ]);
    
    console.log('Migration results:', results);
    
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
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`Error checking ${tableName} data:`, error);
      return false;
    }
    
    console.log(`${tableName} has ${count} records`);
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
    console.log('Migrating staff data...');
    // Insert sample staff data using upsert to avoid duplicates
    const { error: insertError, data } = await supabase
      .from('staff')
      .upsert(sampleStaff, { 
        onConflict: 'email',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('Staff insertion error:', insertError);
      throw insertError;
    }
    
    console.log("Staff data migrated successfully:", data);
    return true;
  } catch (error) {
    console.error('Error migrating staff data:', error);
    return false;
  }
};

// Function to migrate inventory data
const migrateInventoryData = async () => {
  try {
    console.log('Migrating inventory data...');
    // For inventory, we now have a unique constraint for fuel_type + date
    const { error: insertError, data } = await supabase
      .from('inventory')
      .upsert(sampleInventory, { 
        onConflict: 'fuel_type,date',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('Inventory insertion error:', insertError);
      throw insertError;
    }
    
    console.log("Inventory data migrated successfully:", data);
    return true;
  } catch (error) {
    console.error('Error migrating inventory data:', error);
    return false;
  }
};

// Function to migrate customer data
const migrateCustomerData = async () => {
  try {
    console.log('Migrating customer data...');
    // Use upsert with email as the unique constraint for customers
    const { error: insertError, data } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { 
        onConflict: 'email',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('Customer insertion error:', insertError);
      throw insertError;
    }
    
    console.log("Customer data migrated successfully:", data);
    return true;
  } catch (error) {
    console.error('Error migrating customer data:', error);
    return false;
  }
};

// Function to migrate consumables data
const migrateConsumablesData = async () => {
  try {
    console.log('Migrating consumables data...');
    
    // Add category and unit fields to the sample data
    const updatedConsumables = sampleConsumables.map(item => ({
      ...item,
      category: item.category || 'General',
      unit: item.unit || 'Units'
    }));
    
    // Use upsert with name + date as the unique constraint
    const { error: insertError, data } = await supabase
      .from('consumables')
      .upsert(updatedConsumables, { 
        onConflict: 'name,date',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('Consumables insertion error:', insertError);
      throw insertError;
    }
    
    console.log("Consumables data migrated successfully:", data);
    return true;
  } catch (error) {
    console.error('Error migrating consumables data:', error);
    return false;
  }
};

// Function to migrate vehicles data - linked to customers
const migrateVehiclesData = async () => {
  try {
    console.log('Migrating vehicles data...');
    
    // First, get all customers to link vehicles to the correct customer_id
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, email');
    
    if (customerError) {
      throw customerError;
    }
    
    if (!customers || customers.length === 0) {
      console.log('No customers found, skipping vehicles migration');
      return false;
    }
    
    // Link vehicles to customers by email (this is a simple assignment for sample data)
    const vehiclesWithCustomers = [...sampleVehicles];
    
    // Assign first vehicle to first customer and second to second customer (if available)
    if (customers.length > 0 && vehiclesWithCustomers.length > 0) {
      vehiclesWithCustomers[0].customer_id = customers[0].id;
    }
    
    if (customers.length > 1 && vehiclesWithCustomers.length > 1) {
      vehiclesWithCustomers[1].customer_id = customers[1].id;
    } else if (customers.length > 0 && vehiclesWithCustomers.length > 1) {
      // If only one customer but multiple vehicles, assign all to same customer
      vehiclesWithCustomers[1].customer_id = customers[0].id;
    }
    
    // Insert vehicles
    const { error: insertError, data } = await supabase
      .from('vehicles')
      .upsert(vehiclesWithCustomers, { 
        onConflict: 'number',
        ignoreDuplicates: false
      });
    
    if (insertError) {
      console.error('Vehicles insertion error:', insertError);
      throw insertError;
    }
    
    console.log("Vehicles data migrated successfully:", data);
    return true;
  } catch (error) {
    console.error('Error migrating vehicles data:', error);
    return false;
  }
};

// Function to migrate shifts data - linked to staff
const migrateShiftsData = async () => {
  try {
    console.log('Migrating shifts data...');
    
    // First, get all staff to link shifts to the correct staff_id
    const { data: staffMembers, error: staffError } = await supabase
      .from('staff')
      .select('id, email');
    
    if (staffError) {
      throw staffError;
    }
    
    if (!staffMembers || staffMembers.length === 0) {
      console.log('No staff found, skipping shifts migration');
      return false;
    }
    
    // Link shifts to staff by email (this is a simple assignment for sample data)
    const shiftsWithStaff = sampleShifts.map(shift => ({
      ...shift,
      // Add the required shift_type field
      shift_type: shift.shift_type || 'day'
    }));
    
    // Assign shifts to staff members
    if (staffMembers.length > 0) {
      shiftsWithStaff[0].staff_id = staffMembers[0].id;
      
      if (shiftsWithStaff.length > 1 && staffMembers.length > 1) {
        shiftsWithStaff[1].staff_id = staffMembers[1].id;
      } else if (shiftsWithStaff.length > 1) {
        shiftsWithStaff[1].staff_id = staffMembers[0].id;
      }
      
      if (shiftsWithStaff.length > 2 && staffMembers.length > 2) {
        shiftsWithStaff[2].staff_id = staffMembers[2].id;
      } else if (shiftsWithStaff.length > 2 && staffMembers.length > 1) {
        shiftsWithStaff[2].staff_id = staffMembers[1].id;
      } else if (shiftsWithStaff.length > 2) {
        shiftsWithStaff[2].staff_id = staffMembers[0].id;
      }
    }
    
    // First insert the base shift records
    const shiftBaseRecords = shiftsWithStaff.map(shift => ({
      staff_id: shift.staff_id,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      status: shift.status
    }));
    
    // Insert shifts
    const { error: insertError, data: insertedShifts } = await supabase
      .from('shifts')
      .upsert(shiftBaseRecords, { 
        onConflict: 'staff_id,start_time',
        ignoreDuplicates: false
      })
      .select();
    
    if (insertError) {
      console.error('Shifts insertion error:', insertError);
      throw insertError;
    }
    
    // If shifts were inserted, also insert the corresponding readings
    if (insertedShifts && insertedShifts.length > 0) {
      const readingsRecords = insertedShifts.map((shift, index) => ({
        shift_id: shift.id,
        staff_id: shift.staff_id,
        pump_id: shiftsWithStaff[index].pump_id || 'P001', 
        date: new Date().toISOString().split('T')[0],
        opening_reading: shiftsWithStaff[index].opening_reading || 0,
        closing_reading: shiftsWithStaff[index].closing_reading || null
      }));
      
      const { error: readingsError } = await supabase
        .from('readings')
        .upsert(readingsRecords, {
          onConflict: 'shift_id',
          ignoreDuplicates: false
        });
        
      if (readingsError) {
        console.error('Readings insertion error:', readingsError);
        throw readingsError;
      }
    }
    
    console.log("Shifts data migrated successfully:", insertedShifts);
    return true;
  } catch (error) {
    console.error('Error migrating shifts data:', error);
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
