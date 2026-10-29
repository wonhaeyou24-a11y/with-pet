// 디저트 캐릭터 질감별 ASMR 힐링 사운드 엔진 (Web Audio API 기반 실시간 절차적 물리 질감 합성)
// 외부 오디오 CDN 없이 100% 로컬에서 안전하게 동작하며, 모든 오디오 호출은 Zero-Crash(try-catch) 정책을 준수합니다.

export type DessertSoundKind =
  | 'kataifi-crunch' // 💚 두바이 쫀득쿠키: 바사삭! 카다이프 면발 & 피스타치오 크런치
  | 'wax-pop' // 🫧 톡톡 왁싱볼(히트캔디): 톡! 파삭~ 얇은 왁스 껍질이 깨지며 과즙 시럽이 쭈욱 터지는 소리
  | 'cookie-crisp' // 🍪 초코칩 쿠키 / 크로플: 오독오독 바삭한 버터 쿠키 베어무는 소리
  | 'sugar-crack' // 🍓 유리알 탕후루: 빠작! 톡! 얇고 투명한 설탕 코팅이 경쾌하게 깨지는 소리
  | 'mochi-squish' // 🍡 찹쌀떡 모찌 / 말랑 카멜레온: 쫀득~ 말랑말랑 반죽이 눌렸다 떼어지는 힐링음
  | 'pudding-jiggle' // 🍮 말랑 푸딩 / 쫀득 젤리: 탱글탱글~ 뽀용! 출렁이는 탄성 진동음
  | 'choco-melt' // 🍫 달콤 퐁듀 초코: 사르르~ 꾸덕하고 따뜻한 가나슈·시럽 기포 소리
  | 'syrup-drizzle' // 🍒 시럽 & 스프링클 토핑: 쪼르륵~ 반짝반짝 토핑이 쏟아지는 소리
  | 'smore-sizzle' // 🔥 구운 스모어 마시멜로: 치익~ 노릇하게 구워진 마시멜로 폭신 사운드

export interface SoundMeta {
  kind: DessertSoundKind
  label: string
  onomatopoeia: string // 화면에 떠오르는 시각적 ASMR 의성어 말풍선
  desc: string
  icon: string
}

export const DESSERT_SOUND_CATALOG: Record<DessertSoundKind, SoundMeta> = {
  'kataifi-crunch': {
    kind: 'kataifi-crunch',
    label: '카다이프 바사삭 크런치',
    onomatopoeia: '바사삭-! 자작자작 💚✨',
    desc: '두바이 초코 속 볶은 카다이프 면발이 바삭하게 부서지는 고밀도 크런치 ASMR',
    icon: '💚',
  },
  'wax-pop': {
    kind: 'wax-pop',
    label: '왁싱볼 톡! 파삭 과즙팡',
    onomatopoeia: '톡! 파삭~ 쭈욱 츄릅! 🫧💦',
    desc: '얇고 바삭한 파스텔 왁스 껍질이 톡! 깨지며 진한 과일 시럽이 쭈욱 터져 나오는 인기 ASMR',
    icon: '🫧',
  },
  'cookie-crisp': {
    kind: 'cookie-crisp',
    label: '오독오독 버터쿠키',
    onomatopoeia: '오독-! 바삭바삭 🍪',
    desc: '잘 구워진 두툼한 초코칩 쿠키가 경쾌하게 부서지는 고소한 크런치 사운드',
    icon: '🍪',
  },
  'sugar-crack': {
    kind: 'sugar-crack',
    label: '유리알 설탕코팅 빠작',
    onomatopoeia: '빠작-! 톡톡 🍓💎',
    desc: '탕후루의 얇고 투명한 설탕 시럽 유리막이 맑고 경쾌하게 깨지는 힐링 사운드',
    icon: '🍓',
  },
  'mochi-squish': {
    kind: 'mochi-squish',
    label: '쫀득 말랑 찹쌀떡',
    onomatopoeia: '쫀득~ 말랑말랑 🍡🤍',
    desc: '전분 가루가 묻은 폭신한 찹쌀떡 모찌를 손끝으로 꾹 누를 때 나는 포근한 소리',
    icon: '🍡',
  },
  'pudding-jiggle': {
    kind: 'pudding-jiggle',
    label: '탱글탱글 푸딩·젤리',
    onomatopoeia: '탱글~ 출렁출렁 🍮🐻',
    desc: '접시를 흔들 때 커스터드 푸딩과 구미 젤리가 탄성 있게 출렁거리는 귀여운 소리',
    icon: '🍮',
  },
  'choco-melt': {
    kind: 'choco-melt',
    label: '사르르 퐁듀 초코',
    onomatopoeia: '사르르~ 꾸덕꾸덕 🍫✨',
    desc: '따뜻하게 녹은 가나슈 초콜릿 퐁듀가 부드럽게 흐르며 기포가 맺히는 달콤한 소리',
    icon: '🍫',
  },
  'syrup-drizzle': {
    kind: 'syrup-drizzle',
    label: '달콤 시럽 & 스프링클',
    onomatopoeia: '샤르르~ 톡톡톡 🌈🍒',
    desc: '케이크 위에 시럽을 뿌리고 알록달록 스프링클 구슬이 구르는 청량한 소리',
    icon: '🌈',
  },
  'smore-sizzle': {
    kind: 'smore-sizzle',
    label: '노릇 폭신 스모어',
    onomatopoeia: '치익~ 폭신폭신 🔥🐾',
    desc: '모닥불에 노릇하게 구워진 마시멜로 껍질이 바스락거리고 속이 늘어나는 소리',
    icon: '🔥',
  },
}

