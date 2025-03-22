import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, FileText } from 'lucide-react';
import React from 'react';

export interface ReportData {
  title: string;
  date: string;
  summary: {
    label: string;
    value: string;
  }[];
  details?: any[];
}

export const getReportTypeLabel = (type: string): string => {
  switch (type) {
    case 'profit-loss': return 'Profit & Loss Statement';
    case 'balance-sheet': return 'Balance Sheet';
    case 'cash-flow': return 'Cash Flow Statement';
    case 'tax-summary': return 'Tax Summary';
    case 'sales-report': return 'Sales Report';
    default: return 'Report';
  }
};

export const getReportIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'profit-loss':
    case 'sales-report':
    case 'cash-flow':
      return React.createElement(BarChart, { size: 16 });
    default:
      return React.createElement(FileText, { size: 16 });
  }
};

export const generateProfitLossReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
  // Get all sales (revenue)
  const { data: sales, error: salesError } = await supabase
    .from('transactions')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (salesError) throw salesError;
  
  // Get all fuel purchases (cost of goods sold)
  const { data: purchases, error: purchasesError } = await supabase
    .from('tank_unloads')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (purchasesError) throw purchasesError;
  
  // Get all expenses (operating expenses)
  const { data: expenses, error: expensesError } = await supabase
    .from('consumables')
    .select('total_price')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (expensesError) throw expensesError;
  
  // Calculate totals
  const totalSales = sales ? sales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + Number(item.total_price), 0) : 0;
  
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  
  return {
    title: 'Profit & Loss Statement',
    date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
    summary: [
      { label: 'Total Revenue', value: `₹${totalSales.toLocaleString('en-IN')}` },
      { label: 'Cost of Goods Sold', value: `₹${totalPurchases.toLocaleString('en-IN')}` },
      { label: 'Gross Profit', value: `₹${grossProfit.toLocaleString('en-IN')}` },
      { label: 'Operating Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}` },
      { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}` },
    ]
  };
};

export const generateSalesReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
  // Get all sales transactions with fuel type
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      quantity,
      fuel_type,
      date,
      payment_method,
      customer_id,
      customers(name)
    `)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  // Group sales by fuel type
  const salesByFuelType: Record<string, number> = {};
  const salesByPaymentMethod: Record<string, number> = {};
  let totalSales = 0;
  let totalQuantity = 0;
  
  data?.forEach(transaction => {
    const amount = Number(transaction.amount) || 0;
    const quantity = Number(transaction.quantity) || 0;
    const fuelType = transaction.fuel_type || 'Unknown';
    const paymentMethod = transaction.payment_method || 'Unknown';
    
    salesByFuelType[fuelType] = (salesByFuelType[fuelType] || 0) + amount;
    salesByPaymentMethod[paymentMethod] = (salesByPaymentMethod[paymentMethod] || 0) + amount;
    
    totalSales += amount;
    totalQuantity += quantity;
  });
  
  // Prepare report data
  const summaryItems = [
    { label: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}` },
    { label: 'Total Quantity', value: `${totalQuantity.toLocaleString('en-IN')} liters` },
  ];
  
  // Add fuel type breakdown
  Object.entries(salesByFuelType).forEach(([fuelType, amount]) => {
    summaryItems.push({
      label: `${fuelType} Sales`,
      value: `₹${amount.toLocaleString('en-IN')}`
    });
  });
  
  // Add payment method breakdown
  Object.entries(salesByPaymentMethod).forEach(([method, amount]) => {
    summaryItems.push({
      label: `${method} Payments`,
      value: `₹${amount.toLocaleString('en-IN')}`
    });
  });
  
  return {
    title: 'Sales Report',
    date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
    summary: summaryItems,
    details: data?.map(transaction => ({
      id: transaction.id,
      date: format(new Date(transaction.date), 'dd/MM/yyyy'),
      customerName: transaction.customers?.name || 'Walk-in Customer',
      fuelType: transaction.fuel_type,
      quantity: `${Number(transaction.quantity).toLocaleString('en-IN')} L`,
      amount: `₹${Number(transaction.amount).toLocaleString('en-IN')}`,
      paymentMethod: transaction.payment_method
    }))
  };
};

export const generateBalanceSheetReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
  // Get customer balances (accounts receivable)
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('balance');
  
  if (customersError) throw customersError;
  
  // Get current fuel inventory value
  const { data: fuelSettings, error: fuelError } = await supabase
    .from('fuel_settings')
    .select('fuel_type, current_level, current_price');
  
  if (fuelError) throw fuelError;
  
  // Calculate totals
  const accountsReceivable = customers ? customers.reduce((sum, customer) => sum + (Number(customer.balance) || 0), 0) : 0;
  
  let inventoryValue = 0;
  fuelSettings?.forEach(fuel => {
    const level = Number(fuel.current_level) || 0;
    const price = Number(fuel.current_price) || 0;
    inventoryValue += level * price;
  });
  
  // Get cash from transactions and other assets
  const { data: cashTransactions, error: cashError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('payment_method', 'cash')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (cashError) throw cashError;
  
  const cashAndBank = cashTransactions ? cashTransactions.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  
  // Get business equipment value (using a fixed value for now as we don't have this data in the DB)
  // In a real application, this should come from an assets table
  const { data: businessSettings, error: businessError } = await supabase
    .from('business_settings')
    .select('*')
    .single();
  
  if (businessError) throw businessError;
  
  // For simplicity, we'll use a default fixtures value
  // In a real application, this should come from fixed assets table
  const fixtures = 150000;
  
  const totalAssets = cashAndBank + accountsReceivable + inventoryValue + fixtures;
  const equity = totalAssets; // Equity = Assets (since we removed liabilities)
  
  return {
    title: 'Balance Sheet',
    date: `As of ${format(new Date(toDate), 'dd/MM/yyyy')}`,
    summary: [
      { label: 'Assets', value: '' },
      { label: 'Cash and Bank', value: `₹${cashAndBank.toLocaleString('en-IN')}` },
      { label: 'Accounts Receivable', value: `₹${accountsReceivable.toLocaleString('en-IN')}` },
      { label: 'Inventory', value: `₹${inventoryValue.toLocaleString('en-IN')}` },
      { label: 'Fixtures and Equipment', value: `₹${fixtures.toLocaleString('en-IN')}` },
      { label: 'Total Assets', value: `₹${totalAssets.toLocaleString('en-IN')}` },
      { label: 'Owner\'s Equity', value: `₹${equity.toLocaleString('en-IN')}` },
    ]
  };
};

export const generateCashFlowReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
  // Get cash sales
  const { data: cashSales, error: cashError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('payment_method', 'cash')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (cashError) throw cashError;
  
  // Get customer payments (cash inflow)
  const { data: payments, error: paymentsError } = await supabase
    .from('customer_payments')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (paymentsError) throw paymentsError;
  
  // Get fuel purchases (cash outflow)
  const { data: purchases, error: purchasesError } = await supabase
    .from('tank_unloads')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (purchasesError) throw purchasesError;
  
  // Get expenses (cash outflow)
  const { data: expenses, error: expensesError } = await supabase
    .from('consumables')
    .select('total_price')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (expensesError) throw expensesError;
  
  // Calculate totals
  const totalCashSales = cashSales ? cashSales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalPayments = payments ? payments.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + Number(item.total_price), 0) : 0;
  
  const totalCashInflow = totalCashSales + totalPayments;
  const totalCashOutflow = totalPurchases + totalExpenses;
  const netCashFlow = totalCashInflow - totalCashOutflow;
  
  return {
    title: 'Cash Flow Statement',
    date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
    summary: [
      { label: 'Cash Inflow', value: '' },
      { label: 'Cash Sales', value: `₹${totalCashSales.toLocaleString('en-IN')}` },
      { label: 'Customer Payments', value: `₹${totalPayments.toLocaleString('en-IN')}` },
      { label: 'Total Cash Inflow', value: `₹${totalCashInflow.toLocaleString('en-IN')}` },
      { label: 'Cash Outflow', value: '' },
      { label: 'Fuel Purchases', value: `₹${totalPurchases.toLocaleString('en-IN')}` },
      { label: 'Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}` },
      { label: 'Total Cash Outflow', value: `₹${totalCashOutflow.toLocaleString('en-IN')}` },
      { label: 'Net Cash Flow', value: `₹${netCashFlow.toLocaleString('en-IN')}` },
    ]
  };
};

