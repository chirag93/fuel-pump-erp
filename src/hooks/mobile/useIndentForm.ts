
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

export type VehicleData = {
  id: string;
  number: string;
  type: string;
  customer_id: string;
};

export type SuccessDetails = {
  indentNumber: string;
  customerName: string;
  vehicleNumber: string;
  amount: number;
  quantity: number;
  fuelType: string;
};

export const useIndentForm = () => {
  const { toast } = useToast();
  const [fuelType, setFuelType] = useState('Petrol');
  const [amount, setAmount] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Array<{id: string, name: string}>>([]);
  const [indentNumber, setIndentNumber] = useState('');
  const [indentNumberError, setIndentNumberError] = useState('');
  const [searchIndentNumber, setSearchIndentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [selectedBooklet, setSelectedBooklet] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<SuccessDetails>({
    indentNumber: '',
    customerName: '',
    vehicleNumber: '',
    amount: 0,
    quantity: 0,
    fuelType: ''
  });
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [fuelPrice, setFuelPrice] = useState<number>(0);

  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      console.info('Fetching staff data...');
      try {
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to view staff",
            variant: "destructive"
          });
          return;
        }
        
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching staff:', error);
          return;
        }
        
        if (data) {
          console.info(`Staff data fetched: ${data.length} records`);
          setStaff(data);
          // If staff exists, select the first one by default
          if (data.length > 0) {
            setSelectedStaff(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      }
    };
    
    fetchStaff();
  }, [toast]);

  // Fetch current fuel price
  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to fetch fuel price",
            variant: "destructive"
          });
          return;
        }
        
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('current_price')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('fuel_type', fuelType)
          .single();
          
        if (error) {
          console.error('Error fetching fuel price:', error);
          return;
        }
        
        if (data) {
          setFuelPrice(data.current_price);
        }
      } catch (error) {
        console.error('Error fetching fuel price:', error);
      }
    };
    
    fetchFuelPrice();
  }, [fuelType, toast]);
  
  // Update quantity when amount changes
  useEffect(() => {
    if (amount !== '' && fuelPrice > 0) {
      const calculatedQuantity = Number(amount) / fuelPrice;
      setQuantity(parseFloat(calculatedQuantity.toFixed(2)));
    }
  }, [amount, fuelPrice]);
  
  // Update amount when quantity changes
  useEffect(() => {
    if (quantity !== '' && fuelPrice > 0) {
      const calculatedAmount = Number(quantity) * fuelPrice;
      setAmount(parseFloat(calculatedAmount.toFixed(2)));
    }
  }, [quantity, fuelPrice]);
  
  // Fetch vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const fetchVehicles = async () => {
        try {
          const fuelPumpId = await getFuelPumpId();
          
          if (!fuelPumpId) {
            console.error('No fuel pump ID available');
            toast({
              title: "Authentication Required",
              description: "Please log in with a fuel pump account to view vehicles",
              variant: "destructive"
            });
            return;
          }
          
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('fuel_pump_id', fuelPumpId)
            .eq('customer_id', selectedCustomer);
            
          if (error) {
            console.error('Error fetching vehicles:', error);
            return;
          }
          
          if (data) {
            setVehicles(data);
            // Reset selected vehicle
            setSelectedVehicle('');
            setSelectedVehicleNumber('');
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
        }
      };
      
      fetchVehicles();
    }
  }, [selectedCustomer, toast]);

  const resetForm = () => {
    setIndentNumber('');
    setSelectedCustomer('');
    setSelectedCustomerName('');
    setSelectedVehicle('');
    setSelectedVehicleNumber('');
    setSelectedBooklet('');
    setAmount('');
    setQuantity('');
    setDiscountAmount(0);
    setSearchIndentNumber('');
    setIndentNumberError('');
    setSearchError('');
  };

  return {
    fuelType,
    setFuelType,
    amount,
    setAmount,
    quantity, 
    setQuantity,
    discountAmount,
    setDiscountAmount,
    date,
    setDate,
    selectedStaff,
    setSelectedStaff,
    isSubmitting,
    setIsSubmitting,
    staff,
    indentNumber,
    setIndentNumber,
    indentNumberError,
    setIndentNumberError,
    searchIndentNumber,
    setSearchIndentNumber,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    selectedCustomer,
    setSelectedCustomer,
    selectedCustomerName,
    setSelectedCustomerName,
    selectedVehicle,
    setSelectedVehicle,
    selectedVehicleNumber,
    setSelectedVehicleNumber,
    selectedBooklet,
    setSelectedBooklet,
    successDialogOpen,
    setSuccessDialogOpen,
    successDetails,
    setSuccessDetails,
    vehicles,
    fuelPrice,
    resetForm
  };
};
