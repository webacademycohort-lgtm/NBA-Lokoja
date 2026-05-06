-- ============================================================
-- NBA LOKOJA BRANCH — SUPABASE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor to provision
-- the complete database structure for the platform.
-- ============================================================

-- =============== EXTENSIONS ===============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============== ENUMS ===============
DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('pending', 'active', 'suspended', 'expired', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_tier AS ENUM ('junior', 'senior', 'san');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'editor', 'treasurer', 'welfare', 'secretary', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============== MEMBERS ===============
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  title TEXT,
  rank TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  scn_number TEXT UNIQUE,
  gender TEXT,
  year_called INT,
  organization_name TEXT,
  chambers TEXT,
  address TEXT,
  practice_areas TEXT[],
  tier member_tier DEFAULT 'junior',
  role user_role DEFAULT 'member',
  status member_status DEFAULT 'pending',
  photo_url TEXT,
  date_of_birth DATE,
  membership_year INT,
  dues_paid BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES public.members(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS rank TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS membership_number TEXT;

CREATE SEQUENCE IF NOT EXISTS public.membership_number_seq START 1000;

-- =============== EVENTS ===============
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  capacity INT,
  cle_hours INT DEFAULT 0,
  registration_fee NUMERIC(10,2) DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  cover_image_url TEXT,
  created_by UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== EVENT REGISTRATIONS ===============
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =============== PAYMENTS ===============
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  description TEXT,
  payment_type TEXT,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT,
  payment_year INT,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- =============== NEWS / ANNOUNCEMENTS ===============
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  body TEXT,
  category TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== NOTICES (member-targeted) ===============
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT DEFAULT 'normal',
  target_audience TEXT DEFAULT 'all',
  created_by UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== PUBLICATIONS / DOCUMENTS METADATA ===============
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  storage_path TEXT,
  size_bytes BIGINT,
  members_only BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== CLE COURSES ===============
CREATE TABLE IF NOT EXISTS public.cle_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  format TEXT,
  course_date DATE,
  cle_hours INT,
  capacity INT,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cle_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.cle_courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  earned_hours INT DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- =============== INQUIRIES (Contact Form) ===============
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== MESSAGES (member-to-member / from secretariat) ===============
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.members(id),
  recipient_id UUID REFERENCES public.members(id),
  subject TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== SUPPORT TICKETS ===============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.members(id),
  category TEXT,
  priority TEXT DEFAULT 'normal',
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- =============== TICKET RESPONSES ===============
CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES public.members(id),
  response TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== AUDIT LOG ===============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.members(id),
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============== NEWSLETTER SUBSCRIBERS ===============
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  related_user_id UUID REFERENCES public.members(id),
  related_payment_id UUID REFERENCES public.payments(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cle_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cle_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE id = uid AND role IN ('admin', 'super_admin', 'secretary', 'treasurer', 'editor')
  );
$$;

-- Resolve login identifier (email or SCN number) to account email
CREATE OR REPLACE FUNCTION public.resolve_login_email(login_identifier TEXT)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT m.email
  FROM public.members m
  WHERE lower(m.email) = lower(login_identifier)
     OR lower(m.scn_number) = lower(login_identifier)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(TEXT) TO anon, authenticated;

-- Public directory search for active lawyers
CREATE OR REPLACE FUNCTION public.search_lawyers(
  search_text TEXT DEFAULT NULL,
  practice_area TEXT DEFAULT NULL,
  max_results INT DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  title TEXT,
  rank TEXT,
  scn_number TEXT,
  phone TEXT,
  email TEXT,
  organization_name TEXT,
  practice_areas TEXT[],
  year_called INT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    m.id,
    m.full_name,
    m.title,
    m.rank,
    m.scn_number,
    m.phone,
    m.email,
    m.organization_name,
    m.practice_areas,
    m.year_called
  FROM public.members m
  WHERE m.status IN ('active', 'pending')
    AND (
      search_text IS NULL OR btrim(search_text) = '' OR
      m.full_name ILIKE '%' || btrim(search_text) || '%' OR
      m.scn_number ILIKE '%' || btrim(search_text) || '%' OR
      m.organization_name ILIKE '%' || btrim(search_text) || '%'
    )
    AND (
      practice_area IS NULL OR btrim(practice_area) = '' OR
      EXISTS (
        SELECT 1
        FROM unnest(COALESCE(m.practice_areas, ARRAY[]::TEXT[])) pa
        WHERE lower(pa) = lower(btrim(practice_area))
      )
    )
  ORDER BY m.full_name ASC
  LIMIT GREATEST(1, LEAST(COALESCE(max_results, 60), 200));
$$;

GRANT EXECUTE ON FUNCTION public.search_lawyers(TEXT, TEXT, INT) TO anon, authenticated;

-- Members policies
DROP POLICY IF EXISTS "Members can view all active members" ON public.members;
DROP POLICY IF EXISTS "Members can update own record" ON public.members;
DROP POLICY IF EXISTS "Admins can do anything on members" ON public.members;

CREATE POLICY "Members can view all active members"
  ON public.members FOR SELECT
  USING (auth.uid() = id OR status IN ('active', 'pending'));

CREATE POLICY "Members can update own record"
  ON public.members FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can do anything on members"
  ON public.members FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Members can view notices" ON public.notices;
DROP POLICY IF EXISTS "Admins manage notices" ON public.notices;

CREATE POLICY "Members can view notices"
  ON public.notices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage notices"
  ON public.notices FOR ALL
  USING (public.is_admin(auth.uid()));

-- Events policies
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;

CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Admins manage events"
  ON public.events FOR ALL
  USING (public.is_admin(auth.uid()));

-- Event registrations
DROP POLICY IF EXISTS "Members can register and view own" ON public.event_registrations;

CREATE POLICY "Members can register and view own"
  ON public.event_registrations FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Payments policies
DROP POLICY IF EXISTS "Members view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;

CREATE POLICY "Members view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL
  USING (public.is_admin(auth.uid()));

-- News policies (public read)
DROP POLICY IF EXISTS "Anyone can view published news" ON public.news;
DROP POLICY IF EXISTS "Editors manage news" ON public.news;

CREATE POLICY "Anyone can view published news"
  ON public.news FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Editors manage news"
  ON public.news FOR ALL
  USING (public.is_admin(auth.uid()));

-- Publications: members can read members-only, all can read public
DROP POLICY IF EXISTS "View publications based on access" ON public.publications;
DROP POLICY IF EXISTS "Admins manage publications" ON public.publications;

CREATE POLICY "View publications based on access"
  ON public.publications FOR SELECT
  USING (members_only = FALSE OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage publications"
  ON public.publications FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view open CLE courses" ON public.cle_courses;
DROP POLICY IF EXISTS "Admins manage CLE courses" ON public.cle_courses;
DROP POLICY IF EXISTS "Users manage own CLE enrollments" ON public.cle_enrollments;

CREATE POLICY "Users can view open CLE courses"
  ON public.cle_courses FOR SELECT
  USING (is_open = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage CLE courses"
  ON public.cle_courses FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users manage own CLE enrollments"
  ON public.cle_enrollments FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;

CREATE POLICY "Users see own messages"
  ON public.messages FOR ALL
  USING (auth.uid() IN (sender_id, recipient_id) OR public.is_admin(auth.uid()));

-- Support tickets
DROP POLICY IF EXISTS "Users manage own tickets" ON public.support_tickets;

CREATE POLICY "Users manage own tickets"
  ON public.support_tickets FOR ALL
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Ticket responses
DROP POLICY IF EXISTS "Users and admins access ticket responses" ON public.ticket_responses;

CREATE POLICY "Users and admins access ticket responses"
  ON public.ticket_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_responses.ticket_id
      AND (st.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users create inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;

CREATE POLICY "Users create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins manage inquiries"
  ON public.inquiries FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins read notifications" ON public.admin_notifications;

CREATE POLICY "Admins read notifications"
  ON public.admin_notifications FOR ALL
  USING (public.is_admin(auth.uid()));

-- Audit logs (admin only)
DROP POLICY IF EXISTS "Only admins read audit logs" ON public.audit_logs;

CREATE POLICY "Only admins read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_updated_at ON public.members;
CREATE TRIGGER members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS news_updated_at ON public.news;
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create member record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (
    id, membership_number, full_name, first_name, middle_name, last_name, title, rank, email, phone,
    scn_number, gender, year_called, organization_name, address, status
  )
  VALUES (
    NEW.id,
    'NBALOK-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.membership_number_seq')::TEXT, 6, '0'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'title',
    NEW.raw_user_meta_data->>'rank',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'scn_number',
    NEW.raw_user_meta_data->>'gender',
    NULLIF(NEW.raw_user_meta_data->>'year_called', '')::INT,
    NEW.raw_user_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'address',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_new_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications(type, title, body, related_user_id)
  VALUES (
    'registration',
    'New User Registration',
    COALESCE(NEW.full_name, NEW.email) || ' has registered and is pending review.',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.admin_notifications(type, title, body, related_user_id, related_payment_id)
    VALUES (
      'payment',
      'Payment Completed',
      'A payment of ' || COALESCE(NEW.amount::TEXT, '0') || ' was confirmed.',
      NEW.user_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent privilege escalation through direct profile updates
CREATE OR REPLACE FUNCTION public.enforce_member_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can change member roles.';
    END IF;
    IF NEW.role = 'super_admin' AND (
      auth.uid() IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role = 'super_admin'
      )
    ) THEN
      RAISE EXCEPTION 'Only super admins can assign super_admin role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restrict sensitive profile fields from self-service updates
CREATE OR REPLACE FUNCTION public.enforce_sensitive_member_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    IF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.rank IS DISTINCT FROM OLD.rank
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.membership_number IS DISTINCT FROM OLD.membership_number
      OR NEW.scn_number IS DISTINCT FROM OLD.scn_number
      OR NEW.year_called IS DISTINCT FROM OLD.year_called THEN
      RAISE EXCEPTION 'Sensitive fields can only be changed by administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_member_registered_notify ON public.members;
CREATE TRIGGER on_member_registered_notify
  AFTER INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_registration();

DROP TRIGGER IF EXISTS on_payment_completed_notify ON public.payments;
CREATE TRIGGER on_payment_completed_notify
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_completed();

DROP TRIGGER IF EXISTS enforce_member_role_change_trigger ON public.members;
CREATE TRIGGER enforce_member_role_change_trigger
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_member_role_change();

DROP TRIGGER IF EXISTS enforce_sensitive_member_updates_trigger ON public.members;
CREATE TRIGGER enforce_sensitive_member_updates_trigger
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_sensitive_member_updates();

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase Storage UI)
-- ============================================================
-- 1. documents (private) — for member-only files
-- 2. publications (public) — for public PDFs/newsletters
-- 3. avatars (public) — for member profile photos
-- 4. event-covers (public) — for event banners

-- Optional SQL setup for avatars bucket (recommended to fix "Bucket not found")
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar images" ON storage.objects;
CREATE POLICY "Users can upload own avatar images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE ('passports/' || auth.uid()::text || '/%')
);

DROP POLICY IF EXISTS "Users can update own avatar images" ON storage.objects;
CREATE POLICY "Users can update own avatar images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE ('passports/' || auth.uid()::text || '/%')
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_role ON public.members(role);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);

-- ============================================================
-- DONE
-- ============================================================
