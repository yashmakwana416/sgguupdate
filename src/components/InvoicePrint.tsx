import React from 'react';
import { SalesInvoice } from '@/types/billing';

interface InvoicePrintProps {
  invoice: SalesInvoice;
  party?: {
    phone?: string;
    address?: string;
  } | null;
  companyDetails?: {
    name: string;
    address: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
    tagline?: string;
    signature_name?: string;
  };
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  invoice,
  party,
  companyDetails = {
    name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
    address: "150FI RING ROAD, RAMAPUR",
    landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
    city: "PAPAD, 19/4 CORNER, RAJKOT",
    state: "Gujarat",
    pincode: "",
    mobile: "9624985555",
    tagline: "આપણો વિશ્વાસુ",
    signature_name: "પ્રજાપતિ મહેશ"
  }
}) => {

  const convertAmountToWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) return 'Zero';
    if (amount < 10) return ones[amount];
    if (amount < 20) return teens[amount - 10];
    if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '');
    if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' ' + convertAmountToWords(amount % 100) : '');
    if (amount < 100000) return convertAmountToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 !== 0 ? ' ' + convertAmountToWords(amount % 1000) : '');
    if (amount < 1000000) return convertAmountToWords(Math.floor(amount / 100000)) + ' Lakh' + (amount % 100000 !== 0 ? ' ' + convertAmountToWords(amount % 100000) : '');

    return 'Rupees Only';
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill of Supply - ${invoice.invoiceNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: #1F2937;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body { margin: 0; padding: 0; }
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0; 
                background: white !important;
              }
              .print-container {
                box-shadow: none !important;
                border: none !important;
              }
            }
            
            /* Color scheme - Light purple with grey undertone */
            .primary-bg { background-color: #EDE9FE !important; }
            .primary-border { border-color: #D1D5DB !important; }
            .primary-text { color: #1F2937 !important; }
            .accent-text { color: #4B5563 !important; }
            .highlight-bg { background-color: #F5F3FF !important; }
            
            /* Typography - Clean and modern */
            .text-xs { font-size: 10px !important; line-height: 14px !important; }
            .text-sm { font-size: 12px !important; line-height: 18px !important; }
            .text-base { font-size: 14px !important; line-height: 20px !important; }
            .text-lg { font-size: 16px !important; line-height: 22px !important; }
            .text-xl { font-size: 18px !important; line-height: 24px !important; }
            .font-bold { font-weight: 700 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }
            .uppercase { text-transform: uppercase !important; }
            
            /* Layout - Simplified */
            .container { max-width: 100% !important; margin: 0 auto !important; }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .w-full { width: 100% !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
            
            /* Spacing - More breathing room */
            .p-2 { padding: 8px !important; }
            .p-4 { padding: 16px !important; }
            .p-6 { padding: 24px !important; }
            .px-2 { padding-left: 8px !important; padding-right: 8px !important; }
            .px-4 { padding-left: 16px !important; padding-right: 16px !important; }
            .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
            .py-4 { padding-top: 16px !important; padding-bottom: 16px !important; }
            .m-0 { margin: 0 !important; }
            .mb-2 { margin-bottom: 8px !important; }
            .mb-4 { margin-bottom: 16px !important; }
            .mt-2 { margin-top: 8px !important; }
            .mt-4 { margin-top: 16px !important; }
            .gap-2 { gap: 8px !important; }
            .gap-4 { gap: 16px !important; }
            
            /* Borders - Subtle */
            .border { border: 1px solid #D1D5DB !important; }
            .border-b { border-bottom: 1px solid #D1D5DB !important; }
            .border-t { border-top: 1px solid #D1D5DB !important; }
            .rounded { border-radius: 6px !important; }
            
            /* Table styles - Cleaner */
            table { 
              border-collapse: collapse !important; 
              width: 100% !important; 
              margin: 0 !important;
            }
            th, td { 
              border: 1px solid #D1D5DB !important; 
              padding: 8px 12px !important; 
              vertical-align: middle !important;
            }
            .table-header { 
              background-color: #EDE9FE !important; 
              color: #1F2937 !important; 
              font-weight: 600 !important;
            }
            .table-footer { 
              background-color: #EDE9FE !important; 
              color: #1F2937 !important; 
              font-weight: 600 !important;
              border-top: 2px solid #D1D5DB !important;
            }
            
            /* Special elements */
            .invoice-box {
              background: white !important;
              border: 1px solid #D1D5DB !important;
              border-radius: 6px !important;
              padding: 12px !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            }
            .signature-box {
              background: #F5F3FF !important;
              border: 1px solid #D1D5DB !important;
              border-radius: 6px !important;
              padding: 12px !important;
              text-align: center !important;
              display: inline-block !important;
            }
            @media (max-width: 640px) {
              .flex-col-sm { flex-direction: column; }
              .text-sm-responsive { font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            
            <!-- Header Section -->
            <div class="primary-bg p-4 border-b">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                  <h1 class="text-xl font-bold primary-text mb-2">
                    ${companyDetails.name}
                  </h1>
                  <div class="accent-text text-sm">
                    ${companyDetails.address ? `<div class="mb-2">${companyDetails.address}</div>` : ''}
                    ${companyDetails.landmark ? `<div class="mb-2">${companyDetails.landmark}</div>` : ''}
                    ${(companyDetails.city || companyDetails.state || companyDetails.pincode) ? `<div class="mb-2">${[companyDetails.city, companyDetails.state, companyDetails.pincode].filter(Boolean).join(', ')}</div>` : ''}
                    <div class="font-medium">Mobile: ${companyDetails.mobile}</div>
                  </div>
                </div>
                
                <div class="text-right">
                  <div class="invoice-box">
                    <div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div>
                    <h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2>
                    <div class="mb-2">
                      <div class="text-sm accent-text">Invoice No.</div>
                      <div class="text-base font-semibold primary-text">${invoice.invoiceNumber}</div>
                    </div>
                    <div>
                      <div class="text-sm accent-text">Invoice Date</div>
                      <div class="text-sm font-medium primary-text">${new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Information -->
            <div class="highlight-bg p-4 border-b">
              <h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3>
              <div class="text-base font-semibold primary-text mb-2">${invoice.customerName}</div>
              ${party?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${party.phone}</span></div>` : ''}
              ${party?.address ? `<div class="text-sm accent-text">${party.address}</div>` : ''}
            </div>

            <!-- Items Table -->
            <div class="w-full">
              <table>
                <thead>
                  <tr class="table-header">
                    <th class="text-sm font-semibold text-left" style="width: 8%;">S.NO.</th>
                    <th class="text-sm font-semibold text-left" style="width: 40%;">ITEMS</th>
                    <th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th>
                    <th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th>
                    <th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th>
                    <th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item, index) => `
                    <tr>
                      <td class="text-sm text-center primary-text">${index + 1}</td>
                      <td class="text-sm primary-text">${item.productName}</td>
                      <td class="text-sm text-center primary-text">${item.quantity} PCS</td>
                      <td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td>
                      <td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td>
                      <td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td>
                    </tr>
                  `).join('')}
                  
                  <!-- Empty rows for minimum height -->
                  ${Array.from({ length: Math.max(0, 5 - invoice.items.length) }, () => `
                    <tr>
                      <td style="height: 37px;"></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  `).join('')}

                  <tr class="table-footer">
                    <td></td>
                    <td class="text-sm font-semibold">SUBTOTAL</td>
                    <td class="text-sm font-semibold text-center">${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td></td>
                    <td></td>
                    <td class="text-sm font-semibold text-right">₹ ${invoice.subtotal.toFixed(0)}</td>
                  </tr>
                  
                  ${invoice.discount && invoice.discount > 0 ? `
                  <tr class="highlight-bg">
                    <td></td>
                    <td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${invoice.discount.toFixed(0)}</td>
                  </tr>
                  ` : ''}
                  
                  ${invoice.otherCharges && invoice.otherCharges > 0 ? `
                  <tr class="highlight-bg">
                    <td></td>
                    <td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.otherCharges.toFixed(0)}</td>
                  </tr>
                  ` : ''}
                  
                  ${invoice.taxAmount > 0 ? `
                  <tr class="highlight-bg">
                    <td></td>
                    <td class="text-sm font-semibold" style="color: #7C3AED;">TAX</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.taxAmount.toFixed(0)}</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>

            <!-- Totals Section -->
            <div class="p-4 border-t">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div>
                  <div class="text-sm accent-text">${convertAmountToWords(Math.floor(invoice.total))} Rupees Only</div>
                </div>
                <div>
                  <div class="flex justify-between items-center py-2 border-b">
                    <span class="text-sm font-semibold accent-text">Previous Balance</span>
                    <span class="text-sm font-semibold" style="color: #F97316;">₹ ${(invoice.previousBalance || 0).toFixed(0)}</span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b">
                    <span class="text-sm font-semibold accent-text">Current Invoice</span>
                    <span class="text-base font-bold primary-text">₹ ${invoice.total.toFixed(0)}</span>
                  </div>
                  ${invoice.paidAmount && invoice.paidAmount > 0 ? `
                  <div class="flex justify-between items-center py-2 border-b">
                    <span class="text-sm font-semibold accent-text">Paid</span>
                    <span class="text-sm font-semibold" style="color: #16A34A;">- ₹ ${invoice.paidAmount.toFixed(0)}</span>
                  </div>
                  ` : ''}
                  <div class="flex justify-between items-center py-2 border-t-2" style="border-color: #7C3AED;">
                    <span class="text-sm font-bold" style="color: #7C3AED;">${invoice.status === 'paid' ? 'Total Paid' : 'Pending Balance'}</span>
                    <span class="text-base font-bold" style="color: ${invoice.status === 'paid' ? '#16A34A' : '#DC2626'};">₹ ${invoice.status === 'paid' ? invoice.total.toFixed(0) : (invoice.total - (invoice.paidAmount || 0)).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer with Signature -->
            <div class="highlight-bg p-6 text-center border-t" style="page-break-inside: avoid;">
              <div class="signature-box">
                <div class="text-lg font-bold primary-text mb-2">
                  ${companyDetails.tagline}
                </div>
                <div class="text-base font-medium accent-text mb-2">
                  ${companyDetails.signature_name || "પ્રજાપતિ મહેશ"}
                </div>
                <div class="text-xs font-semibold accent-text uppercase border-t pt-2 mt-2">
                  Authorised Signature for ${companyDetails.name}
                </div>
              </div>
            </div>

            ${invoice.notes ? `
              <div class="p-4 border-t bg-gray-50">
                <div class="text-sm accent-text">
                  <strong>Notes:</strong> ${invoice.notes}
                </div>
              </div>
            ` : ''}

          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Auto-print when component mounts
  React.useEffect(() => {
    printInvoice();
  }, []);

  return null;
};

export default InvoicePrint;