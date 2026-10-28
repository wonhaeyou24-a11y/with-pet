// 초대 코드로 새 계정을 만든다. 이미 가입한 이메일은 코드를 쓰지 않고 그대로 통과시킨다.
// 로그인용 인증 메일 발송은 클라이언트가 이어서 signInWithOtp 로 처리한다.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { email, code } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof code !== 'string' || !email.includes('@')) {
    return json({ ok: false, message: '이메일과 초대 코드를 확인해 주세요.' })
  }
  const addr = email.trim().toLowerCase()
  const inviteCode = code.trim().toUpperCase()

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 코드를 먼저 선점한다 (동시에 두 명이 같은 코드를 쓰지 못하게)
  const { data: claimed, error: claimError } = await admin
    .from('invite_codes')
    .update({ used_at: new Date().toISOString(), claimed_email: addr })
    .eq('code', inviteCode)
    .is('used_at', null)
    .select('code')
    .maybeSingle()
  if (claimError) return json({ ok: false, message: '잠시 후 다시 시도해 주세요.' })

  if (!claimed) {
    // 코드가 틀렸거나 이미 쓰였다. 단, 같은 이메일이 이미 그 코드로 가입했다면 통과.
    const { data: mine } = await admin
      .from('invite_codes')
      .select('code')
      .eq('code', inviteCode)
      .eq('claimed_email', addr)
      .maybeSingle()
    if (mine) return json({ ok: true })
    return json({ ok: false, message: '없는 코드이거나 이미 사용된 코드예요.' })
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: addr,
    email_confirm: true,
  })

  if (createError) {
    // 이미 가입한 이메일이면 코드를 되돌리고 로그인만 진행
    await admin.from('invite_codes').update({ used_at: null, claimed_email: null }).eq('code', inviteCode)
    if (/already|registered|exists/i.test(createError.message)) return json({ ok: true })
    return json({ ok: false, message: '계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요.' })
  }

  await admin.from('invite_codes').update({ used_by: created.user.id }).eq('code', inviteCode)
  return json({ ok: true })
})
