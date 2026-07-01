/* ============================================================
   DUKASAFE MVP SUPABASE SCHEMA
   Verified checkout + buyer/seller protection for social commerce
   Run in Supabase SQL Editor.
   ============================================================ */

begin;

/* -----------------------------
   Extensions
----------------------------- */
create extension if not exists pgcrypto;
create extension if not exists citext;

/* -----------------------------
   Enums
----------------------------- */
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('buyer', 'seller', 'admin', 'operations');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum ('draft', 'submitted', 'pending_review', 'needs_more_info', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'seller_status') then
    create type public.seller_status as enum ('pending', 'active', 'suspended', 'banned', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'seller_badge') then
    create type public.seller_badge as enum ('none', 'under_review', 'verified', 'trusted', 'elite');
  end if;

  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('draft', 'active', 'paused', 'sold_out', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'payment_uploaded', 'paid', 'dispatched', 'delivered', 'closed', 'disputed', 'refunded', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'proof_uploaded', 'verified', 'failed', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('mpesa_manual', 'mpesa_stk_push', 'card', 'bank_transfer', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'dispute_type') then
    create type public.dispute_type as enum ('item_not_received', 'wrong_item', 'counterfeit_or_fake', 'damaged_item', 'seller_disappeared', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'dispute_status') then
    create type public.dispute_status as enum ('open', 'awaiting_seller_response', 'awaiting_buyer_response', 'under_admin_review', 'resolved', 'dismissed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'dispute_resolution') then
    create type public.dispute_resolution as enum ('none', 'refund', 'partial_refund', 'dismissed', 'more_evidence_needed');
  end if;

  if not exists (select 1 from pg_type where typname = 'evidence_type') then
    create type public.evidence_type as enum ('id_document', 'shop_photo', 'social_screenshot', 'payment_screenshot', 'delivery_photo', 'delivery_receipt', 'chat_screenshot', 'video', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_review_status') then
    create type public.document_review_status as enum ('pending', 'approved', 'rejected', 'needs_more_info');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_action_type') then
    create type public.admin_action_type as enum ('approve_seller', 'reject_seller', 'request_more_info', 'suspend_seller', 'ban_seller', 'adjust_trust_score', 'verify_payment', 'resolve_dispute', 'refund_order', 'export_logs', 'other');
  end if;
end $$;

/* -----------------------------
   Utility functions
----------------------------- */
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

/* -----------------------------
   Profiles linked to auth.users
----------------------------- */
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'buyer',
  full_name text,
  email citext,
  phone text unique,
  avatar_url text,
  default_location text,
  preferred_language text not null default 'en',
  is_active boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_format_check check (phone is null or phone ~ '^\+?[0-9]{7,15}$')
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_phone_idx on public.profiles(phone);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

/* -----------------------------
   Security helper functions
----------------------------- */
create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select role from public.profiles where id = (select auth.uid())), 'buyer'::public.app_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'operations')
      and is_active = true
  );
$$;

/* -----------------------------
   Sellers
----------------------------- */
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  shop_name text not null,
  slug text not null unique,
  category text not null default 'Fashion',
  description text,
  location_city text,
  location_area text,
  ships_nationwide boolean not null default false,
  whatsapp_number text,
  masked_whatsapp text,
  mpesa_number text,
  till_number text,
  paybill_number text,
  tiktok_url text,
  instagram_url text,
  facebook_url text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  verification_status public.verification_status not null default 'draft',
  seller_status public.seller_status not null default 'pending',
  verified boolean not null default false,
  trust_score numeric(5,2) not null default 50.00,
  trust_badge public.seller_badge not null default 'under_review',
  completed_orders_count integer not null default 0,
  total_orders_count integer not null default 0,
  disputed_orders_count integer not null default 0,
  rating_average numeric(3,2) not null default 0.00,
  rating_count integer not null default 0,
  refund_window_hours integer not null default 24,
  delivery_regions text[] not null default array[]::text[],
  delivery_terms text,
  refund_policy text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  rejected_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejection_reason text,
  profile_visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sellers_trust_score_check check (trust_score >= 0 and trust_score <= 100),
  constraint sellers_refund_window_check check (refund_window_hours between 0 and 168),
  constraint sellers_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists sellers_user_id_idx on public.sellers(user_id);
