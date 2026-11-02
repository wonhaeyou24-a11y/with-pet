-- 136개 모든 부티크 아이템 (신규 패션 91종, 룸 테마 16종, 가구 17종, 받침대 12종) 가격표 및 구매 함수 동기화
-- Supabase SQL Editor에서 이 쿼리를 실행하면 서버에서도 136개 모든 아이템이 정상 구매됩니다.

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
  ('base-snow-mountain', 620),
  ('base-cast-iron-pan', 450),
  ('base-ufo-beam', 720),
  ('base-eiffel-tower', 680),
  ('base-mini-car', 590),
  ('base-motorcycle', 640),
  ('cream-cherry', 350),
  ('wizard-hat', 650),
  ('birthday-candle', 380),
  ('star-crown', 850),
  ('berry-beret', 180),
  ('alchemy-glasses', 280),
  ('sleep-mask', 150),
  ('star-patch', 220),
  ('pretzel-ribbon', 320),
  ('rune-scarf', 280),
  ('bell-ribbon', 180),
  ('meteor-wings', 1200),
  ('explorer-pack', 250),
  ('lantern-staff', 950),
  ('lollipop-wand', 400),
  ('star-wand', 450),
  ('golden-recipe-grimoire', 1100),
  ('crystal-sugar-shield', 780),
  ('syrup-glider-blades', 1250),
  ('constellation-aura', 1500),
  ('blossom-breeze', 580),
  ('crown-emoji-floating', 950),
  ('wings-meringue-angel', 1200),
  ('aura-galaxy-orbit', 1600),
  ('footprint-honey-dew', 850),
  ('syrup-drizzle-strawberry', 980),
  ('syrup-drizzle-choco', 980),
  ('syrup-drizzle-condensed', 880),
  ('wafer-roll-pin', 450),
  ('macaron-beret', 520),
  ('gold-sugar-powder', 1100),
  ('footprint-strawberry-jam', 780),
  ('footprint-macaron-crumbs', 780),
  ('chef-coat-tie', 850),
  ('tiny-wood-rollingpin', 320),
  ('preppy-school-tie', 350),
  ('vintage-leather-satchel', 400),
  ('bear-knit-suspenders', 300),
  ('sherlock-cape-coat', 780),
  ('bubble-detective-magnifier', 360),
  ('round-gold-spectacles', 290),
  ('spring-cherry-blossom-beret', 420),
  ('spring-picnic-basket', 360),
  ('summer-marine-sailor-collar', 380),
  ('summer-cool-sunglasses', 320),
  ('autumn-maple-knit-muffler', 350),
  ('autumn-artist-palette', 340),
  ('winter-fluffy-earmuffs', 310),
  ('winter-snow-padded-vest', 820),
  ('astral-sorcerer-hood', 460),
  ('crystal-monocle', 340),
  ('celestial-wizard-robe', 850),
  ('arcane-sugar-grimoire', 380),
  ('fairy-sugar-winged-circlet', 430),
  ('moonlight-velvet-choker', 310),
  ('arcane-rune-mask', 330),
  ('celestial-meteor-staff', 820),
  ('party-confetti-cone-hat', 320),
  ('masquerade-feather-eyemask', 360),
  ('masquerade-tuxedo-bowtie', 420),
  ('sparkler-party-firework', 390),
  ('champagne-cork-topper', 820),
  ('birthday-cake-ruffle-collar', 480),
  ('party-whistle-blower', 280),
  ('royal-party-champagne-glass', 400),
  ('iphone-headset', 380),
  ('street-ball-cap', 290),
  ('knit-beanie-hat', 260),
  ('pastry-chef-toque', 320),
  ('angel-holy-halo', 460),
  ('pince-nez-retro-specs', 280),
  ('round-tortoise-glasses', 240),
  ('cyber-pixel-shades', 310),
  ('lovely-heart-sunglasses', 290),
  ('xmas-santa-fur-hat', 360),
  ('xmas-holy-cape', 420),
  ('birthday-party-cone-deluxe', 260),
  ('party-blower-flute', 220),
  ('taeguk-glory-headband', 350),
  ('taeguk-hero-cape', 480),
  ('travel-roller-suitcase', 390),
  ('surfing-wave-board', 420),
  ('snow-polar-sled-board', 430),
  ('snorkel-dive-mask', 280),
  ('vintage-film-camera', 340),
  ('lux-gold-rolex-watch', 480),
  ('lux-tweed-pearl-beret', 420),
  ('lux-hermes-silk-twilly', 380),
  ('lux-cartier-trinity-ring', 450),
  ('lux-diamond-camellia-brooch', 440),
  ('lux-celebrity-oversized-shades', 350),
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

-- 구매 함수 최신화: 136개 모든 아이템 및 기본 지급 아이템 지원
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

revoke all on function public.shop_buy(text) from public, anon;
grant execute on function public.shop_buy(text) to authenticated;

-- 기본 지급 및 보유 아이템 검증 도우미
create or replace function public._item_ok(p_owned jsonb, p_item text) returns boolean
language sql
immutable
set search_path = public
as $$
  select (p_owned ? p_item) or p_item = any(array['berry-beret', 'sleep-mask', 'bell-ribbon', 'room-patisserie', 'sofa-macaron', 'lamp-starlight', 'nest', 'base-nest']);
$$;
revoke all on function public._item_ok(jsonb, text) from public, anon, authenticated;

-- 마이룸 설정 저장 (16종 테마 및 17종 가구 지원)
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

-- 꾸민 몬스터 모습 저장 (패션 91종 + 받침대 12종 및 염색 지원)
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
  b text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  select * into mo from public.monsters where id = p_monster and owner = uid;
  if not found then return jsonb_build_object('ok', false, 'code', 'no_monster', 'message', '내 몬스터를 찾지 못했어요.'); end if;
  if jsonb_typeof(p_custom) is distinct from 'object' or length(p_custom::text) > 32000 then
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

  -- 12종 디저트 받침대(dessertBase) 안전 검증 및 보존
  if p_custom ? 'dessertBase' and jsonb_typeof(p_custom->'dessertBase') = 'string' then
    b := p_custom->>'dessertBase';
    if public._item_ok(p.owned_items, b) and exists (select 1 from public.shop_items where id = b) then
      clean := jsonb_set(clean, '{dessertBase}', to_jsonb(b), true);
    end if;
  end if;

  update public.monsters set look_custom = clean where id = mo.id;
  return jsonb_build_object('ok', true, 'look', clean);
end $$;

revoke all on function public.room_save(text, jsonb), public.look_save(uuid, jsonb) from public, anon;
grant execute on function public.room_save(text, jsonb), public.look_save(uuid, jsonb) to authenticated;
