-- ============================================================
-- NBA LOKOJA - FRESH START CLEANUP SCRIPT
-- Purpose:
-- 1) Remove operational/admin records for a clean go-live state
-- 2) Remove hardcoded/legacy admin assignments from member rows
-- 3) Keep schema, functions and triggers intact
--
-- Run this in Supabase SQL Editor when you are ready.
-- ============================================================

BEGIN;

-- Clear dependent records first
DELETE FROM public.event_registrations;
DELETE FROM public.cle_enrollments;
DELETE FROM public.messages;
DELETE FROM public.support_tickets;
DELETE FROM public.payments;
DELETE FROM public.notices;
DELETE FROM public.news;
DELETE FROM public.publications;
DELETE FROM public.events;
DELETE FROM public.cle_courses;
DELETE FROM public.inquiries;
DELETE FROM public.audit_logs;
DELETE FROM public.admin_notifications;

-- Reset all roles back to member so admin access starts clean.
-- Keep member records so users can still sign in after reset.
ALTER TABLE public.members DISABLE TRIGGER enforce_member_role_change_trigger;

UPDATE public.members
SET
  role = 'member',
  status = CASE
    WHEN status = 'active'::member_status THEN 'active'::member_status
    ELSE 'pending'::member_status
  END,
  approved_by = NULL,
  approved_at = NULL,
  updated_at = NOW();

ALTER TABLE public.members ENABLE TRIGGER enforce_member_role_change_trigger;

-- Optional hard reset for all member profiles (linked to auth users)
-- DELETE FROM public.members;

-- Optional: remove test/auth users too (uncomment if you want full reset)
-- DELETE FROM auth.users;

COMMIT;
