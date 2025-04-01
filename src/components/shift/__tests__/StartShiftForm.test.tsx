
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';

describe('StartShiftForm Component', () => {
  const mockSetFormOpen = vi.fn();
  const mockSetNewShift = vi.fn();
  const mockHandleAddShift = vi.fn().mockResolvedValue(true);
  
  const defaultProps = {
    formOpen: true,
    setFormOpen: mockSetFormOpen,
    newShift: {
      staff_id: '',
      pump_id: '',
      date: '2023-08-15',
      opening_reading: 0,
      starting_cash_balance: 0
    },
    setNewShift: mockSetNewShift,
    handleAddShift: mockHandleAddShift,
    staffList: [
      { id: 'staff-1', name: 'John Doe' },
      { id: 'staff-2', name: 'Jane Smith' }
    ]
  };

  it('renders the form correctly when dialog is open', () => {
    render(<StartShiftForm {...defaultProps} />);
    
    expect(screen.getByText('Start New Shift')).toBeInTheDocument();
    expect(screen.getByText('Enter the details to start a new shift.')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Pump')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Opening Reading')).toBeInTheDocument();
    expect(screen.getByText('Starting Cash Balance')).toBeInTheDocument();
  });

  it('updates shift details when form inputs change', async () => {
    const user = userEvent.setup();
    render(<StartShiftForm {...defaultProps} />);
    
    // Select staff member
    const staffSelect = screen.getByText('Select staff');
    await user.click(staffSelect);
    const staffOption = screen.getByText('John Doe');
    await user.click(staffOption);
    
    expect(mockSetNewShift).toHaveBeenCalledWith(expect.objectContaining({
      staff_id: 'staff-1'
    }));
    
    // Would continue with more form interactions when using a real DOM
  });

  it('calls handleAddShift and closes the dialog on submit', async () => {
    const user = userEvent.setup();
    render(<StartShiftForm {...defaultProps} />);
    
    // Find and click the start shift button
    const startButton = screen.getByRole('button', { name: 'Start Shift' });
    await user.click(startButton);
    
    expect(mockHandleAddShift).toHaveBeenCalled();
    expect(mockSetFormOpen).toHaveBeenCalledWith(false);
  });

  it('keeps dialog open if handleAddShift returns false', async () => {
    const mockFailedAddShift = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    
    render(
      <StartShiftForm 
        {...defaultProps}
        handleAddShift={mockFailedAddShift}
      />
    );
    
    // Find and click the start shift button
    const startButton = screen.getByRole('button', { name: 'Start Shift' });
    await user.click(startButton);
    
    expect(mockFailedAddShift).toHaveBeenCalled();
    expect(mockSetFormOpen).not.toHaveBeenCalledWith(false);
  });
});
