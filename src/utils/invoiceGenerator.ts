
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Transaction } from '@/integrations/supabase/client';
import { getBusinessSettings } from '@/integrations/businessSettings';
import { getFuelPumpId } from '@/integrations/utils';

interface BusinessInfo {
  id?: string;
  business_name: string;
  gst_number: string;
  address: string;
}

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

export const generateGSTInvoice = async (
  customer: Customer,
  filteredTransactions: TransactionWithDetails[],
  dateRange: { from?: Date; to?: Date }
): Promise<{ success: boolean; message: string }> => {
  if (!filteredTransactions.length) {
    return {
      success: false,
      message: "No transactions to generate invoice"
    };
  }

  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      return {
        success: false,
        message: "Authentication required to generate invoice"
      };
    }
    
    // Get business details from business_settings
    const businessSettings = await getBusinessSettings();
    
    let businessInfo: BusinessInfo;
    if (businessSettings) {
      businessInfo = {
        business_name: businessSettings.business_name,
        gst_number: businessSettings.gst_number,
        address: businessSettings.address
      };
    } else {
      businessInfo = {
        business_name: 'Fuel Station',
        gst_number: 'Not Available',
        address: 'Address not available'
      };
    }

    // Calculate totals
    let totalAmount = 0;
    let totalQuantity = 0;
    
    // Count only fuel transactions, not payments
    const fuelTransactions = filteredTransactions.filter(t => t.fuel_type !== 'PAYMENT');
    
    fuelTransactions.forEach(t => {
      totalAmount += Number(t.amount) || 0;
      totalQuantity += Number(t.quantity) || 0;
    });

    // Calculate GST (assuming 18% GST)
    const gstRate = 0.18;
    const gstAmount = totalAmount * gstRate;
    const baseAmount = totalAmount - gstAmount;

    // Create an invoice record in the database
    const invoiceDate = new Date();
    
    // Format dates for the invoice period
    const formattedFromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const formattedToDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    
    // Using the explicit parameter names matching the database function
    const invoiceParams = {
      p_customer_id: customer.id,
      p_amount: totalAmount,
      p_date: invoiceDate.toISOString().split('T')[0],
      pump_id: fuelPumpId
    };
    
    const { data: invoiceId, error: invoiceError } = await supabase
      .rpc('create_invoice_record', invoiceParams);

    if (invoiceError) {
      console.error('Error creating invoice record:', invoiceError);
      throw new Error('Failed to create invoice record');
    }
    
    // Generate invoice ID if not returned from the function
    const displayInvoiceId = invoiceId || `INV-${new Date().getTime().toString().substring(0, 10)}`;

    // Generate the invoice content
    const invoicePeriod = dateRange.from && dateRange.to 
      ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
      : 'All time';

    // Create PDF document
    const pdf = new jsPDF();
    
    // Add logo/header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(businessInfo.business_name, 105, 20, { align: 'center' });
    
    // Add address and contact details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(businessInfo.address, 105, 28, { align: 'center' });
    
    const gstNumber = businessInfo.gst_number ? `GSTIN: ${businessInfo.gst_number}` : 'GSTIN: Not Available';
    pdf.text(gstNumber, 105, 34, { align: 'center' });
    
    // Add invoice title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text("TAX INVOICE", 105, 42, { align: 'center' });
    
    // Add a line
    pdf.line(14, 47, 196, 47);
    
    // Invoice details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice Date: ${format(invoiceDate, 'dd/MM/yyyy')}`, 14, 55);
    pdf.text(`Period: ${invoicePeriod}`, 14, 61);
    pdf.text(`Invoice No: ${displayInvoiceId}`, 14, 67);
    
    // Customer details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Customer Details:", 14, 77);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${customer.name}`, 14, 84);
    pdf.text(`Contact: ${customer.contact || 'N/A'}`, 14, 90);
    pdf.text(`Phone: ${customer.phone || 'N/A'}`, 14, 96);
    pdf.text(`GSTIN: ${customer.gst || 'Not Available'}`, 14, 102);
    
    // Add transaction table
    autoTable(pdf, {
      head: [['Date', 'Vehicle', 'Fuel Type', 'Quantity (L)', 'Amount (INR)', 'Payment Method']],
      body: fuelTransactions.map(trans => [
        format(new Date(trans.date), 'dd/MM/yyyy'),
        trans.vehicle_number || 'N/A',
        trans.fuel_type || 'N/A',
        trans.quantity ? trans.quantity.toString() : '0',
        trans.amount.toString(),
        trans.payment_method || 'N/A'
      ]),
      startY: 110,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Add summary
    const finalY = (pdf as any).lastAutoTable.finalY + 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Invoice Summary", 140, finalY);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Quantity: ${totalQuantity.toFixed(2)} L`, 140, finalY + 7);
    pdf.text(`Base Amount: INR ${baseAmount.toFixed(2)}`, 140, finalY + 14);
    pdf.text(`CGST (${(gstRate/2)*100}%): INR ${(gstAmount/2).toFixed(2)}`, 140, finalY + 21);
    pdf.text(`SGST (${(gstRate/2)*100}%): INR ${(gstAmount/2).toFixed(2)}`, 140, finalY + 28);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Amount: INR ${totalAmount.toFixed(2)}`, 140, finalY + 35);
    
    // Add footer
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 280);
    
    // Add signature line
    pdf.line(140, finalY + 50, 190, finalY + 50);
    pdf.text("Authorized Signature", 150, finalY + 55);
    
    // Terms and conditions
    pdf.setFontSize(8);
    pdf.text("Terms & Conditions:", 14, 255);
    pdf.text("1. This is a computer generated invoice and does not require a physical signature.", 14, 260);
    pdf.text("2. Please pay within 30 days of the invoice date.", 14, 265);
    pdf.text("3. For any queries related to this invoice, please contact us.", 14, 270);
    
    // Save the PDF with a clear date range in the filename
    const filenameDatePart = dateRange.from && dateRange.to 
      ? `${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}` 
      : format(new Date(), 'yyyy-MM-dd');
      
    pdf.save(`${customer.name}-GST-Invoice-${filenameDatePart}.pdf`);
    
    return {
      success: true,
      message: "The GST invoice has been generated and downloaded successfully"
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return {
      success: false,
      message: "There was a problem generating the invoice. Please try again."
    };
  }
};
