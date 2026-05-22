-- Storage policies for fotos and contratos buckets
-- Create buckets in Supabase Dashboard: fotos (private), contratos (private)

CREATE POLICY "fotos_upload_promotor"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fotos'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_promotor_ativo()
);

CREATE POLICY "fotos_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fotos'
  AND (
    public.is_admin()
    OR public.is_promotor_ativo()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'industria')
  )
);

CREATE POLICY "contratos_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contratos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "contratos_read_own_or_admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contratos'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "admin_storage_all"
ON storage.objects FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
