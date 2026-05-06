-- Blog posts table + RLS for public homepage display
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  featured_image_url text,
  category text,
  author_name text default 'NBA Lokoja Branch',
  status text default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;

create index if not exists idx_blog_posts_status_published_at on public.blog_posts(status, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);

drop policy if exists "Anyone can read published blog posts" on public.blog_posts;
create policy "Anyone can read published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts
for all
to authenticated
using (
  exists (
    select 1 from public.members
    where members.id = auth.uid()
    and members.role in ('admin', 'treasurer', 'super_admin')
  )
)
with check (
  exists (
    select 1 from public.members
    where members.id = auth.uid()
    and members.role in ('admin', 'treasurer', 'super_admin')
  )
);

create or replace function public.blog_posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.blog_posts_set_updated_at();

