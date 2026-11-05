-- M5 4a단계: 리본 코인·부티크 구매·일일/주간 미션을 서버(DB)가 판정한다.
-- 이 파일은 scripts/gen-shop-migration.mjs 가 화면 설정(boutique.ts, missions.ts)에서 만든다. 직접 고치지 말고 스크립트를 다시 돌린다.
-- 훈련·타워·대전·돌보기·투표는 이미 서버 함수가 기록(care_logs, battles, social_reactions)을 남기므로,
-- 그 기록이 생길 때 DB 트리거가 리본 코인과 미션 진행을 올린다. 폰이 "했다"고 주장할 방법이 없다.

-- 1. 플레이어 칸: 리본 코인(처음 150 환영 보너스), 보유 아이템, 미션 진행
alter table public.players
  add column if not exists ribbon_coins int not null default 150 check (ribbon_coins >= 0),
  add column if not exists owned_items jsonb not null default '[]'::jsonb,
  add column if not exists missions jsonb not null default '{}'::jsonb,
  add column if not exists ribbon_day date,
  add column if not exists ribbon_earned int not null default 0;

-- 2. 규칙 표 (누구나 읽을 수 있고, 고칠 수 있는 건 서버뿐)
create table if not exists public.shop_items (
  id text primary key,
  price int not null check (price >= 0)
);
create table if not exists public.mission_rules (
  id text primary key,
  kind text not null check (kind in ('daily', 'weekly')),
  target int not null check (target > 0),
  reward_coins int not null default 0,
  reward_ribbons int not null default 0
);
alter table public.shop_items enable row level security;
alter table public.mission_rules enable row level security;
drop policy if exists "shop_items_read" on public.shop_items;
drop policy if exists "mission_rules_read" on public.mission_rules;
create policy "shop_items_read" on public.shop_items for select to authenticated using (true);
create policy "mission_rules_read" on public.mission_rules for select to authenticated using (true);
revoke all on public.shop_items, public.mission_rules from anon, authenticated;
grant select on public.shop_items, public.mission_rules to authenticated;

