// 디저트 캐릭터 질감별 ASMR 사운드 & 아이폰 햅틱 브릿지
// 소리는 종류마다 다른 물리 재료(껍질이 깨지는 입자, 물방울, 나무·유리 울림, 탄산 기포, 고무 마찰 등)로
// soundSynth.ts에서 합성한다. 이 파일은 종류 목록·종족 매핑·햅틱·재생(캐시·마스터 볼륨)을 맡는다.
import { synthesizeDessertSound, type SynthKind } from './soundSynth'

export type DessertSoundKind =
  | 'kataifi-crunch' // 💚 두바이 쫀득쿠키: 바사삭! 카다이프 면발 & 피스타치오 크런치
  | 'wax-pop' // 🫧 왁뿌볼: 단단한 왁스 껍질이 꾹 눌리다 아-그-작 깨지고, 속의 말랑한 점액이 쭈욱 새는 소리
  | 'wax-tap' // 🫧 왁뿌볼 선택음: 버튼을 누를 때 나는 짧은 아그작 (기본 버튼 소리)
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
    label: '왁뿌볼 아그작 말랑',
    onomatopoeia: '끽… 아-그-작! 쭈왁~ 🫧',
    desc: '단단하게 코팅된 왁스 껍질이 꾹 눌리다 아-그-작 세 조각으로 깨지고, 부스러기가 후두둑 떨어진 뒤 속의 말랑한 점액이 쭈욱 새어 나오는 왁뿌볼 ASMR',
    icon: '🫧',
  },
  'wax-tap': {
    kind: 'wax-tap',
    label: '왁뿌볼 선택음',
    onomatopoeia: '아그작! 🫧',
    desc: '버튼을 누를 때마다 나는 짧고 경쾌한 왁뿌볼 소리. 단단한 껍질이 아그작 갈라지고 말랑한 끝맛이 남아요',
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
    kind === 'wax-tap' ||
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
  'wax-tap': 8,
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


// ───────── 재생 ─────────
// 소리 계산은 soundSynth.ts(순수 코드)가 하고, 여기서는 계산된 소리를 AudioBuffer로 감싸 재생한다.
// - 같은 소리를 여러 번 계산해 두고 돌려 가며 틀어서, 같은 디저트를 연타해도 매번 조금씩 다르게 들린다
// - 첫 재생이 끊기지 않도록 처음 소리가 난 뒤 나머지 17종을 짬짬이 미리 계산해 둔다
// - 마스터 볼륨과 부드러운 압축기를 거쳐, 소리가 겹쳐도 찢어지지 않는다

const VARIANTS_PER_KIND = 3

let masterBus: GainNode | null = null
const bufferCache = new Map<DessertSoundKind, AudioBuffer[]>()
let warmupStarted = false

function getMasterBus(ctx: AudioContext): AudioNode {
  if (masterBus && masterBus.context === ctx) return masterBus
  const gain = ctx.createGain()
  gain.gain.value = 0.92
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.knee.value = 14
  comp.ratio.value = 3
  comp.attack.value = 0.004
  comp.release.value = 0.16
  gain.connect(comp)
  comp.connect(ctx.destination)
  masterBus = gain
  return gain
}

function renderBuffer(ctx: AudioContext, kind: DessertSoundKind): AudioBuffer {
  const s = synthesizeDessertSound(kind as SynthKind, ctx.sampleRate)
  const buf = ctx.createBuffer(2, s.L.length, s.sampleRate)
  buf.getChannelData(0).set(s.L)
  buf.getChannelData(1).set(s.R)
  return buf
}

function pickBuffer(ctx: AudioContext, kind: DessertSoundKind): AudioBuffer {
  let list = bufferCache.get(kind)
  if (!list) {
    list = []
    bufferCache.set(kind, list)
  }
  if (list.length === 0) list.push(renderBuffer(ctx, kind))
  return list[Math.floor(Math.random() * list.length)]
}

// 한 번 재생한 뒤에는 조용한 틈에 변형을 하나씩 더 계산해 둔다
function topUpVariants(ctx: AudioContext, kind: DessertSoundKind) {
  const list = bufferCache.get(kind)
  if (!list || list.length >= VARIANTS_PER_KIND) return
  setTimeout(() => {
    try {
      if (list.length < VARIANTS_PER_KIND) list.push(renderBuffer(ctx, kind))
    } catch {
      // 계산에 실패해도 재생은 계속된다
    }
  }, 120)
}

// 처음 소리가 난 뒤 나머지 소리를 하나씩 미리 계산해 둔다 (한꺼번에 하지 않아 화면이 버벅이지 않는다)
function warmUpAll(ctx: AudioContext) {
  if (warmupStarted) return
  warmupStarted = true
  const kinds = Object.keys(DESSERT_SOUND_CATALOG) as DessertSoundKind[]
  let i = 0
  const step = () => {
    if (i >= kinds.length) return
    const kind = kinds[i++]
    try {
      if (!bufferCache.get(kind)?.length) bufferCache.set(kind, [renderBuffer(ctx, kind)])
    } catch {
      // 무시
    }
    setTimeout(step, 90)
  }
  setTimeout(step, 400)
}

// 디저트 질감별 ASMR 사운드 + 손맛 햅틱 재생 (Zero-Crash 보장)
// comboStep이 커질수록 소리가 살짝 높고 빨라져 연타의 쾌감이 쌓인다
let lastAsmrAt = 0

export function playDessertAsmr(kind: DessertSoundKind, comboStep = 0): SoundMeta {
  const meta = DESSERT_SOUND_CATALOG[kind] ?? DESSERT_SOUND_CATALOG['mochi-squish']
  lastAsmrAt = Date.now()
  try {
    triggerSensoryHaptic(kind)
    if (isAsmrMuted()) return meta
    const ctx = getAudioContext()
    if (!ctx) return meta
    const key = DESSERT_SOUND_CATALOG[kind] ? kind : 'mochi-squish'
    const src = ctx.createBufferSource()
    src.buffer = pickBuffer(ctx, key)
    const combo = Math.min(8, Math.max(0, comboStep))
    src.playbackRate.value = (1 + combo * 0.02) * (1 + (Math.random() - 0.5) * 0.03)
    src.connect(getMasterBus(ctx))
    src.start()
    topUpVariants(ctx, key)
    warmUpAll(ctx)
  } catch {
    // 오디오 컨텍스트 제한 시에도 앱이 절대 멈추지 않도록 안전 처리
  }
  return meta
}

// ───────── 기본 선택 버튼음: 왁뿌볼 ─────────
// 화면의 모든 버튼을 누를 때 짧은 왁뿌볼 소리(wax-tap)를 낸다.
// - 버튼이 이미 자기 소리를 내는 경우(돌보기·훈련·대전 등)에는 겹치지 않도록 건너뛴다
// - 버튼에 data-silent 를 달면 소리를 내지 않는다 (입력칸·스위치처럼 조용해야 하는 곳)
// - 소리를 끄면(isAsmrMuted) 선택음도 함께 꺼진다
const UI_TAP_GAP_MS = 70
const OWN_SOUND_GRACE_MS = 160
let uiTapInstalled = false
let lastUiTapAt = 0

export function installUiTapSound(): void {
  if (uiTapInstalled || typeof document === 'undefined') return
  uiTapInstalled = true
  // 버블 단계에서 듣는다: 버튼 자신의 onClick(React)이 먼저 실행된 뒤, 그 버튼이 따로 소리를 냈는지 확인할 수 있다
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!(target instanceof Element)) return
    const btn = target.closest('button, [role="button"]')
    if (!btn || btn.closest('[data-silent]')) return
    if ((btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true') return
    const now = Date.now()
    if (now - lastUiTapAt < UI_TAP_GAP_MS || now - lastAsmrAt < OWN_SOUND_GRACE_MS) return
    lastUiTapAt = now
    playDessertAsmr('wax-tap')
  })
}
