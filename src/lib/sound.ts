// 디저트 캐릭터 질감별 리얼 폴라(Foley) ASMR 사운드 & 아이폰 햅틱 브릿지 엔진
// 기계적인 전자음(단순 사인파/삼각파 멜로디)을 100% 배제하고,
// 실제 마이크로 녹음한 듯한 다층 입자 파쇄음(Granular Fracture), 점탄성 공기포 마찰음(Viscoelastic Suction),
// 과즙 기포 캐비테이션(Cavitation Bubble), 아이폰 Taptic 스위치 & 초저역(45Hz) 스피커 진동 펄스를 합성합니다.

export type DessertSoundKind =
  | 'kataifi-crunch' // 💚 두바이 쫀득쿠키: 바사삭! 카다이프 면발 & 피스타치오 크런치
  | 'wax-pop' // 🫧 톡톡 왁싱볼(히트캔디): 톡! 파삭~ 얇은 왁스 껍질이 깨지며 과즙 시럽이 쭈욱 터지는 소리
  | 'cookie-crisp' // 🍪 초코칩 쿠키 / 크로플: 오독오독 바삭한 버터 쿠키 베어무는 소리
  | 'sugar-crack' // 🍓 유리알 탕후루: 빠작! 톡! 얇고 투명한 설탕 코팅이 경쾌하게 깨지는 소리
  | 'mochi-squish' // 🍡 찹쌀떡 모찌: 쫀득~ 말랑말랑 찰떡 반죽이 늘어났다 떼어지는 소리
  | 'pudding-jiggle' // 🍮 말랑 푸딩: 탱글탱글~ 뽀용! 부드럽게 출렁이는 탄성 진동음
  | 'jelly-gummy' // 🐻 쫀득 젤리: 쫘압- 쫀득쫀득 고탄성 과일 구미 젤리 씹는 소리
  | 'choco-melt' // 🍫 달콤 퐁듀 초코: 사르르~ 꾸덕하고 따뜻한 가나슈·시럽 기포 소리
  | 'cotton-puff' // ☁️ 몽실 솜사탕: 사르르~ 입안에서 보송보송 녹아내리는 극상의 에어리 사운드
  | 'acorn-snap' // 🌰 콩콩 도토리: 또각- 딱! 고소하고 야무진 너츠 크래킹 소리
  | 'soda-fizz' // ⚡ 번개꼬리 탄산 소다: 톡톡 파바박! 탄산 기포가 청량하게 터지는 스파클링 소리
  | 'biscuit-armor' // 🛡️ 강철등 비스킷: 콰득- 단단한 통밀 비스킷 판갑이 묵직하게 부서지는 소리
  | 'flambe-crackle' // 🔥 흑염 다크초코: 타닥타닥- 진한 다크초코 카라멜라이징 크림 브륄레 소리
  | 'starlight-ting' // ✨ 별비늘 별사탕: 팅- 챠르릉! 투명한 설탕 결정체가 부딪치는 영롱한 크리스탈 소리
  | 'chameleon-morph' // 🦎 말랑 카멜레온: 뽀요용~ 찰떡 반죽이 카멜레온처럼 변형되는 마법 모찌음
  | 'syrup-drizzle' // 🍒 시럽 & 스프링클 토핑: 쪼르륵~ 반짝반짝 토핑 구슬이 쏟아지는 소리
  | 'smore-sizzle' // 🔥 구운 스모어 마시멜로: 치익~ 노릇하게 구워진 마시멜로 껍질 바스락 & 폭신 사운드

export interface SoundMeta {
  kind: DessertSoundKind
  label: string
  onomatopoeia: string
  desc: string
  icon: string
}

