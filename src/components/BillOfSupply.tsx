import React from 'react';
import { SalesInvoice } from '@/types/billing';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface BillOfSupplyProps {
  invoice: SalesInvoice;
  party?: {
    phone?: string;
    address?: string;
    location_link?: string;
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

export const BillOfSupply: React.FC<BillOfSupplyProps> = ({
  invoice,
  party,
  companyDetails = {
    name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ",
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
  const { t } = useTranslation();

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

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 shadow-lg print:shadow-none font-sans border border-gray-200 rounded-lg overflow-hidden print:text-[10px] print:leading-tight">

      {/* Clean Header - Minimal */}
      <div className="bg-purple-100 border-b border-purple-200 p-1 print:p-0.5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
          <div className="flex-1">
            <h1 className="text-sm font-bold text-purple-900 print:text-[11px] print:mb-0">
              {companyDetails.name}
            </h1>
            <div className="text-purple-700 text-[10px] print:text-[9px] leading-none">
              {companyDetails.address && <div>{companyDetails.address}</div>}
              {companyDetails.landmark && <div>{companyDetails.landmark}</div>}
              {(companyDetails.city || companyDetails.state || companyDetails.pincode) && (
                <div>
                  {[companyDetails.city, companyDetails.state, companyDetails.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>Mobile:</span>
                <span className="font-medium">{companyDetails.mobile}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="bg-white rounded p-1 border border-purple-200 print:p-0.5">
              <div className="text-[9px] text-gray-600 print:text-[8px]">ORIGINAL FOR RECIPIENT</div>
              <h2 className="text-sm font-bold text-purple-900 print:text-[10px] print:mb-0">BILL OF SUPPLY</h2>
              <div className="space-y-0">
                <div>
                  <div className="text-[9px] text-gray-600 print:text-[8px]">Invoice No.</div>
                  <div className="text-[10px] font-bold text-purple-900 print:text-[9px]">{invoice.invoiceNumber}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600 print:text-[8px]">Invoice Date</div>
                  <div className="font-semibold text-gray-800 text-[10px] print:text-[9px]">{new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information - Minimal */}
      <div className="bg-purple-50 p-1 border-b border-purple-100 print:p-0.5">
        <div className="flex flex-col sm:flex-row justify-between items-start">
          <div className="flex-1">
            <h3 className="text-[10px] font-bold text-purple-900 print:text-[9px] print:mb-0">
              BILL TO
            </h3>
            <div>
              <div className="text-[11px] font-bold text-gray-900 print:text-[10px]">{invoice.customerName}</div>
              {party?.phone && (
                <div className="text-[10px] text-gray-600 print:text-[9px]">Mobile: <span className="font-medium">{party.phone}</span></div>
              )}
              {party?.address && (
                <div className="text-[10px] text-gray-600 print:text-[9px]">{party.address}</div>
              )}
              {party?.location_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-6 text-[10px] print:hidden"
                  onClick={() => window.open(party.location_link, '_blank')}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {t('viewLocation')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table - Minimal */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-purple-100 border-b border-purple-200">
              <th className="px-0.5 py-0.5 text-left text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">S.NO.</th>
              <th className="px-0.5 py-0.5 text-left text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">ITEMS</th>
              <th className="px-0.5 py-0.5 text-center text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">QTY.</th>
              <th className="px-0.5 py-0.5 text-right text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">MRP</th>
              <th className="px-0.5 py-0.5 text-right text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">RATE</th>
              <th className="px-0.5 py-0.5 text-right text-[10px] font-bold text-purple-900 uppercase print:text-[9px]">AMOUNT</th>
            </tr>
          </thead >
          <tbody className="bg-white">
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 text-center print:text-[9px]">{index + 1}</td>
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 print:text-[9px]">{item.productName}</td>
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 text-center print:text-[9px]">{item.quantity} PCS</td>
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 text-right print:text-[9px]">{item.mrp || Math.round(item.price * 1.2)}</td>
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 text-right print:text-[9px]">{item.price.toFixed(0)}</td>
                <td className="px-0.5 py-0.5 text-[10px] text-gray-900 text-right font-medium print:text-[9px]">{item.amount.toFixed(0)}</td>
              </tr>
            ))}

            {/* Empty rows for minimum height - minimal */}
            {Array.from({ length: Math.max(0, 2 - invoice.items.length) }, (_, i) => (
              <tr key={`empty-${i}`} className="border-b border-gray-100">
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
              </tr>
            ))}

            {/* Subtotal Row */}
            <tr className="bg-purple-100 border-t-2 border-purple-200">
              <td className="px-0.5 py-0.5 print:py-0"></td>
              <td className="px-0.5 py-0.5 text-[10px] font-bold text-purple-900 print:text-[9px]">SUBTOTAL</td>
              <td className="px-0.5 py-0.5 text-[10px] font-bold text-center text-purple-900 print:text-[9px]">
                {invoice.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td className="px-0.5 py-0.5 print:py-0"></td>
              <td className="px-0.5 py-0.5 print:py-0"></td>
              <td className="px-0.5 py-0.5 text-[10px] font-bold text-right text-purple-900 print:text-[9px]">₹ {invoice.subtotal.toFixed(0)}</td>
            </tr>

            {/* Discount Row - only show if discount > 0 */}
            {invoice.discount && invoice.discount > 0 && (
              <tr className="bg-purple-50">
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-purple-900 print:text-[9px]">DISCOUNT</td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-right text-red-600 print:text-[9px]">- ₹ {invoice.discount.toFixed(0)}</td>
              </tr>
            )}

            {/* Other Charges Row - only show if other charges > 0 */}
            {invoice.otherCharges && invoice.otherCharges > 0 && (
              <tr className="bg-purple-50">
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-purple-900 print:text-[9px]">OTHER CHARGES</td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-right text-purple-900 print:text-[9px]">₹ {invoice.otherCharges.toFixed(0)}</td>
              </tr>
            )}

            {/* Tax Row - only show if tax amount > 0 */}
            {invoice.taxAmount > 0 && (
              <tr className="bg-purple-50">
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-purple-900 print:text-[9px]">TAX</td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 print:py-0"></td>
                <td className="px-0.5 py-0.5 text-[10px] font-semibold text-right text-purple-900 print:text-[9px]">₹ {invoice.taxAmount.toFixed(0)}</td>
              </tr>
            )}
          </tbody>
        </table >
      </div >

      {/* Totals Section - Minimal */}
      < div className="bg-white border-t border-purple-100" >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 print:p-0.5">

          {/* Left side - Amount in words and Payment Mode */}
          <div className="space-y-1">
            <div>
              <div className="text-[10px] font-semibold text-purple-900 print:text-[9px]">Total Amount (in words)</div>
              <div className="text-[10px] text-gray-800 leading-none print:text-[9px]">
                {convertAmountToWords(Math.floor(invoice.total))} Rupees
              </div>
            </div>
            
            {/* Payment Mode Display */}
            <div className="pt-1 border-t border-gray-200">
              <div className="text-[10px] font-semibold text-purple-900 print:text-[9px]">Payment Mode</div>
              <div className="text-[10px] text-gray-800 leading-none print:text-[9px]">
                {invoice.paymentMode === 'cash' && 'Cash'}
                {invoice.paymentMode === 'cheque' && (
                  <div>
                    <span className="font-medium">Cheque</span>
                    {invoice.chequeNumber && <span> (#{invoice.chequeNumber})</span>}
                  </div>
                )}
                {invoice.paymentMode === 'online' && (
                  <div>
                    <span className="font-medium">Online - </span>
                    <span>{invoice.onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Payment Summary */}
          <div className="space-y-1">
            {invoice.previousBalance && invoice.previousBalance > 0 && (
              <div className="flex justify-between items-center border-b border-gray-200 py-0.5">
                <span className="text-gray-700 font-medium text-[10px] print:text-[9px]">Previous Balance</span>
                <span className="font-semibold text-orange-600 text-[10px] print:text-[9px]">₹ {invoice.previousBalance.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-gray-200 py-0.5">
              <span className="text-gray-700 font-medium text-[10px] print:text-[9px]">Current Invoice</span>
              <span className="font-bold text-gray-900 text-[11px] print:text-[10px]">₹ {invoice.total.toFixed(0)}</span>
            </div>
            {invoice.paidAmount && invoice.paidAmount > 0 && (
              <div className="flex justify-between items-center border-b border-gray-200 py-0.5">
                <span className="text-gray-700 font-medium text-[10px] print:text-[9px]">Paid</span>
                <span className="font-semibold text-green-600 text-[10px] print:text-[9px]">- ₹ {invoice.paidAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-purple-300 pt-1">
              <span className="text-purple-900 font-bold text-[11px] print:text-[10px]">
                {invoice.status === 'paid' ? 'Total Paid' : 'Pending Balance'}
              </span>
              <span className={`font-bold text-[12px] print:text-[11px] ${invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                ₹ {((invoice.previousBalance || 0) + invoice.total - (invoice.paidAmount || 0)).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div >

      {/* Footer with Signature - Minimal */}
      < div className="bg-purple-100 border-t border-purple-200 p-1 text-center print:p-0.5" >
        <div className="bg-purple-200 rounded p-0.5 inline-block">
          <div className="text-[10px] font-bold text-purple-900 print:text-[9px]">
            {companyDetails.tagline}
          </div>
          <div className="text-[10px] font-medium text-purple-800 print:text-[9px]">
            {companyDetails.signature_name || "પ્રજાપતિ મહેશ"}
          </div>
        </div>
        <div className="text-[9px] text-purple-700 print:text-[8px]">
          Authorised Signature for {companyDetails.name}
        </div>
      </div >

      {/* Notes Section - Minimal */}
      {
        invoice.notes && (
          <div className="bg-gray-50 border-t border-gray-200 p-0.5 print:p-0">
            <div className="text-[9px] text-gray-700 print:text-[8px]">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          </div>
        )
      }

    </div >
  );
};

export default BillOfSupply;