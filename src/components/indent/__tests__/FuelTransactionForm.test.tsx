
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FuelTransactionForm } from '@/components/indent/FuelTransactionForm';
import '@testing-library/jest-dom';

describe('FuelTransactionForm Component', () => {
  const defaultProps = {
    fuelType: 'Petrol',
    setFuelType: jest.fn(),
    amount: 0,
    setAmount: jest.fn(),
    quantity: 0,
    setQuantity: jest.fn(),
    discountAmount: 0,
    setDiscountAmount: jest.fn(),
    date: new Date(),
    setDate: jest.fn(),
    isSubmitting: false,
    onSubmit: jest.fn(),
    staff: [
      { id: 'staff-1', name: 'John Doe' },
      { id: 'staff-2', name: 'Jane Smith' }
    ],
    selectedStaff: 'staff-1',
    setSelectedStaff: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    // Check for fuel type selector
    expect(screen.getByLabelText(/fuel type/i)).toBeInTheDocument();
    
    // Check for amount field
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    
    // Check for quantity field
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    
    // Check for discount field
    expect(screen.getByLabelText(/discount/i)).toBeInTheDocument();
    
    // Check for date field
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    
    // Check for staff selector
    expect(screen.getByLabelText(/staff member/i)).toBeInTheDocument();
    
    // Check that staff names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls setFuelType when fuel type is changed', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    const fuelTypeSelect = screen.getByLabelText(/fuel type/i);
    fireEvent.change(fuelTypeSelect, { target: { value: 'Diesel' } });
    
    expect(defaultProps.setFuelType).toHaveBeenCalledWith('Diesel');
  });

  it('calls setAmount when amount is changed', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    
    expect(defaultProps.setAmount).toHaveBeenCalledWith(1000);
  });

  it('calls setQuantity when quantity is changed', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText(/quantity/i);
    fireEvent.change(quantityInput, { target: { value: '10' } });
    
    expect(defaultProps.setQuantity).toHaveBeenCalledWith(10);
  });

  it('calls setDiscountAmount when discount is changed', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    const discountInput = screen.getByLabelText(/discount/i);
    fireEvent.change(discountInput, { target: { value: '100' } });
    
    expect(defaultProps.setDiscountAmount).toHaveBeenCalledWith(100);
  });

  it('calls setSelectedStaff when staff is changed', () => {
    render(<FuelTransactionForm {...defaultProps} />);
    
    const staffSelect = screen.getByLabelText(/staff member/i);
    fireEvent.change(staffSelect, { target: { value: 'staff-2' } });
    
    expect(defaultProps.setSelectedStaff).toHaveBeenCalledWith('staff-2');
  });

  it('shows loading state when isSubmitting is true', () => {
    render(<FuelTransactionForm {...defaultProps} isSubmitting={true} />);
    
    // Check for loading indicator
    const loadingText = screen.queryByText(/recording/i);
    expect(loadingText).not.toBeNull();
  });
});