create index if not exists sellers_slug_idx on public.sellers(slug);
create index if not exists sellers_verified_idx on public.sellers(verified);
create index if not exists sellers_status_idx on public.sellers(seller_status);
create index if not exists sellers_trust_score_idx on public.sellers(trust_score);

/* -----------------------------
   Seller documents
----------------------------- */
create table if not exists public.seller_documents (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  evidence_type public.evidence_type not null,
  title text not null,
  file_url text,
  storage_path text,
  mime_type text,
  file_size_bytes bigint,
  review_status public.document_review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_documents_seller_id_idx on public.seller_documents(seller_id);
create index if not exists seller_documents_uploaded_by_idx on public.seller_documents(uploaded_by);

/* -----------------------------
   Products / protected order links
----------------------------- */
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price numeric(12,2) not null,
  currency text not null default 'KES',
  product_image_url text,
  product_image_storage_path text,
  gallery_urls text[] not null default array[]::text[],
  available_sizes text[] not null default array[]::text[],
  delivery_options text[] not null default array[]::text[],
  delivery_terms text,
  refund_policy text,
  refund_window_hours integer not null default 24,
  special_notes text,
  status public.product_status not null default 'draft',
  share_url text,
  link_clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, slug),
  constraint products_price_check check (price >= 0),
  constraint products_refund_window_check check (refund_window_hours between 0 and 168)
);

create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_slug_idx on public.products(slug);

/* -----------------------------
   Orders
----------------------------- */
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('DS-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid not null references public.sellers(id),
  buyer_id uuid not null references public.profiles(id),
  buyer_full_name text not null,
  buyer_phone text not null,
  buyer_email citext,
  delivery_location text not null,
  delivery_method text,
  delivery_notes text,
  item_name text,
  item_description text,
  item_snapshot jsonb not null default '{}'::jsonb,
  selected_size text,
  amount numeric(12,2) not null,
  buyer_protection_fee numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) generated always as (coalesce(amount, 0) + coalesce(buyer_protection_fee, 0) + coalesce(delivery_fee, 0)) stored,
  currency text not null default 'KES',
  payment_method public.payment_method not null default 'mpesa_manual',
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'pending',
  payment_proof_url text,
  payment_proof_storage_path text,
  delivery_proof_url text,
  delivery_proof_storage_path text,
  delivery_otp text,
  delivery_otp_confirmed_at timestamptz,
  refund_window_hours integer not null default 24,
  dispute_window_closes_at timestamptz,
  paid_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amount_check check (amount >= 0),
  constraint orders_buyer_protection_fee_check check (buyer_protection_fee >= 0),
  constraint orders_delivery_fee_check check (delivery_fee >= 0),
  constraint orders_refund_window_check check (refund_window_hours between 0 and 168),
  constraint orders_buyer_phone_format_check check (buyer_phone ~ '^\+?[0-9]{7,15}$')
);

create index if not exists orders_order_code_idx on public.orders(order_code);
create index if not exists orders_product_id_idx on public.orders(product_id);
create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_created_at_idx on public.orders(created_at);

/* -----------------------------
   Evidence timeline / payments / delivery
----------------------------- */
create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  old_status public.order_status,
  new_status public.order_status not null,
  title text,
  notes text,
  evidence_url text,
  evidence_storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_id_idx on public.order_status_events(order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null default 'mpesa_manual',
  status public.payment_status not null default 'pending',
  amount numeric(12,2) not null,
  currency text not null default 'KES',
  mpesa_receipt_code text,
  payer_phone text,
  paybill_number text,
  till_number text,
  transaction_time timestamptz,
  proof_url text,
  proof_storage_path text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_check check (amount >= 0),
  constraint payments_payer_phone_format_check check (payer_phone is null or payer_phone ~ '^\+?[0-9]{7,15}$')
);

create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_mpesa_receipt_code_idx on public.payments(mpesa_receipt_code);

create table if not exists public.delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id),
  proof_type public.evidence_type not null default 'delivery_photo',
  proof_url text,
  proof_storage_path text,
  tracking_code text,
  rider_name text,
  rider_phone text,
  courier_name text,
  notes text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_proofs_rider_phone_format_check check (rider_phone is null or rider_phone ~ '^\+?[0-9]{7,15}$')
);

