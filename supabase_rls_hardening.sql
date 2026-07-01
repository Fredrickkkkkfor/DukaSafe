/* DukaSafe RLS hardening
   Apply after the base schema. This prevents seller-owned clients from changing
   admin-managed trust/verification fields and from creating active products
   while pending, suspended, banned, or unapproved.
*/

create or replace function public.prevent_seller_self_privileged_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if old.user_id = (select auth.uid()) then
    if new.user_id is distinct from old.user_id
      or new.verified is distinct from old.verified
      or new.trust_score is distinct from old.trust_score
      or new.trust_badge is distinct from old.trust_badge
      or new.completed_orders_count is distinct from old.completed_orders_count
      or new.total_orders_count is distinct from old.total_orders_count
      or new.disputed_orders_count is distinct from old.disputed_orders_count
      or new.rating_average is distinct from old.rating_average
      or new.rating_count is distinct from old.rating_count
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by
      or new.rejected_at is distinct from old.rejected_at
      or new.rejected_by is distinct from old.rejected_by then
      raise exception 'Seller verification and trust fields are admin-managed';
    end if;

    if new.verification_status is distinct from old.verification_status
      and new.verification_status not in ('submitted', 'pending_review') then
      raise exception 'Sellers cannot set approval or rejection verification states';
    end if;

    if new.seller_status is distinct from old.seller_status
      and new.seller_status <> 'pending' then
      raise exception 'Sellers cannot set active, suspended, banned, or archived status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sellers_prevent_self_privileged_update on public.sellers;
create trigger trg_sellers_prevent_self_privileged_update
before update on public.sellers
for each row execute function public.prevent_seller_self_privileged_update();

create or replace function public.enforce_active_product_seller_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  seller_record public.sellers%rowtype;
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  select * into seller_record
  from public.sellers
  where id = new.seller_id;

  if seller_record.id is null then
    raise exception 'Seller not found';
  end if;

  if seller_record.user_id <> (select auth.uid()) then
    raise exception 'Seller ownership is required';
  end if;

  if new.status = 'active'
    and (seller_record.verified is not true
      or seller_record.seller_status <> 'active'
      or seller_record.verification_status <> 'approved') then
    raise exception 'Only approved active sellers can create active checkout links';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_enforce_active_seller_status on public.products;
create trigger trg_products_enforce_active_seller_status
before insert or update of status, seller_id on public.products
for each row execute function public.enforce_active_product_seller_status();
