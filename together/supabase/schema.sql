-- ── Together: shared-pregnancy sync schema ──────────────────────────────────
-- One "couple" is a private space. Each phone signs in anonymously (no email,
-- no password), then creates a couple or joins one with its 8-character code.
-- Row Level Security means a device can only ever read or write the entries of
-- the couple it has joined. Nothing is readable by code alone, except joining
-- itself, which happens through join_couple() below.
--
-- Run this whole file once in the Supabase SQL editor, then:
--   Authentication → Sign In / Providers → enable "Allow anonymous sign-ins".
-- Every table is prefixed tg_ so it can share a project with other apps.

create table if not exists public.tg_couples (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tg_members (
  couple_id uuid not null references public.tg_couples(id) on delete cascade,
  user_id   uuid not null default auth.uid(),
  role      text not null check (role in ('mom', 'dad')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table if not exists public.tg_entries (
  id          uuid primary key,
  couple_id   uuid not null references public.tg_couples(id) on delete cascade,
  author_id   uuid not null default auth.uid(),
  author_role text not null check (author_role in ('mom', 'dad')),
  kind        text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists tg_entries_couple_time on public.tg_entries (couple_id, created_at);

alter table public.tg_couples enable row level security;
alter table public.tg_members enable row level security;
alter table public.tg_entries enable row level security;

-- security definer so the policy check doesn't recurse into tg_members' own RLS
create or replace function public.tg_is_member(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tg_members m where m.couple_id = c and m.user_id = auth.uid())
$$;

drop policy if exists tg_couples_read on public.tg_couples;
create policy tg_couples_read on public.tg_couples for select to authenticated
  using (public.tg_is_member(id));

drop policy if exists tg_members_read on public.tg_members;
create policy tg_members_read on public.tg_members for select to authenticated
  using (public.tg_is_member(couple_id));

drop policy if exists tg_entries_read on public.tg_entries;
create policy tg_entries_read on public.tg_entries for select to authenticated
  using (public.tg_is_member(couple_id));

drop policy if exists tg_entries_write on public.tg_entries;
create policy tg_entries_write on public.tg_entries for insert to authenticated
  with check (public.tg_is_member(couple_id) and author_id = auth.uid());

drop policy if exists tg_entries_delete on public.tg_entries;
create policy tg_entries_delete on public.tg_entries for delete to authenticated
  using (author_id = auth.uid());

-- Create a couple and join it as the caller. Returns { couple_id, code }.
create or replace function public.tg_create_couple(p_role text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
  new_code text;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_role not in ('mom', 'dad') then raise exception 'bad role'; end if;
  loop
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.tg_couples where code = new_code);
  end loop;
  insert into public.tg_couples (code) values (new_code) returning id into new_id;
  insert into public.tg_members (couple_id, user_id, role) values (new_id, auth.uid(), p_role);
  return json_build_object('couple_id', new_id, 'code', new_code);
end $$;

-- Join with a code.
create or replace function public.tg_join_couple(p_code text, p_role text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  c_id uuid;
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_role not in ('mom', 'dad') then raise exception 'bad role'; end if;
  select id into c_id from public.tg_couples where code = clean;
  if c_id is null then raise exception 'No couple with that code'; end if;
  insert into public.tg_members (couple_id, user_id, role) values (c_id, auth.uid(), p_role)
    on conflict (couple_id, user_id) do update set role = excluded.role, joined_at = now();
  -- A phone that "forgot" itself re-joins as a new device. Keep only the 3 most
  -- recent devices per role so stale ones never lock the couple out.
  delete from public.tg_members
   where couple_id = c_id and role = p_role
     and user_id not in (select m.user_id from public.tg_members m
                          where m.couple_id = c_id and m.role = p_role
                          order by m.joined_at desc limit 3);
  return json_build_object('couple_id', c_id, 'code', clean);
end $$;

revoke all on function public.tg_create_couple(text) from public, anon;
revoke all on function public.tg_join_couple(text, text) from public, anon;
grant execute on function public.tg_create_couple(text) to authenticated;
grant execute on function public.tg_join_couple(text, text) to authenticated;
grant execute on function public.tg_is_member(uuid) to authenticated;

-- Live updates: the partner's phone hears inserts the moment they land.
do $$ begin
  alter publication supabase_realtime add table public.tg_entries;
exception when duplicate_object then null; end $$;
