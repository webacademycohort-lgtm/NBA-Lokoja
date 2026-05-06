-- NBA Lokoja - Manual Bank Transfer Approval Workflow
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- =========================================================
-- 1) Payment status support
-- =========================================================
do $$ begin
  alter type payment_status add value if not exists 'pending_review';
exception when others then null; end $$;
do $$ begin
  alter type payment_status add value if not exists 'approved';
exception when others then null; end $$;
do $$ begin
  alter type payment_status add value if not exists 'paid';
exception when others then null; end $$;
do $$ begin
  alter type payment_status add value if not exists 'rejected';
exception when others then null; end $$;

-- =========================================================
-- 2) Payments table upgrade
-- =========================================================
alter table public.payments
  add column if not exists member_id uuid references public.members(id) on delete cascade,
  add column if not exists payment_method text,
  add column if not exists payment_period text,
  add column if not exists payment_reference text,
  add column if not exists receipt_number text,
  add column if not exists proof_url text,
  add column if not exists proof_file_path text,
  add column if not exists rejection_reason text,
  add column if not exists approved_by uuid references public.members(id),
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists payment_channel text;

update public.payments
set member_id = user_id
where member_id is null and user_id is not null;

update public.payments
set payment_reference = reference
where payment_reference is null and reference is not null;

update public.payments
set payment_method = coalesce(payment_method, method, 'paystack')
where payment_method is null;

update public.payments
set payment_channel = coalesce(payment_channel, method, payment_method, 'paystack')
where payment_channel is null;

create unique index if not exists idx_payments_payment_reference_unique on public.payments(payment_reference) where payment_reference is not null;
create unique index if not exists idx_payments_receipt_number_unique on public.payments(receipt_number) where receipt_number is not null;
create index if not exists idx_payments_member_id on public.payments(member_id);
create index if not exists idx_payments_status_created_at on public.payments(status, created_at desc);

-- Keep both legacy and new columns in sync
create or replace function public.sync_payment_legacy_columns()
returns trigger
language plpgsql
as $$
begin
  if new.member_id is null then new.member_id := new.user_id; end if;
  if new.user_id is null then new.user_id := new.member_id; end if;
  if new.payment_reference is null then new.payment_reference := new.reference; end if;
  if new.reference is null then new.reference := new.payment_reference; end if;
  if new.payment_method is null then new.payment_method := coalesce(new.method, 'paystack'); end if;
  if new.method is null then new.method := new.payment_method; end if;
  if new.payment_channel is null then new.payment_channel := coalesce(new.payment_method, new.method, 'paystack'); end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sync_payment_legacy_columns_trigger on public.payments;
create trigger sync_payment_legacy_columns_trigger
before insert or update on public.payments
for each row execute function public.sync_payment_legacy_columns();

-- =========================================================
-- 3) Payment approvals audit table
-- =========================================================
create table if not exists public.payment_approvals (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('approved', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_approvals_payment_id on public.payment_approvals(payment_id, created_at desc);

-- =========================================================
-- 4) Admin helper function
-- =========================================================
create or replace function public.is_payment_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = uid and m.role in ('admin', 'super_admin', 'treasurer')
  );
$$;

grant execute on function public.is_payment_admin(uuid) to authenticated;

-- =========================================================
-- 5) Receipt number generator
-- =========================================================
create or replace function public.generate_receipt_number()
returns text
language plpgsql
as $$
declare
  yr text := to_char(now(), 'YYYY');
  rnd text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  return 'NBA-LOC-' || yr || '-' || rnd;
end;
$$;

grant execute on function public.generate_receipt_number() to authenticated;

-- =========================================================
-- 6) Storage bucket for payment proofs
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "payment_proofs_member_read_own" on storage.objects;
create policy "payment_proofs_member_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_payment_admin(auth.uid())
  )
);

drop policy if exists "payment_proofs_member_insert_own" on storage.objects;
create policy "payment_proofs_member_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "payment_proofs_member_update_own_or_admin" on storage.objects;
create policy "payment_proofs_member_update_own_or_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_payment_admin(auth.uid())
  )
)
with check (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_payment_admin(auth.uid())
  )
);

drop policy if exists "payment_proofs_admin_delete" on storage.objects;
create policy "payment_proofs_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.is_payment_admin(auth.uid())
);

-- =========================================================
-- 7) RLS policies for manual approval flow
-- =========================================================
alter table public.payment_approvals enable row level security;

drop policy if exists "member_select_own_payments" on public.payments;
create policy "member_select_own_payments"
on public.payments
for select
to authenticated
using (auth.uid() = member_id or public.is_payment_admin(auth.uid()));

drop policy if exists "member_insert_own_payments" on public.payments;
create policy "member_insert_own_payments"
on public.payments
for insert
to authenticated
with check (auth.uid() = member_id);

drop policy if exists "member_update_proof_pending_or_rejected" on public.payments;
create policy "member_update_proof_pending_or_rejected"
on public.payments
for update
to authenticated
using (auth.uid() = member_id and status in ('pending', 'pending_review', 'rejected'))
with check (
  auth.uid() = member_id
  and status in ('pending', 'pending_review', 'rejected')
  and approved_by is null
  and approved_at is null
);

drop policy if exists "payment_admin_manage_all" on public.payments;
create policy "payment_admin_manage_all"
on public.payments
for all
to authenticated
using (public.is_payment_admin(auth.uid()))
with check (public.is_payment_admin(auth.uid()));

drop policy if exists "payment_approvals_admin_only" on public.payment_approvals;
create policy "payment_approvals_admin_only"
on public.payment_approvals
for all
to authenticated
using (public.is_payment_admin(auth.uid()))
with check (public.is_payment_admin(auth.uid()));

-- =========================================================
-- 8) Approval RPC (prevents self-approval and centralizes logic)
-- =========================================================
create or replace function public.review_payment(
  p_payment_id uuid,
  p_action text,
  p_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments;
  v_new_status payment_status;
begin
  if v_actor is null or not public.is_payment_admin(v_actor) then
    raise exception 'Not authorized to review payments.';
  end if;
  if p_action not in ('approved', 'rejected') then
    raise exception 'Invalid action.';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found.';
  end if;
  if v_payment.member_id = v_actor then
    raise exception 'You cannot approve your own payment.';
  end if;

  if p_action = 'approved' then
    v_new_status := 'paid';
    update public.payments
      set status = v_new_status,
          rejection_reason = null,
          approved_by = v_actor,
          approved_at = now(),
          receipt_number = coalesce(receipt_number, public.generate_receipt_number())
    where id = p_payment_id;
  else
    v_new_status := 'rejected';
    update public.payments
      set status = v_new_status,
          rejection_reason = coalesce(nullif(trim(p_note), ''), 'Payment proof could not be verified.'),
          approved_by = null,
          approved_at = null
    where id = p_payment_id;
  end if;

  insert into public.payment_approvals(payment_id, admin_id, action, note)
  values (p_payment_id, v_actor, p_action, p_note);

  return (select p from public.payments p where p.id = p_payment_id);
end;
$$;

grant execute on function public.review_payment(uuid, text, text) to authenticated;

