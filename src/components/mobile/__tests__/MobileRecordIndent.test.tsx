
import React from 'react';
import { screen } from '@testing-library/react';
import MobileRecordIndent from '@/pages/mobile/MobileRecordIndent';
import { renderWithProviders, setupMobileViewport } from '@/test-utils/testing-helpers';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock hooks and services
vi.mock('@/hooks/mobile/useIndentForm', () => ({
  useIndentForm: vi.fn(() => ({
    fuelType: 'Petrol',
    setFuelType: vi.fn(),
    amount: 0,
    setAmount: vi.fn(),
    quantity: 0,
    setQuantity: vi.fn(),
    discountAmount: 0,
    date: new Date(),
    selectedStaff: '',
    isSubmitting: false,
    staff: [],
    indentNumber: '',
    setIndentNumber: vi.fn(),
    indentNumberError: '',
    setIndentNumberError: vi.fn(),
    searchIndentNumber: '',
    setSearchIndentNumber: vi.fn(),
    selectedCustomer: '',
    setSelectedCustomer: vi.fn(),
    selectedCustomerName: '',
    setSelectedCustomerName: vi.fn(),
    selectedVehicle: '',
    setSelectedVehicle: vi.fn(),
    selectedVehicleNumber: '',
    setSelectedVehicleNumber: vi.fn(),
    selectedBooklet: '',
    setSelectedBooklet: vi.fn(),
    successDialogOpen: false,
    setSuccessDialogOpen: vi.fn(),
    successDetails: null,
    setSuccessDetails: vi.fn(),
    vehicles: [
      { id: 'veh-1', number: 'ABC123', type: 'Car', customer_id: 'cust-1' },
      { id: 'veh-2', number: 'XYZ789', type: 'Truck', customer_id: 'cust-1' }
    ],
    resetForm: vi.fn()
  }))
}));

vi.mock('@/hooks/mobile/useIndentValidation', () => ({
  useIndentValidation: vi.fn(() => ({
    indentNumberError: '',
    setIndentNumberError: vi.fn(),
    validateIndentNumber: vi.fn().mockResolvedValue(true)
  }))
}));

vi.mock('@/hooks/mobile/useIndentSearch', () => ({
  useIndentSearch: vi.fn(() => ({
    isSearching: false,
    searchError: '',
    searchByIndentNumber: vi.fn(),
    setSearchError: vi.fn()
  }))
}));

vi.mock('@/hooks/mobile/useSaveIndent', () => ({
  useSaveIndent: vi.fn(() => ({
    isSubmitting: false,
    handleSaveIndent: vi.fn()
  }))
}));

describe('MobileRecordIndent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMobileViewport();
  });

  it('renders the mobile record indent form', async () => {
    renderWithProviders(<MobileRecordIndent />, { isAuthenticated: true });
    
    // Check page title
    expect(screen.getByText('Record Indent')).toBeInTheDocument();
    
    // Check indent details section
    expect(screen.getByText('Indent Details')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
    expect(screen.getByText('Mobile indents require approval from the web system before being processed.')).toBeInTheDocument();
  });
});