export const DESSERT_SOUND_CATALOG: Record<DessertSoundKind, SoundMeta> = {
  'kataifi-crunch': {
    kind: 'kataifi-crunch',
    label: '카다이프 바사삭 크런치',
    onomatopoeia: '바사삭-! 자작자작 💚✨',
    desc: '두바이 초코 속 볶은 카다이프 면발 수백 가닥이 겹겹이 바삭하게 부서지는 리얼 크런치 ASMR',
    icon: '💚',
  },
  'wax-pop': {
    kind: 'wax-pop',
    label: '왁싱볼 톡! 파삭 과즙팡',
    onomatopoeia: '톡! 파삭~ 쭈욱 츄릅! 🫧💦',
    desc: '얇은 밀랍 왁스 캡슐이 톡! 파삭 깨지며 진한 과일 시럽이 쭈욱 뿜어져 나오는 인기 ASMR',
    icon: '🫧',
  },
  'cookie-crisp': {
    kind: 'cookie-crisp',
    label: '오독오독 버터쿠키',
    onomatopoeia: '오독-! 바삭바삭 🍪',
    desc: '잘 구워진 두툼한 초코칩 버터 쿠키가 묵직하고 고소하게 부서지는 크런치 사운드',
    icon: '🍪',
  },
  'sugar-crack': {
    kind: 'sugar-crack',
    label: '유리알 설탕코팅 빠작',
    onomatopoeia: '빠작-! 톡톡 🍓💎',
    desc: '탕후루의 얇고 투명한 설탕 유리막이 빠작! 하고 깨지며 과즙이 배어 나오는 소리',
    icon: '🍓',
  },
  'mochi-squish': {
    kind: 'mochi-squish',
    label: '쫀득 말랑 찹쌀떡',
    onomatopoeia: '쫀득~ 말랑말랑 🍡🤍',
    desc: '고운 전분 가루가 묻은 찹쌀떡 모찌가 폭신하게 눌렸다가 쫀득하게 달라붙어 떨어지는 소리',
    icon: '🍡',
  },
  'pudding-jiggle': {
    kind: 'pudding-jiggle',
    label: '탱글탱글 커스터드 푸딩',
    onomatopoeia: '탱글~ 출렁출렁 🍮✨',
    desc: '촉촉한 시럽이 발린 커스터드 푸딩이 탱글탱글 탄성 있게 출렁이는 소리',
    icon: '🍮',
  },
  'jelly-gummy': {
    kind: 'jelly-gummy',
    label: '쫘압 쫀득 구미젤리',
    onomatopoeia: '쫘압~ 쫀득쫀득 🐻🍬',
    desc: '영롱하고 찰진 과일 구미 젤리가 잇몸 사이에서 쫘압- 늘어나며 씹히는 고탄성 ASMR',
    icon: '🐻',
  },
  'choco-melt': {
    kind: 'choco-melt',
    label: '사르르 퐁듀 초코',
    onomatopoeia: '사르르~ 꾸덕꾸덕 🍫✨',
    desc: '따뜻하고 진한 가나슈 초콜릿 퐁듀가 꾸덕하게 섞이며 작은 기포가 톡톡 터지는 소리',
    icon: '🍫',
  },
  'cotton-puff': {
    kind: 'cotton-puff',
    label: '보송보송 구름 솜사탕',
    onomatopoeia: '사르르~ 보송보송 ☁️🫧',
    desc: '공기를 가득 머금은 솜사탕 양털이 입안에 닿자마자 미세 기포를 터뜨리며 사르르 녹는 소리',
    icon: '☁️',
  },
  'acorn-snap': {
    kind: 'acorn-snap',
    label: '또각 딱 도토리 쿠키',
    onomatopoeia: '또각-! 오독바삭 🌰🐿️',
    desc: '햇살 가득 머금은 단단한 도토리 껍질이 딱! 갈라지며 고소한 너츠 쿠키가 씹히는 소리',
    icon: '🌰',
  },
  'soda-fizz': {
    kind: 'soda-fizz',
    label: '톡톡 스파클링 소다',
    onomatopoeia: '치이익~ 톡톡 파바박! ⚡🍋',
    desc: '시원한 레몬 소다 속 탄산 기포 수천 개가 톡톡 튀며 청량하게 터지는 스파클링 사운드',
    icon: '⚡',
  },
  'biscuit-armor': {
    kind: 'biscuit-armor',
    label: '묵직 바삭 강철 비스킷',
    onomatopoeia: '콰득-! 단단바삭 🛡️🍪',
    desc: '수백 겹으로 압착된 통밀 비스킷 판갑이 묵직한 힘으로 콰득! 부서지는 단단한 크런치음',
    icon: '🛡️',
  },
  'flambe-crackle': {
    kind: 'flambe-crackle',
    label: '타닥타닥 다크초코 브륄레',
    onomatopoeia: '타닥타닥~ 카라멜 파작! 🔥🍫',
    desc: '푸른 불꽃으로 플람베된 다크초코 카라멜 막이 타닥타닥 타오르며 바삭하게 갈라지는 소리',
    icon: '🔥',
  },
  'starlight-ting': {
    kind: 'starlight-ting',
    label: '팅 챠르릉 별사탕 크리스탈',
    onomatopoeia: '팅-! 챠르르릉 ✨💎',
    desc: '은하수 별자리 결정체인 별사탕들이 부딪치며 맑고 청아하게 울려 퍼지는 크리스탈 사운드',
    icon: '✨',
  },
  'chameleon-morph': {
    kind: 'chameleon-morph',
    label: '뽀요용 무지개 모찌',
    onomatopoeia: '뽀요용~ 말랑말랑 🦎🌈',
    desc: '만능 찹쌀 반죽이 체형을 자유자재로 바꾸며 뽀용~ 쫀득하게 반응하는 마법 사운드',
    icon: '🦎',
  },
  'syrup-drizzle': {
    kind: 'syrup-drizzle',
    label: '달콤 시럽 & 스프링클',
    onomatopoeia: '샤르르~ 토독토독 🌈🍒',
    desc: '케이크 위에 진한 시럽이 흐르고 설탕 스프링클 구슬들이 토독토독 쏟아지는 소리',
    icon: '🌈',
  },
  'smore-sizzle': {
    kind: 'smore-sizzle',
    label: '노릇 폭신 스모어',
    onomatopoeia: '바스락~ 폭신 사르르 🔥🐾',
    desc: '모닥불에 노릇하게 구워진 마시멜로 겉껍질이 바스락 갈라지며 속살이 폭신하게 늘어나는 소리',
    icon: '🔥',
  },
}

