-- M5 4b단계: 마이룸(테마·가구·좋아요·방문자)·방명록(답글·삭제)·꾸민 몬스터 모습을 서버(DB)에 저장한다.
-- 쓰기는 모두 로그인한 본인이 DB 함수를 통해서만 한다 (화면이 표를 직접 고칠 수 없다). 읽기는 로그인한 지인 모두 가능.
-- 기획: 신고 기능 없이 "내 방명록의 글은 내가 삭제할 수 있다"(방 주인은 모든 글, 작성자는 자기 글).

-- 1. 꾸민 몬스터 모습 (장식·변신·시럽 등). 광장에서 지인들이 이 모습을 본다.
alter table public.monsters add column if not exists look_custom jsonb;

-- 2. 마이룸 설정
create table if not exists public.room_settings (
  owner uuid primary key references public.players (id) on delete cascade,
  theme_id text not null default 'room-patisserie',
  furniture jsonb not null default '["sofa-macaron","lamp-starlight"]'::jsonb,
  likes int not null default 0,
  updated_at timestamptz not null default now()
);

-- 방문 기록(하루 한 번)과 좋아요(하루 한 번)
create table if not exists public.room_visits (
  visitor uuid not null references public.players (id) on delete cascade,
  owner uuid not null references public.players (id) on delete cascade,
  day date not null,
  primary key (visitor, owner, day)
);
create table if not exists public.room_likes (
  visitor uuid not null references public.players (id) on delete cascade,
  owner uuid not null references public.players (id) on delete cascade,
  day date not null,
  primary key (visitor, owner, day)
);
create index if not exists room_visits_owner_idx on public.room_visits (owner, day);

-- 3. 방명록 (글 + 한 단계 답글)
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  room_owner uuid not null references public.players (id) on delete cascade,
  author uuid not null references public.players (id) on delete cascade,
  author_name text not null,
  message text not null check (char_length(message) between 1 and 120),
  parent_id uuid references public.guestbook_entries (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists guestbook_room_idx on public.guestbook_entries (room_owner, created_at desc);
create index if not exists guestbook_author_idx on public.guestbook_entries (author, created_at desc);

alter table public.room_settings enable row level security;
alter table public.room_visits enable row level security;
alter table public.room_likes enable row level security;
alter table public.guestbook_entries enable row level security;
drop policy if exists "room_settings_read" on public.room_settings;
drop policy if exists "guestbook_read" on public.guestbook_entries;
create policy "room_settings_read" on public.room_settings for select to authenticated using (true);
create policy "guestbook_read" on public.guestbook_entries for select to authenticated using (true);
revoke all on public.room_settings, public.room_visits, public.room_likes, public.guestbook_entries from anon, authenticated;
grant select on public.room_settings, public.guestbook_entries to authenticated;

-- 4. 도우미: 이 아이템을 쓸 수 있는가 (산 아이템 + 기본 지급 아이템). 기본 지급 목록은 src/config/boutique.ts 의 DEFAULT_OWNED_ITEMS 와 같아야 한다 (npm run test:room 이 확인).
create or replace function public._item_ok(p_owned jsonb, p_item text) returns boolean
language sql
immutable
set search_path = public
as $$
  select (p_owned ? p_item) or p_item = any(array['berry-beret', 'sleep-mask', 'bell-ribbon', 'room-patisserie', 'sofa-macaron', 'nest', 'base-nest'])
$$;
revoke all on function public._item_ok(jsonb, text) from public, anon, authenticated;

-- 5. 방 보기 (p_owner 를 비우면 내 방). 지인의 방을 열면 오늘의 방문으로 기록한다.
create or replace function public.room_get(p_owner uuid default null) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  o uuid;
  ow record;
  s record;
  today date := (now() at time zone 'Asia/Seoul')::date;
  entries jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  o := coalesce(p_owner, uid);
  select * into ow from public.players where id = o;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_room', 'message', '이 지인의 방을 찾지 못했어요.'); end if;
  insert into public.room_settings (owner) values (o) on conflict do nothing;
  select * into s from public.room_settings where owner = o;
  if uid <> o then
    insert into public.room_visits (visitor, owner, day) values (uid, o, today) on conflict do nothing;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'authorId', g.author, 'author', g.author_name, 'message', g.message,
           'parentId', g.parent_id, 'createdAt', g.created_at) order by g.created_at desc), '[]'::jsonb)
    into entries
    from (select * from public.guestbook_entries where room_owner = o order by created_at desc limit 120) g;
  return jsonb_build_object('ok', true, 'me', uid, 'isOwner', uid = o, 'ownerName', ow.nickname,
    'theme', s.theme_id, 'furniture', s.furniture, 'likes', s.likes,
    'todayVisitors', (select count(*) from public.room_visits where owner = o and day = today),
    'totalVisitors', (select count(*) from public.room_visits where owner = o),
    'likedToday', exists (select 1 from public.room_likes where visitor = uid and owner = o and day = today),
    'entries', entries);
