import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AUTH, GAME_NAME } from '../config/game'
import { supabase } from '../lib/supabase'
import { EggArt } from '../ui/EggArt'
import { ArrowIcon, BackIcon, MailIcon, PawIcon, TicketIcon } from '../ui/Icons'

export default function Login() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus()
  }, [step])

  async function sendOtp(addr: string) {
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: false } })
    if (otpError) {
      setError(
        /signups not allowed|not found/i.test(otpError.message)
          ? '처음이라면 초대 코드가 필요해요.'
          : '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
      return false
    }
    setCooldown(30)
    return true
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const addr = email.trim().toLowerCase()
      const code = inviteCode.trim().toUpperCase()

      if (code) {
        // 처음 가입: 서버가 초대 코드를 확인하고 계정을 만든다
        const { data, error: fnError } = await supabase.functions.invoke('redeem-invite', { body: { email: addr, code } })
        if (fnError || !data?.ok) {
          setError(data?.message ?? '초대 코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
          return
        }
      }
      if (await sendOtp(addr)) setStep('otp')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError('')
    await sendOtp(email.trim().toLowerCase())
    setBusy(false)
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp.trim(), type: 'email' })
    if (verifyError) setError('코드가 맞지 않거나 만료됐어요.')
    setBusy(false)
  }

  if (step === 'otp') {
    return (
      <main className="screen">
        <div className="row between">
          <button className="btn-round" onClick={() => { setStep('email'); setOtp(''); setError('') }} aria-label="뒤로">
            <BackIcon />
          </button>
          <div className="brand">
            <PawIcon size={22} />
            {GAME_NAME}
          </div>
          <span style={{ width: 44 }} />
        </div>

        <div className="center-text" style={{ marginTop: 12 }}>
          <span className="chip coral" style={{ padding: 18, borderRadius: '50%' }}>
            <MailIcon size={34} color="var(--primary-rim)" />
          </span>
        </div>

        <form className="card" onSubmit={verify}>
          <h1 className="title center-text">인증 코드 입력</h1>
          <p className="sub center-text">
            <span className="chip" style={{ fontSize: 14 }}>{email}</span>
            <br />
            으로 보낸 {AUTH.otpLength}자리 코드를 입력해 주세요
          </p>
          <div className="otp" onClick={() => otpRef.current?.focus()}>
            {Array.from({ length: AUTH.otpLength }, (_, i) => (
              <div key={i} className={`otp-box${i === Math.min(otp.length, AUTH.otpLength - 1) ? ' active' : ''}`}>
                {otp[i] ?? ''}
              </div>
            ))}
            <input
              ref={otpRef}
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={AUTH.otpLength}
              value={otp}
              aria-label="인증 코드"
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {error && <p className="error-line">{error}</p>}
          <button className="btn block" disabled={busy || otp.length !== AUTH.otpLength}>
            {busy ? '확인 중…' : '들어가기'}
            <PawIcon size={20} color="#fff" />
          </button>
        </form>

        <button className="btn-link" onClick={resend} disabled={busy || cooldown > 0}>
          {cooldown > 0 ? `코드 다시 받기 (${cooldown}초)` : '코드 다시 받기'}
        </button>
        <p className="small center-text">코드가 안 왔나요? 스팸함도 확인해 보세요</p>
      </main>
    )
  }

  return (
    <main className="screen center">
      <div className="center-text">
        <EggArt rarity="common" mood={busy ? "happy" : "sleep"} size={130} rainbowLoading={busy} />
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="title-xl">
          {GAME_NAME} <PawIcon size={24} color="#4a90d9" />
        </h1>
        <p className="sub center-text">알에서 태어난 친구와 함께해요</p>
      </div>

      <form className="card" onSubmit={sendCode}>
        <div className="field">
          <label className="field-label" htmlFor="email">
            <span className="row">
              <MailIcon size={18} color="var(--primary-rim)" /> 이메일
            </span>
          </label>
          <div className="input-wrap">
            <input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="invite">
            <span className="row">
              <TicketIcon size={18} color="var(--primary-rim)" /> 초대 코드
            </span>
            <span className="hint">처음 한 번만 입력해요</span>
          </label>
          <div className={`input-wrap${error.includes('코드') ? ' invalid' : ''}`}>
            <input
              id="invite"
              value={inviteCode}
              maxLength={AUTH.inviteCodeLength}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error-line">{error}</p>}
        <button className="btn block" disabled={busy || !email}>
          {busy ? '보내는 중…' : '인증 코드 받기'}
          <ArrowIcon size={20} color="#fff" />
        </button>
      </form>
      <p className="small center-text">따뜻한 마음으로 돌보는 나만의 작은 쉼터</p>
    </main>
  )
}
