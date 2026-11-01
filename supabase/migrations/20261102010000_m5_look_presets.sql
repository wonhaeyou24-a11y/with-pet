-- M5 꾸미기 고도화: 내 몬스터 코디 프리셋. 직접 테이블을 쓰지 않고 아래 함수만 호출한다.
create table if not exists public.look_presets (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.players(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  custom jsonb not null check (jsonb_typeof(custom) = 'object' and octet_length(custom::text) <= 24000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists look_presets_owner_updated_idx on public.look_presets(owner, updated_at desc);
alter table public.look_presets enable row level security;

create or replace function public.look_preset_list() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  return jsonb_build_object('ok', true, 'presets', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'custom', custom, 'updatedAt', updated_at) order by updated_at desc)
    from public.look_presets where owner = uid
  ), '[]'::jsonb));
end $$;

create or replace function public.look_preset_save(p_id uuid, p_name text, p_custom jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); out_id uuid;
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 24 then return jsonb_build_object('ok', false, 'code', 'name', 'message', '프리셋 이름은 1~24자로 적어 주세요.'); end if;
  if jsonb_typeof(p_custom) is distinct from 'object' or octet_length(p_custom::text) > 24000 then return jsonb_build_object('ok', false, 'code', 'custom', 'message', '코디 데이터가 올바르지 않아요.'); end if;
  if p_id is null then
    if (select count(*) from public.look_presets where owner = uid) >= 8 then return jsonb_build_object('ok', false, 'code', 'limit', 'message', '코디 프리셋은 최대 8개까지 저장할 수 있어요.'); end if;
    insert into public.look_presets(owner, name, custom) values (uid, trim(p_name), p_custom) returning id into out_id;
  else
    update public.look_presets set name = trim(p_name), custom = p_custom, updated_at = now() where id = p_id and owner = uid returning id into out_id;
    if out_id is null then return jsonb_build_object('ok', false, 'code', 'missing', 'message', '프리셋을 찾지 못했어요.'); end if;
  end if;
  return jsonb_build_object('ok', true, 'id', out_id);
end $$;

create or replace function public.look_preset_delete(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'code', 'auth', 'message', '다시 로그인해 주세요.'); end if;
  delete from public.look_presets where id = p_id and owner = uid;
  if not found then return jsonb_build_object('ok', false, 'code', 'missing', 'message', '프리셋을 찾지 못했어요.'); end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on table public.look_presets from public, anon, authenticated;
revoke all on function public.look_preset_list(), public.look_preset_save(uuid, text, jsonb), public.look_preset_delete(uuid) from public, anon;
grant execute on function public.look_preset_list(), public.look_preset_save(uuid, text, jsonb), public.look_preset_delete(uuid) to authenticated;