end $$;

-- 6. 내 방 꾸미기 저장 (산 테마·가구만, 가구는 12개까지)
create or replace function public.room_save(p_theme text, p_furniture jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  f text;
  clean jsonb := '[]'::jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into p from public.players where id = uid;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_player', 'message', '플레이어 정보를 찾지 못했어요.'); end if;
  if p_theme is null or p_theme not like 'room-%' or not exists (select 1 from public.shop_items where id = p_theme) or not public._item_ok(p.owned_items, p_theme) then
    return jsonb_build_object('ok', false, 'code', 'bad_theme', 'message', '아직 구매하지 않은 테마입니다. 부티크에서 구매해보세요!');
  end if;
  if jsonb_typeof(p_furniture) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'code', 'bad_furniture', 'message', '가구 목록이 올바르지 않아요.');
  end if;
  for f in select jsonb_array_elements_text(p_furniture) loop
    if f like 'room-%' or not exists (select 1 from public.shop_items where id = f) or not public._item_ok(p.owned_items, f) then
      return jsonb_build_object('ok', false, 'code', 'bad_furniture', 'message', '아직 구매하지 않은 가구입니다. 부티크에서 구매해보세요!');
    end if;
    if not (clean ? f) then clean := clean || to_jsonb(f); end if;
  end loop;
  if jsonb_array_length(clean) > 12 then
    return jsonb_build_object('ok', false, 'code', 'too_many', 'message', '가구는 12개까지 놓을 수 있어요.');
  end if;
  insert into public.room_settings (owner, theme_id, furniture, updated_at) values (uid, p_theme, clean, now())
    on conflict (owner) do update set theme_id = excluded.theme_id, furniture = excluded.furniture, updated_at = now();
  return jsonb_build_object('ok', true, 'theme', p_theme, 'furniture', clean);
end $$;

