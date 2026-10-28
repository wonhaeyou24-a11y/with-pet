import { useState, type FormEvent } from 'react'
import { AUTH, GAME_NAME } from '../config/game'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const addr = email.trim().toLowerCase()
      const code = inviteCode.trim().toUpperCase()

      if (code) {
        // 처음 가입: 서버가 초대 코드를 확인하고 계정을 만든다
        const { data, error: fnError } = await supabase.functions.invoke('redeem-invite', {
          body: { email: addr, code },
        })
        if (fnError || !data?.ok) {
          setError(data?.message ?? '초대 코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
          return
        }
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { shouldCreateUser: false },
      })
      if (otpError) {
        setError(
          /signups not allowed|not found/i.test(otpError.message)
            ? '처음이라면 초대 코드가 필요해요.'
            : '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
        )
        return
      }
      setStep('otp')
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })
    if (verifyError) setError('코드가 맞지 않거나 만료됐어요.')
    setBusy(false)
  }

  return (
    <main className="screen">
      <h1>{GAME_NAME}</h1>
      <p className="sub">알을 품고, 키우고, 친구들과 함께해요</p>

      {step === 'email' ? (
        <form className="card" onSubmit={sendCode}>
          <label>
            이메일
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            초대 코드 (처음 한 번만)
            <input
              value={inviteCode}
              maxLength={AUTH.inviteCodeLength}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy || !email}>{busy ? '보내는 중…' : '인증 코드 받기'}</button>
        </form>
      ) : (
        <form className="card" onSubmit={verify}>
          <p className="sub">{email} 로 보낸 {AUTH.otpLength}자리 코드를 입력하세요</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={AUTH.otpLength}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button disabled={busy || otp.length !== AUTH.otpLength}>{busy ? '확인 중…' : '들어가기'}</button>
          <button type="button" className="link" onClick={() => { setStep('email'); setOtp(''); setError('') }}>
            이메일 다시 입력
          </button>
        </form>
      )}
    </main>
  )
}
