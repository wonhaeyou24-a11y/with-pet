-- M2 2단계: 훈련·디저트 타워 진행(세션)을 서버가 기억하고 판정한다.
-- 시작 시각·끝나는 시각·난수 시드는 서버가 기록하고, 클라이언트는 읽기만 한다.

-- 1. 진행 중/받은 활동 기록
create table if not exists public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.players (id) on delete cascade,
  monster_id uuid not null references public.monsters (id) on delete cascade,
  kind text not null check (kind in ('train', 'tower')),
  course_id text,               -- 훈련 코스 (str/def/spd/int/hp)
  start_floor int,              -- 타워 출발 층
  max_floors int,               -- 타워 한 번에 오르는 층 수
  sec_per_floor int,            -- 타워 한 층에 걸리는 시간(초) - 출발 때 전투력으로 정해 고정
  seed bigint not null,         -- 등급 굴림 등 재현용 난수 시드
  started_at timestamptz not null default now(),
  finish_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'claimed')),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 같은 몬스터가 같은 종류를 동시에 두 개 진행하지 못한다
create unique index if not exists activity_one_active_idx
  on public.activity_sessions (monster_id, kind) where status = 'active';
create index if not exists activity_owner_idx on public.activity_sessions (owner, kind, started_at desc);

alter table public.activity_sessions enable row level security;

create policy "activity_select_own" on public.activity_sessions
  for select to authenticated using (owner = auth.uid());

revoke all on public.activity_sessions from anon, authenticated;
grant select on public.activity_sessions to authenticated;

-- 2. 타워 최고 도달 층(몬스터별), 하루 코인 상한·타워 입장 횟수 집계(플레이어별)
alter table public.monsters
  add column if not exists tower_floor int not null default 1;

alter table public.players
  add column if not exists earn_day date,
  add column if not exists earn_coins int not null default 0,
  add column if not exists tower_day date,
  add column if not exists tower_entries int not null default 0;
