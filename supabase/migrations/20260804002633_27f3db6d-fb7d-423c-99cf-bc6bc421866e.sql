CREATE POLICY "Only admins can insert roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE TO public
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;