const MUTE_STORAGE_KEY = 'withpet_asmr_muted_v1'

let sharedCtx: AudioContext | null = null
let iosHapticLabel: HTMLLabelElement | null = null

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

// 아이폰(iOS 17.4+ / iOS 18 Safari) 전용 네이티브 Taptic Engine 스위치 햅틱 브릿지 생성
function ensureIosHapticBridge(): HTMLLabelElement | null {
  try {
    if (typeof document === 'undefined') return null
    if (iosHapticLabel && document.body.contains(iosHapticLabel)) return iosHapticLabel

    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.position = 'fixed'
    label.style.left = '-9999px'
    label.style.top = '-9999px'
    label.style.width = '1px'
    label.style.height = '1px'
    label.style.opacity = '0'
    label.style.pointerEvents = 'none'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.body.appendChild(label)
    iosHapticLabel = label
    return label
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

// 종족/변신 체형에 따른 1:1 고유 리얼 ASMR 사운드 매핑 (15종 전 종족 중복 배제)
export function getSpeciesSoundKind(speciesId: string, dessertBase?: string): DessertSoundKind {
  // 1. 15종 개별 고유 종족 매핑
  if (speciesId === 'dubai-cookie') return 'kataifi-crunch'
  if (speciesId === 'wax-ball') return 'wax-pop'
  if (speciesId === 'tanghulu') return 'sugar-crack'
  if (speciesId === 'smore') return 'smore-sizzle'
  if (speciesId === 'pudding') return 'pudding-jiggle'
  if (speciesId === 'jelly') return 'jelly-gummy'
  if (speciesId === 'choco') return 'choco-melt'
  if (speciesId === 'mongsil') return 'cotton-puff'
  if (speciesId === 'kongkong') return 'acorn-snap'
  if (speciesId === 'beongaekkori') return 'soda-fizz'
  if (speciesId === 'gangcheoldeung') return 'biscuit-armor'
  if (speciesId === 'heugyeom') return 'flambe-crackle'
  if (speciesId === 'byeolbineul') return 'starlight-ting'
  if (speciesId === 'chameleon') return 'chameleon-morph'
  if (speciesId === 'mochi') return 'mochi-squish'

  // 2. 플레이팅 받침대 폴백
  if (dessertBase === 'choco-cookie') return 'cookie-crisp'
  if (dessertBase === 'custard-pudding') return 'pudding-jiggle'
  if (dessertBase === 'parfait-cup') return 'soda-fizz'
  if (dessertBase === 'macaron-cushion') return 'cotton-puff'
  return 'mochi-squish'
}

export type SensoryCategory = 'crispy' | 'chewy' | 'jiggly' | 'melty'

export function getSensoryCategory(kind: DessertSoundKind): SensoryCategory {
  if (
    kind === 'kataifi-crunch' ||
    kind === 'wax-pop' ||
    kind === 'cookie-crisp' ||
    kind === 'sugar-crack' ||
    kind === 'acorn-snap' ||
    kind === 'biscuit-armor' ||
    kind === 'starlight-ting'
  )
    return 'crispy'
  if (kind === 'pudding-jiggle' || kind === 'jelly-gummy') return 'jiggly'
  if (kind === 'choco-melt' || kind === 'smore-sizzle' || kind === 'flambe-crackle') return 'melty'
  return 'chewy'
}

const HAPTIC_PATTERNS: Record<DessertSoundKind, number | number[]> = {
  'kataifi-crunch': [14, 18, 12, 16, 16, 20, 12],
  'wax-pop': [26, 18, 12, 48],
  'cookie-crisp': [24, 24, 18, 22],
  'sugar-crack': [30, 28, 14],
  'mochi-squish': [20, 48, 16],
  'pudding-jiggle': [12, 24, 12, 24, 12],
  'jelly-gummy': [24, 38, 20, 42],
  'choco-melt': [38],
  'cotton-puff': [10, 12, 10],
  'acorn-snap': [32, 16],
  'soda-fizz': [8, 12, 8, 14, 8, 12],
  'biscuit-armor': [42, 26, 32],
  'flambe-crackle': [16, 24, 18, 30],
  'starlight-ting': [12, 35, 12],
  'chameleon-morph': [18, 36, 18],
  'syrup-drizzle': [10, 14, 10, 14, 10],
  'smore-sizzle': [16, 22, 30],
}

// 안드로이드 navigator.vibrate + 아이폰 Taptic Engine 스위치 브릿지 동시 실행
export function triggerSensoryHaptic(kind: DessertSoundKind) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(HAPTIC_PATTERNS[kind] ?? 18)
    }
    const label = ensureIosHapticBridge()
    if (label) {
      label.click()
    }
  } catch {
    // 진동 미지원 환경 안전 무시
  }
}

