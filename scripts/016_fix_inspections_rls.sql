-- 1. Remover policies antigas de inspections
DROP POLICY IF EXISTS "inspections_select_own_franchise" ON public.inspections;
DROP POLICY IF EXISTS "inspections_insert_authenticated" ON public.inspections;
DROP POLICY IF EXISTS "inspections_update_own" ON public.inspections;
DROP POLICY IF EXISTS "inspections_delete_own" ON public.inspections;
DROP POLICY IF EXISTS "Only admins can insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Only admins can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "All authenticated users can view inspections" ON public.inspections;

-- 2. Criar policies permissivas para inspections (qualquer autenticado pode ver e criar)
CREATE POLICY "allow_all_inspections_authenticated" ON public.inspections
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Remover policies antigas de checklist_items
DROP POLICY IF EXISTS "checklist_items_select_via_inspection" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert_own_inspection" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_update_own_inspection" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete_own_inspection" ON public.checklist_items;

-- 4. Criar policies permissivas para checklist_items
CREATE POLICY "allow_all_checklist_items_authenticated" ON public.checklist_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
