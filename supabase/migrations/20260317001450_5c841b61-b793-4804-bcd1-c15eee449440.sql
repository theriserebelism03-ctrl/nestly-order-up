-- Allow chefs to insert nests
CREATE POLICY "Chefs can insert nests"
ON public.nests
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'chef'::app_role));

-- Allow chefs to delete nests
CREATE POLICY "Chefs can delete nests"
ON public.nests
FOR DELETE
TO public
USING (has_role(auth.uid(), 'chef'::app_role));