// 아이폰 스피커 인클로저를 손끝에서 실제로 울리게 만드는 초저역(44~58Hz) 촉각 공명 펄스
function triggerSubBassTactilePulse(ctx: AudioContext, startTime: number, strength = 0.28, duration = 0.065) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(58, startTime)
  osc.frequency.exponentialRampToValueAtTime(36, startTime + duration)
  gain.gain.setValueAtTime(0.001, startTime)
  gain.gain.linearRampToValueAtTime(strength, startTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.005)
}

// 1. 실제 바삭/크런치 파쇄 입자 합성기 (순수 파형 멜로디 없이 수백 개의 비대칭 미세 균열 임펄스와 공명 필터로 실제 베어무는 소리 생성)
function playFractureCluster(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  opts: {
    density: number // 초당 미세 파쇄 입자 수
    formantLow: number // 주 공명 주파수 (쿠키/카다이프 바디감)
    formantHigh: number // 고역 크랙 주파수 (설탕/왁스 파삭거림)
    qLow: number
    qHigh: number
    gain: number
     woodyThump?: number // 첫 입 베어물 때의 치아/껍질 저항감
  },
) {
  const sr = ctx.sampleRate
  const len = Math.max(1, Math.floor(sr * duration))
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  // 브라운/핑크 노이즈 기반의 다공성 크럼블 질감 + 비규칙 스파이크 임펄스
  let last = 0
  const expectedSpikes = Math.max(4, Math.floor(duration * opts.density))
  for (let s = 0; s < expectedSpikes; s++) {
    const pos = Math.floor(Math.pow(Math.random(), 0.85) * (len - 64))
    const amp = (0.35 + Math.random() * 0.65) * (Math.random() < 0.5 ? 1 : -1)
    const decayLen = Math.min(len - pos, Math.floor(sr * (0.0008 + Math.random() * 0.0032)))
    const ringFreq = opts.formantLow + Math.random() * (opts.formantHigh - opts.formantLow)
    const omega = (2 * Math.PI * ringFreq) / sr
    for (let j = 0; j < decayLen; j++) {
      const env = Math.exp((-j / decayLen) * 5.2)
      // 비대칭 감쇠 진동 + 미세 노이즈 결합 (기계음 방지)
      const grain = Math.sin(j * omega) * 0.55 + (Math.random() * 2 - 1) * 0.45
      data[pos + j] += amp * env * grain
    }
  }

  // 미세한 바스락 결(Texture Bed) 추가 및 소프트 클리핑
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.06 * white) / 1.06
    const macroEnv = Math.sin((Math.PI * i) / len)
    const sample = data[i] + last * 0.18 * macroEnv
    data[i] = Math.tanh(sample * 1.6)
  }

  const src = ctx.createBufferSource()
  src.buffer = buf

  const fLow = ctx.createBiquadFilter()
  fLow.type = 'bandpass'
  fLow.frequency.setValueAtTime(opts.formantLow, startTime)
  fLow.Q.setValueAtTime(opts.qLow, startTime)

  const fHigh = ctx.createBiquadFilter()
  fHigh.type = 'peaking'
  fHigh.frequency.setValueAtTime(opts.formantHigh, startTime)
  fHigh.Q.setValueAtTime(opts.qHigh, startTime)
  fHigh.gain.setValueAtTime(8, startTime)

  const outGain = ctx.createGain()
  outGain.gain.setValueAtTime(opts.gain, startTime)

  src.connect(fLow)
  fLow.connect(fHigh)
  fHigh.connect(outGain)
  outGain.connect(ctx.destination)

  src.start(startTime)
  src.stop(startTime + duration)

  if (opts.woodyThump) {
    triggerSubBassTactilePulse(ctx, startTime, opts.woodyThump, 0.055)
  }
}

