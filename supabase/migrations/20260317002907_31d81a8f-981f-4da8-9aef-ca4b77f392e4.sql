
-- Create a function to decrement stock safely (security definer so students can call it)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_item_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock_quantity INTO current_stock FROM menu_items WHERE id = p_item_id FOR UPDATE;
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Menu item not found';
  END IF;
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for %', (SELECT name FROM menu_items WHERE id = p_item_id);
  END IF;
  UPDATE menu_items
  SET stock_quantity = stock_quantity - p_quantity,
      available = (stock_quantity - p_quantity) > 0
  WHERE id = p_item_id;
END;
$$;
