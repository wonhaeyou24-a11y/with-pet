-- M5 탐험: 보내 놓고 기다리기. 출발·복귀·보상은 care 함수(서버 시각·시드)가 판정하고, 폰은 읽기만 한다.
-- 규칙표(지역·권장 전투력·보상)는 supabase/functions/care/explore.ts 한 곳에 있다.

-- 1. 몬스터별로 지역마다 돌파한 가장 높은 구역
alter table public.monsters add column if not exists explore_progress jsonb not null default '{}'::jsonb;

-- 2. 탐험 기록 (진행 중이거나 끝난 것). 일지도 여기서 읽는다.
create table if not exists public.explore_trips (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  monster_id uuid not null references public.monsters(id) on delete cascade,
  region text not null,
  zone int not null check (zone between 1 and 10),
  hours int not null check (hours in (1, 2, 4, 8)),
  power int not null,
  seed bigint not null,
  started_at timestamptz not null default now(),
  finish_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'claimed')),
  claimed_at timestamptz,
  result jsonb
);
create unique index if not exists explore_trips_one_active_uidx on public.explore_trips (monster_id) where status = 'active';
create index if not exists explore_trips_owner_idx on public.explore_trips (owner, started_at desc);
alter table public.explore_trips enable row level security;
drop policy if exists "explore_trips_read_own" on public.explore_trips;
create policy "explore_trips_read_own" on public.explore_trips for select to authenticated using (owner = auth.uid());
revoke all on public.explore_trips from anon, authenticated;
grant select on public.explore_trips to authenticated;

-- 3. 내부 도우미: 정해진 등급의 장비를 한 개 준다 (care 함수가 부른다). 가방이 가득 차면 주지 않는다.
create or replace function public.gear_grant(p_owner uuid, p_grade text, p_source text) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  d record;
  have int;
begin
  select count(*) into have from public.gear_items where owner = p_owner;
  if have >= 60 then return null; end if;
  select * into d from public.gear_defs where grade = p_grade order by random() limit 1;
  if not found then return null; end if;
  insert into public.gear_items (owner, def_id, slot, source) values (p_owner, d.id, d.slot, p_source);
  return d.id;
end $$;
revoke all on function public.gear_grant(uuid, text, text) from public, anon, authenticated;
