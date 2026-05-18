DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = current_user
      AND rolbypassrls
  ) THEN
    RAISE NOTICE 'Current role (%) has BYPASSRLS enabled. Configure runtime role manually with a superuser to enforce RLS strictly.', current_user;
  ELSE
    RAISE NOTICE 'Current role (%) does not bypass RLS.', current_user;
  END IF;
END
$$;