insert into public.shop_items (id, price) values
  ('base-nest', 0),
  ('base-strawberry-cake', 480),
  ('base-choco-cookie', 350),
  ('base-custard-pudding', 350),
  ('base-macaron-cushion', 520),
  ('base-parfait-cup', 750),
  ('base-coffee-cup', 580),
  ('base-antique-plate', 650),
  ('base-oven-pizza', 620),
  ('base-ramen-pot', 590),
  ('base-cast-iron-pan', 450),
  ('base-ufo-beam', 720),
  ('cream-cherry', 850),
  ('wizard-hat', 1800),
  ('birthday-candle', 910),
  ('star-crown', 2210),
  ('berry-beret', 450),
  ('alchemy-glasses', 850),
  ('sleep-mask', 450),
  ('star-patch', 850),
  ('luxury-clover-earring', 1200),
  ('chanel-camellia-earring', 1150),
  ('dior-pearl-drop', 1350),
  ('tiffany-heart-diamond', 1100),
  ('luxury-gold-hoop', 1180),
  ('cartier-emerald-teardrop', 1380),
  ('starlight-sapphire-earring', 1250),
  ('pink-ribbon-pearl-earring', 1120),
  ('cozy-pompom-earring', 980),
  ('pretzel-ribbon', 850),
  ('rune-scarf', 850),
  ('bell-ribbon', 450),
  ('meteor-wings', 3120),
  ('explorer-pack', 550),
  ('lantern-staff', 2470),
  ('lollipop-wand', 960),
  ('star-wand', 1080),
  ('golden-recipe-grimoire', 2860),
  ('crystal-sugar-shield', 1870),
  ('syrup-glider-blades', 3250),
  ('constellation-aura', 3900),
  ('blossom-breeze', 1390),
  ('crown-emoji-floating', 2280),
  ('wings-meringue-angel', 3120),
  ('aura-galaxy-orbit', 4160),
  ('footprint-honey-dew', 2040),
  ('syrup-drizzle-strawberry', 2550),
  ('syrup-drizzle-choco', 2550),
  ('syrup-drizzle-condensed', 2110),
  ('wafer-roll-pin', 1080),
  ('macaron-beret', 1250),
  ('gold-sugar-powder', 2860),
  ('footprint-strawberry-jam', 1870),
  ('footprint-macaron-crumbs', 1870),
  ('chef-coat-tie', 2210),
  ('tiny-wood-rollingpin', 850),
  ('preppy-school-tie', 850),
  ('vintage-leather-satchel', 960),
  ('bear-knit-suspenders', 850),
  ('sherlock-cape-coat', 2030),
  ('bubble-detective-magnifier', 860),
  ('round-gold-spectacles', 850),
  ('spring-cherry-blossom-beret', 1010),
  ('spring-picnic-basket', 860),
  ('summer-marine-sailor-collar', 910),
  ('summer-cool-sunglasses', 700),
  ('autumn-maple-knit-muffler', 770),
  ('autumn-artist-palette', 850),
  ('winter-fluffy-earmuffs', 680),
  ('winter-snow-padded-vest', 2130),
  ('astral-sorcerer-hood', 1100),
  ('crystal-monocle', 850),
  ('celestial-wizard-robe', 2210),
  ('arcane-sugar-grimoire', 910),
  ('fairy-sugar-winged-circlet', 1030),
  ('moonlight-velvet-choker', 680),
  ('arcane-rune-mask', 730),
  ('celestial-meteor-staff', 2130),
  ('party-confetti-cone-hat', 700),
  ('masquerade-feather-eyemask', 860),
  ('masquerade-tuxedo-bowtie', 1010),
  ('sparkler-party-firework', 940),
  ('champagne-cork-topper', 2130),
  ('birthday-cake-ruffle-collar', 1150),
  ('party-whistle-blower', 620),
  ('royal-party-champagne-glass', 960),
  ('iphone-headset', 910),
  ('street-ball-cap', 640),
  ('knit-beanie-hat', 570),
  ('pastry-chef-toque', 850),
  ('angel-holy-halo', 1800),
  ('pince-nez-retro-specs', 850),
  ('round-tortoise-glasses', 530),
  ('cyber-pixel-shades', 850),
  ('lovely-heart-sunglasses', 640),
  ('xmas-santa-fur-hat', 860),
  ('xmas-holy-cape', 1010),
  ('birthday-party-cone-deluxe', 570),
  ('party-blower-flute', 480),
  ('taeguk-glory-headband', 850),
  ('taeguk-hero-cape', 1800),
  ('travel-roller-suitcase', 940),
  ('surfing-wave-board', 1010),
  ('snow-polar-sled-board', 1030),
  ('snorkel-dive-mask', 620),
  ('vintage-film-camera', 850),
  ('lux-gold-rolex-watch', 1800),
  ('lux-tweed-pearl-beret', 1800),
  ('lux-hermes-silk-twilly', 910),
  ('lux-cartier-trinity-ring', 1800),
  ('lux-diamond-camellia-brooch', 1800),
  ('lux-celebrity-oversized-shades', 850),
  ('room-patisserie', 0),
  ('room-paris-eiffel', 480),
  ('room-fuji-cherry', 450),
  ('room-ny-brooklyn', 520),
  ('room-london-bigben', 460),
  ('room-hawaii-sunset', 430),
  ('room-swiss-alps', 490),
  ('room-rome-colosseum', 440),
  ('room-arctic-aurora', 550),
  ('room-jeju-canola', 380),
  ('room-cherry-blossom-lake', 420),
  ('room-moonlight-bamboo', 460),
  ('room-tropical-ocean', 390),
  ('room-galaxy', 880),
  ('room-berry', 550),
  ('room-vintage', 600),
  ('sofa-macaron', 0),
  ('table-pretzel', 300),
  ('trampoline-jelly', 550),
  ('showcase-dessert', 680),
  ('lamp-starlight', 250),
  ('fountain-choco', 850),
  ('sofa-parfait', 920),
  ('lamp-fondue', 400),
  ('stool-macaron', 350),
  ('clock-pretzel', 300),
  ('rug-waffle', 450),
  ('furn-eiffel-tower-lamp', 520),
  ('furn-cozy-camping-tent', 580),
  ('furn-classic-luggage-stand', 360),
  ('furn-giant-birthday-cake', 640),
  ('furn-cozy-xmas-fireplace', 690),
  ('furn-tropical-surf-rack', 480)
on conflict (id) do update set price = excluded.price;

insert into public.mission_rules (id, kind, target, reward_coins, reward_ribbons) values
  ('d-care', 'daily', 2, 40, 10),
  ('d-train', 'daily', 1, 50, 15),
  ('d-battle', 'daily', 1, 60, 20),
  ('w-battle-win', 'weekly', 3, 150, 50),
  ('w-tower', 'weekly', 5, 120, 40),
  ('w-social', 'weekly', 5, 100, 35)
on conflict (id) do update set kind = excluded.kind, target = excluded.target, reward_coins = excluded.reward_coins, reward_ribbons = excluded.reward_ribbons;

