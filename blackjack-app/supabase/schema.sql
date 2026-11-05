-- Blackjack: The Table — optional cloud progress.
-- One row per signed-in player holding their progress JSON. Row Level Security
-- makes each row readable and writable only by its owner.
create table if not exists public.bj_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.bj_progress enable row level security;

drop policy if exists "own progress: select" on public.bj_progress;
create policy "own progress: select" on public.bj_progress
  for select using (auth.uid() = user_id);

drop policy if exists "own progress: insert" on public.bj_progress;
create policy "own progress: insert" on public.bj_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "own progress: update" on public.bj_progress;
create policy "own progress: update" on public.bj_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own progress: delete" on public.bj_progress;
create policy "own progress: delete" on public.bj_progress
  for delete using (auth.uid() = user_id);