export const generateTaxSummaryReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
  // Get all sales (for output tax calculation)
  const { data: sales, error: salesError } = await supabase
    .from('transactions')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (salesError) throw salesError;
  
  // Get all purchases (for input tax calculation)
  const { data: purchases, error: purchasesError } = await supabase
    .from('tank_unloads')
    .select('amount')
    .gte('date', fromDate)
    .lte('date', toDate);
  
  if (purchasesError) throw purchasesError;
  
  // Calculate tax amounts (assuming 18% GST for this example)
  const gstRate = 0.18;
  
  const totalSales = sales ? sales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  
  const salesBeforeTax = totalSales / (1 + gstRate);
  const outputGST = totalSales - salesBeforeTax;
  
  const purchasesBeforeTax = totalPurchases / (1 + gstRate);
  const inputGST = totalPurchases - purchasesBeforeTax;
  
  const netGSTPayable = outputGST - inputGST;
  
  return {
    title: 'Tax Summary',
    date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
    summary: [
      { label: 'Output Tax', value: '' },
      { label: 'Taxable Sales', value: `₹${salesBeforeTax.toLocaleString('en-IN')}` },
      { label: 'Output GST', value: `₹${outputGST.toLocaleString('en-IN')}` },
      { label: 'Input Tax', value: '' },
      { label: 'Taxable Purchases', value: `₹${purchasesBeforeTax.toLocaleString('en-IN')}` },
      { label: 'Input GST', value: `₹${inputGST.toLocaleString('en-IN')}` },
      { label: 'Net GST Payable', value: `₹${netGSTPayable.toLocaleString('en-IN')}` },
    ]
  };
};

