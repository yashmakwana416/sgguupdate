-- Add payment mode fields to sales_invoices table
ALTER TABLE sales_invoices 
ADD COLUMN payment_mode text,
ADD COLUMN cheque_number text,
ADD COLUMN online_payment_method text;

-- Add comment for documentation
COMMENT ON COLUMN sales_invoices.payment_mode IS 'Payment mode: cash, cheque, or online';
COMMENT ON COLUMN sales_invoices.cheque_number IS 'Cheque number when payment_mode is cheque';
COMMENT ON COLUMN sales_invoices.online_payment_method IS 'Online payment method: upi or bank_transfer';