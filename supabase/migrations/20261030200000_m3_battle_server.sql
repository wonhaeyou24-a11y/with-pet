-- M3 3a단계: 친선 대전·한입 투표를 서버가 판정한다.
-- 스킬 레벨 저장 칸, 하루 대전 보상 횟수, 대전 기록의 최대 체력(리플레이용)을 추가한다.

alter table public.monsters
  add column if not exists skill_levels jsonb;  -- null 이면 예전 해금/장착 표에서 자동 이전

alter table public.players
  add column if not exists battle_day date,
  add column if not exists battle_rewards int not null default 0;

alter table public.battles
  add column if not exists challenger_max_hp int,
  add column if not exists defender_max_hp int,
  add column if not exists reward_coins int not null default 0;

-- 같은 지인에게 하루 한 번만 투표했는지 빨리 찾기 위한 색인
create index if not exists social_reactions_voter_idx
  on public.social_reactions (from_player, monster_id, created_at desc);
