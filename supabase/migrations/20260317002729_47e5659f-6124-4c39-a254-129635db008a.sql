
-- Add stock_quantity column to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 100;

-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow anyone authenticated to view food images
CREATE POLICY "Anyone can view food images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'food-images');

-- Allow admins to upload food images
CREATE POLICY "Admins can upload food images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to delete food images
CREATE POLICY "Admins can delete food images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to update food images
CREATE POLICY "Admins can update food images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'food-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Enable realtime for menu_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