export const exportReportToCsv = (reportData: ReportData) => {
  if (!reportData) {
    return false;
  }
  
  // Create CSV content
  const headers = "Category,Value\n";
  const rows = reportData.summary
    .filter(item => item.value) // Skip headers with empty values
    .map(item => `"${item.label}","${item.value}"`)
    .join('\n');
  
  const csvContent = `${headers}${rows}`;
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportData.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  
  return true;
};

export const printReport = (reportData: ReportData) => {
  if (!reportData) {
    return false;
  }
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Unable to open print window');
    return false;
  }
  
  // Generate printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { 
          font-size: 24px;
          margin-bottom: 5px; 
        }
        .report-date {
          font-size: 14px;
          margin-bottom: 20px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f7f7f7;
          font-weight: bold;
        }
        .value-cell {
          text-align: right;
        }
        .header-row {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .details-section {
          margin-top: 30px;
        }
        .print-footer {
          margin-top: 30px;
          font-size: 12px;
          text-align: center;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>${reportData.title}</h1>
      <div class="report-date">${reportData.date}</div>
      
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="value-cell">Value</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.summary.map(item => `
            <tr class="${item.value === '' ? 'header-row' : ''}">
              <td>${item.label}</td>
              <td class="value-cell">${item.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${reportData.details && reportData.details.length > 0 ? `
        <div class="details-section">
          <h2>Detailed Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Quantity</th>
                <th class="value-cell">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.map(detail => `
                <tr>
                  <td>${detail.date}</td>
                  <td>${detail.customerName}</td>
                  <td>${detail.fuelType}</td>
                  <td>${detail.quantity}</td>
                  <td class="value-cell">${detail.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div class="print-footer">
        Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
      </div>
    </body>
    </html>
  `;
  
  // Write to the new window and print
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.print();
    // Close the window after printing (optional)
    // printWindow.close();
  };
  
  return true;
};