-- 3. 미션 진행 정리: 한국 시각 기준으로 날짜가 바뀌면 일일, 주(월요일)가 바뀌면 주간 미션을 0으로
create or replace function public._mission_normalize(m jsonb) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  today text := to_char((now() at time zone 'Asia/Seoul')::date, 'YYYY-MM-DD');
  wk text := to_char((now() at time zone 'Asia/Seoul')::date, 'IYYY-"W"IW');
  out jsonb := coalesce(m, '{}'::jsonb);
  r record;
begin
  if jsonb_typeof(out->'counts') is distinct from 'object' then out := jsonb_set(out, '{counts}', '{}'::jsonb, true); end if;
  if jsonb_typeof(out->'claimed') is distinct from 'object' then out := jsonb_set(out, '{claimed}', '{}'::jsonb, true); end if;
  if coalesce(out->>'day', '') <> today then
    for r in select id from public.mission_rules where kind = 'daily' loop
      out := jsonb_set(out, array['counts', r.id], '0'::jsonb, true);
      out := jsonb_set(out, array['claimed', r.id], 'false'::jsonb, true);
    end loop;
    out := jsonb_set(out, '{day}', to_jsonb(today), true);
  end if;
  if coalesce(out->>'week', '') <> wk then
    for r in select id from public.mission_rules where kind = 'weekly' loop
      out := jsonb_set(out, array['counts', r.id], '0'::jsonb, true);
      out := jsonb_set(out, array['claimed', r.id], 'false'::jsonb, true);
    end loop;
    out := jsonb_set(out, '{week}', to_jsonb(wk), true);
  end if;
  return out;
end $$;

-- 4. 활동이 생겼을 때 미션 진행과 리본 코인을 올린다 (트리거에서만 호출, 하루 리본 획득 상한 300)
create or replace function public._game_event(p_owner uuid, p_mission text, p_amount int, p_ribbon int) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  m jsonb;
  today date := (now() at time zone 'Asia/Seoul')::date;
  earned int;
  grant_r int := 0;
  cap constant int := 300;
begin
  select * into p from public.players where id = p_owner for update;
  if not found then return; end if;
  m := public._mission_normalize(p.missions);
  if p_mission is not null and p_amount > 0 and exists (select 1 from public.mission_rules where id = p_mission) then
    m := jsonb_set(m, array['counts', p_mission], to_jsonb(coalesce((m->'counts'->>p_mission)::int, 0) + p_amount), true);
  end if;
  earned := case when p.ribbon_day = today then p.ribbon_earned else 0 end;
  if p_ribbon > 0 then grant_r := greatest(0, least(p_ribbon, cap - earned)); end if;
  update public.players
    set missions = m,
        ribbon_coins = ribbon_coins + grant_r,
        ribbon_day = today,
        ribbon_earned = earned + grant_r
    where id = p_owner;
end $$;
revoke all on function public._game_event(uuid, text, int, int) from public, anon, authenticated;
revoke all on function public._mission_normalize(jsonb) from public, anon, authenticated;

-- 5. 트리거: 서버 함수가 남기는 기록이 곧 활동의 증거
create or replace function public._trg_care_log() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a text := new.action;
  rg text[];
  floors int;
begin
  if a = 'feed' then
    perform public._game_event(new.owner, 'd-care', 1, 0);
  elsif a = 'play' then
    perform public._game_event(new.owner, null, 0, 5);
  elsif a = 'rest' then
    perform public._game_event(new.owner, null, 0, 15);
  elsif a like 'train\_%' then
    perform public._game_event(new.owner, 'd-train', 1, 15);
  elsif a = 'tower' then
    rg := regexp_match(coalesce(new.detail, ''), '^(\d+)~(\d+)');
    floors := case when rg is null then 1 else greatest(1, rg[2]::int - rg[1]::int + 1) end;
    perform public._game_event(new.owner, 'w-tower', floors, 20 * floors);
  end if;
  return new;
end $$;
revoke all on function public._trg_care_log() from public, anon, authenticated;
drop trigger if exists care_log_rewards on public.care_logs;
create trigger care_log_rewards after insert on public.care_logs for each row execute function public._trg_care_log();

create or replace function public._trg_battle() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._game_event(new.challenger_owner, 'd-battle', 1, case when new.reward_coins > 0 then (case when new.winner = 'challenger' then 30 else 10 end) else 0 end);
  if new.winner = 'challenger' then
    perform public._game_event(new.challenger_owner, 'w-battle-win', 1, 0);
  end if;
  return new;
