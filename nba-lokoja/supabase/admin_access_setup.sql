-- ============================================================
-- NBA LOKOJA - DEFAULT ADMIN ACCESS SETUP
-- Purpose: Promote one or more already-registered users to
-- admin roles so they can log into /admin/login.html securely.
--
-- IMPORTANT:
-- 1) Users must register first (so they exist in auth.users + public.members).
-- 2) Replace placeholder emails below with real emails.
-- 3) Run in Supabase SQL Editor as project owner/admin.
--
-- DEFAULT ADMIN LOGIN BOOTSTRAP (recommended):
-- Username: admin@nbalokoja.org
-- Password: set a strong password in Supabase Auth user creation flow.
-- (Do not hardcode passwords in SQL files.)
-- ============================================================

BEGIN;

-- Primary super admin
UPDATE public.members
SET role = 'super_admin',
    status = 'active',
    approved_at = NOW()
WHERE lower(email) = lower('admin@nbalokoja.org');

-- Optional additional admins (uncomment and edit as needed)
-- UPDATE public.members
-- SET role = 'admin',
--     status = 'active',
--     approved_at = NOW()
-- WHERE lower(email) = lower('secretariat@nbalokoja.org');

-- UPDATE public.members
-- SET role = 'editor',
--     status = 'active',
--     approved_at = NOW()
-- WHERE lower(email) = lower('communications@nbalokoja.org');

COMMIT;

-- Verification query
-- SELECT id, full_name, email, role, status
-- FROM public.members
-- WHERE role IN ('super_admin', 'admin', 'editor', 'secretary', 'treasurer')
-- ORDER BY created_at DESC;
