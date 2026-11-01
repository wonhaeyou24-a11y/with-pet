-- M5 추가 보안 & 동시성 패치:
-- 1. 한입 투표 동시성(Race Condition) 방어: 동일 유저의 동일 대상 당일 중복 투표 유니크 제약
-- 2. 광장 지인 몬스터 최소 권한 공개 뷰 (Zero-Trust Security View)

-- 1. 한입 투표 당일 유니크 제약
alter table public.social_reactions
  add column if not exists vote_day date not null default ((now() at time zone 'Asia/Seoul')::date);

create unique index if not exists social_reactions_voter_unique_idx
  on public.social_reactions (from_player, monster_id, vote_day);

-- 2. 광장 공개 뷰: 개인의 민감 스탯 및 재화 정보 노출 차단, 광장에 필요한 속성만 제공
create or replace view public.plaza_monsters with (security_invoker = false) as
  select
    m.id,
    m.owner,
    m.name,
    m.species,
    m.element,
    m.parts,
    m.level,
    m.likes_count,
    m.bio,
    m.current_stage,
    m.stage,
    m.morph_stage,
    m.active_skin,
    m.active_syrup,
    m.active_decoration,
    m.active_dough,
    p.nickname as owner_nickname
  from public.monsters m
  left join public.players p on p.id = m.owner
  where m.name is not null;

grant select on public.plaza_monsters to authenticated;
