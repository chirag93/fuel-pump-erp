
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TankReadingsForm, { ReadingFormData } from '@/components/daily-readings/TankReadingsForm';
import '@testing-library/jest-dom';

describe('TankReadingsForm Component', () => {
  const mockHandleTankInputChange = jest.fn();
  const mockAddTank = jest.fn();
  const mockRemoveTank = jest.fn();
  
  const defaultReadingFormData: ReadingFormData = {
    date: '2023-08-15',
    fuel_type: 'Diesel',
    readings: {
      1: {
        tank_number: 1,
        dip_reading: 100,
        net_stock: 500
      }
    },
    receipt_quantity: 0,
    closing_stock: 0,
    actual_meter_sales: 0
  };
  
  const calculatedValues = {
    opening_stock: 500,
    sales_per_tank_stock: 0,
    stock_variation: 0
  };
  
  const defaultProps = {
    readingFormData: defaultReadingFormData,
    tankCount: 1,
    handleTankInputChange: mockHandleTankInputChange,
    addTank: mockAddTank,
    removeTank: mockRemoveTank,
    calculatedValues: calculatedValues
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tank readings form correctly', () => {
    render(<TankReadingsForm {...defaultProps} />);
    
    expect(screen.getByText('Tank Readings')).toBeInTheDocument();
    expect(screen.getByText('Add Tank')).toBeInTheDocument();
    expect(screen.getByText('Tank 1')).toBeInTheDocument();
    expect(screen.getByText('Dip Reading')).toBeInTheDocument();
    expect(screen.getByText('Net Stock')).toBeInTheDocument();
    expect(screen.getByText('Total Opening Stock =')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument(); // The opening stock value
  });

  it('allows adding a new tank', async () => {
    const user = userEvent.setup();
    render(<TankReadingsForm {...defaultProps} />);
    
    const addTankButton = screen.getByText('Add Tank');
    await user.click(addTankButton);
    
    expect(mockAddTank).toHaveBeenCalled();
  });

  it('allows removing a tank when more than one exists', async () => {
    const user = userEvent.setup();
    const propsWithMultipleTanks = {
      ...defaultProps,
      readingFormData: {
        ...defaultReadingFormData,
        readings: {
          1: {
            tank_number: 1,
            dip_reading: 100,
            net_stock: 500
          },
          2: {
            tank_number: 2,
            dip_reading: 150,
            net_stock: 750
          }
        }
      },
      tankCount: 2
    };
    
    render(<TankReadingsForm {...propsWithMultipleTanks} />);
    
    // The form should display remove buttons now
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons.length).toBe(2);
    
    await user.click(removeButtons[0]);
    expect(mockRemoveTank).toHaveBeenCalledWith(1);
  });

  it('updates tank inputs when values change', async () => {
    const user = userEvent.setup();
    render(<TankReadingsForm {...defaultProps} />);
    
    const dipReadingInput = screen.getByLabelText(/Dip Reading/);
    await user.clear(dipReadingInput);
    await user.type(dipReadingInput, '200');
    
    expect(mockHandleTankInputChange).toHaveBeenCalledWith(1, 'dip_reading', '200');
    
    const netStockInput = screen.getByLabelText(/Net Stock/);
    await user.clear(netStockInput);
    await user.type(netStockInput, '1000');
    
    expect(mockHandleTankInputChange).toHaveBeenCalledWith(1, 'net_stock', '1000');
  });
});