const MUTE_STORAGE_KEY = 'withpet_asmr_muted_v1'

let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new Ctx()
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume().catch(() => {})
    }
    return sharedCtx
  } catch {
    return null
  }
}

export function isAsmrMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAsmrMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // 저장소 접근 불가 시 무시
  }
}

// 종족/변신 체형에 따른 기본 ASMR 사운드 매핑
export function getSpeciesSoundKind(speciesId: string, dessertBase?: string): DessertSoundKind {
  if (speciesId === 'dubai-cookie') return 'kataifi-crunch'
  if (speciesId === 'wax-ball') return 'wax-pop'
  if (speciesId === 'tanghulu') return 'sugar-crack'
  if (speciesId === 'smore') return 'smore-sizzle'
  if (speciesId === 'pudding' || speciesId === 'jelly') return 'pudding-jiggle'
  if (speciesId === 'choco') return 'choco-melt'
  if (speciesId === 'mochi' || speciesId === 'mongsil') return 'mochi-squish'
  if (speciesId === 'kongkong' || speciesId === 'gangcheoldeung') return 'cookie-crisp'
  if (dessertBase === 'choco-cookie') return 'cookie-crisp'
  if (dessertBase === 'custard-pudding') return 'pudding-jiggle'
  return 'mochi-squish'
}

export type SensoryCategory = 'crispy' | 'chewy' | 'jiggly' | 'melty'

// 식감 사운드 종류별 시각·촉각 카테고리 분류 (파티클 & 젤리 변형 연동용)
export function getSensoryCategory(kind: DessertSoundKind): SensoryCategory {
  if (kind === 'kataifi-crunch' || kind === 'wax-pop' || kind === 'cookie-crisp' || kind === 'sugar-crack') return 'crispy'
  if (kind === 'pudding-jiggle') return 'jiggly'
  if (kind === 'choco-melt' || kind === 'smore-sizzle') return 'melty'
  return 'chewy'
}

// 손끝으로 느끼는 식감별 맞춤형 햅틱 진동 패턴 (모바일 지원 기기 연동)
const HAPTIC_PATTERNS: Record<DessertSoundKind, number | number[]> = {
  'kataifi-crunch': [12, 16, 10, 14, 14, 18, 10], // 자작자작 바사삭 다중 크런치 진동
  'wax-pop': [24, 18, 10, 45], // 톡! 파삭 깨진 뒤 쭈욱 과즙이 퍼지는 2단 하이브리드 진동
  'cookie-crisp': [22, 24, 16, 20], // 오독오독 묵직한 쿠키 진동
  'sugar-crack': [28, 30, 12], // 빠작! 유리알 설탕 스냅 진동
  'mochi-squish': [18, 45, 14], // 쫀~득! 눌렸다 떨어지는 탄성 진동
  'pudding-jiggle': [10, 22, 10, 22, 10], // 탱~글~탱~글 물결 진동
  'choco-melt': [35], // 사르르 부드러운 온기 진동
  'syrup-drizzle': [8, 14, 8, 14, 8], // 톡톡톡 스프링클 진동
  'smore-sizzle': [14, 20, 28], // 바삭~ 폭신 스모어 진동
}