create index if not exists delivery_proofs_order_id_idx on public.delivery_proofs(order_id);
create index if not exists delivery_proofs_seller_id_idx on public.delivery_proofs(seller_id);

/* -----------------------------
   Disputes and evidence
----------------------------- */
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_code text not null unique default ('DSP-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id),
  buyer_id uuid not null references public.profiles(id),
  raised_by uuid not null references public.profiles(id),
  type public.dispute_type not null,
  status public.dispute_status not null default 'open',
  resolution public.dispute_resolution not null default 'none',
  title text,
  summary text not null,
  buyer_requested_outcome text,
  seller_response text,
  seller_responded_at timestamptz,
  seller_response_due_at timestamptz not null default (now() + interval '48 hours'),
  admin_notes text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  refund_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disputes_refund_amount_check check (refund_amount >= 0)
);

create index if not exists disputes_order_id_idx on public.disputes(order_id);
create index if not exists disputes_seller_id_idx on public.disputes(seller_id);
create index if not exists disputes_buyer_id_idx on public.disputes(buyer_id);
create index if not exists disputes_status_idx on public.disputes(status);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  evidence_type public.evidence_type not null,
  title text,
  description text,
  file_url text,
  storage_path text,
  mime_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists dispute_evidence_dispute_id_idx on public.dispute_evidence(dispute_id);
create index if not exists dispute_evidence_uploaded_by_idx on public.dispute_evidence(uploaded_by);

/* -----------------------------
   Reviews, reports, policies, audit logs
----------------------------- */
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.sellers(id),
  rating integer not null,
  comment text,
  is_verified_order boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create index if not exists reviews_buyer_id_idx on public.reviews(buyer_id);
create index if not exists reviews_seller_id_idx on public.reviews(seller_id);

create table if not exists public.buyer_blacklist_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  buyer_id uuid references public.profiles(id),
  buyer_phone text,
  reason text not null,
  evidence_summary text,
  status public.document_review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_blacklist_phone_format_check check (buyer_phone is null or buyer_phone ~ '^\+?[0-9]{7,15}$')
);

