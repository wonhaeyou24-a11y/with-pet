-- 4c: 도감 발견 기록을 서버(DB)에 저장한다.
-- 키 형식은 화면과 같다: `${종족}_stage${단계}_${갈래 또는 base}`
-- 몬스터가 생기거나(부화) 진화 단계·갈래가 바뀔 때 트리거가 기록하므로 어떤 경로로 바뀌어도 빠지지 않는다.
-- 화면(authenticated)은 이 컬럼을 직접 쓸 수 없다 (players 는 nickname 만 수정 가능).

alter table public.players add column if not exists dex_unlocked jsonb not null default '[]'::jsonb;

create or replace function public.dex_record() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
begin
  k := new.species || '_stage' || coalesce(new.evo_stage, 1)::text || '_' ||
       case when coalesce(new.evo_stage, 1) <= 1 then 'base' else coalesce(new.evo_branch, 'base') end;
  update public.players
     set dex_unlocked = dex_unlocked || to_jsonb(k)
   where id = new.owner
     and not (dex_unlocked ? k);
  return new;
end $$;

revoke all on function public.dex_record() from public, anon, authenticated;

drop trigger if exists monsters_dex_insert on public.monsters;
create trigger monsters_dex_insert after insert on public.monsters
  for each row execute function public.dex_record();

drop trigger if exists monsters_dex_evolve on public.monsters;
create trigger monsters_dex_evolve after update of evo_stage, evo_branch on public.monsters
  for each row when (new.evo_stage is distinct from old.evo_stage or new.evo_branch is distinct from old.evo_branch)
  execute function public.dex_record();

-- 이미 있는 몬스터의 기록을 채워 둔다 (현재 단계까지만 알 수 있음)
update public.players p
   set dex_unlocked = coalesce((
     select jsonb_agg(distinct m.species || '_stage' || coalesce(m.evo_stage, 1)::text || '_' ||
            case when coalesce(m.evo_stage, 1) <= 1 then 'base' else coalesce(m.evo_branch, 'base') end)
       from public.monsters m where m.owner = p.id), '[]'::jsonb);