// 2. 실제 점탄성(Viscoelastic) 반죽·젤리·과즙·기포 폴라(Foley) 합성기
// (기계적인 오실레이터 멜로디 대신, 젖은 공명 필터 노이즈와 미세 공기방울 캐비테이션 임펄스로 실제 찹쌀떡·푸딩·과즙 소리를 재현)
function playWetSquishFoley(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  opts: {
    baseCutoff: number
    peakCutoff: number
    resonanceQ: number
    bubbleCount: number
    wobbleHz?: number
    gain: number
  },
) {
  const sr = ctx.sampleRate
  const len = Math.max(1, Math.floor(sr * duration))
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  // 부드러운 벨벳 핑크 노이즈(전분/시럽 마찰음) + 점성 기포 팝(Cavitation Micro-Pops)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.997 * b0 + w * 0.029
    b1 = 0.985 * b1 + w * 0.032
    b2 = 0.94 * b2 + w * 0.048
    const pink = b0 + b1 + b2
    const tNorm = i / len
    const env = Math.sin(Math.PI * tNorm) * Math.pow(1 - tNorm, 0.5)
    const wobble = opts.wobbleHz ? 0.65 + 0.35 * Math.sin((2 * Math.PI * opts.wobbleHz * i) / sr) : 1
    data[i] = pink * env * wobble * 0.35
  }

  // 쫀득하게 늘어나거나 과즙이 터질 때 나는 실제 미세 점액 방울 팝(Micro-Suction Pops)
  for (let b = 0; b < opts.bubbleCount; b++) {
    const pos = Math.floor((0.12 + 0.78 * (b / Math.max(1, opts.bubbleCount)) + (Math.random() - 0.5) * 0.08) * (len - 256))
    const SafePos = Math.max(0, Math.min(len - 256, pos))
    const popDur = Math.floor(sr * (0.004 + Math.random() * 0.008))
    const fStart = opts.baseCutoff * (0.9 + Math.random() * 0.5)
    const fEnd = opts.peakCutoff * (0.85 + Math.random() * 0.4)
    let phase = 0
    for (let j = 0; j < popDur && SafePos + j < len; j++) {
      const pNorm = j / popDur
      // 실제 물방울(Minnaert resonance) 공식: 주파수가 급격히 상승하며 짧게 끊김
      const instFreq = fStart + (fEnd - fStart) * Math.pow(pNorm, 1.7)
      phase += (2 * Math.PI * instFreq) / sr
      const popEnv = Math.sin(Math.PI * pNorm) * Math.exp(-pNorm * 2.4)
      data[SafePos + j] += Math.sin(phase) * popEnv * 0.65
    }
  }

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(opts.baseCutoff, startTime)
  filter.frequency.exponentialRampToValueAtTime(opts.peakCutoff, startTime + duration * 0.42)
  filter.frequency.exponentialRampToValueAtTime(Math.max(180, opts.baseCutoff * 0.8), startTime + duration)
  filter.Q.setValueAtTime(opts.resonanceQ, startTime)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(opts.gain, startTime)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  src.start(startTime)
  src.stop(startTime + duration)
}

