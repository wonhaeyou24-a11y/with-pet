// 장비·강화 수치표(src/config/equipment.ts)에서 DB 마이그레이션을 만든다.
//   node scripts/gen-gear-migration.mjs   → supabase/migrations/20261031200000_m5_gear.sql 갱신
//   (npm run test:gear 가 같은 결과인지 확인해서 화면 설정과 DB 표가 어긋나지 않게 한다)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  GEAR_BAG_LIMIT,
  GEAR_BOSS_EVERY,
  GEAR_DEFS,
  GEAR_DROPS,
  GEAR_ENHANCE,
  GEAR_LEVEL_BONUS,
  GEAR_MAX_LEVEL,
} from '../src/config/equipment.ts'

export const OUT = 'supabase/migrations/20261031200000_m5_gear.sql'

export function buildGearMigration() {
  const denom = Math.round(1 / GEAR_LEVEL_BONUS)
  const defRows = GEAR_DEFS.map(
    (d) => `  ('${d.id}', '${d.slot}', '${d.grade}', '${JSON.stringify(d.bonus)}'::jsonb, ${d.price === null ? 'null' : d.price})`,
  ).join(',\n')
  const enhRows = GEAR_ENHANCE.map((r) => `  (${r.level}, ${r.chance}, ${r.cost})`).join(',\n')
  const dropRows = GEAR_DROPS.map((r) => `  (${r.minFloor}, '${r.grade}', ${r.weight})`).join(',\n')
  return `-- M5 장비·강화: 장비 표·강화 규칙·타워 드롭 규칙과 소유 장비를 서버(DB)가 판정한다.
-- 이 파일은 scripts/gen-gear-migration.mjs 가 화면 설정(src/config/equipment.ts)에서 만든다. 직접 고치지 말고 스크립트를 다시 돌린다.
-- 코인 차감·강화 성공 여부(random)·드롭은 모두 아래 함수 안에서만 일어나고, 폰은 결과만 받는다.

-- 1. 규칙 표 (누구나 읽을 수 있고, 고칠 수 있는 건 서버뿐)
create table if not exists public.gear_defs (
  id text primary key,
  slot text not null check (slot in ('weapon', 'armor', 'charm')),
  grade text not null check (grade in ('common', 'fine', 'rare', 'legend')),
  bonus jsonb not null,
  price int check (price is null or price > 0)
);
create table if not exists public.gear_enhance_rules (
  level int primary key check (level between 1 and ${GEAR_MAX_LEVEL}),
  chance int not null check (chance between 1 and 100),
  cost int not null check (cost >= 0)
);
create table if not exists public.gear_drop_rules (
  min_floor int not null,
  grade text not null check (grade in ('common', 'fine', 'rare', 'legend')),
  weight int not null check (weight > 0),
  primary key (min_floor, grade)
);
alter table public.gear_defs enable row level security;
alter table public.gear_enhance_rules enable row level security;
alter table public.gear_drop_rules enable row level security;
drop policy if exists "gear_defs_read" on public.gear_defs;
drop policy if exists "gear_enhance_rules_read" on public.gear_enhance_rules;
drop policy if exists "gear_drop_rules_read" on public.gear_drop_rules;
create policy "gear_defs_read" on public.gear_defs for select to authenticated using (true);
create policy "gear_enhance_rules_read" on public.gear_enhance_rules for select to authenticated using (true);
create policy "gear_drop_rules_read" on public.gear_drop_rules for select to authenticated using (true);
revoke all on public.gear_defs, public.gear_enhance_rules, public.gear_drop_rules from anon, authenticated;
grant select on public.gear_defs, public.gear_enhance_rules, public.gear_drop_rules to authenticated;

delete from public.gear_defs where id <> all (array[${GEAR_DEFS.map((d) => `'${d.id}'`).join(', ')}]);
insert into public.gear_defs (id, slot, grade, bonus, price) values
${defRows}
on conflict (id) do update set slot = excluded.slot, grade = excluded.grade, bonus = excluded.bonus, price = excluded.price;

delete from public.gear_enhance_rules;
insert into public.gear_enhance_rules (level, chance, cost) values
${enhRows};

delete from public.gear_drop_rules;
insert into public.gear_drop_rules (min_floor, grade, weight) values
${dropRows};

-- 2. 소유 장비: 읽기는 로그인한 누구나(지인 카드에 보여 줄 수 있게), 쓰기는 아래 함수만
create table if not exists public.gear_items (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  def_id text not null references public.gear_defs(id),
  slot text not null,
  level int not null default 0 check (level between 0 and ${GEAR_MAX_LEVEL}),
  monster_id uuid references public.monsters(id) on delete set null,
  source text not null default 'shop',
  created_at timestamptz not null default now()
);
create index if not exists gear_items_owner_idx on public.gear_items (owner);
create unique index if not exists gear_items_monster_slot_uidx on public.gear_items (monster_id, slot) where monster_id is not null;
alter table public.gear_items enable row level security;
drop policy if exists "gear_items_read" on public.gear_items;
create policy "gear_items_read" on public.gear_items for select to authenticated using (true);
revoke all on public.gear_items from anon, authenticated;
grant select on public.gear_items to authenticated;

-- 3. 내부 도우미: 이 몬스터가 낀 장비의 능력치 합계 (대전·타워 계산용, 로그인한 사용자는 직접 부를 수 없다)
create or replace function public.gear_bonus(p_monster uuid) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from (
    select e.key as k, sum(round((e.value)::numeric * (${denom} + i.level) / ${denom}.0))::int as v
      from public.gear_items i
      join public.gear_defs d on d.id = i.def_id
      cross join lateral jsonb_each_text(d.bonus) as e(key, value)
     where i.monster_id = p_monster
     group by e.key
  ) t
$$;
revoke all on function public.gear_bonus(uuid) from public, anon, authenticated;

-- 4. 내부 도우미: 타워 ${GEAR_BOSS_EVERY}층마다 있는 보스 층을 지나면 장비를 한 개씩 준다 (care 함수가 부른다)
create or replace function public.gear_tower_drop(p_owner uuid, p_from int, p_to int) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  f int;
  rule_floor int;
  total int;
  pick int;
  acc int;
  r record;
  g text;
  d record;
  got jsonb := '[]'::jsonb;
  have int;
begin
  select count(*) into have from public.gear_items where owner = p_owner;
  for f in select x from generate_series(p_from, p_to) x where x % ${GEAR_BOSS_EVERY} = 0 loop
    exit when have >= ${GEAR_BAG_LIMIT};
    select max(min_floor) into rule_floor from public.gear_drop_rules where min_floor <= f;
    continue when rule_floor is null;
    select sum(weight) into total from public.gear_drop_rules where min_floor = rule_floor;
    pick := floor(random() * total)::int;
    acc := 0;
    g := null;
    for r in select grade, weight from public.gear_drop_rules where min_floor = rule_floor order by grade loop
      acc := acc + r.weight;
      if pick < acc then g := r.grade; exit; end if;
    end loop;
    continue when g is null;
    select * into d from public.gear_defs where grade = g order by random() limit 1;
    continue when not found;
    insert into public.gear_items (owner, def_id, slot, source) values (p_owner, d.id, d.slot, 'tower');
    have := have + 1;
    got := got || jsonb_build_object('floor', f, 'def', d.id);
  end loop;
  return got;
end $$;
revoke all on function public.gear_tower_drop(uuid, int, int) from public, anon, authenticated;

-- 5. 화면이 부르는 함수 (로그인한 사용자 본인 것만)
create or replace function public.gear_list() returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  return jsonb_build_object(
    'ok', true,
    'coins', coalesce((select coins from public.players where id = uid), 0),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'def', i.def_id, 'level', i.level, 'monster', i.monster_id) order by i.created_at, i.id)
        from public.gear_items i where i.owner = uid
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.gear_buy(p_def text) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d record;
  have int;
  left_coins int;
  new_id uuid;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into d from public.gear_defs where id = p_def;
  if not found or d.price is null then return jsonb_build_object('ok', false, 'code', 'not_for_sale', 'message', '상점에서 파는 장비가 아니에요.'); end if;
  select count(*) into have from public.gear_items where owner = uid;
  if have >= ${GEAR_BAG_LIMIT} then return jsonb_build_object('ok', false, 'code', 'bag_full', 'message', '장비 가방이 가득 찼어요. (최대 ${GEAR_BAG_LIMIT}개)'); end if;
  update public.players set coins = coins - d.price where id = uid and coins >= d.price returning coins into left_coins;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_coins', 'message', '코인이 부족해요. (필요: ' || d.price || ' 🪙)'); end if;
  insert into public.gear_items (owner, def_id, slot, source) values (uid, d.id, d.slot, 'shop') returning id into new_id;
  return jsonb_build_object('ok', true, 'coins', left_coins, 'item', new_id, 'message', '장비를 샀어요!');
end $$;

create or replace function public.gear_equip(p_item uuid, p_monster uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  it record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into it from public.gear_items where id = p_item and owner = uid for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_item', 'message', '장비를 찾지 못했어요.'); end if;
  if p_monster is null then
    update public.gear_items set monster_id = null where id = it.id;
    return jsonb_build_object('ok', true, 'message', '장비를 벗었어요.');
  end if;
  if not exists (select 1 from public.monsters where id = p_monster and owner = uid) then
    return jsonb_build_object('ok', false, 'code', 'no_monster', 'message', '내 몬스터가 아니에요.');
  end if;
  update public.gear_items set monster_id = null where monster_id = p_monster and slot = it.slot and id <> it.id and owner = uid;
  update public.gear_items set monster_id = p_monster where id = it.id;
  return jsonb_build_object('ok', true, 'message', '장비를 착용했어요!');
end $$;

create or replace function public.gear_enhance(p_item uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  it record;
  rule record;
  left_coins int;
  won boolean;
  new_level int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into it from public.gear_items where id = p_item and owner = uid for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_item', 'message', '장비를 찾지 못했어요.'); end if;
  if it.level >= ${GEAR_MAX_LEVEL} then return jsonb_build_object('ok', false, 'code', 'max', 'message', '이미 최대 단계예요.'); end if;
  select * into rule from public.gear_enhance_rules where level = it.level + 1;
  if not found then return jsonb_build_object('ok', false, 'code', 'max', 'message', '더 강화할 수 없어요.'); end if;
  update public.players set coins = coins - rule.cost where id = uid and coins >= rule.cost returning coins into left_coins;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_coins', 'message', '코인이 부족해요. (필요: ' || rule.cost || ' 🪙)'); end if;
  won := (random() * 100) < rule.chance;
  new_level := it.level;
  if won then
    new_level := it.level + 1;
    update public.gear_items set level = new_level where id = it.id;
  end if;
  return jsonb_build_object(
    'ok', true, 'success', won, 'level', new_level, 'coins', left_coins, 'spent', rule.cost,
    'message', case when won then '강화 성공! +' || new_level || ' 단계가 됐어요 ✨' else '아쉽게 실패했어요. 장비는 그대로예요.' end
  );
end $$;

revoke all on function public.gear_list(), public.gear_buy(text), public.gear_equip(uuid, uuid), public.gear_enhance(uuid) from public, anon;
grant execute on function public.gear_list(), public.gear_buy(text), public.gear_equip(uuid, uuid), public.gear_enhance(uuid) to authenticated;
`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, buildGearMigration())
  console.log('쓴 파일:', OUT, '/ 장비', GEAR_DEFS.length, '/ 강화 단계', GEAR_ENHANCE.length)
}
