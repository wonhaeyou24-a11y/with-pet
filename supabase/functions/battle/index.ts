// M3 3a·3b단계 서버 (Edge Function: battle)
// 친선 대전(시드·결과·보상·전적), 한입 투표, 스킬 올리기·전투 성향·진화를 서버가 판정한다. 폰이 보낸 능력치·결과는 믿지 않는다.
// 전투 계산은 engine.ts(순수 코드)이고 화면도 같은 파일을 쓴다. 같은 시드면 항상 같은 리플레이가 나온다.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { BATTLE } from './config.ts'
import { simulateAsmrBattle } from './engine.ts'
import { checkEvolutionEligibility, computeEvolution } from './evolution.ts'
import { planSkillUpgrade } from './skillLevels.ts'
import { BATTLE_STANCES } from './skills.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ ...body, now: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const dayKey = (now: Date) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10)
const BUSY = { ok: false, code: 'busy', message: '잠시 후 다시 해 주세요.' }

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(token)
    const uid = auth.user?.id
    if (!uid) return json({ ok: false, code: 'auth', message: '다시 로그인해 주세요.' }, 401)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const now = new Date()
    const today = dayKey(now)
    const dayStart = `${today}T00:00:00+09:00`

    const { data: player } = await admin.from('players').select('*').eq('id', uid).maybeSingle()
    if (!player) return json({ ok: false, code: 'no_player', message: '플레이어 정보를 찾지 못했어요.' }, 404)

    const coins = Number(player.coins ?? 200)
    const rewardedToday = player.battle_day === today ? Number(player.battle_rewards ?? 0) : 0
    const rewardsLeft = Math.max(0, BATTLE.rewardedPerDay - rewardedToday)

    // 오늘 내가 한입 투표한 지인 몬스터들
    const votedToday = async () => {
      const { data } = await admin
        .from('social_reactions')
        .select('monster_id')
        .eq('from_player', uid)
        .gte('created_at', dayStart)
      return (data ?? []).map((r: { monster_id: string }) => r.monster_id)
    }

    if (action === 'status') {
      const voted = await votedToday()
      return json({ ok: true, coins, rewardsLeft, votedIds: voted, votesRewardLeft: Math.max(0, BATTLE.votesRewardedPerDay - voted.length) })
    }

    if (action === 'fight') {
      const monsterId = String(body.monsterId ?? '')
      const defenderId = String(body.defenderId ?? '')
      if (!monsterId || !defenderId) return json({ ok: false, code: 'bad_request', message: '대전 상대를 찾지 못했어요.' }, 400)
      if (monsterId === defenderId) return json({ ok: false, code: 'self', message: '내 펫과는 대전할 수 없어요.' })

      const [{ data: mine }, { data: other }] = await Promise.all([
        admin.from('monsters').select('*').eq('id', monsterId).eq('owner', uid).maybeSingle(),
        admin.from('monsters').select('*').eq('id', defenderId).maybeSingle(),
      ])
      if (!mine) return json({ ok: false, code: 'no_monster', message: '내 몬스터를 찾지 못했어요.' }, 404)
      if (!other) return json({ ok: false, code: 'no_defender', message: '상대 몬스터를 찾지 못했어요.' }, 404)
      if (other.owner === uid) return json({ ok: false, code: 'self', message: '내 펫과는 대전할 수 없어요.' })

      // 시드는 서버가 정한다 (폰이 유리한 시드를 고르지 못한다)
      const seed = Math.floor(Math.random() * 2_000_000_000)
      // 장착 장비의 능력치는 서버가 DB에서 읽어 더한다 (양쪽 모두)
      const [{ data: myGear }, { data: otherGear }] = await Promise.all([
        admin.rpc('gear_bonus', { p_monster: mine.id }),
        admin.rpc('gear_bonus', { p_monster: other.id }),
      ])
      const result = simulateAsmrBattle({ ...mine, gear: myGear ?? null }, { ...other, gear: otherGear ?? null }, seed)
      const won = result.winner === 'challenger'
      const reward = rewardsLeft > 0 ? (won ? BATTLE.rewardWin : BATTLE.rewardLose) : 0

      // 보상은 읽은 시점의 코인·횟수와 같을 때만 지급한다 (연타해도 한 번만)
      if (reward > 0) {
        let guard = admin
          .from('players')
          .update({ coins: coins + reward, battle_day: today, battle_rewards: rewardedToday + 1 })
          .eq('id', uid)
          .eq('coins', coins)
        guard = player.battle_day === today ? guard.eq('battle_rewards', rewardedToday).eq('battle_day', today) : guard.eq('battle_rewards', Number(player.battle_rewards ?? 0))
        const { data: paid } = await guard.select('id').maybeSingle()
        if (!paid) return json(BUSY)
      }

      const { data: saved } = await admin
        .from('battles')
        .insert({
          challenger_owner: uid,
          challenger_monster_id: mine.id,
          defender_monster_id: other.id,
          defender_name: String(other.name ?? '상대 디저트'),
          seed,
          winner: result.winner,
          turns: result.turns,
          challenger_max_hp: result.challengerMaxHp,
          defender_max_hp: result.defenderMaxHp,
          reward_coins: reward,
        })
        .select('id')
        .maybeSingle()

      // 전적 (친선전이라 양쪽 모두 기록한다)
      await Promise.all([
        admin
          .from('monsters')
          .update(won ? { wins: Number(mine.wins ?? 0) + 1 } : { losses: Number(mine.losses ?? 0) + 1 })
          .eq('id', mine.id),
        admin
          .from('monsters')
          .update(won ? { losses: Number(other.losses ?? 0) + 1 } : { wins: Number(other.wins ?? 0) + 1 })
          .eq('id', other.id),
      ])

      return json({
        ok: true,
        battleId: saved?.id ?? null,
        result,
        reward,
        coins: coins + reward,
        rewardsLeft: reward > 0 ? rewardsLeft - 1 : rewardsLeft,
        message: reward > 0 ? `🪙 +${reward} 코인` : '오늘 대전 코인 보상은 모두 받았어요! 대전은 계속 즐길 수 있어요.',
      })
    }

    if (action === 'vote') {
      const targetId = String(body.monsterId ?? '')
      const { data: target } = await admin.from('monsters').select('id, owner, likes_count').eq('id', targetId).maybeSingle()
      if (!target) return json({ ok: false, code: 'no_monster', message: '지인의 몬스터를 찾지 못했어요.' }, 404)
      if (target.owner === uid) return json({ ok: false, code: 'self', message: '내 펫에는 투표할 수 없어요.' })

      const voted = await votedToday()
      if (voted.includes(targetId)) return json({ ok: false, code: 'voted', message: '이미 오늘 한입 투표를 보냈어요!' })

      const { error: insErr } = await admin.from('social_reactions').insert({
        from_player: uid,
        from_nickname: String(player.nickname ?? '파티시에'),
        monster_id: targetId,
        emoji: '🥄',
      })
      if (insErr) return json(BUSY)

      // 한입 수는 읽은 값과 같을 때만 올린다 (동시에 와도 한 번씩 반영되도록 두 번까지 다시 시도)
      let likes = Number(target.likes_count ?? 0)
      for (let i = 0; i < 3; i++) {
        const { data: up } = await admin.from('monsters').update({ likes_count: likes + 1 }).eq('id', targetId).eq('likes_count', likes).select('likes_count').maybeSingle()
        if (up) {
          likes = Number(up.likes_count)
          break
        }
        const { data: fresh } = await admin.from('monsters').select('likes_count').eq('id', targetId).maybeSingle()
        likes = Number(fresh?.likes_count ?? likes)
      }

      // 코인은 하루 정해진 횟수까지만 (읽은 코인과 같을 때만 지급)
      let reward = 0
      let newCoins = coins
      if (voted.length < BATTLE.votesRewardedPerDay) {
        const { data: paid } = await admin.from('players').update({ coins: coins + BATTLE.voteReward }).eq('id', uid).eq('coins', coins).select('id').maybeSingle()
        if (paid) {
          reward = BATTLE.voteReward
          newCoins = coins + reward
        }
      }
      return json({ ok: true, likes, coins: newCoins, reward })
    }

    // ── 성장: 스킬 올리기·전투 성향·진화 (내 몬스터만)
    if (action === 'skill_upgrade' || action === 'set_stance' || action === 'evolve') {
      const { data: mon } = await admin.from('monsters').select('*').eq('id', String(body.monsterId ?? '')).eq('owner', uid).maybeSingle()
      if (!mon) return json({ ok: false, code: 'no_monster', message: '내 몬스터를 찾지 못했어요.' }, 404)

      if (action === 'skill_upgrade') {
        const plan = planSkillUpgrade(mon, String(body.skillId ?? ''))
        if (!plan.ok) return json({ ok: false, code: plan.code, message: plan.message })
        // 읽은 SP와 같을 때만 저장한다 (연타해도 한 번만 차감)
        const { data: up } = await admin
          .from('monsters')
          .update({ skill_levels: plan.nextLevels, sp: Number(mon.sp ?? 0) - plan.cost })
          .eq('id', mon.id)
          .eq('sp', Number(mon.sp ?? 0))
          .select('*')
          .maybeSingle()
        if (!up) return json(BUSY)
        await admin.from('care_logs').insert({ owner: uid, monster_id: mon.id, action: 'skill_up', detail: plan.node.id })
        return json({ ok: true, monster: up, skillId: plan.node.id, skillLevel: plan.nextLevel, spent: plan.cost })
      }

      if (action === 'set_stance') {
        const stance = String(body.stance ?? '')
        if (!BATTLE_STANCES.some((s) => s.id === stance)) return json({ ok: false, code: 'bad_stance', message: '알 수 없는 전투 성향이에요.' }, 400)
        const { data: up } = await admin.from('monsters').update({ battle_stance: stance }).eq('id', mon.id).select('*').maybeSingle()
        if (!up) return json(BUSY)
        return json({ ok: true, monster: up })
      }

      // evolve
      const elig = checkEvolutionEligibility(mon)
      if (!elig.canEvolve) return json({ ok: false, code: 'not_ready', message: elig.missingReason ?? '아직 진화 조건을 충족하지 못했어요.' })
      const evo = computeEvolution(mon, body.branch ? String(body.branch) : elig.recommendedBranch)
      // 같은 진화 단계일 때만 저장한다 (연타해도 한 번만 진화)
      const { data: up } = await admin
        .from('monsters')
        .update({ evo_stage: evo.nextStage, evo_branch: evo.branch, stats: evo.newStats, sp: evo.newSp })
        .eq('id', mon.id)
        .eq('evo_stage', Number(mon.evo_stage ?? 1))
        .select('*')
        .maybeSingle()
      if (!up) return json(BUSY)
      await admin.from('care_logs').insert({ owner: uid, monster_id: mon.id, action: 'evolve', detail: `${evo.nextStage}:${evo.branch}` })
      return json({ ok: true, monster: up, newStage: evo.nextStage, branch: evo.branch, statBoost: evo.statBoost, bonusSp: evo.bonusSp })
    }

    return json({ ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }, 400)
  } catch (err) {
    return json({ ok: false, code: 'server_error', message: '서버 처리 중 일시적인 문제가 발생했어요.', detail: String(err) }, 500)
  }
})
