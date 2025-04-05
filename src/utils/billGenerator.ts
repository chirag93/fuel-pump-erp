
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Indent, Transaction } from '@/integrations/supabase/client';
import { getBusinessSettings } from '@/integrations/businessSettings';

interface BusinessInfo {
  business_name: string;
  gst_number: string;
  address: string;
}

interface BillData {
  indent?: Indent;
  transaction: Transaction;
  businessInfo: BusinessInfo;
  vehicleNumber?: string;
  customerName?: string;
  customizations?: {
    fuelType?: string;
    quantity?: number;
    amount?: number;
    date?: Date;
  };
}

export const generateBill = async (data: BillData): Promise<{ success: boolean; message: string }> => {
  try {
    const {
      transaction,
      businessInfo,
      vehicleNumber,
      customerName,
      customizations,
    } = data;

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
    pdf.text("FUEL BILL", 105, 42, { align: 'center' });
    
    // Add a line
    pdf.line(14, 47, 196, 47);
    
    // Bill details
    const billDate = customizations?.date || new Date(transaction.date);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Bill Date: ${format(billDate, 'dd/MM/yyyy')}`, 14, 55);
    pdf.text(`Bill No: BILL-${new Date().getTime().toString().substring(0, 10)}`, 14, 61);
    
    // Customer details
    if (customerName) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Customer Details:", 14, 71);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${customerName}`, 14, 78);
      if (vehicleNumber) {
        pdf.text(`Vehicle: ${vehicleNumber}`, 14, 85);
      }
    }
    
    // Fuel details
    const fuelType = customizations?.fuelType || transaction.fuel_type;
    const quantity = customizations?.quantity || transaction.quantity;
    const amount = customizations?.amount || transaction.amount;
    
    const startY = customerName ? 95 : 71;
    
    autoTable(pdf, {
      head: [['Fuel Type', 'Quantity (L)', 'Rate', 'Amount (INR)']],
      body: [
        [
          fuelType, 
          quantity.toString(), 
          (amount / quantity).toFixed(2), 
          amount.toString()
        ]
      ],
      startY: startY,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    // Add summary
    const finalY = (pdf as any).lastAutoTable.finalY + 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Total Amount: INR " + amount.toFixed(2), 140, finalY + 10);
    
    // Add payment method
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Payment Method: ${transaction.payment_method}`, 14, finalY + 10);
    
    // Add footer
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 280);
    
    // Add signature line
    pdf.line(140, finalY + 30, 190, finalY + 30);
    pdf.text("Authorized Signature", 150, finalY + 35);
    
    // Save the PDF
    const customerText = customerName ? `-${customerName.replace(/\s+/g, '-')}` : '';
    pdf.save(`Fuel-Bill${customerText}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    return {
      success: true,
      message: "Bill has been generated and downloaded successfully"
    };
  } catch (error) {
    console.error('Error generating bill:', error);
    return {
      success: false,
      message: "There was a problem generating the bill. Please try again."
    };
  }
};
