-- M3: 지인 디저트 광장(좋아요·한입 투표·응원), 식감 스킬 트리 1단계·스킬 장착, 오감 ASMR 친선 대전 & 시드 리플레이

-- 1. 몬스터 테이블에 해금 스킬, 장착 스킬 4칸, 전투 성향, 좋아요(한입 투표) 수, 승패 전적, 한줄 소개 추가
alter table public.monsters
  add column if not exists unlocked_skills jsonb not null default '["kataifi-strike","sugar-shield","sweet-gaze","element-drizzle"]'::jsonb,
  add column if not exists equipped_skills jsonb not null default '["kataifi-strike","sugar-shield","sweet-gaze","element-drizzle"]'::jsonb,
  add column if not exists battle_stance text not null default 'balanced' check (battle_stance in ('aggressive', 'balanced', 'defensive', 'trickster')),
  add column if not exists bio text not null default '달콤하고 바삭쫀득한 나의 시그니처 디저트 친구예요!',
  add column if not exists likes_count integer not null default 12,
  add column if not exists wins integer not null default 0,
  add column if not exists losses integer not null default 0;

-- 2. 지인 광장 좋아요·이모지·응원 한줄 반응 테이블
create table if not exists public.social_reactions (
  id uuid primary key default gen_random_uuid(),
  from_player uuid not null references public.players (id) on delete cascade,
  from_nickname text not null,
  monster_id uuid not null references public.monsters (id) on delete cascade,
  emoji text not null default '🥄',
  comment text check (comment is null or char_length(comment) <= 60),
  created_at timestamptz not null default now()
);

create index if not exists social_reactions_monster_idx on public.social_reactions (monster_id, created_at desc);

alter table public.social_reactions enable row level security;

create policy "social_reactions_select_authenticated" on public.social_reactions
  for select to authenticated using (true);

create policy "social_reactions_insert_own" on public.social_reactions
  for insert to authenticated with check (from_player = auth.uid());

grant select, insert on public.social_reactions to authenticated;

-- 3. 비동기 식감 ASMR 대전 기록 및 난수 시드 리플레이 테이블
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  challenger_owner uuid not null references public.players (id) on delete cascade,
  challenger_monster_id uuid not null references public.monsters (id) on delete cascade,
  defender_monster_id uuid,
  defender_name text not null,
  seed integer not null,
  winner text not null check (winner in ('challenger', 'defender', 'draw')),
  turns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists battles_challenger_idx on public.battles (challenger_owner, created_at desc);

alter table public.battles enable row level security;

create policy "battles_select_authenticated" on public.battles
  for select to authenticated using (true);

revoke insert, update, delete on public.battles from anon, authenticated;
grant select on public.battles to authenticated;

