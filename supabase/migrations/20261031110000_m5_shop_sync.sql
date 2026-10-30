-- 받침대 6종이 부티크에 추가되고 기본 지급 아이템에 'nest'·'base-nest'가 들어간 것을 서버에도 반영한다.
-- (src/config/boutique.ts 와 어긋나면 npm run test:shop · test:room 이 알려 준다)
insert into public.shop_items (id, price) values
  ('base-nest', 0),
  ('base-strawberry-cake', 45),
  ('base-choco-cookie', 35),
  ('base-custard-pudding', 35),
  ('base-macaron-cushion', 50),
  ('base-parfait-cup', 70)
on conflict (id) do update set price = excluded.price;

create or replace function public._item_ok(p_owned jsonb, p_item text) returns boolean
language sql
immutable
set search_path = public
as $$
  select (p_owned ? p_item) or p_item = any(array['berry-beret', 'sleep-mask', 'bell-ribbon', 'room-patisserie', 'sofa-macaron', 'nest', 'base-nest'])
$$;
revoke all on function public._item_ok(jsonb, text) from public, anon, authenticated;

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
