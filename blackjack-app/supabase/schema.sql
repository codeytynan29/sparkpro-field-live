-- Blackjack: The Table — cloud backup and sync by private sync code.
-- Applied to the Supabase project the app is configured for (see src/config.ts).
-- No accounts: a 12-character code (alphabet without I, O, 0, 1) identifies a save.
-- RLS is on with no policies, so the table can't be read or written directly; the
-- only access is through the two functions below, which require the code.
create table if not exists public.bj_sync (
  code text primary key check (code ~ '^[A-Z2-9]{12}$'),
  data jsonb not null,
  updated_ms bigint not null,
  created_at timestamptz not null default now(),
  touched_at timestamptz not null default now()
);
alter table public.bj_sync enable row level security;
revoke all on public.bj_sync from anon, authenticated;

create or replace function public.bj_pull(p_code text)
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object('data', data, 'updated_ms', updated_ms)
  from public.bj_sync
  where code = upper(p_code) and upper(p_code) ~ '^[A-Z2-9]{12}$'
$$;

-- Newer save wins: a push older than what's stored is ignored.
create or replace function public.bj_push(p_code text, p_data jsonb, p_updated_ms bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c text := upper(p_code);
  cur bigint;
begin
  if c !~ '^[A-Z2-9]{12}$' then raise exception 'bad code'; end if;
  if pg_column_size(p_data) > 512000 then raise exception 'too large'; end if;
  if jsonb_typeof(p_data) <> 'object' then raise exception 'bad data'; end if;
  select updated_ms into cur from public.bj_sync where code = c for update;
  if cur is null then
    insert into public.bj_sync (code, data, updated_ms) values (c, p_data, p_updated_ms);
    return jsonb_build_object('stored', true);
  elsif p_updated_ms > cur then
    update public.bj_sync set data = p_data, updated_ms = p_updated_ms, touched_at = now() where code = c;
    return jsonb_build_object('stored', true);
  end if;
  return jsonb_build_object('stored', false, 'updated_ms', cur);
end;
$$;

revoke all on function public.bj_pull(text) from public;
revoke all on function public.bj_push(text, jsonb, bigint) from public;
grant execute on function public.bj_pull(text) to anon, authenticated;
grant execute on function public.bj_push(text, jsonb, bigint) to anon, authenticated;