-- 7. 방 좋아요 (지인의 방에 하루 한 번, 🎀 +5, 주간 미션 "지인 응원" +1)
create or replace function public.room_like(p_owner uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Seoul')::date;
  n int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  if p_owner is null or p_owner = uid then return jsonb_build_object('ok', false, 'code', 'self', 'message', '내 방에는 좋아요를 누를 수 없어요.'); end if;
  if not exists (select 1 from public.players where id = p_owner) then
    return jsonb_build_object('ok', false, 'code', 'no_room', 'message', '이 지인의 방을 찾지 못했어요.');
  end if;
  insert into public.room_likes (visitor, owner, day) values (uid, p_owner, today) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', false, 'code', 'liked', 'message', '오늘은 이미 이 방에 하트를 보냈어요!'); end if;
  insert into public.room_settings (owner, likes) values (p_owner, 1)
    on conflict (owner) do update set likes = public.room_settings.likes + 1;
  perform public._game_event(uid, 'w-social', 1, 5);
  return jsonb_build_object('ok', true, 'likes', (select likes from public.room_settings where owner = p_owner));
end $$;

-- 8. 방명록 쓰기 (글 1~120자, 답글은 글 아래 한 단계만, 하루 40개까지)
--    지인 방에 글 🎀 +10 & 주간 미션 +1, 답글 🎀 +5 (하루 리본 획득 상한은 그대로 적용)
create or replace function public.guestbook_add(p_owner uuid, p_message text, p_parent uuid default null) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  me record;
  msg text := btrim(coalesce(p_message, ''));
  par record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  if char_length(msg) < 1 or char_length(msg) > 120 then
    return jsonb_build_object('ok', false, 'code', 'bad_message', 'message', '방명록은 1~120자로 써 주세요.');
  end if;
  select * into me from public.players where id = uid;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_player', 'message', '플레이어 정보를 찾지 못했어요.'); end if;
  if not exists (select 1 from public.players where id = p_owner) then
    return jsonb_build_object('ok', false, 'code', 'no_room', 'message', '이 지인의 방을 찾지 못했어요.');
  end if;
  if (select count(*) from public.guestbook_entries where author = uid and created_at > now() - interval '24 hours') >= 40 then
    return jsonb_build_object('ok', false, 'code', 'too_many', 'message', '오늘은 방명록을 많이 남겼어요. 내일 또 남겨 주세요!');
  end if;
  if p_parent is not null then
    select * into par from public.guestbook_entries where id = p_parent;
    if not found or par.room_owner <> p_owner or par.parent_id is not null then
      return jsonb_build_object('ok', false, 'code', 'bad_parent', 'message', '답글을 달 글을 찾지 못했어요.');
    end if;
  end if;
  insert into public.guestbook_entries (room_owner, author, author_name, message, parent_id) values (p_owner, uid, me.nickname, msg, p_parent);
  if p_parent is null and p_owner <> uid then
    perform public._game_event(uid, 'w-social', 1, 10);
  elsif p_parent is not null then
    perform public._game_event(uid, null, 0, 5);
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- 9. 방명록 삭제: 방 주인은 모든 글, 작성자는 자기 글 (답글은 함께 지워진다)
create or replace function public.guestbook_delete(p_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into g from public.guestbook_entries where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'gone', 'message', '이미 지워진 글이에요.'); end if;
  if g.author <> uid and g.room_owner <> uid then
    return jsonb_build_object('ok', false, 'code', 'forbidden', 'message', '내 방의 글이거나 내가 쓴 글만 지울 수 있어요.');
  end if;
  delete from public.guestbook_entries where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- 10. 꾸민 몬스터 모습 저장: 내 몬스터만, 크기 제한, 산 장식만 남긴다
create or replace function public.look_save(p_monster uuid, p_custom jsonb) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p record;
  mo record;
  decor jsonb;
  clean_decor jsonb := '{}'::jsonb;
  k text;
  v jsonb;
  clean jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into mo from public.monsters where id = p_monster and owner = uid;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_monster', 'message', '내 몬스터를 찾지 못했어요.'); end if;
  if jsonb_typeof(p_custom) is distinct from 'object' or length(p_custom::text) > 24000 then
    return jsonb_build_object('ok', false, 'code', 'bad_look', 'message', '꾸민 모습이 너무 크거나 올바르지 않아요.');
  end if;
  select * into p from public.players where id = uid;
  decor := coalesce(p_custom->'decorations', '{}'::jsonb);
  if jsonb_typeof(decor) = 'object' then
    for k, v in select * from jsonb_each(decor) loop
      if k = 'dye' then
        if jsonb_typeof(v) = 'number' then clean_decor := jsonb_set(clean_decor, array[k], v, true); end if;
      elsif k in ('head', 'face', 'neck', 'back', 'hand', 'bg', 'effect') and jsonb_typeof(v) = 'string' then
        if public._item_ok(p.owned_items, v #>> '{}') and exists (select 1 from public.shop_items where id = v #>> '{}') then
          clean_decor := jsonb_set(clean_decor, array[k], v, true);
        end if;
      end if;
    end loop;
  end if;
  clean := jsonb_set(p_custom, '{decorations}', clean_decor, true);
  update public.monsters set look_custom = clean where id = mo.id;
  return jsonb_build_object('ok', true, 'look', clean);
end $$;

revoke all on function public.room_get(uuid), public.room_save(text, jsonb), public.room_like(uuid), public.guestbook_add(uuid, text, uuid), public.guestbook_delete(uuid), public.look_save(uuid, jsonb) from public, anon;
grant execute on function public.room_get(uuid), public.room_save(text, jsonb), public.room_like(uuid), public.guestbook_add(uuid, text, uuid), public.guestbook_delete(uuid), public.look_save(uuid, jsonb) to authenticated;