// 디저트 질감별 리얼 폴라(Foley) ASMR 사운드 + 손맛 햅틱 브릿지 재생 (Zero-Crash 보장)
export function playDessertAsmr(kind: DessertSoundKind, comboStep = 0): SoundMeta {
  const meta = DESSERT_SOUND_CATALOG[kind] ?? DESSERT_SOUND_CATALOG['mochi-squish']
  try {
    triggerSensoryHaptic(kind)
    if (isAsmrMuted()) return meta
    const ctx = getAudioContext()
    if (!ctx) return meta
    const now = ctx.currentTime
    // 콤보가 쌓일수록 포먼트가 살짝 더 선명해지되 기계적인 반음계 멜로디는 절대 재생하지 않음
    const crispBoost = 1 + Math.min(8, Math.max(0, comboStep)) * 0.025

    if (kind === 'kataifi-crunch') {
      // 💚 두바이 쫀득쿠키:
      // 1) 첫 입에 두툼한 초코 코팅이 묵직하게 갈라지는 소리
      playFractureCluster(ctx, now, 0.065, {
        density: 260,
        formantLow: 620,
        formantHigh: 1950 * crispBoost,
        qLow: 1.4,
        qHigh: 2.8,
        gain: 0.42,
        woodyThump: 0.34,
      })
      // 2) 속 안의 볶은 카다이프 면발 수백 가닥이 3연속 파도로 바사삭-! 자작자작 부서지는 고밀도 그라뉼러 크런치
      const waves = [
        { t: 0.045, d: 0.095, density: 540, low: 1180, high: 3600 * crispBoost, g: 0.46 },
        { t: 0.135, d: 0.088, density: 480, low: 1320, high: 3950 * crispBoost, g: 0.38 },
        { t: 0.215, d: 0.08, density: 360, low: 1050, high: 3200 * crispBoost, g: 0.28 },
      ]
      waves.forEach((w) =>
        playFractureCluster(ctx, now + w.t, w.d, {
          density: w.density,
          formantLow: w.low,
          formantHigh: w.high,
          qLow: 1.8,
          qHigh: 3.4,
          gain: w.g,
        }),
      )
      // 3) 피스타치오 스프레드의 꾸덕한 크림 여운
      playWetSquishFoley(ctx, now + 0.08, 0.22, {
        baseCutoff: 340,
        peakCutoff: 780,
        resonanceQ: 3.2,
        bubbleCount: 4,
        gain: 0.22,
      })
    } else if (kind === 'wax-pop') {
      // 🫧 톡톡 과즙 왁싱볼(히트캔디):
      // 1단계 (0~75ms): 속이 빈 얇은 밀랍 왁스 캡슐이 치아에 눌려 '톡! 파삭~' 경쾌하게 깨지는 공동(Cavity) 크랙음
      playFractureCluster(ctx, now, 0.072, {
        density: 340,
        formantLow: 880,
        formantHigh: 2850 * crispBoost,
        qLow: 2.6,
        qHigh: 4.0,
        gain: 0.46,
        woodyThump: 0.32,
      })
      // 2단계 (65~370ms): 깨진 왁스 틈으로 진한 과일 시럽이 '쭈욱~ 츄릅💦' 뿜어져 나오는 리얼 액체 스퀴즈 & 과즙 방울 사운드
      playWetSquishFoley(ctx, now + 0.062, 0.31, {
        baseCutoff: 420,
        peakCutoff: 1480 * crispBoost,
        resonanceQ: 4.8,
        bubbleCount: 9,
        wobbleHz: 14,
        gain: 0.44,
      })
      triggerSubBassTactilePulse(ctx, now + 0.085, 0.25, 0.08)
    } else if (kind === 'cookie-crisp') {
      // 🍪 오독오독 버터쿠키: 두툼하고 고소한 다공성 버터 쇼트브레드가 오독! 바삭! 세 번에 걸쳐 부서지는 소리
      const bites = [
        { t: 0, d: 0.075, low: 540, high: 1850, g: 0.45, thump: 0.32 },
        { t: 0.082, d: 0.068, low: 680, high: 2150, g: 0.38, thump: 0.22 },
        { t: 0.16, d: 0.065, low: 610, high: 1920, g: 0.3, thump: 0 },
      ]
      bites.forEach((b) =>
        playFractureCluster(ctx, now + b.t, b.d, {
          density: 310,
          formantLow: b.low,
          formantHigh: b.high * crispBoost,
          qLow: 1.6,
          qHigh: 2.6,
          gain: b.g,
          woodyThump: b.thump,
        }),
      )
    } else if (kind === 'sugar-crack') {
      // 🍓 유리알 탕후루: 얇고 투명한 설탕 유리막이 '빠작! 톡톡' 날카롭게 금 가며 부서진 뒤 생과일 과즙이 터지는 소리
      playFractureCluster(ctx, now, 0.055, {
        density: 460,
        formantLow: 1650,
        formantHigh: 4800 * crispBoost,
        qLow: 2.8,
        qHigh: 4.5,
        gain: 0.44,
        woodyThump: 0.3,
      })
      playFractureCluster(ctx, now + 0.058, 0.065, {
        density: 380,
        formantLow: 1900,
        formantHigh: 5200 * crispBoost,
        qLow: 3.0,
        qHigh: 4.2,
        gain: 0.36,
      })
      // 설탕 코팅이 깨진 직후 상큼한 생딸기/포도 과육이 아삭 씹히며 과즙이 나오는 소리
      playWetSquishFoley(ctx, now + 0.07, 0.21, {
        baseCutoff: 520,
        peakCutoff: 1350,
        resonanceQ: 3.6,
        bubbleCount: 6,
        gain: 0.32,
      })
    } else if (kind === 'mochi-squish') {
      // 🍡 쫀득 말랑 찹쌀떡 모찌:
      // 1) 손가락이 폭신한 전분 가루 표면을 꾹 누를 때의 포근한 압착음
      triggerSubBassTactilePulse(ctx, now, 0.3, 0.075)
      playWetSquishFoley(ctx, now, 0.14, {
        baseCutoff: 260,
        peakCutoff: 620,
        resonanceQ: 2.8,
        bubbleCount: 3,
        gain: 0.38,
      })
      // 2) 쫀득한 찰떡 반죽이 늘어나며 손끝에서 쩍~ 쫀득! 하고 떨어지는 점탄성 흡착음
      playWetSquishFoley(ctx, now + 0.11, 0.21, {
        baseCutoff: 380,
        peakCutoff: 1180 * crispBoost,
        resonanceQ: 4.5,
        bubbleCount: 7,
        wobbleHz: 9,
        gain: 0.42,
      })
    } else if (kind === 'pudding-jiggle') {
      // 🍮 탱글탱글 푸딩 & 구미 젤리:
      // 촉촉한 카라멜 시럽이 묻은 푸딩이 접시 위에서 '탱-글-탱-글' 4번 탄성 있게 출렁이며 찰랑이는 소리
      triggerSubBassTactilePulse(ctx, now, 0.26, 0.07)
      playWetSquishFoley(ctx, now, 0.36, {
        baseCutoff: 320,
        peakCutoff: 980 * crispBoost,
        resonanceQ: 5.2,
        bubbleCount: 8,
        wobbleHz: 13.5,
        gain: 0.42,
      })
    } else if (kind === 'choco-melt') {
      // 🍫 달콤 퐁듀 초코: 따뜻하고 진한 초콜릿 가나슈가 꾸덕하게 휘저어지며 기포가 보글보글 터지는 소리
      triggerSubBassTactilePulse(ctx, now, 0.24, 0.08)
      playWetSquishFoley(ctx, now, 0.32, {
        baseCutoff: 240,
        peakCutoff: 760 * crispBoost,
        resonanceQ: 4.0,
        bubbleCount: 10,
        wobbleHz: 7.5,
        gain: 0.4,
      })
    } else if (kind === 'smore-sizzle') {
      // 🔥 구운 스모어 마시멜로: 겉의 노릇하게 구운 마시멜로 카라멜 크러스트가 바스락 갈라지며 속의 따뜻한 마시멜로가 폭신하게 늘어나는 소리
      playFractureCluster(ctx, now, 0.11, {
        density: 420,
        formantLow: 950,
        formantHigh: 3100 * crispBoost,
        qLow: 1.5,
        qHigh: 2.4,
        gain: 0.32,
        woodyThump: 0.26,
      })
      playWetSquishFoley(ctx, now + 0.06, 0.24, {
        baseCutoff: 290,
        peakCutoff: 840,
        resonanceQ: 3.4,
        bubbleCount: 6,
        gain: 0.36,
      })
    } else if (kind === 'jelly-gummy') {
      // 🐻 쫀득 구미 젤리: 찰지고 질긴 고탄성 젤리가 잇몸에서 쫘압- 쫀득하게 씹히는 묵직한 고무 탄성음
      triggerSubBassTactilePulse(ctx, now, 0.32, 0.08)
      playWetSquishFoley(ctx, now, 0.28, {
        baseCutoff: 310,
        peakCutoff: 880 * crispBoost,
        resonanceQ: 5.8,
        bubbleCount: 5,
        wobbleHz: 16,
        gain: 0.44,
      })
      playWetSquishFoley(ctx, now + 0.08, 0.22, {
        baseCutoff: 440,
        peakCutoff: 1250,
        resonanceQ: 4.2,
        bubbleCount: 7,
        wobbleHz: 11,
        gain: 0.38,
      })
    } else if (kind === 'cotton-puff') {
      // ☁️ 몽실 솜사탕: 수백만 개의 미세 설탕 실타래가 닿자마자 보송보송 사르르 녹아내리는 에어리 사운드
      playFractureCluster(ctx, now, 0.08, {
        density: 160,
        formantLow: 2200,
        formantHigh: 6400 * crispBoost,
        qLow: 0.8,
        qHigh: 1.5,
        gain: 0.24,
      })
      playWetSquishFoley(ctx, now + 0.02, 0.18, {
        baseCutoff: 580,
        peakCutoff: 1400,
        resonanceQ: 2.1,
        bubbleCount: 4,
        gain: 0.22,
      })
    } else if (kind === 'acorn-snap') {
      // 🌰 콩콩 도토리: 단단하고 오독한 견과류 껍질이 또각-! 딱 부러진 뒤 바삭하게 씹히는 고소한 너츠 사운드
      playFractureCluster(ctx, now, 0.048, {
        density: 380,
        formantLow: 420,
        formantHigh: 1650 * crispBoost,
        qLow: 3.2,
        qHigh: 5.0,
        gain: 0.5,
        woodyThump: 0.45,
      })
      playFractureCluster(ctx, now + 0.052, 0.065, {
        density: 290,
        formantLow: 750,
        formantHigh: 2200,
        qLow: 2.2,
        qHigh: 3.4,
        gain: 0.36,
      })
    } else if (kind === 'soda-fizz') {
      // ⚡ 번개꼬리 탄산 소다: 청량한 탄산 기포 수천 개가 치이익- 톡톡 파바박! 터져 나오는 스파클링 사운드
      triggerSubBassTactilePulse(ctx, now, 0.18, 0.05)
      playFractureCluster(ctx, now, 0.14, {
        density: 580,
        formantLow: 2400,
        formantHigh: 7200 * crispBoost,
        qLow: 1.2,
        qHigh: 2.8,
        gain: 0.42,
      })
      playWetSquishFoley(ctx, now + 0.03, 0.22, {
        baseCutoff: 650,
        peakCutoff: 2100,
        resonanceQ: 4.8,
        bubbleCount: 14,
        wobbleHz: 22,
        gain: 0.36,
      })
    } else if (kind === 'biscuit-armor') {
      // 🛡️ 강철등 통밀 비스킷: 단단하고 두꺼운 비스킷 판갑이 묵직하게 콰득! 깨지는 무거운 크런치음
      triggerSubBassTactilePulse(ctx, now, 0.38, 0.09)
      playFractureCluster(ctx, now, 0.09, {
        density: 460,
        formantLow: 320,
        formantHigh: 1450 * crispBoost,
        qLow: 2.8,
        qHigh: 4.2,
        gain: 0.52,
        woodyThump: 0.48,
      })
      playFractureCluster(ctx, now + 0.07, 0.08, {
        density: 320,
        formantLow: 520,
        formantHigh: 1800,
        qLow: 2.0,
        qHigh: 3.2,
        gain: 0.38,
      })
    } else if (kind === 'flambe-crackle') {
      // 🔥 흑염 다크초코 플람베: 카라멜라이징된 초코 표면이 타닥타닥 타오르며 파작 갈라지는 소리
      triggerSubBassTactilePulse(ctx, now, 0.28, 0.08)
      playFractureCluster(ctx, now, 0.065, {
        density: 420,
        formantLow: 850,
        formantHigh: 2900 * crispBoost,
        qLow: 2.4,
        qHigh: 3.8,
        gain: 0.44,
        woodyThump: 0.32,
      })
      playWetSquishFoley(ctx, now + 0.04, 0.26, {
        baseCutoff: 280,
        peakCutoff: 920,
        resonanceQ: 3.8,
        bubbleCount: 8,
        gain: 0.38,
      })
    } else if (kind === 'starlight-ting') {
      // ✨ 별비늘 별사탕 크리스탈: 맑고 투명한 유리알 별사탕들이 부딪치며 팅-! 챠르릉 울리는 소리
      playFractureCluster(ctx, now, 0.12, {
        density: 220,
        formantLow: 3200,
        formantHigh: 8500 * crispBoost,
        qLow: 4.5,
        qHigh: 7.2,
        gain: 0.46,
      })
      playFractureCluster(ctx, now + 0.04, 0.16, {
        density: 180,
        formantLow: 4200,
        formantHigh: 9200,
        qLow: 5.0,
        qHigh: 8.0,
        gain: 0.38,
      })
    } else if (kind === 'chameleon-morph') {
      // 🦎 말랑 카멜레온: 모찌 반죽이 뽀요용~ 출렁이며 형태를 자유자재로 바꾸는 마법 점탄성 사운드
      triggerSubBassTactilePulse(ctx, now, 0.3, 0.08)
      playWetSquishFoley(ctx, now, 0.26, {
        baseCutoff: 350,
        peakCutoff: 1350 * crispBoost,
        resonanceQ: 6.2,
        bubbleCount: 8,
        wobbleHz: 18,
        gain: 0.46,
      })
    } else {
      // 🌈 시럽 & 스프링클 토핑: 진한 시럽이 쪼르륵 흐르고 설탕 스프링클 알갱이들이 케이크 위에 토독토독 쏟아지는 리얼 폴라 사운드
      playWetSquishFoley(ctx, now, 0.18, {
        baseCutoff: 450,
        peakCutoff: 1150,
        resonanceQ: 3.2,
        bubbleCount: 5,
        gain: 0.28,
      })
      playFractureCluster(ctx, now + 0.03, 0.22, {
        density: 280,
        formantLow: 1800,
        formantHigh: 4600 * crispBoost,
        qLow: 2.2,
        qHigh: 3.8,
        gain: 0.32,
      })
    }
  } catch {
    // 오디오 컨텍스트 제한 시에도 앱이 절대 멈추지 않도록 안전 처리
  }
  return meta
}
