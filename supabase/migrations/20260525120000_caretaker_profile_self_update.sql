-- ============================================================================
-- Caretaker profile self-update (employees sync)
-- Allows active caretakers to update their own contact fields on employees.
-- profiles_update_self already permits profile row updates for auth.uid().
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employees'
      AND policyname = 'employees_update_self_caretaker'
  ) THEN
    CREATE POLICY employees_update_self_caretaker ON public.employees
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
        AND role_id = 'CARETAKER'
        AND status = 'ACTIVE'
      )
      WITH CHECK (
        user_id = auth.uid()
        AND role_id = 'CARETAKER'
        AND status = 'ACTIVE'
      );
  END IF;
END $$;
