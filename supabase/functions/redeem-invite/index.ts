// 초대 코드로 새 계정을 만든다. 이미 가입한 이메일은 코드를 쓰지 않고 그대로 통과시킨다.
// 로그인용 인증 메일 발송은 클라이언트가 이어서 signInWithOtp 로 처리한다.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// 무차별 대입(Brute-force) 방어를 위한 인메모리 레이트 리미터 (최근 1분 기준 5회 실패 시 1분 차단)
interface RateRecord {
  failures: number
  lastAttempt: number
  blockedUntil: number
}
const rateLimitMap = new Map<string, RateRecord>()

function checkRateLimit(key: string): { allowed: boolean; waitSec: number } {
  const now = Date.now()
  const rec = rateLimitMap.get(key)
  if (!rec) return { allowed: true, waitSec: 0 }

  if (rec.blockedUntil > now) {
    return { allowed: false, waitSec: Math.ceil((rec.blockedUntil - now) / 1000) }
  }

  // 1분 이상 지난 실패 기록은 리셋
  if (now - rec.lastAttempt > 60_000) {
    rateLimitMap.delete(key)
    return { allowed: true, waitSec: 0 }
  }

  return { allowed: true, waitSec: 0 }
}

function recordFailure(key: string) {
  const now = Date.now()
  const rec = rateLimitMap.get(key) ?? { failures: 0, lastAttempt: now, blockedUntil: 0 }
  rec.failures += 1
  rec.lastAttempt = now
  if (rec.failures >= 5) {
    rec.blockedUntil = now + 60_000 // 1분 차단
  }
  rateLimitMap.set(key, rec)
}

function clearRecord(key: string) {
  rateLimitMap.delete(key)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous'
    const { email, code } = await req.json().catch(() => ({}))

    if (
      typeof email !== 'string' ||
      typeof code !== 'string' ||
      email.length > 100 ||
      code.length > 32 ||
      !email.includes('@')
    ) {
      return json({ ok: false, message: '이메일과 초대 코드를 올바르게 입력해 주세요.' }, 400)
    }

    const addr = email.trim().toLowerCase()
    const inviteCode = code.trim().toUpperCase()

    // 이메일 및 초대코드 형식 엄격 검증
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addr)) {
      return json({ ok: false, message: '올바른 이메일 주소를 입력해 주세요.' }, 400)
    }
    if (!/^[A-Z0-9-_]{4,32}$/.test(inviteCode)) {
      return json({ ok: false, message: '올바른 형식의 초대 코드를 입력해 주세요.' }, 400)
    }

    // IP 및 이메일 레이트 리밋 검사
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return json({ ok: false, message: `시도 횟수를 초과했습니다. ${rateCheck.waitSec}초 후에 다시 시도해 주세요.` }, 429)
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 코드를 먼저 선점한다 (동시에 두 명이 같은 코드를 쓰지 못하게)
    const { data: claimed, error: claimError } = await admin
      .from('invite_codes')
      .update({ used_at: new Date().toISOString(), claimed_email: addr })
      .eq('code', inviteCode)
      .is('used_at', null)
      .select('code')
      .maybeSingle()
    if (claimError) {
      console.error('[redeem-invite] claimError:', claimError)
      return json({ ok: false, message: '잠시 후 다시 시도해 주세요.' }, 500)
    }

    if (!claimed) {
      // 코드가 틀렸거나 이미 쓰였다. 단, 같은 이메일이 이미 그 코드로 가입했다면 통과.
      const { data: mine } = await admin
        .from('invite_codes')
        .select('code')
        .eq('code', inviteCode)
        .eq('claimed_email', addr)
        .maybeSingle()
      if (mine) {
        clearRecord(ip)
        return json({ ok: true })
      }
      
      recordFailure(ip)
      // 타이밍 공격 및 자동화 봇 방어를 위한 인위적 지연 (300ms)
      await sleep(300)
      return json({ ok: false, message: '없는 코드이거나 이미 사용된 코드예요.' }, 400)
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: addr,
      email_confirm: true,
    })

    if (createError) {
      // 이미 가입한 이메일이면 코드를 되돌리고 로그인만 진행
      await admin.from('invite_codes').update({ used_at: null, claimed_email: null }).eq('code', inviteCode)
      if (/already|registered|exists/i.test(createError.message)) {
        clearRecord(ip)
        return json({ ok: true })
      }
      console.error('[redeem-invite] createUser error:', createError)
      return json({ ok: false, message: '계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요.' }, 500)
    }

    await admin.from('invite_codes').update({ used_by: created.user.id }).eq('code', inviteCode)
    clearRecord(ip)
    return json({ ok: true })
  } catch (err) {
    console.error('[redeem-invite] unexpected error:', err)
    return json({ ok: false, message: '서버 처리 중 일시적인 문제가 발생했어요.' }, 500)
  }
})