function triggerSensoryHaptic(kind: DessertSoundKind) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(HAPTIC_PATTERNS[kind] ?? 15)
    }
  } catch {
    // 진동 미지원 환경 안전 무시
  }
}

// 짧은 노이즈 버스트 생성 헬퍼 (바삭/크런치/설탕 깨짐 질감 표현용)
function triggerNoiseGrain(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  filterFreq: number,
  q: number,
  gainPeak: number,
  filterType: BiquadFilterType = 'bandpass',
) {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) {
    // 미세한 크랙 질감을 위해 지수 감쇠 엔벨로프와 랜덤 스파이크 결합
    const env = Math.pow(1 - i / sampleCount, 1.8)
    data[i] = (Math.random() * 2 - 1) * env
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.setValueAtTime(filterFreq, startTime)
  filter.Q.setValueAtTime(q, startTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, startTime)
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + duration * 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  src.start(startTime)
  src.stop(startTime + duration)
}

// 디저트 질감별 실제 ASMR 사운드 + 손맛 햅틱 진동 + 콤보 배음 재생 (Zero-Crash 보장)
export function playDessertAsmr(kind: DessertSoundKind, comboStep = 0): SoundMeta {
  const meta = DESSERT_SOUND_CATALOG[kind] ?? DESSERT_SOUND_CATALOG['mochi-squish']
  try {
    triggerSensoryHaptic(kind)
    if (isAsmrMuted()) return meta
    const ctx = getAudioContext()
    if (!ctx) return meta
    const now = ctx.currentTime
    const pitchBoost = 1 + Math.min(10, Math.max(0, comboStep)) * 0.035

    if (kind === 'kataifi-crunch') {
      // 💚 두바이 쫀득쿠키: 겉의 묵직한 초코 크랙 + 수십 개의 잘게 볶은 카다이프 면발이 연속으로 바사삭 부서지는 소리
      triggerNoiseGrain(ctx, now, 0.045, 920, 2.2, 0.28, 'bandpass')
      const offsets = [0.018, 0.036, 0.052, 0.074, 0.095, 0.118, 0.145, 0.172, 0.205, 0.235]
      offsets.forEach((off, idx) => {
        const freq = 1800 + ((idx * 430) % 2200)
        triggerNoiseGrain(ctx, now + off, 0.028, freq, 3.8, 0.22 - idx * 0.012, 'bandpass')
      })
      // 속의 쫀득한 피스타치오 크림 저음 울림
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(190, now + 0.04)
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.24)
      g.gain.setValueAtTime(0.09, now + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(now + 0.04)
      osc.stop(now + 0.26)
    } else if (kind === 'wax-pop') {
      // 🫧 톡톡 왁싱볼(히트캔디): 1단계 얇은 밀랍 왁스 껍질이 '톡! 파삭~' 깨지는 속 빈 크랙음 + 2단계 진한 과즙 시럽이 '쭈욱~ 츄릅💦' 터져 나오는 사운드
      // 1단계: 속 빈 왁스 캡슐이 톡! 하고 깨지는 중역 공명 팝 + 파삭거리는 왁스 크럼블 3연타
      const popOsc = ctx.createOscillator()
      const popGain = ctx.createGain()
      popOsc.type = 'triangle'
      popOsc.frequency.setValueAtTime(520 * pitchBoost, now)
      popOsc.frequency.exponentialRampToValueAtTime(1180 * pitchBoost, now + 0.032)
      popGain.gain.setValueAtTime(0.24, now)
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)
      popOsc.connect(popGain)
      popGain.connect(ctx.destination)
      popOsc.start(now)
      popOsc.stop(now + 0.05)

      const waxSnaps = [
        { t: 0.008, f: 2150, d: 0.026, g: 0.25 },
        { t: 0.034, f: 2680, d: 0.022, g: 0.21 },
        { t: 0.062, f: 1850, d: 0.028, g: 0.18 },
      ]
      waxSnaps.forEach((s) => triggerNoiseGrain(ctx, now + s.t, s.d, s.f, 4.2, s.g, 'bandpass'))

      // 2단계: 깨진 틈으로 꾸덕하고 달콤한 과일 시럽이 '쭈욱~ 츄릅💦' 뿜어져 나오는 액체 공명 필터 스윕 & 방울 팝
      const syrupOsc = ctx.createOscillator()
      const syrupFilter = ctx.createBiquadFilter()
      const syrupGain = ctx.createGain()
      syrupOsc.type = 'sine'
      syrupOsc.frequency.setValueAtTime(280 * pitchBoost, now + 0.075)
      syrupOsc.frequency.exponentialRampToValueAtTime(690 * pitchBoost, now + 0.19)
      syrupOsc.frequency.exponentialRampToValueAtTime(340 * pitchBoost, now + 0.33)

      syrupFilter.type = 'bandpass'
      syrupFilter.frequency.setValueAtTime(900, now + 0.075)
      syrupFilter.Q.setValueAtTime(3.5, now + 0.075)

      syrupGain.gain.setValueAtTime(0.001, now + 0.075)
      syrupGain.gain.linearRampToValueAtTime(0.19, now + 0.11)
      syrupGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      syrupOsc.connect(syrupFilter)
      syrupFilter.connect(syrupGain)
      syrupGain.connect(ctx.destination)
      syrupOsc.start(now + 0.075)
      syrupOsc.stop(now + 0.36)

      // 과즙 방울 톡톡 2연타
      ;[0.18, 0.26].forEach((dropT, idx) => {
        const drop = ctx.createOscillator()
        const dg = ctx.createGain()
        drop.type = 'sine'
        drop.frequency.setValueAtTime((620 + idx * 190) * pitchBoost, now + dropT)
        drop.frequency.exponentialRampToValueAtTime((1120 + idx * 240) * pitchBoost, now + dropT + 0.055)
        dg.gain.setValueAtTime(0.11, now + dropT)
        dg.gain.exponentialRampToValueAtTime(0.001, now + dropT + 0.065)
        drop.connect(dg)
        dg.connect(ctx.destination)
        drop.start(now + dropT)
        drop.stop(now + dropT + 0.07)
      })
    } else if (kind === 'cookie-crisp') {
      // 🍪 오독오독 초코칩 쿠키: 낮고 고소한 버터 쿠키 스냅 4연타
      const snaps = [
        { t: 0, f: 780, d: 0.055, g: 0.28 },
        { t: 0.055, f: 1120, d: 0.048, g: 0.24 },
        { t: 0.115, f: 940, d: 0.05, g: 0.22 },
        { t: 0.18, f: 1350, d: 0.04, g: 0.16 },
      ]
      snaps.forEach((s) => triggerNoiseGrain(ctx, now + s.t, s.d, s.f, 2.5, s.g, 'bandpass'))
    } else if (kind === 'sugar-crack') {
      // 🍓 유리알 탕후루: 얇은 유리 설탕 코팅이 빠작! 깨지는 고주파 크리스탈 스냅 + 맑은 공명음
      const cracks = [0, 0.032, 0.068, 0.115, 0.155]
      cracks.forEach((t, i) => {
        triggerNoiseGrain(ctx, now + t, 0.024, 3200 + i * 380, 5.0, 0.22, 'highpass')
      })
      const tones = [1760, 2349, 2960]
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.045)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + i * 0.045 + 0.09)
        g.gain.setValueAtTime(0.08, now + i * 0.045)
        g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.045 + 0.11)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + i * 0.045)
        osc.stop(now + i * 0.045 + 0.12)
      })
    } else if (kind === 'pudding-jiggle') {
      // 🍮 말랑 푸딩 & 구미 젤리: 탱글탱글~ 탄성 있게 흔들리는 피치 모듈레이션 사운드
      const osc = ctx.createOscillator()
      const mod = ctx.createOscillator()
      const modGain = ctx.createGain()
      const mainGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(240, now)
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.14)
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.26)
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.36)

      mod.type = 'sine'
      mod.frequency.setValueAtTime(18, now)
      modGain.gain.setValueAtTime(55, now)

      mainGain.gain.setValueAtTime(0.001, now)
      mainGain.gain.linearRampToValueAtTime(0.18, now + 0.03)
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

      mod.connect(modGain)
      modGain.connect(osc.frequency)
      osc.connect(mainGain)
      mainGain.connect(ctx.destination)

      osc.start(now)
      mod.start(now)
      osc.stop(now + 0.4)
      mod.stop(now + 0.4)
    } else if (kind === 'mochi-squish') {
      // 🍡 찹쌀떡 모찌: 포근하게 꾹 눌리는 소리 + 쫀득하게 떨어지는 소리 2단계
      const osc1 = ctx.createOscillator()
      const g1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(280, now)
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.11)
      g1.gain.setValueAtTime(0.16, now)
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc1.connect(g1)
      g1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.13)

      // 쫀득하게 늘어나며 붙었다 떨어지는 고운 소리
      const osc2 = ctx.createOscillator()
      const g2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(190, now + 0.12)
      osc2.frequency.exponentialRampToValueAtTime(520, now + 0.25)
      g2.gain.setValueAtTime(0.12, now + 0.12)
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.27)
      osc2.connect(g2)
      g2.connect(ctx.destination)
      osc2.start(now + 0.12)
      osc2.stop(now + 0.28)
    } else if (kind === 'choco-melt') {
      // 🍫 달콤 퐁듀 초코: 따뜻하고 부드러운 가나슈 버블 팝 3연속
      const pops = [
        { t: 0, f1: 220, f2: 410 },
        { t: 0.09, f1: 260, f2: 480 },
        { t: 0.18, f1: 310, f2: 590 },
      ]
      pops.forEach((p) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(p.f1, now + p.t)
        osc.frequency.exponentialRampToValueAtTime(p.f2, now + p.t + 0.075)
        g.gain.setValueAtTime(0.14, now + p.t)
        g.gain.exponentialRampToValueAtTime(0.001, now + p.t + 0.085)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + p.t)
        osc.stop(now + p.t + 0.09)
      })
    } else if (kind === 'smore-sizzle') {
      // 🔥 구운 스모어 마시멜로: 노릇한 마시멜로 껍질의 바스락 시즐링 + 폭신한 스퀴시
      triggerNoiseGrain(ctx, now, 0.18, 2400, 1.8, 0.14, 'bandpass')
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(210, now + 0.05)
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.22)
      g.gain.setValueAtTime(0.14, now + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(now + 0.05)
      osc.stop(now + 0.25)
    } else {
      // 🌈 시럽 & 스프링클 토핑: 알록달록 구슬이 또르르 구르는 하프 차임
      const notes = [880, 1174, 1396, 1760]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq * pitchBoost, now + i * 0.04)
        g.gain.setValueAtTime(0.09, now + i * 0.04)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + i * 0.04)
        osc.stop(now + i * 0.04 + 0.13)
      })
    }

    // 연속 터치/콤보 시 중독성 있는 크리스탈 슈가 배음 추가
    if (comboStep >= 2) {
      const bell = ctx.createOscillator()
      const bellGain = ctx.createGain()
      bell.type = 'sine'
      bell.frequency.setValueAtTime(1046.5 * pitchBoost, now + 0.06)
      bell.frequency.exponentialRampToValueAtTime(1567.98 * pitchBoost, now + 0.19)
      bellGain.gain.setValueAtTime(0.055, now + 0.06)
      bellGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.21)
      bell.connect(bellGain)
      bellGain.connect(ctx.destination)
      bell.start(now + 0.06)
      bell.stop(now + 0.22)
    }
  } catch {
    // 오디오 컨텍스트 제한 시에도 앱이 절대 멈추지 않도록 안전 처리
  }
  return meta
}

