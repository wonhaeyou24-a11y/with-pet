-- M0: 플레이어와 초대 코드

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 10),
  coins integer not null default 0 check (coins >= 0),
  star_shards integer not null default 0 check (star_shards >= 0),
  main_monster_id uuid,
  rank_score integer not null default 1000,
  created_at timestamptz not null default now()
);

create unique index players_nickname_key on public.players (lower(btrim(nickname)));

alter table public.players enable row level security;

-- 로그인한 사람은 모두의 프로필을 읽을 수 있다 (지인 광장용)
create policy "players_select_authenticated" on public.players
  for select to authenticated using (true);

-- 자기 행만 만들고 고칠 수 있다
create policy "players_insert_own" on public.players
  for insert to authenticated with check (id = auth.uid());

create policy "players_update_own" on public.players
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 코인·별조각·랭크 점수는 서버(Edge Function)만 바꾼다: 클라이언트는 닉네임만 쓸 수 있다
revoke insert, update on public.players from anon, authenticated;
grant insert (id, nickname) on public.players to authenticated;
grant update (nickname) on public.players to authenticated;

-- 초대 코드: 클라이언트는 접근 불가, Edge Function(service_role)만 사용
create table public.invite_codes (
  code text primary key,
  created_at timestamptz not null default now(),
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  claimed_email text
);

alter table public.invite_codes enable row level security;
revoke all on public.invite_codes from anon, authenticated;
