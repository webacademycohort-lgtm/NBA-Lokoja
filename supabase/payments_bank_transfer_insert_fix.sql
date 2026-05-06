-- Fix "Unable to create payment record" for bank transfer workflow
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Ensure status enum supports bank-transfer review flow
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

-- Ensure payments table has all required columns
alter table public.payments
  add column if not exists member_id uuid references public.members(id) on delete cascade,
  add column if not exists payment_type text default 'branch_due',
  add column if not exists payment_method text not null default 'bank_transfer',
  add column if not exists payment_status text not null default 'pending_review',
  add column if not exists payment_period text,
  add column if not exists payment_reference text,
  add column if not exists receipt_number text,
  add column if not exists proof_url text,
  add column if not exists proof_file_path text,
  add column if not exists rejection_reason text,
  add column if not exists approved_by uuid references public.members(id),
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Backfill compatibility data for existing rows
update public.payments set member_id = user_id where member_id is null and user_id is not null;
update public.payments set payment_reference = reference where payment_reference is null and reference is not null;
update public.payments set payment_status = status::text where payment_status is null and status is not null;

-- Constraints / indexes
do $$ begin
  alter table public.payments
    add constraint payments_payment_method_check check (payment_method in ('paystack', 'bank_transfer', 'cash'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.payments
    add constraint payments_payment_status_check check (payment_status in ('pending', 'pending_review', 'approved', 'paid', 'rejected', 'failed', 'confirmed', 'refunded'));
exception when duplicate_object then null; end $$;

create unique index if not exists idx_payments_payment_reference_unique on public.payments(payment_reference) where payment_reference is not null;
create unique index if not exists idx_payments_receipt_number_unique on public.payments(receipt_number) where receipt_number is not null;

-- Keep legacy column values in sync
create or replace function public.sync_payment_status_columns()
returns trigger
language plpgsql
as $$
begin
  if new.member_id is null then new.member_id := new.user_id; end if;
  if new.user_id is null then new.user_id := new.member_id; end if;
  if new.payment_reference is null then new.payment_reference := new.reference; end if;
  if new.reference is null then new.reference := new.payment_reference; end if;
  if new.payment_method is null then new.payment_method := coalesce(new.method, 'bank_transfer'); end if;
  if new.method is null then new.method := new.payment_method; end if;
  if new.payment_status is null then new.payment_status := coalesce(new.status::text, 'pending_review'); end if;
  if new.status is null then new.status := new.payment_status::payment_status; end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sync_payment_status_columns_trigger on public.payments;
create trigger sync_payment_status_columns_trigger
before insert or update on public.payments
for each row execute function public.sync_payment_status_columns();

-- RLS
alter table public.payments enable row level security;

drop policy if exists "Members can create own payments" on public.payments;
create policy "Members can create own payments"
on public.payments
for insert
to authenticated
with check (member_id = auth.uid());

drop policy if exists "Members can view own payments" on public.payments;
create policy "Members can view own payments"
on public.payments
for select
to authenticated
using (member_id = auth.uid());

drop policy if exists "Members can update own pending payment proof" on public.payments;
create policy "Members can update own pending payment proof"
on public.payments
for update
to authenticated
using (
  member_id = auth.uid()
  and payment_status in ('pending_review', 'rejected', 'pending')
)
with check (
  member_id = auth.uid()
  and payment_status in ('pending_review', 'rejected', 'pending')
);