create table if not exists public.seller_reports (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete set null,
  reported_by uuid references public.profiles(id),
  reporter_name text,
  reporter_phone text,
  reporter_email citext,
  seller_link_or_phone text,
  reason text not null,
  evidence_summary text,
  status public.dispute_status not null default 'open',
  admin_notes text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_reports_reporter_phone_format_check check (reporter_phone is null or reporter_phone ~ '^\+?[0-9]{7,15}$')
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action public.admin_action_type not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  notes text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  version text not null default '1.0',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

/* -----------------------------
   Helper functions after tables
----------------------------- */
create or replace function public.owns_seller(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.sellers s where s.id = p_seller_id and s.user_id = (select auth.uid()));
$$;

create or replace function public.order_is_buyer(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.orders o where o.id = p_order_id and o.buyer_id = (select auth.uid()));
$$;

create or replace function public.order_is_seller(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.orders o
    join public.sellers s on s.id = o.seller_id
    where o.id = p_order_id and s.user_id = (select auth.uid())
  );
$$;

create or replace function public.dispute_is_party(p_dispute_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.disputes d
    join public.sellers s on s.id = d.seller_id
    where d.id = p_dispute_id
      and (d.buyer_id = (select auth.uid()) or s.user_id = (select auth.uid()) or d.raised_by = (select auth.uid()))
  );
$$;

/* -----------------------------
   Slug and order triggers
----------------------------- */
create or replace function public.set_seller_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_slug text;
  new_slug text;
  counter integer := 1;
begin
  if new.slug is null or trim(new.slug) = '' then
    base_slug := public.slugify(new.shop_name);
    if base_slug = '' then base_slug := 'seller'; end if;
    new_slug := base_slug;
    while exists (select 1 from public.sellers where slug = new_slug and id is distinct from new.id) loop
      counter := counter + 1;
      new_slug := base_slug || '-' || counter::text;
    end loop;
    new.slug := new_slug;
  else
    new.slug := public.slugify(new.slug);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sellers_set_slug on public.sellers;
create trigger trg_sellers_set_slug before insert or update of shop_name, slug on public.sellers for each row execute function public.set_seller_slug();

create or replace function public.set_product_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_slug text;
  new_slug text;
  counter integer := 1;
begin
  if new.slug is null or trim(new.slug) = '' then
    base_slug := public.slugify(new.name);
    if base_slug = '' then base_slug := 'product'; end if;
    new_slug := base_slug;
    while exists (select 1 from public.products where seller_id = new.seller_id and slug = new_slug and id is distinct from new.id) loop
      counter := counter + 1;
      new_slug := base_slug || '-' || counter::text;
    end loop;
    new.slug := new_slug;
  else
    new.slug := public.slugify(new.slug);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_set_slug on public.products;
create trigger trg_products_set_slug before insert or update of name, slug on public.products for each row execute function public.set_product_slug();

create or replace function public.set_order_defaults()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p record;
begin
  if new.product_id is not null then
    select * into p from public.products where id = new.product_id;
    if found then
      if new.item_name is null then new.item_name := p.name; end if;
      if new.item_description is null then new.item_description := p.description; end if;
      if new.refund_window_hours is null then new.refund_window_hours := p.refund_window_hours; end if;
      new.item_snapshot := jsonb_build_object('product_id', p.id, 'seller_id', p.seller_id, 'name', p.name, 'price', p.price, 'currency', p.currency, 'refund_window_hours', p.refund_window_hours);
    end if;
  end if;
  if new.delivery_otp is null then
    new.delivery_otp := lpad((floor(random() * 1000000))::int::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_set_defaults on public.orders;
create trigger trg_orders_set_defaults before insert on public.orders for each row execute function public.set_order_defaults();

create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
    if new.status = 'paid' and new.paid_at is null then new.paid_at := now(); end if;
    if new.status = 'dispatched' and new.dispatched_at is null then new.dispatched_at := now(); end if;
    if new.status = 'delivered' and new.delivered_at is null then
      new.delivered_at := now();
      new.dispute_window_closes_at := now() + make_interval(hours => new.refund_window_hours);
    end if;
    if new.status = 'closed' and new.closed_at is null then new.closed_at := now(); end if;
    if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at := now(); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_status_timestamps on public.orders;
create trigger trg_orders_status_timestamps before update of status on public.orders for each row execute function public.handle_order_status_change();

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_events (order_id, changed_by, old_status, new_status, title, notes)
    values (new.id, (select auth.uid()), old.status, new.status, 'Order status changed', 'Status changed from ' || old.status::text || ' to ' || new.status::text);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_log_status_event on public.orders;
create trigger trg_orders_log_status_event after update of status on public.orders for each row execute function public.log_order_status_event();

/* -----------------------------
   Trust score recalculation
----------------------------- */
create or replace function public.recalculate_seller_trust(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_completed_orders integer := 0;
  v_total_orders integer := 0;
  v_total_disputes integer := 0;
  v_seller_wins integer := 0;
  v_rating_average numeric := 0;
  v_rating_count integer := 0;
  v_verified boolean := false;
  v_account_age_days integer := 0;
  final_score numeric := 0;
  final_badge public.seller_badge := 'under_review';
begin
  select count(*), count(*) filter (where status in ('closed', 'delivered'))
  into v_total_orders, v_completed_orders
  from public.orders where seller_id = p_seller_id;

  select count(*), count(*) filter (where resolution = 'dismissed')
  into v_total_disputes, v_seller_wins
  from public.disputes where seller_id = p_seller_id and status in ('resolved', 'dismissed');

  select coalesce(avg(rating), 0), count(*)
  into v_rating_average, v_rating_count
  from public.reviews where seller_id = p_seller_id and is_public = true;

  select verified, greatest(0, extract(day from now() - created_at)::integer)
  into v_verified, v_account_age_days
  from public.sellers where id = p_seller_id;

  final_score := round(least(100,
    (least(v_completed_orders, 50) / 50.0 * 40.0) +
    (case when v_verified then 20.0 else 0.0 end) +
    (case when v_total_disputes = 0 then 20.0 else greatest(0, (v_seller_wins::numeric / v_total_disputes::numeric) * 20.0) end) +
    10.0 +
    (least(v_account_age_days, 365) / 365.0 * 10.0)
  ), 2);

  final_badge := case
    when final_score >= 90 then 'elite'::public.seller_badge
    when final_score >= 70 then 'trusted'::public.seller_badge
    when final_score >= 50 then 'verified'::public.seller_badge
    else 'under_review'::public.seller_badge
  end;

  update public.sellers
  set trust_score = final_score,
      trust_badge = final_badge,
      completed_orders_count = coalesce(v_completed_orders, 0),
      total_orders_count = coalesce(v_total_orders, 0),
      disputed_orders_count = coalesce(v_total_disputes, 0),
      rating_average = round(coalesce(v_rating_average, 0), 2),
      rating_count = coalesce(v_rating_count, 0),
      updated_at = now()
  where id = p_seller_id;
end;
$$;

create or replace function public.recalculate_seller_trust_from_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.recalculate_seller_trust(coalesce(new.seller_id, old.seller_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_orders_recalculate_seller_trust on public.orders;
create trigger trg_orders_recalculate_seller_trust after insert or update or delete on public.orders for each row execute function public.recalculate_seller_trust_from_row();

drop trigger if exists trg_reviews_recalculate_seller_trust on public.reviews;
create trigger trg_reviews_recalculate_seller_trust after insert or update or delete on public.reviews for each row execute function public.recalculate_seller_trust_from_row();

drop trigger if exists trg_disputes_recalculate_seller_trust on public.disputes;
create trigger trg_disputes_recalculate_seller_trust after insert or update or delete on public.disputes for each row execute function public.recalculate_seller_trust_from_row();

/* -----------------------------
   Updated_at triggers
----------------------------- */
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','sellers','seller_documents','products','orders','payments','delivery_proofs','disputes','reviews','buyer_blacklist_requests','seller_reports','policy_documents'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

/* -----------------------------
   RLS Enable
----------------------------- */
alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.seller_documents enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_events enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.reviews enable row level security;
alter table public.buyer_blacklist_requests enable row level security;
alter table public.seller_reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.policy_documents enable row level security;

/* -----------------------------
   RLS Policies
----------------------------- */
-- profiles
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own_or_admin on public.profiles for update to authenticated using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());

-- sellers
drop policy if exists sellers_select_public_owner_admin on public.sellers;
drop policy if exists sellers_insert_own on public.sellers;
drop policy if exists sellers_update_own_or_admin on public.sellers;
drop policy if exists sellers_delete_admin_only on public.sellers;
create policy sellers_select_public_owner_admin on public.sellers for select to anon, authenticated using ((verified = true and seller_status = 'active' and profile_visibility = 'public') or user_id = (select auth.uid()) or public.is_admin());
create policy sellers_insert_own on public.sellers for insert to authenticated with check (user_id = (select auth.uid()));
create policy sellers_update_own_or_admin on public.sellers for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy sellers_delete_admin_only on public.sellers for delete to authenticated using (public.is_admin());

-- seller documents
drop policy if exists seller_documents_select_owner_or_admin on public.seller_documents;
drop policy if exists seller_documents_insert_owner_or_admin on public.seller_documents;
drop policy if exists seller_documents_update_owner_or_admin on public.seller_documents;
drop policy if exists seller_documents_delete_admin_only on public.seller_documents;
create policy seller_documents_select_owner_or_admin on public.seller_documents for select to authenticated using (public.owns_seller(seller_id) or uploaded_by = (select auth.uid()) or public.is_admin());
create policy seller_documents_insert_owner_or_admin on public.seller_documents for insert to authenticated with check (public.owns_seller(seller_id) or uploaded_by = (select auth.uid()) or public.is_admin());
create policy seller_documents_update_owner_or_admin on public.seller_documents for update to authenticated using (public.owns_seller(seller_id) or public.is_admin()) with check (public.owns_seller(seller_id) or public.is_admin());
create policy seller_documents_delete_admin_only on public.seller_documents for delete to authenticated using (public.is_admin());

-- products
drop policy if exists products_select_public_owner_admin on public.products;
drop policy if exists products_insert_seller on public.products;
drop policy if exists products_update_seller_or_admin on public.products;
drop policy if exists products_delete_seller_or_admin on public.products;
create policy products_select_public_owner_admin on public.products for select to anon, authenticated using ((status = 'active' and exists (select 1 from public.sellers s where s.id = products.seller_id and s.verified = true and s.seller_status = 'active')) or public.owns_seller(seller_id) or public.is_admin());
create policy products_insert_seller on public.products for insert to authenticated with check (public.owns_seller(seller_id) or public.is_admin());
create policy products_update_seller_or_admin on public.products for update to authenticated using (public.owns_seller(seller_id) or public.is_admin()) with check (public.owns_seller(seller_id) or public.is_admin());
create policy products_delete_seller_or_admin on public.products for delete to authenticated using (public.owns_seller(seller_id) or public.is_admin());

-- orders
drop policy if exists orders_select_party_or_admin on public.orders;
drop policy if exists orders_insert_buyer on public.orders;
drop policy if exists orders_update_party_or_admin on public.orders;
drop policy if exists orders_delete_admin_only on public.orders;
create policy orders_select_party_or_admin on public.orders for select to authenticated using (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin());
create policy orders_insert_buyer on public.orders for insert to authenticated with check (buyer_id = (select auth.uid()));
create policy orders_update_party_or_admin on public.orders for update to authenticated using (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin()) with check (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin());
create policy orders_delete_admin_only on public.orders for delete to authenticated using (public.is_admin());

-- order events
drop policy if exists order_events_select_party_or_admin on public.order_status_events;
drop policy if exists order_events_insert_party_or_admin on public.order_status_events;
drop policy if exists order_events_delete_admin_only on public.order_status_events;
create policy order_events_select_party_or_admin on public.order_status_events for select to authenticated using (public.order_is_buyer(order_id) or public.order_is_seller(order_id) or public.is_admin());
create policy order_events_insert_party_or_admin on public.order_status_events for insert to authenticated with check (public.order_is_buyer(order_id) or public.order_is_seller(order_id) or public.is_admin());
create policy order_events_delete_admin_only on public.order_status_events for delete to authenticated using (public.is_admin());

-- payments
drop policy if exists payments_select_party_or_admin on public.payments;
drop policy if exists payments_insert_buyer_or_admin on public.payments;
drop policy if exists payments_update_buyer_or_admin on public.payments;
drop policy if exists payments_delete_admin_only on public.payments;
create policy payments_select_party_or_admin on public.payments for select to authenticated using (public.order_is_buyer(order_id) or public.order_is_seller(order_id) or public.is_admin());
create policy payments_insert_buyer_or_admin on public.payments for insert to authenticated with check (public.order_is_buyer(order_id) or public.is_admin());
create policy payments_update_buyer_or_admin on public.payments for update to authenticated using (public.order_is_buyer(order_id) or public.is_admin()) with check (public.order_is_buyer(order_id) or public.is_admin());
create policy payments_delete_admin_only on public.payments for delete to authenticated using (public.is_admin());

-- delivery proofs
drop policy if exists delivery_proofs_select_party_or_admin on public.delivery_proofs;
drop policy if exists delivery_proofs_insert_seller_or_admin on public.delivery_proofs;
drop policy if exists delivery_proofs_update_seller_or_admin on public.delivery_proofs;
drop policy if exists delivery_proofs_delete_admin_only on public.delivery_proofs;
create policy delivery_proofs_select_party_or_admin on public.delivery_proofs for select to authenticated using (public.order_is_buyer(order_id) or public.order_is_seller(order_id) or public.is_admin());
create policy delivery_proofs_insert_seller_or_admin on public.delivery_proofs for insert to authenticated with check (public.order_is_seller(order_id) or public.is_admin());
create policy delivery_proofs_update_seller_or_admin on public.delivery_proofs for update to authenticated using (public.order_is_seller(order_id) or public.is_admin()) with check (public.order_is_seller(order_id) or public.is_admin());
create policy delivery_proofs_delete_admin_only on public.delivery_proofs for delete to authenticated using (public.is_admin());

-- disputes
drop policy if exists disputes_select_party_or_admin on public.disputes;
drop policy if exists disputes_insert_buyer_or_admin on public.disputes;
drop policy if exists disputes_update_party_or_admin on public.disputes;
drop policy if exists disputes_delete_admin_only on public.disputes;
create policy disputes_select_party_or_admin on public.disputes for select to authenticated using (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or raised_by = (select auth.uid()) or public.is_admin());
create policy disputes_insert_buyer_or_admin on public.disputes for insert to authenticated with check (buyer_id = (select auth.uid()) or public.is_admin());
create policy disputes_update_party_or_admin on public.disputes for update to authenticated using (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin()) with check (buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin());
create policy disputes_delete_admin_only on public.disputes for delete to authenticated using (public.is_admin());

-- dispute evidence
drop policy if exists dispute_evidence_select_party_or_admin on public.dispute_evidence;
drop policy if exists dispute_evidence_insert_party_or_admin on public.dispute_evidence;
drop policy if exists dispute_evidence_delete_admin_only on public.dispute_evidence;
create policy dispute_evidence_select_party_or_admin on public.dispute_evidence for select to authenticated using (public.dispute_is_party(dispute_id) or public.is_admin());
create policy dispute_evidence_insert_party_or_admin on public.dispute_evidence for insert to authenticated with check (public.dispute_is_party(dispute_id) or public.is_admin());
create policy dispute_evidence_delete_admin_only on public.dispute_evidence for delete to authenticated using (public.is_admin());

-- reviews
drop policy if exists reviews_select_public_or_party_admin on public.reviews;
drop policy if exists reviews_insert_buyer on public.reviews;
drop policy if exists reviews_update_buyer_or_admin on public.reviews;
drop policy if exists reviews_delete_admin_only on public.reviews;
create policy reviews_select_public_or_party_admin on public.reviews for select to anon, authenticated using (is_public = true or buyer_id = (select auth.uid()) or public.owns_seller(seller_id) or public.is_admin());
create policy reviews_insert_buyer on public.reviews for insert to authenticated with check (buyer_id = (select auth.uid()) and exists (select 1 from public.orders o where o.id = reviews.order_id and o.buyer_id = (select auth.uid()) and o.status in ('delivered', 'closed')));
create policy reviews_update_buyer_or_admin on public.reviews for update to authenticated using (buyer_id = (select auth.uid()) or public.is_admin()) with check (buyer_id = (select auth.uid()) or public.is_admin());
create policy reviews_delete_admin_only on public.reviews for delete to authenticated using (public.is_admin());

-- blacklist, reports, logs, policies
drop policy if exists buyer_blacklist_select_seller_or_admin on public.buyer_blacklist_requests;
drop policy if exists buyer_blacklist_insert_seller_or_admin on public.buyer_blacklist_requests;
drop policy if exists buyer_blacklist_update_admin_only on public.buyer_blacklist_requests;
drop policy if exists buyer_blacklist_delete_admin_only on public.buyer_blacklist_requests;
create policy buyer_blacklist_select_seller_or_admin on public.buyer_blacklist_requests for select to authenticated using (public.owns_seller(seller_id) or public.is_admin());
create policy buyer_blacklist_insert_seller_or_admin on public.buyer_blacklist_requests for insert to authenticated with check (public.owns_seller(seller_id) or public.is_admin());
create policy buyer_blacklist_update_admin_only on public.buyer_blacklist_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy buyer_blacklist_delete_admin_only on public.buyer_blacklist_requests for delete to authenticated using (public.is_admin());

drop policy if exists seller_reports_select_admin_or_reporter on public.seller_reports;
drop policy if exists seller_reports_insert_authenticated on public.seller_reports;
drop policy if exists seller_reports_update_admin_only on public.seller_reports;
drop policy if exists seller_reports_delete_admin_only on public.seller_reports;
create policy seller_reports_select_admin_or_reporter on public.seller_reports for select to authenticated using (reported_by = (select auth.uid()) or public.is_admin());
create policy seller_reports_insert_authenticated on public.seller_reports for insert to authenticated with check (reported_by = (select auth.uid()) or reported_by is null);
create policy seller_reports_update_admin_only on public.seller_reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy seller_reports_delete_admin_only on public.seller_reports for delete to authenticated using (public.is_admin());

drop policy if exists admin_audit_logs_admin_only on public.admin_audit_logs;
create policy admin_audit_logs_admin_only on public.admin_audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists policy_documents_select_published_or_admin on public.policy_documents;
drop policy if exists policy_documents_admin_write on public.policy_documents;
create policy policy_documents_select_published_or_admin on public.policy_documents for select to anon, authenticated using (is_published = true or public.is_admin());
create policy policy_documents_admin_write on public.policy_documents for all to authenticated using (public.is_admin()) with check (public.is_admin());

/* -----------------------------
   Storage buckets and policies
----------------------------- */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('seller-documents', 'seller-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
  ('shop-photos', 'shop-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
  ('delivery-proofs', 'delivery-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
  ('dispute-evidence', 'dispute-evidence', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_public_read_shop_and_product_images on storage.objects;
drop policy if exists storage_user_upload_own_folder on storage.objects;
drop policy if exists storage_user_read_own_private_files_or_admin on storage.objects;
drop policy if exists storage_user_update_own_folder_or_admin on storage.objects;
drop policy if exists storage_user_delete_own_folder_or_admin on storage.objects;

create policy storage_public_read_shop_and_product_images on storage.objects for select to anon, authenticated using (bucket_id in ('shop-photos', 'product-images'));
create policy storage_user_upload_own_folder on storage.objects for insert to authenticated with check (bucket_id in ('seller-documents', 'shop-photos', 'product-images', 'payment-proofs', 'delivery-proofs', 'dispute-evidence') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_user_read_own_private_files_or_admin on storage.objects for select to authenticated using (public.is_admin() or (bucket_id in ('seller-documents', 'payment-proofs', 'delivery-proofs', 'dispute-evidence') and (storage.foldername(name))[1] = (select auth.uid())::text) or bucket_id in ('shop-photos', 'product-images'));
create policy storage_user_update_own_folder_or_admin on storage.objects for update to authenticated using (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text) with check (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_user_delete_own_folder_or_admin on storage.objects for delete to authenticated using (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text);

/* -----------------------------
   Grants
----------------------------- */
grant usage on schema public to anon, authenticated;
grant select on public.sellers to anon;
grant select on public.products to anon;
grant select on public.reviews to anon;
grant select on public.policy_documents to anon;
grant all on all tables in schema public to authenticated;
grant execute on function public.current_profile_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.owns_seller(uuid) to authenticated;
grant execute on function public.order_is_buyer(uuid) to authenticated;
grant execute on function public.order_is_seller(uuid) to authenticated;
grant execute on function public.dispute_is_party(uuid) to authenticated;

/* -----------------------------
   Default public policy pages
----------------------------- */
insert into public.policy_documents (slug, title, body, version, is_published, published_at)
values
  ('buyer-protection', 'Buyer Protection', 'DukaSafe records order details, payment proof, delivery status, and dispute evidence so buyers can shop more safely from verified social sellers.', '1.0', true, now()),
  ('seller-protection', 'Seller Protection', 'DukaSafe protects genuine sellers by requiring payment before dispatch, recording delivery proof, and resolving disputes using evidence rather than assumptions.', '1.0', true, now()),
  ('dispute-charter', 'DukaSafe Protection Charter', 'Complaints are reviewed through an evidence-based process: complaint raised, evidence uploaded, seller response, admin review, and resolution logged.', '1.0', true, now()),
  ('refund-policy', 'Refund Policy', 'Refunds are not automatic. They require review of buyer and seller evidence within the dispute window shown on the order page.', '1.0', true, now())
on conflict (slug) do update
set title = excluded.title,
    body = excluded.body,
    version = excluded.version,
    is_published = excluded.is_published,
    published_at = excluded.published_at,
    updated_at = now();

commit;

/* ============================================================
   AFTER RUNNING THIS SCHEMA
   ============================================================

   1. Create your user account through Supabase Auth first.

   2. Then make yourself admin by running:

      update public.profiles
      set role = 'admin'
      where email = 'YOUR_EMAIL_HERE';

   3. Codex/local setup:
      Do NOT paste service tokens into SQL files.
      Use a local .env file instead:

      SUPABASE_ACCESS_TOKEN
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SUPABASE_SERVICE_ROLE_KEY

   4. MVP payment mode:
      Use payment_method = 'mpesa_manual' and upload payment proof screenshots.

   5. File upload paths:
      seller-documents/<user_id>/id.pdf
      shop-photos/<user_id>/shop-front.jpg
      product-images/<user_id>/white-tull-set.jpg
      payment-proofs/<user_id>/mpesa-proof.jpg
      delivery-proofs/<user_id>/dispatch-proof.jpg
      dispute-evidence/<user_id>/chat-screenshot.png

   ============================================================ */
