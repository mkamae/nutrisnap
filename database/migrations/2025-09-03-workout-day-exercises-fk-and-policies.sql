-- Ensure table and relationships exist for workout_day_exercises
-- This enables PostgREST to discover the relationship used by select=*,exercise:exercises(*)

-- Create table if missing
do $$ begin
  if not exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'workout_day_exercises'
  ) then
    create table public.workout_day_exercises (
      id uuid primary key default gen_random_uuid(),
      day_id uuid not null,
      exercise_id uuid not null,
      sort_order integer not null default 1,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

-- Add foreign key to workout_days(id)
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'workout_day_exercises_day_id_fkey'
  ) then
    alter table public.workout_day_exercises
      add constraint workout_day_exercises_day_id_fkey
      foreign key (day_id) references public.workout_days(id)
      on delete cascade not valid;
  end if;
end $$;

-- Add foreign key to exercises(id)
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'workout_day_exercises_exercise_id_fkey'
  ) then
    alter table public.workout_day_exercises
      add constraint workout_day_exercises_exercise_id_fkey
      foreign key (exercise_id) references public.exercises(id)
      on delete cascade not valid;
  end if;
end $$;

-- Helpful indexes
create index if not exists idx_wde_day_id on public.workout_day_exercises(day_id);
create index if not exists idx_wde_exercise_id on public.workout_day_exercises(exercise_id);
create index if not exists idx_wde_day_sort on public.workout_day_exercises(day_id, sort_order);

-- Enable RLS and allow read access for authenticated users (adjust later if needed)
alter table public.workout_day_exercises enable row level security;

drop policy if exists "authenticated can read workout_day_exercises" on public.workout_day_exercises;
create policy "authenticated can read workout_day_exercises"
on public.workout_day_exercises
for select
to authenticated
using (true);