end $$;
revoke all on function public._trg_battle() from public, anon, authenticated;
drop trigger if exists battle_rewards on public.battles;
create trigger battle_rewards after insert on public.battles for each row execute function public._trg_battle();

create or replace function public._trg_reaction() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._game_event(new.from_player, 'w-social', 1, 0);
  return new;
end $$;
revoke all on function public._trg_reaction() from public, anon, authenticated;
drop trigger if exists reaction_rewards on public.social_reactions;
create trigger reaction_rewards after insert on public.social_reactions for each row execute function public._trg_reaction();

-- 한입 투표는 서버 함수(battle)만 남길 수 있다: 화면이 직접 기록을 만들어 미션·보상을 올리는 길을 막는다
revoke insert on public.social_reactions from authenticated;
drop policy if exists "social_reactions_insert_own" on public.social_reactions;

-- 6. 화면이 부르는 함수 3개 (로그인한 본인 것만)
create or replace function public.shop_state() returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  m jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into p from public.players where id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_player', 'message', '플레이어 정보를 찾지 못했어요.'); end if;
  m := public._mission_normalize(p.missions);
  if m is distinct from p.missions then update public.players set missions = m where id = uid; end if;
  return jsonb_build_object('ok', true, 'ribbon', p.ribbon_coins, 'coins', p.coins, 'owned', p.owned_items,
    'day', m->>'day', 'week', m->>'week', 'counts', m->'counts', 'claimed', m->'claimed');
end $$;

create or replace function public.shop_buy(p_item text) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  it record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into it from public.shop_items where id = p_item;
  if not found then return jsonb_build_object('ok', false, 'code', 'bad_item', 'message', '없는 상품이에요.'); end if;
  select * into p from public.players where id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_player', 'message', '플레이어 정보를 찾지 못했어요.'); end if;
  if p.owned_items ? p_item or p_item = any(array['berry-beret', 'sleep-mask', 'bell-ribbon', 'room-patisserie', 'sofa-macaron', 'nest', 'base-nest']) then
    return jsonb_build_object('ok', false, 'code', 'owned', 'message', '이미 소유하고 있는 아이템입니다.');
  end if;
  if p.ribbon_coins < it.price then
    return jsonb_build_object('ok', false, 'code', 'no_ribbons', 'message', '슈가 리본 코인이 부족합니다! (필요: ' || it.price || ' 🎀)');
  end if;
  update public.players set ribbon_coins = ribbon_coins - it.price, owned_items = owned_items || to_jsonb(p_item) where id = uid;
  return jsonb_build_object('ok', true, 'ribbon', p.ribbon_coins - it.price, 'owned', p.owned_items || to_jsonb(p_item), 'message', '구매가 완료되었습니다! 언제든 착용할 수 있어요.');
end $$;

create or replace function public.shop_claim_mission(p_mission text) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  r record;
  m jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into r from public.mission_rules where id = p_mission;
  if not found then return jsonb_build_object('ok', false, 'code', 'bad_mission', 'message', '존재하지 않는 미션입니다.'); end if;
  select * into p from public.players where id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_player', 'message', '플레이어 정보를 찾지 못했어요.'); end if;
  m := public._mission_normalize(p.missions);
  if coalesce((m->'claimed'->>p_mission)::boolean, false) then
    return jsonb_build_object('ok', false, 'code', 'claimed', 'message', '이미 보상을 수령한 미션입니다.');
  end if;
  if coalesce((m->'counts'->>p_mission)::int, 0) < r.target then
    return jsonb_build_object('ok', false, 'code', 'not_yet', 'message', '아직 미션 목표를 달성하지 못했습니다.');
  end if;
  m := jsonb_set(m, array['claimed', p_mission], 'true'::jsonb, true);
  update public.players set missions = m, coins = coins + r.reward_coins, ribbon_coins = ribbon_coins + r.reward_ribbons where id = uid;
  return jsonb_build_object('ok', true, 'coins', p.coins + r.reward_coins, 'ribbon', p.ribbon_coins + r.reward_ribbons,
    'rewardCoins', r.reward_coins, 'rewardRibbons', r.reward_ribbons,
    'message', '🎉 미션 완료! 🪙 +' || r.reward_coins || ' 코인, 🎀 +' || r.reward_ribbons || ' 리본 코인을 받았습니다!');
end $$;

revoke all on function public.shop_state(), public.shop_buy(text), public.shop_claim_mission(text) from public, anon;
grant execute on function public.shop_state(), public.shop_buy(text), public.shop_claim_mission(text) to authenticated;
