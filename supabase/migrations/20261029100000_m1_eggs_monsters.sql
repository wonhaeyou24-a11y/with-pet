-- M1: 알과 몬스터

alter table public.players add column starter_egg_granted boolean not null default false;

create table public.eggs (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.players (id) on delete cascade,
  rarity text not null check (rarity in ('common', 'rare', 'legendary')),
  hatch_at timestamptz not null,
  pet_count integer not null default 0,
  warm_count integer not null default 0,
  care_day date,
  pets_today integer not null default 0,
  warms_today integer not null default 0,
  hatched_at timestamptz,
  monster_id uuid,
  created_at timestamptz not null default now()
);

create index eggs_owner_idx on public.eggs (owner, created_at);

alter table public.eggs enable row level security;
create policy "eggs_select_own" on public.eggs for select to authenticated using (owner = auth.uid());
revoke all on public.eggs from anon, authenticated;
grant select on public.eggs to authenticated;

create table public.monsters (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.players (id) on delete cascade,
  name text check (name is null or name ~ '^[가-힣A-Za-z0-9]{1,10}$'),
  species text not null,
  element text not null,
  element2 text,
  parts jsonb not null,
  talents jsonb not null,
  trait text not null,
  fav_food text not null,
  disliked_food text not null,
  level integer not null default 1,
  exp integer not null default 0,
  stats jsonb not null,
  personality_active integer not null default 0,
  personality_bond integer not null default 0,
  evo_stage integer not null default 1,
  evo_branch text,
  hunger integer not null default 80,
  mood integer not null default 80,
  fatigue integer not null default 0,
  cleanliness integer not null default 100,
  last_calc_at timestamptz not null default now(),
  sp integer not null default 0,
  is_shiny boolean not null default false,
  mutation text,
  hatched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index monsters_owner_idx on public.monsters (owner, created_at);

alter table public.eggs add constraint eggs_monster_fk foreign key (monster_id) references public.monsters (id) on delete set null;

alter table public.monsters enable row level security;

-- 지인 몬스터 구경을 위해 로그인한 모두가 읽을 수 있다
create policy "monsters_select_authenticated" on public.monsters for select to authenticated using (true);
create policy "monsters_update_own" on public.monsters for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

-- 클라이언트는 이름만 고칠 수 있고, 한 번 정한 이름은 바꿀 수 없다
revoke all on public.monsters from anon, authenticated;
grant select on public.monsters to authenticated;
grant update (name) on public.monsters to authenticated;

create function public.monsters_name_once() returns trigger language plpgsql set search_path = public as $$
begin
  if old.name is not null and new.name is distinct from old.name then
    raise exception 'name already set';
  end if;
  return new;
end;
$$;

create trigger monsters_name_once before update on public.monsters
  for each row execute function public.monsters_name_once();
