-- Drop the broad superadmin policies
DROP POLICY IF EXISTS "superadmin_read_all_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "superadmin_read_all_invoice_items" ON public.sales_invoice_items;

-- Create a security definer function to get distributor invoices (only for superadmin)
CREATE OR REPLACE FUNCTION public.get_distributor_invoices(distributor_user_id uuid)
RETURNS TABLE (
  id uuid,
  invoice_number text,
  customer_name text,
  customer_id uuid,
  date date,
  due_date date,
  subtotal numeric,
  tax_amount numeric,
  total numeric,
  discount numeric,
  other_charges numeric,
  status text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow superadmins to call this function
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can view distributor invoices';
  END IF;
  
  -- Return all invoices created by the specified distributor
  RETURN QUERY
  SELECT 
    si.id,
    si.invoice_number,
    si.customer_name,
    si.customer_id,
    si.date,
    si.due_date,
    si.subtotal,
    si.tax_amount,
    si.total,
    si.discount,
    si.other_charges,
    si.status,
    si.notes,
    si.created_by,
    si.created_at,
    si.updated_at
  FROM public.sales_invoices si
  WHERE si.created_by = distributor_user_id;
END;
$$;

-- Create a security definer function to get distributor invoice items
CREATE OR REPLACE FUNCTION public.get_distributor_invoice_items(p_invoice_id uuid)
RETURNS TABLE (
  id uuid,
  invoice_id uuid,
  product_id uuid,
  product_name text,
  quantity numeric,
  price numeric,
  mrp numeric,
  tax_rate numeric,
  amount numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow superadmins to call this function
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can view distributor invoice items';
  END IF;
  
  -- Return all items for the specified invoice
  RETURN QUERY
  SELECT 
    sii.id,
    sii.invoice_id,
    sii.product_id,
    sii.product_name,
    sii.quantity,
    sii.price,
    sii.mrp,
    sii.tax_rate,
    sii.amount,
    sii.created_at
  FROM public.sales_invoice_items sii
  WHERE sii.invoice_id = p_invoice_id;
END;
$$;