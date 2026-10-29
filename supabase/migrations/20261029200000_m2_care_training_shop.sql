-- M2: 디저트 돌보기(상태 4종), 토핑 가방·베이커리 상점·코인, 파티세리 훈련 5종, 레벨업, 돌봄 기록(care_logs)

-- 1. 플레이어 테이블에 토핑 가방(food_bag) 및 무료 슈가파우더 지급일(free_food_day) 추가, 기본 코인 200 지급
alter table public.players
  alter column coins set default 200,
  add column if not exists food_bag jsonb not null default '{"기본 슈가파우더": 3, "생딸기 슈가시럽": 1, "피스타치오 크림": 1}'::jsonb,
  add column if not exists free_food_day date;

-- 기존 플레이어에게도 초기 테스트용 코인이 0원이면 200코인을 지급
update public.players set coins = 200 where coins = 0;

-- 2. 몬스터 테이블에 최애/기피 토핑 발견 여부, 최근 먹은 토핑 목록(골고루 보너스 판정), 누적 훈련/돌봄 카운트 추가
alter table public.monsters
  add column if not exists discovered_fav boolean not null default false,
  add column if not exists discovered_disliked boolean not null default false,
  add column if not exists recent_foods jsonb not null default '[]'::jsonb,
  add column if not exists care_counts jsonb not null default '{"str":0,"def":0,"spd":0,"int":0,"hp":0,"feed":0,"play":0,"clean":0,"rest":0}'::jsonb;

-- 3. 돌봄·훈련 로그 테이블 (진화 갈래 판정 및 생활 연동 스킬 해금용)
create table if not exists public.care_logs (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.players (id) on delete cascade,
  monster_id uuid not null references public.monsters (id) on delete cascade,
  action text not null check (char_length(action) between 1 and 40),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists care_logs_monster_idx on public.care_logs (monster_id, created_at desc);

alter table public.care_logs enable row level security;

create policy "care_logs_select_own" on public.care_logs
  for select to authenticated using (owner = auth.uid());

revoke all on public.care_logs from anon, authenticated;
grant select on public.care_logs to authenticated;

