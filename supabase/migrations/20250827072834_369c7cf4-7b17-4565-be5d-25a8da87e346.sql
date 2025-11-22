-- First, let's check and fix the stock management function for sales
DROP TRIGGER IF EXISTS update_product_stock_on_sale_trigger ON public.sales_invoice_items;

CREATE OR REPLACE FUNCTION public.update_product_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reduce product stock when sale item is added
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - NEW.quantity,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    -- Create inventory transaction record (only if user has permission)
    IF is_admin_or_superadmin() OR is_distributor() THEN
      INSERT INTO public.inventory_transactions (
        product_id,
        product_name,
        type,
        quantity,
        reason,
        reference,
        reference_id
      ) VALUES (
        NEW.product_id,
        NEW.product_name,
        'out',
        NEW.quantity,
        'Sale',
        (SELECT invoice_number FROM public.sales_invoices WHERE id = NEW.invoice_id),
        NEW.invoice_id
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity difference
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + OLD.quantity - NEW.quantity,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Add back stock when sale item is deleted
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + OLD.quantity,
      updated_at = now()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_product_stock_on_sale_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

-- Fix the returns function as well
DROP TRIGGER IF EXISTS update_product_stock_on_return_trigger ON public.returns;

CREATE OR REPLACE FUNCTION public.update_product_stock_on_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase product stock when return is processed
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity + NEW.quantity_returned,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    -- Create inventory transaction record (only if user has permission)
    IF is_admin_or_superadmin() OR is_distributor() THEN
      INSERT INTO public.inventory_transactions (
        product_id,
        product_name,
        type,
        quantity,
        reason,
        reference,
        reference_id
      ) VALUES (
        NEW.product_id,
        NEW.product_name,
        'in',
        NEW.quantity_returned,
        'Return',
        NEW.return_number,
        NEW.id
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity difference
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - OLD.quantity_returned + NEW.quantity_returned,
      updated_at = now()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Reduce stock when return is deleted
    UPDATE public.products 
    SET 
      stock_quantity = stock_quantity - OLD.quantity_returned,
      updated_at = now()
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Recreate the returns trigger
CREATE TRIGGER update_product_stock_on_return_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_return();