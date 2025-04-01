
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApprovalRequests from '@/pages/ApprovalRequests';
import { renderWithProviders } from '@/test-utils/testing-helpers';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useApprovalRequests hook
vi.mock('@/hooks/useApprovalRequests', () => ({
  useApprovalRequests: vi.fn(() => ({
    pendingIndents: [
      {
        id: 'indent-1',
        indent_number: 'IND001',
        customer_name: 'Test Customer',
        vehicle_number: 'ABC123',
        date: '2023-08-15',
        fuel_type: 'Petrol',
        amount: 1000,
        source: 'mobile',
        approval_status: 'pending'
      },
      {
        id: 'indent-2',
        indent_number: 'IND002',
        customer_name: 'Another Customer',
        vehicle_number: 'XYZ789',
        date: '2023-08-16',
        fuel_type: 'Diesel',
        amount: 2000,
        source: 'mobile',
        approval_status: 'pending'
      }
    ],
    isLoadingIndents: false,
    pendingTransactions: [],
    isLoadingTransactions: false,
    handleApproveIndent: vi.fn().mockResolvedValue(true),
    handleRejectIndent: vi.fn().mockResolvedValue(true),
    handleApproveTransaction: vi.fn().mockResolvedValue(true),
    handleRejectTransaction: vi.fn().mockResolvedValue(true),
    refetchIndents: vi.fn(),
    refetchTransactions: vi.fn()
  }))
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis()
  }
}));

describe('ApprovalRequests Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the approval requests page', async () => {
    renderWithProviders(<ApprovalRequests />, { isAuthenticated: true });
    
    // Check page title
    expect(screen.getByText('Approval Requests')).toBeInTheDocument();
    
    // Check Pending Indents tab
    expect(screen.getByRole('tab', { name: 'Pending Indents' })).toBeInTheDocument();
    
    // Check Pending Transactions tab
    expect(screen.getByRole('tab', { name: 'Pending Transactions' })).toBeInTheDocument();
    
    // Check indent data is displayed
    expect(screen.getByText('IND001')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    
    // Check approval/reject buttons
    const approveButtons = screen.getAllByText('Approve');
    const rejectButtons = screen.getAllByText('Reject');
    expect(approveButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });
  
  it('handles indent approval', async () => {
    const { useApprovalRequests } = require('@/hooks/useApprovalRequests');
    const mockHandleApproveIndent = vi.fn().mockResolvedValue(true);
    
    useApprovalRequests.mockReturnValue({
      pendingIndents: [
        {
          id: 'indent-1',
          indent_number: 'IND001',
          customer_name: 'Test Customer',
          vehicle_number: 'ABC123',
          date: '2023-08-15',
          fuel_type: 'Petrol',
          amount: 1000,
          source: 'mobile',
          approval_status: 'pending'
        }
      ],
      isLoadingIndents: false,
      pendingTransactions: [],
      isLoadingTransactions: false,
      handleApproveIndent: mockHandleApproveIndent,
      handleRejectIndent: vi.fn().mockResolvedValue(true),
      handleApproveTransaction: vi.fn().mockResolvedValue(true),
      handleRejectTransaction: vi.fn().mockResolvedValue(true),
      refetchIndents: vi.fn(),
      refetchTransactions: vi.fn()
    });
    
    const user = userEvent.setup();
    renderWithProviders(<ApprovalRequests />, { isAuthenticated: true });
    
    // Find and click the approve button
    const approveButton = screen.getAllByText('Approve')[0];
    await user.click(approveButton);
    
    // Check that the handleApproveIndent function was called
    expect(mockHandleApproveIndent).toHaveBeenCalledWith(expect.objectContaining({
      id: 'indent-1'
    }));
  });
});
