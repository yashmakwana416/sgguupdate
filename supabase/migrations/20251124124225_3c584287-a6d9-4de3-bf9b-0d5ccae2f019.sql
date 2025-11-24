-- Stop deducting raw materials when invoice items are created/updated/deleted
DROP TRIGGER IF EXISTS trigger_deduct_raw_materials ON public.sales_invoice_items;