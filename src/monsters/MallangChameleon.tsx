// 메챠 카멜레온(Meccha Chameleon) 스타일 '말랑 카멜레온' 기본 체형 + 실시간 바디 페인팅·스탬프 + 만능 파츠 조합기
import { ClayGradientDefs, Eye, INK, SW, type Palette } from './Biped'
import Pattern from './Pattern'
import type { ArtProps, MonsterDecorations, MonsterLook, MonsterMedals, SpeciesDef } from './types'

export type MorphFormId =
  | 'chameleon'
  | 'mochi'
  | 'pudding'
  | 'jelly'
  | 'choco'
  | 'dubai-cookie'
  | 'wax-ball'
  | 'tanghulu'
  | 'smore'
  | 'mongsil'
  | 'kongkong'
  | 'beongaekkori'
  | 'gangcheoldeung'
  | 'heugyeom'
  | 'byeolbineul'

export type StampKind = 'star' | 'heart' | 'bolt' | 'flame' | 'swirl' | 'clover' | 'melon' | 'cherry' | 'strawberry'
export type WingKind = 'none' | 'dragon' | 'flame-mane' | 'rock-shell' | 'chameleon-crest'
export type DessertBaseId =
  | 'nest'
  | 'strawberry-cake'
  | 'choco-cookie'
  | 'custard-pudding'
  | 'macaron-cushion'
  | 'parfait-cup'
export type SyrupId = 'choco-drizzle' | 'berry-syrup' | 'matcha-powder' | 'rainbow-sprinkles' | 'sugar-powder'

export interface PaintStroke {
  color: string
  size: number
  points: [number, number][]
}

export interface PaintStamp {
  kind: StampKind
  x: number
  y: number
  color: string
  scale?: number
}

// 말랑 카멜레온 & 모찌 디저트 커스텀 데이터 (체형 몰딩 + 만능 파츠 + 바디 페인팅 + 디저트 플레이팅 받침대/시럽 + 코디/훈장)
export interface MallangCustom {
  morphForm?: MorphFormId
  skinPalette?: number
  earsSpecies?: string
  tailSpecies?: string
  wingKind?: WingKind
  strokes?: PaintStroke[]
  stamps?: PaintStamp[]
  dessertBase?: DessertBaseId
  syrups?: SyrupId[]
  decorations?: MonsterDecorations
  medals?: MonsterMedals
}

// 찰흙 물감 8색 팔레트 (Stitch 12번 공방 기준, 화이트리스트 검증용)
export const CLAY_PAINTS = [
  { id: 'coral', name: '코랄 핑크', color: '#FF7A59' },
  { id: 'mint', name: '민트 젤리', color: '#56C596' },
  { id: 'gold', name: '허니 골드', color: '#F7C04A' },
  { id: 'sky', name: '소다 스카이', color: '#64B5F6' },
  { id: 'lavender', name: '타로 라벤더', color: '#B388FF' },
  { id: 'melon', name: '멜론 크림', color: '#9CCC65' },
  { id: 'choco', name: '초코 차콜', color: '#4E342E' },
  { id: 'milk', name: '우유 화이트', color: '#FFFDF9' },
] as const

export const STAMP_CATALOG: { kind: StampKind; label: string; icon: string; defaultColor: string }[] = [
  { kind: 'cherry', label: '체리토핑', icon: '🍒', defaultColor: '#E11D48' },
  { kind: 'strawberry', label: '생딸기', icon: '🍓', defaultColor: '#FF5252' },
  { kind: 'star', label: '별빛', icon: '⭐', defaultColor: '#FBC02D' },
  { kind: 'heart', label: '쫀득하트', icon: '❤️', defaultColor: '#FF6B81' },
  { kind: 'bolt', label: '번개', icon: '⚡', defaultColor: '#4FC3F7' },
  { kind: 'flame', label: '앙증불꽃', icon: '🔥', defaultColor: '#FF7043' },
  { kind: 'swirl', label: '소용돌이', icon: '🌀', defaultColor: '#7E57C2' },
  { kind: 'clover', label: '행운잎', icon: '🍀', defaultColor: '#66BB6A' },
  { kind: 'melon', label: '수박줄무늬', icon: '🍉', defaultColor: '#2E7D32' },
]

export const MORPH_FORMS: { id: MorphFormId; name: string; icon: string; desc: string }[] = [
  { id: 'dubai-cookie', name: '두바이 쫀득쿠키', icon: '💚', desc: '바사삭! 볶은 카다이프 면발과 진한 피스타치오 크림이 터져나오는 쿠키' },
  { id: 'wax-ball', name: '아그작 왁뿌볼', icon: '🫧', desc: '단단한 왁스 껍질을 누르면 아그작! 깨지고 속은 말랑말랑한 구슬' },
  { id: 'tanghulu', name: '유리알 탕후루', icon: '🍓', desc: '빠작! 얇고 투명한 크리스탈 설탕 코팅이 영롱하게 빛나는 과일꼬치' },
  { id: 'smore', name: '구운 스모어 마시멜로', icon: '🔥', desc: '치익~ 모닥불에 노릇하게 구워진 폭신쫀득 고양이 발바닥 마시멜로' },
  { id: 'mochi', name: '쫀득 찹쌀떡 모찌', icon: '🍡', desc: '케이크·쿠키 위에 얹기 좋은 말랑 찹쌀떡 디저트 체형' },
  { id: 'pudding', name: '말랑말랑 푸딩', icon: '🍮', desc: '달콤한 카라멜 시럽이 흐르는 탱글탱글 커스터드 푸딩 체형' },
  { id: 'jelly', name: '쫀득 구미 젤리', icon: '🐻', desc: '반투명한 유리알 광택과 과일 코어가 비치는 탱글 젤리베어 체형' },
  { id: 'choco', name: '달콤 퐁듀 초코', icon: '🍫', desc: '진한 가나슈 위에 따뜻한 초콜릿 퐁듀가 사르르 녹아내리는 체형' },
  { id: 'chameleon', name: '원조 카멜레온', icon: '🦎', desc: '쫀득한 모찌 몸통과 돌돌 말린 꼬리' },
  { id: 'mongsil', name: '폭신 구름형', icon: '☁️', desc: '솜사탕처럼 몽글몽글 부푼 구름 체형' },
  { id: 'kongkong', name: '통통 도토리형', icon: '🌰', desc: '볼주머니가 빵빵한 땅딸보 다람쥐 체형' },
  { id: 'beongaekkori', name: '날렵 썬더형', icon: '⚡', desc: '유연하게 휘어지는 S자 족제비 체형' },
  { id: 'byeolbineul', name: '아기 드래곤형', icon: '🐉', desc: '배 비늘과 은하 날개가 돋은 아기용 체형' },
  { id: 'gangcheoldeung', name: '바위 골렘형', icon: '🛡️', desc: '4족 보행 자세의 든든한 판갑 가디언 체형' },
  { id: 'heugyeom', name: '불꽃 사자형', icon: '🦁', desc: '타오르는 갈기를 두른 카리스마 사자 체형' },
]

// Stitch 13번: 케이크·쿠키 디저트 플레이팅 받침대 6종 카탈로그
export const DESSERT_BASES: { id: DessertBaseId; name: string; icon: string; charm: number; desc: string }[] = [
  { id: 'strawberry-cake', name: '생딸기 홀케이크', icon: '🎂', charm: 25, desc: '폭신한 생크림과 통딸기가 얹힌 홀케이크' },
  { id: 'choco-cookie', name: '오독 초코칩 쿠키', icon: '🍪', charm: 20, desc: '노릇하게 구운 버터 쿠키와 진한 초코칩' },
  { id: 'custard-pudding', name: '탱글 커스터드 푸딩', icon: '🍮', charm: 20, desc: '달콤한 카라멜 시럽이 흐르는 푸딩 접시' },
  { id: 'macaron-cushion', name: '파스텔 마카롱 방석', icon: '🧁', charm: 25, desc: '쫀득한 꼬끄와 필링 크림이 가득한 마카롱' },
  { id: 'parfait-cup', name: '베리 파르페 유리컵', icon: '🍨', charm: 30, desc: '요거트와 베리가 층층이 쌓인 파르페 잔' },
  { id: 'nest', name: '포근 나무 둥지', icon: '🪹', charm: 10, desc: '기본으로 제공되는 따뜻한 나뭇가지 둥지' },
]

// Stitch 13번: 달콤 시럽 & 파우더 토핑 5종 카탈로그
export const SYRUP_CATALOG: { id: SyrupId; name: string; icon: string; charm: number }[] = [
  { id: 'choco-drizzle', name: '초코 드리즐', icon: '🍫', charm: 8 },
  { id: 'berry-syrup', name: '딸기 시럽', icon: '🍓', charm: 8 },
  { id: 'matcha-powder', name: '말차 파우더', icon: '🍵', charm: 8 },
  { id: 'rainbow-sprinkles', name: '레인보우 스프링클', icon: '🌈', charm: 10 },
  { id: 'sugar-powder', name: '슈가파우더', icon: '❄️', charm: 6 },
]

export const WING_CATALOG: { id: WingKind; name: string; icon: string; desc: string }[] = [
  { id: 'none', name: '파츠 없음', icon: '⭕', desc: '기본 체형 실루엣 유지' },
  { id: 'dragon', name: '드래곤 날개', icon: '🦇', desc: '양옆에 펼쳐지는 아기용 날개' },
  { id: 'flame-mane', name: '태양 불꽃 갈기', icon: '🦁', desc: '머리 주변을 감싸는 타오르는 갈기' },
  { id: 'rock-shell', name: '바위 판갑 등딱지', icon: '🛡️', desc: '등 뒤를 지켜주는 단단한 수정 갑옷' },
  { id: 'chameleon-crest', name: '무지개 카멜레온 볏', icon: '🌈', desc: '양 볼 옆에 돋아나는 알록달록 젤리 돌기' },
]

// 원터치 메챠 카멜레온 변신 & 모찌·푸딩·젤리·초코 디저트 플레이팅 프리셋 8종
export const MALLANG_PRESETS: { id: string; name: string; icon: string; custom: MallangCustom }[] = [
  {
    id: 'dubai-pistachio-cookie',
    name: '💚 두바이 쫀득쿠키',
    icon: '💚',
    custom: {
      morphForm: 'dubai-cookie',
      skinPalette: 0,
      wingKind: 'none',
      dessertBase: 'choco-cookie',
      syrups: ['choco-drizzle', 'matcha-powder'],
      decorations: {
        head: 'star-crown',
        neck: 'pretzel-ribbon',
        dye: 2,
      },
      strokes: [],
      stamps: [
        { kind: 'star', x: 120, y: 174, color: '#FBC02D', scale: 1.05 },
      ],
    },
  },
  {
    id: 'juicy-wax-ball-set',
    name: '🫧 왁뿌볼',
    icon: '🫧',
    custom: {
      morphForm: 'wax-ball',
      skinPalette: 3,
      wingKind: 'none',
      dessertBase: 'parfait-cup',
      syrups: ['berry-syrup', 'rainbow-sprinkles'],
      decorations: {
        head: 'cream-cherry',
        neck: 'bell-ribbon',
        dye: 1,
      },
      strokes: [],
      stamps: [
        { kind: 'heart', x: 120, y: 176, color: '#FF6B81', scale: 1.0 },
      ],
    },
  },
  {
    id: 'crystal-tanghulu-set',
    name: '🍓 유리알 설탕 탕후루',
    icon: '🍓',
    custom: {
      morphForm: 'tanghulu',
      skinPalette: 2,
      wingKind: 'none',
      dessertBase: 'parfait-cup',
      syrups: ['berry-syrup', 'sugar-powder'],
      decorations: {
        head: 'cream-cherry',
        hand: 'lollipop-wand',
        dye: 1,
      },
      strokes: [],
      stamps: [
        { kind: 'strawberry', x: 92, y: 180, color: '#FF5252', scale: 0.95 },
        { kind: 'strawberry', x: 148, y: 180, color: '#FF5252', scale: 0.95 },
      ],
    },
  },
  {
    id: 'campfire-smore-set',
    name: '🔥 구운 스모어 마시멜로',
    icon: '🔥',
    custom: {
      morphForm: 'smore',
      skinPalette: 1,
      wingKind: 'none',
      dessertBase: 'choco-cookie',
      syrups: ['choco-drizzle'],
      decorations: {
        head: 'birthday-candle',
        neck: 'bell-ribbon',
        dye: 3,
      },
      strokes: [],
      stamps: [
        { kind: 'heart', x: 120, y: 178, color: '#FF8A9E', scale: 1.1 },
      ],
    },
  },
  {
    id: 'strawberry-cake-mochi',
    name: '🎂 생딸기 케이크 모찌',
    icon: '🎂',
    custom: {
      morphForm: 'mochi',
      skinPalette: 1,
      wingKind: 'none',
      dessertBase: 'strawberry-cake',
      syrups: ['choco-drizzle', 'rainbow-sprinkles', 'sugar-powder'],
      decorations: {
        head: 'cream-cherry',
        neck: 'bell-ribbon',
        hand: 'lollipop-wand',
        effect: 'blossom-breeze',
        dye: 1,
      },
      strokes: [
        { color: '#FF7A59', size: 12, points: [[92, 168], [120, 178], [148, 168]] },
      ],
      stamps: [
        { kind: 'strawberry', x: 88, y: 188, color: '#FF5252', scale: 1.0 },
        { kind: 'strawberry', x: 152, y: 188, color: '#FF5252', scale: 1.0 },
        { kind: 'heart', x: 120, y: 154, color: '#FF6B81', scale: 0.9 },
      ],
    },
  },
  {
    id: 'caramel-pudding-set',
    name: '🍮 탱글 카라멜 푸딩',
    icon: '🍮',
    custom: {
      morphForm: 'pudding',
      skinPalette: 5,
      wingKind: 'none',
      dessertBase: 'custard-pudding',
      syrups: ['rainbow-sprinkles', 'sugar-powder'],
      decorations: {
        head: 'cream-cherry',
        neck: 'bell-ribbon',
        dye: 3,
      },
      strokes: [],
      stamps: [
        { kind: 'cherry', x: 120, y: 174, color: '#E11D48', scale: 1.0 },
        { kind: 'star', x: 88, y: 186, color: '#FBC02D', scale: 0.9 },
        { kind: 'star', x: 152, y: 186, color: '#FBC02D', scale: 0.9 },
      ],
    },
  },
  {
    id: 'gummy-jelly-parfait',
    name: '🐻 소다 구미 젤리베어',
    icon: '🐻',
    custom: {
      morphForm: 'jelly',
      skinPalette: 3,
      wingKind: 'none',
      dessertBase: 'parfait-cup',
      syrups: ['berry-syrup', 'rainbow-sprinkles'],
      decorations: {
        head: 'star-crown',
        hand: 'lollipop-wand',
        dye: 4,
      },
      strokes: [],
      stamps: [
        { kind: 'heart', x: 120, y: 172, color: '#FF6B81', scale: 1.15 },
        { kind: 'star', x: 90, y: 188, color: '#FBC02D', scale: 0.85 },
        { kind: 'star', x: 150, y: 188, color: '#FBC02D', scale: 0.85 },
      ],
    },
  },
  {
    id: 'fondue-choco-macaron',
    name: '🍫 퐁듀 가나슈 초코',
    icon: '🍫',
    custom: {
      morphForm: 'choco',
      skinPalette: 2,
      wingKind: 'none',
      dessertBase: 'macaron-cushion',
      syrups: ['choco-drizzle', 'sugar-powder'],
      decorations: {
        head: 'birthday-candle',
        neck: 'pretzel-ribbon',
        dye: 1,
      },
      strokes: [],
      stamps: [
        { kind: 'strawberry', x: 92, y: 184, color: '#FF5252', scale: 0.95 },
        { kind: 'strawberry', x: 148, y: 184, color: '#FF5252', scale: 0.95 },
        { kind: 'heart', x: 120, y: 168, color: '#FF6B81', scale: 0.95 },
      ],
    },
  },
  {
    id: 'choco-cookie-mochi',
    name: '🍪 초코칩 쿠키 모찌',
    icon: '🍪',
    custom: {
      morphForm: 'mochi',
      skinPalette: 5,
      wingKind: 'none',
      dessertBase: 'choco-cookie',
      syrups: ['choco-drizzle', 'matcha-powder'],
      decorations: {
        head: 'birthday-candle',
        neck: 'pretzel-ribbon',
        dye: 3,
      },
      strokes: [],
      stamps: [
        { kind: 'cherry', x: 92, y: 182, color: '#E11D48', scale: 0.95 },
        { kind: 'cherry', x: 148, y: 182, color: '#E11D48', scale: 0.95 },
        { kind: 'star', x: 120, y: 164, color: '#FBC02D', scale: 1.0 },
      ],
    },
  },
  {
    id: 'watermelon-cham',
    name: '🍉 수박 말랑이',
    icon: '🍉',
    custom: {
      morphForm: 'chameleon',
      skinPalette: 0,
      wingKind: 'chameleon-crest',
      strokes: [
        { color: '#FF7A59', size: 16, points: [[95, 178], [120, 184], [145, 178]] },
        { color: '#4E342E', size: 6, points: [[108, 172], [108, 173]] },
        { color: '#4E342E', size: 6, points: [[120, 176], [120, 177]] },
        { color: '#4E342E', size: 6, points: [[132, 172], [132, 173]] },
      ],
      stamps: [
        { kind: 'melon', x: 82, y: 158, color: '#2E7D32', scale: 1.05 },
        { kind: 'melon', x: 158, y: 158, color: '#2E7D32', scale: 1.05 },
        { kind: 'heart', x: 120, y: 84, color: '#FF7A59', scale: 0.9 },
      ],
    },
  },
  {
    id: 'rainbow-dragon',
    name: '🐉 별빛 날개 말랑이',
    icon: '🐉',
    custom: {
      morphForm: 'chameleon',
      skinPalette: 3,
      wingKind: 'dragon',
      strokes: [
        { color: '#B388FF', size: 12, points: [[86, 152], [120, 166], [154, 152]] },
        { color: '#F7C04A', size: 10, points: [[92, 192], [120, 204], [148, 192]] },
      ],
      stamps: [
        { kind: 'star', x: 120, y: 82, color: '#F7C04A', scale: 1.15 },
        { kind: 'bolt', x: 86, y: 174, color: '#64B5F6', scale: 0.95 },
        { kind: 'bolt', x: 154, y: 174, color: '#64B5F6', scale: 0.95 },
      ],
    },
  },
  {
    id: 'strawberry-cloud',
    name: '🍓 딸기모찌 구름이',
    icon: '🍓',
    custom: {
      morphForm: 'mongsil',
      skinPalette: 2,
      wingKind: 'chameleon-crest',
      strokes: [
        { color: '#FF7A59', size: 14, points: [[92, 164], [120, 154], [148, 164]] },
      ],
      stamps: [
        { kind: 'heart', x: 96, y: 186, color: '#FF6B81', scale: 1.0 },
        { kind: 'heart', x: 144, y: 186, color: '#FF6B81', scale: 1.0 },
        { kind: 'clover', x: 120, y: 78, color: '#56C596', scale: 1.1 },
      ],
    },
  },
]

// 말랑 카멜레온 기본 젤리·모찌 피부 팔레트 6종
export const CHAMELEON_PALETTES: Palette[] = [
  { fur: '#C8F4DC', shade: '#8AD8B2', belly: '#FFFDF6', inner: '#FFB6B9', accent: '#FF8A65', accent2: '#FFE082', pad: '#76C7A2', blush: '#FF8A9E', pattern: '#68C49A', eye: '#3B2F2F' },
  { fur: '#FFF5E6', shade: '#F5D6B8', belly: '#FFFFFF', inner: '#FFAB91', accent: '#FF8A65', accent2: '#81D4FA', pad: '#E6B89C', blush: '#FF8A80', pattern: '#E8C29E', eye: '#3B2F2F' },
  { fur: '#FFE4EE', shade: '#F8BBD0', belly: '#FFFDFD', inner: '#F48FB1', accent: '#AB47BC', accent2: '#FFF59D', pad: '#F092B0', blush: '#FF6090', pattern: '#F092B0', eye: '#3B2F2F' },
  { fur: '#E1F5FE', shade: '#90CAF9', belly: '#FFFFFF', inner: '#F8BBD0', accent: '#29B6F6', accent2: '#FFF176', pad: '#64B5F6', blush: '#FF8A9E', pattern: '#64B5F6', eye: '#283593' },
  { fur: '#F3E5F5', shade: '#CE93D8', belly: '#FFFFFF', inner: '#F48FB1', accent: '#7E57C2', accent2: '#80DEEA', pad: '#BA68C8', blush: '#FF80AB', pattern: '#AB47BC', eye: '#311B92' },
  { fur: '#FFF9C4', shade: '#FFD54F', belly: '#FFFFFF', inner: '#FFAB91', accent: '#FF7043', accent2: '#81C784', pad: '#FBC02D', blush: '#FF7043', pattern: '#F9A825', eye: '#3E2723' },
]

// 원조 말랑 카멜레온(쫀득한 모찌 젤리 체형) 몸통·머리 경로
const CHAM_HEAD_D =
  'M 120 54 C 158 54 180 78 178 108 C 176 134 154 146 120 146 C 86 146 64 134 62 108 C 60 78 82 54 120 54 Z'
const CHAM_BODY_D =
  'M 86 136 C 68 154 64 190 76 218 C 86 234 154 234 164 218 C 176 190 172 154 154 136 Z'

// Zero-Trust 입력값 검증: 색상 코드 및 좌표 범위 제한으로 SVG 인젝션 및 비정상 데이터 원천 차단
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/
function safeColor(c: string, fallback = '#FF7A59'): string {
  return typeof c === 'string' && HEX_COLOR_RE.test(c) ? c : fallback
}
function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n * 10) / 10))
}

// 로컬 저장소에서 몬스터별 말랑 카멜레온 변신·페인팅 설정 읽기/쓰기 (예외 처리 완비)
const STORAGE_PREFIX = 'withpet_mallang_v1_'

export function loadMallangCustom(monsterId: string): MallangCustom | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + monsterId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MallangCustom
    return sanitizeMallangCustom(parsed)
  } catch {
    return null
  }
}

// 실제 서비스에서 Game 이 등록한다: 꾸민 모습을 저장할 때 서버(DB)에도 올려 지인들이 광장에서 보게 한다
let remoteLookSaver: ((monsterId: string, custom: MallangCustom) => void) | null = null
export function setRemoteLookSaver(fn: ((monsterId: string, custom: MallangCustom) => void) | null) {
  remoteLookSaver = fn
}

// 이 기기에만 저장 (서버에서 받은 값을 내려 받을 때 쓴다)
export function saveMallangCustomLocal(monsterId: string, custom: MallangCustom): boolean {
  try {
    const clean = sanitizeMallangCustom(custom)
    localStorage.setItem(STORAGE_PREFIX + monsterId, JSON.stringify(clean))
    return true
  } catch {
    return false
  }
}

export function saveMallangCustom(monsterId: string, custom: MallangCustom): boolean {
  const ok = saveMallangCustomLocal(monsterId, custom)
  if (ok) remoteLookSaver?.(monsterId, sanitizeMallangCustom(custom))
  return ok
}

export function sanitizeMallangCustom(input?: MallangCustom | null): MallangCustom {
  if (!input || typeof input !== 'object') return {}
  const strokes: PaintStroke[] = Array.isArray(input.strokes)
    ? input.strokes.slice(0, 60).map((s) => ({
        color: safeColor(s.color),
        size: clamp(s.size, 4, 26),
        points: Array.isArray(s.points)
          ? s.points.slice(0, 120).map((pt) => [clamp(pt[0], 20, 220), clamp(pt[1], 20, 245)] as [number, number])
          : [],
      }))
    : []
  const stamps: PaintStamp[] = Array.isArray(input.stamps)
    ? input.stamps.slice(0, 40).map((st) => ({
        kind: STAMP_CATALOG.some((c) => c.kind === st.kind) ? st.kind : 'star',
        x: clamp(st.x, 30, 210),
        y: clamp(st.y, 30, 235),
        color: safeColor(st.color, '#FBC02D'),
        scale: clamp(st.scale ?? 1, 0.6, 1.8),
      }))
    : []
  const validSyrups: SyrupId[] = Array.isArray(input.syrups)
    ? input.syrups.filter((s): s is SyrupId => SYRUP_CATALOG.some((c) => c.id === s)).slice(0, 5)
    : []
  const validBase: DessertBaseId | undefined = DESSERT_BASES.some((b) => b.id === input.dessertBase)
    ? input.dessertBase
    : undefined
  return {
    morphForm: input.morphForm,
    skinPalette: typeof input.skinPalette === 'number' ? clamp(input.skinPalette, 0, 5) : undefined,
    wingKind: input.wingKind,
    strokes,
    stamps,
    dessertBase: validBase,
    syrups: validSyrups,
    decorations: input.decorations,
    medals: input.medals,
  }
}

// 스탬프 1개 SVG 렌더링
function RenderStamp({ stamp }: { stamp: PaintStamp }) {
  const { kind, x, y, color, scale = 1 } = stamp
  const c = safeColor(color)
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {kind === 'star' && (
        <path
          d="M 0 -11 L 3.2 -3.5 L 11 -2.5 L 5 3 L 6.8 11 L 0 6.8 L -6.8 11 L -5 3 L -11 -2.5 L -3.2 -3.5 Z"
          fill={c}
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
      {kind === 'heart' && (
        <path
          d="M 0 9 C -12 1 -13 -8 -6 -10 C -2 -11 0 -7 0 -5 C 0 -7 2 -11 6 -10 C 13 -8 12 1 0 9 Z"
          fill={c}
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
      {kind === 'bolt' && (
        <path
          d="M 2 -12 L -8 1 L -1 1 L -4 12 L 8 -2 L 1 -2 Z"
          fill={c}
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
      {kind === 'flame' && (
        <path
          d="M 0 -12 C 6 -4 10 2 6 9 C 3 13 -3 13 -6 9 C -10 2 -6 -4 0 -12 Z"
          fill={c}
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
      {kind === 'swirl' && (
        <path
          d="M 0 0 C -4 0 -5 -5 0 -6 C 6 -7 8 0 4 5 C -1 10 -10 7 -10 -1"
          fill="none"
          stroke={c}
          strokeWidth={3.6}
          strokeLinecap="round"
        />
      )}
      {kind === 'clover' && (
        <g fill={c} stroke={INK} strokeWidth={1.5}>
          <circle cx={-4.5} cy={-4.5} r={5} />
          <circle cx={4.5} cy={-4.5} r={5} />
          <circle cx={0} cy={3.5} r={5} />
        </g>
      )}
      {kind === 'melon' && (
        <path
          d="M -6 -14 L -2 -5 L -6 4 L -2 13 M 4 -14 L 8 -5 L 4 4 L 8 13"
          fill="none"
          stroke={c}
          strokeWidth={3.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {kind === 'cherry' && (
        <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
          <path d="M -4 2 C -3 -7 2 -11 6 -12 M 5 2 C 4 -5 5 -9 6 -12" fill="none" stroke="#15803D" strokeWidth={2} />
          <circle cx={-5} cy={4} r={5.5} fill={c} />
          <circle cx={5} cy={4} r={5.5} fill={c} />
          <circle cx={-6.5} cy={2.2} r={1.5} fill="#FFFFFF" strokeWidth={0} />
          <circle cx={3.5} cy={2.2} r={1.5} fill="#FFFFFF" strokeWidth={0} />
        </g>
      )}
      {kind === 'strawberry' && (
        <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
          <path d="M 0 11 C -9 4 -10 -5 -4 -8 C 0 -9 0 -9 4 -8 C 10 -5 9 4 0 11 Z" fill={c} />
          <path d="M -5 -8 Q 0 -13 5 -8 Q 0 -5 -5 -8 Z" fill="#4ADE80" />
          <circle cx={-3} cy={-1} r={1} fill="#FEF08A" strokeWidth={0} />
          <circle cx={3} cy={-1} r={1} fill="#FEF08A" strokeWidth={0} />
          <circle cx={0} cy={4} r={1} fill="#FEF08A" strokeWidth={0} />
        </g>
      )}
    </g>
  )
}

// 플레이어가 직접 그린 브러시 스트로크 & 스탬프 레이어 (몬스터 몸통 안에 클리핑됨)
export function BodyPaintLayer({
  custom,
  clipId,
}: {
  custom?: MallangCustom | null
  clipId: string
}) {
  if (!custom) return null
  const strokes = custom.strokes ?? []
  const stamps = custom.stamps ?? []
  if (strokes.length === 0 && stamps.length === 0) return null

  return (
    <g clipPath={`url(#${clipId})`} opacity={0.92}>
      {strokes.map((s, idx) => {
        if (!s.points || s.points.length === 0) return null
        if (s.points.length === 1) {
          const [px, py] = s.points[0]
          return <circle key={idx} cx={px} cy={py} r={s.size / 2} fill={safeColor(s.color)} />
        }
        const d = s.points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ')
        return (
          <path
            key={idx}
            d={d}
            fill="none"
            stroke={safeColor(s.color)}
            strokeWidth={s.size}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
      {stamps.map((st, idx) => (
        <RenderStamp key={idx} stamp={st} />
      ))}
    </g>
  )
}

// 타 체형(구름형·도토리형·드래곤형 등 6종)으로 변신했을 때도 눈/입을 가리지 않고 몸통에만 페인팅이 입혀지는 마스크 오버레이
export function MorphBodyPaintOverlay({
  custom,
  uid,
  activeSpecies,
}: {
  custom?: MallangCustom | null
  uid: string
  activeSpecies: string
}) {
  if (
    !custom ||
    activeSpecies === 'chameleon' ||
    activeSpecies === 'mochi' ||
    activeSpecies === 'pudding' ||
    activeSpecies === 'jelly' ||
    activeSpecies === 'choco' ||
    activeSpecies === 'dubai-cookie' ||
    activeSpecies === 'wax-ball' ||
    activeSpecies === 'tanghulu' ||
    activeSpecies === 'smore'
  )
    return null
  const strokes = custom.strokes ?? []
  const stamps = custom.stamps ?? []
  if (strokes.length === 0 && stamps.length === 0) return null

  const clipId = `${uid}-morph-paint-clip`
  const maskId = `${uid}-morph-paint-mask`
  // 강철등(4족 보행)은 눈 위치가 살짝 아래에 위치함
  const isQuad = activeSpecies === 'gangcheoldeung'
  const eyeLx = isQuad ? 94 : 96
  const eyeRx = isQuad ? 142 : 144
  const eyeY = isQuad ? 120 : 104

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={120} cy={148} rx={58} ry={82} />
        </clipPath>
        <mask id={maskId}>
          <rect x={0} y={0} width={240} height={260} fill="#FFFFFF" />
          {/* 눈과 입 주변은 검은색 마스크로 보호하여 물감이 눈을 덮지 않게 처리 */}
          <circle cx={eyeLx} cy={eyeY} r={14} fill="#000000" />
          <circle cx={eyeRx} cy={eyeY} r={14} fill="#000000" />
          <ellipse cx={120} cy={eyeY + 14} rx={14} ry={8} fill="#000000" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <BodyPaintLayer custom={custom} clipId={clipId} />
      </g>
    </g>
  )
}

// 만능 등 파츠 (체형과 무관하게 장착 가능한 드래곤 날개 / 불꽃 갈기 / 바위 등딱지 / 카멜레온 무지개 볏)
export function UniversalWingLayer({ wingKind, p }: { wingKind?: MallangCustom['wingKind']; p: Palette }) {
  if (!wingKind || wingKind === 'none') return null
  if (wingKind === 'dragon') {
    return (
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <path d="M 88 144 C 54 118 28 126 18 154 C 34 150 44 158 46 174 C 56 160 70 162 76 174 Z" fill={p.inner} />
        <path d="M 152 144 C 186 118 212 126 222 154 C 206 150 196 158 194 174 C 184 160 170 162 164 174 Z" fill={p.inner} />
      </g>
    )
  }
  if (wingKind === 'flame-mane') {
    return (
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <circle cx={120} cy={104} r={66} fill={p.accent} strokeDasharray="18 8" />
        <circle cx={120} cy={104} r={56} fill={p.accent2} />
      </g>
    )
  }
  if (wingKind === 'rock-shell') {
    return (
      <g stroke={INK} strokeWidth={SW}>
        <ellipse cx={120} cy={166} rx={62} ry={46} fill="#7C8DA8" />
        <ellipse cx={108} cy={152} rx={34} ry={22} fill="#AEBCD2" strokeWidth={0} opacity={0.75} />
      </g>
    )
  }
  if (wingKind === 'chameleon-crest') {
    return (
      <g stroke={INK} strokeWidth={2.6}>
        <circle cx={60} cy={92} r={8} fill="#FF8A65" />
        <circle cx={56} cy={112} r={9} fill="#FFD54F" />
        <circle cx={60} cy={132} r={8} fill="#76C7A2" />
        <circle cx={180} cy={92} r={8} fill="#FF8A65" />
        <circle cx={184} cy={112} r={9} fill="#FFD54F" />
        <circle cx={180} cy={132} r={8} fill="#76C7A2" />
      </g>
    )
  }
  return null
}

// 원조 '말랑 카멜레온' 아트워크 (쫀득한 모찌 몸통 + 돌돌 말린 카멜레온 꼬리 + 무지개 배 + 만능 파츠)
export function ChameleonArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const base = CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const clipId = `${uid}-cham-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={CHAM_HEAD_D} />
          <path d={CHAM_BODY_D} />
        </clipPath>
      </defs>

      {/* 만능 등 파츠 */}
      <UniversalWingLayer wingKind={look.mallang?.wingKind} p={p} />

      {/* 카멜레온 시그니처 돌돌 말린 젤리 꼬리 */}
      <g fill="none" strokeLinecap="round">
        <path
          d="M 152 218 C 198 228 222 192 204 166 C 190 148 166 158 174 178 C 180 192 198 184 190 172"
          stroke={INK}
          strokeWidth={24}
        />
        <path
          d="M 152 218 C 198 228 222 192 204 166 C 190 148 166 158 174 178 C 180 192 198 184 190 172"
          stroke={`url(#${uid}-clay-fur)`}
          strokeWidth={17}
        />
        <circle cx={190} cy={172} r={4.5} fill={p.accent2} />
      </g>

      {/* 쫀득한 모찌 뒷발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={92} cy={230} rx={18} ry={10} />
        <ellipse cx={148} cy={230} rx={18} ry={10} />
      </g>
      <g fill={p.pad}>
        <ellipse cx={92} cy={232} rx={8} ry={4} />
        <ellipse cx={148} cy={232} rx={8} ry={4} />
      </g>

      {/* 말랑 카멜레온 몸통 + 파스텔 무지개 배 */}
      <path d={CHAM_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={188} rx={32} ry={34} fill={`url(#${uid}-clay-belly)`} />
      {/* 카멜레온 배 위 은은한 파스텔 무지개 줄무늬 */}
      <g clipPath={`url(#${clipId})`} opacity={0.45}>
        <path d="M 90 174 Q 120 182 150 174" fill="none" stroke="#FF8A65" strokeWidth={5} />
        <path d="M 88 186 Q 120 194 152 186" fill="none" stroke="#FFD54F" strokeWidth={5} />
        <path d="M 90 198 Q 120 206 150 198" fill="none" stroke="#76C7A2" strokeWidth={5} />
        <path d="M 94 210 Q 120 218 146 210" fill="none" stroke="#64B5F6" strokeWidth={5} />
      </g>

      {/* 앙증맞은 모찌 앞손 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={74} cy={176} rx={11} ry={16} transform="rotate(20 74 176)" />
        <ellipse cx={166} cy={176} rx={11} ry={16} transform="rotate(-20 166 176)" />
      </g>

      {/* 카멜레온 볼록 지느러미 귀 / 뿔 */}
      <g stroke={INK} strokeWidth={SW}>
        <path d="M 74 78 C 56 70 50 52 62 42 C 74 44 86 56 90 70 Z" fill={p.inner} />
        <path d="M 166 78 C 184 70 190 52 178 42 C 166 44 154 56 150 70 Z" fill={p.inner} />
      </g>

      {/* 말랑 카멜레온 머리 + 젤리 하이라이트 광택 */}
      <path d={CHAM_HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={100} cy={70} rx={20} ry={8} fill="#FFFFFF" opacity={0.65} transform="rotate(-14 100 70)" />
      <circle cx={132} cy={66} r={4.5} fill="#FFFFFF" opacity={0.6} />

      {/* 카멜레온 정수리 3단 말랑 벼슬 */}
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <path d="M 104 56 C 104 38 114 34 120 24 C 126 34 136 38 136 56 Z" fill={p.accent2} />
        <circle cx={120} cy={40} r={4.5} fill={p.accent} strokeWidth={0} />
      </g>

      {/* 타고난 시드 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 🖌️ 플레이어가 직접 칠한 메챠 카멜레온 바디 페인팅 & 스탬프 레이어 */}
      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 얼굴: 발그레한 볼터치 + 반짝이는 왕눈이 + 귀여운 카멜레온 입과 낼름 혀 */}
      <ellipse cx={84} cy={118} rx={10} ry={6.2} fill={p.blush} opacity={0.85} />
      <ellipse cx={156} cy={118} rx={10} ry={6.2} fill={p.blush} opacity={0.85} />
      <Eye x={96} y={104} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={144} y={104} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      {/* 귀여운 카멜레온 미소와 분홍빛 혀 살짝 */}
      <path d="M 108 118 Q 120 126 132 118" fill="none" stroke={INK} strokeWidth={2.8} />
      <path d="M 118 122 Q 120 131 125 129 Q 127 125 123 122" fill="#FF8A9E" stroke={INK} strokeWidth={2} />
    </g>
  )
}

export const chameleon: SpeciesDef = {
  id: 'chameleon',
  name: '말랑카멜레온',
  element: 'wind',
  postureLabel: '자세 0 · 만능 변신 말랑이',
  silhouetteDesc: '무엇으로든 변신하고 몸에 직접 그림을 그릴 수 있는 모찌 카멜레온',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: ChameleonArt,
}

// 🍫 달콤 시럽 & 파우더 토핑 레이어 (초코 드리즐 / 딸기 시럽 / 말차 파우더 / 레인보우 스프링클 / 슈가파우더)
export function SyrupToppingLayer({ syrups }: { syrups?: SyrupId[] }) {
  if (!syrups || syrups.length === 0) return null
  const has = (id: SyrupId) => syrups.includes(id)

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* 초코 드리즐 (머리·어깨 위에 흐르는 진한 초콜릿 시럽) */}
      {has('choco-drizzle') && (
        <g>
          <path
            d="M 80 76 C 88 64 102 60 120 60 C 138 60 152 64 160 76 C 154 86 148 74 142 88 C 136 100 130 76 124 90 C 118 102 112 76 104 92 C 98 102 92 78 86 86 Z"
            fill="#4E342E"
            stroke={INK}
            strokeWidth={2.2}
          />
          <path d="M 94 68 Q 120 63 146 68" fill="none" stroke="#8D6E63" strokeWidth={2.5} opacity={0.7} />
        </g>
      )}

      {/* 상큼 딸기 시럽 드리즐 */}
      {has('berry-syrup') && (
        <g opacity={0.92}>
          <path
            d="M 84 82 Q 96 96 106 80 Q 120 98 134 80 Q 144 96 156 82"
            fill="none"
            stroke="#FF5252"
            strokeWidth={6.5}
          />
          <path
            d="M 84 80 Q 96 94 106 78 Q 120 96 134 78 Q 144 94 156 80"
            fill="none"
            stroke="#FF8A9E"
            strokeWidth={2.5}
          />
        </g>
      )}

      {/* 향긋한 말차 파우더 솔솔 */}
      {has('matcha-powder') && (
        <g fill="#558B2F" opacity={0.65}>
          <ellipse cx={120} cy={72} rx={36} ry={10} />
          <circle cx={78} cy={156} r={3} />
          <circle cx={162} cy={160} r={2.8} />
          <circle cx={92} cy={82} r={2.2} />
          <circle cx={148} cy={82} r={2.2} />
        </g>
      )}

      {/* 알록달록 레인보우 스프링클 */}
      {has('rainbow-sprinkles') && (
        <g stroke={INK} strokeWidth={1.2}>
          <rect x={88} y={74} width={9} height={4.2} rx={2.1} fill="#FF6B81" transform="rotate(-24 88 74)" />
          <rect x={114} y={66} width={9} height={4.2} rx={2.1} fill="#FFD54F" transform="rotate(14 114 66)" />
          <rect x={142} y={72} width={9} height={4.2} rx={2.1} fill="#4FC3F7" transform="rotate(28 142 72)" />
          <rect x={76} y={162} width={9} height={4.2} rx={2.1} fill="#81C784" transform="rotate(-18 76 162)" />
          <rect x={156} y={164} width={9} height={4.2} rx={2.1} fill="#BA68C8" transform="rotate(22 156 164)" />
          <rect x={102} y={198} width={9} height={4.2} rx={2.1} fill="#FF8A65" transform="rotate(12 102 198)" />
          <rect x={132} y={196} width={9} height={4.2} rx={2.1} fill="#4FC3F7" transform="rotate(-15 132 196)" />
        </g>
      )}

      {/* 눈꽃 슈가파우더 반짝이 */}
      {has('sugar-powder') && (
        <g fill="#FFFFFF" opacity={0.9}>
          <circle cx={96} cy={70} r={2.8} />
          <circle cx={126} cy={64} r={2.2} />
          <circle cx={148} cy={76} r={3} />
          <circle cx={72} cy={142} r={2.5} />
          <circle cx={168} cy={146} r={2.5} />
          <circle cx={86} cy={204} r={2.4} />
          <circle cx={154} cy={202} r={2.6} />
        </g>
      )}
    </g>
  )
}

// 🍡 '쫀득 찹쌀떡 모찌' 체형 경로 (케이크나 쿠키 위에 폭 내려앉은 말랑말랑 다이후쿠·찹쌀떡 실루엣)
const MOCHI_BODY_D =
  'M 120 68 C 168 68 194 104 194 156 C 194 202 172 228 120 228 C 68 228 46 202 46 156 C 46 104 72 68 120 68 Z'

export function MochiArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const base = CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const clipId = `${uid}-mochi-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={MOCHI_BODY_D} />
        </clipPath>
      </defs>

      {/* 만능 등 파츠 */}
      <UniversalWingLayer wingKind={look.mallang?.wingKind} p={p} />

      {/* 찹쌀떡 아래쪽에 살짝 눌린 말랑한 모찌 발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={84} cy={226} rx={18} ry={8} />
        <ellipse cx={156} cy={226} rx={18} ry={8} />
      </g>

      {/* 쫀득하고 폭신한 찹쌀떡 모찌 귀 (말랑한 미니 만두귀) */}
      <g stroke={INK} strokeWidth={SW}>
        <ellipse cx={78} cy={76} rx={18} ry={14} transform="rotate(-22 78 76)" fill={p.fur} />
        <ellipse cx={78} cy={76} rx={9} ry={6} transform="rotate(-22 78 76)" fill={p.inner} strokeWidth={0} />
        <ellipse cx={162} cy={76} rx={18} ry={14} transform="rotate(22 162 76)" fill={p.fur} />
        <ellipse cx={162} cy={76} rx={9} ry={6} transform="rotate(22 162 76)" fill={p.inner} strokeWidth={0} />
      </g>

      {/* 메인 찹쌀떡 모찌 몸통 + 은은한 속앙금(딸기/단팥) 빛깔과 뽀얀 전분 광택 */}
      <path d={MOCHI_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={164} rx={52} ry={44} fill={p.inner} opacity={0.28} />
      <ellipse cx={120} cy={186} rx={48} ry={34} fill={`url(#${uid}-clay-belly)`} opacity={0.85} />
      {/* 모찌 상단 쫀득한 하이라이트 */}
      <ellipse cx={96} cy={88} rx={26} ry={10} fill="#FFFFFF" opacity={0.75} transform="rotate(-14 96 88)" />
      <circle cx={136} cy={82} r={5.5} fill="#FFFFFF" opacity={0.7} />

      {/* 타고난 시드 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 🖌️ 플레이어가 직접 칠한 바디 페인팅 & 스탬프 레이어 */}
      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 앙증맞게 모은 찹쌀떡 손 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={66} cy={168} rx={13} ry={10} transform="rotate(18 66 168)" />
        <ellipse cx={174} cy={168} rx={13} ry={10} transform="rotate(-18 174 168)" />
      </g>

      {/* 말랑 모찌 얼굴: 통통한 핑크 볼터치 + 초롱초롱 눈 + 귀여운 'ω' 입 */}
      <ellipse cx={80} cy={138} rx={13} ry={7.5} fill={p.blush} opacity={0.88} />
      <ellipse cx={160} cy={138} rx={13} ry={7.5} fill={p.blush} opacity={0.88} />
      <Eye x={96} y={124} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={144} y={124} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <path d="M 111 136 Q 115.5 142 120 136 Q 124.5 142 129 136" fill="none" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

export const mochi: SpeciesDef = {
  id: 'mochi',
  name: '찹쌀떡모찌',
  element: 'grass',
  postureLabel: '자세 M · 쫀득 찹쌀떡 모찌',
  silhouetteDesc: '케이크와 쿠키 위에 사르르 녹아내리는 쫀득 말랑 디저트 모찌',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: MochiArt,
}

// 🍮 1. '말랑말랑 푸딩' 체형 (사다리꼴 스캘럽 프릴 밑단 + 머리 위 달콤쌉싸름한 카라멜 시럽이 주르륵 흐르는 커스터드 푸딩)
const PUDDING_BODY_D =
  'M 78 68 C 84 54 156 54 162 68 L 188 198 C 192 214 180 226 168 222 C 158 218 150 228 138 224 C 126 220 114 220 102 224 C 90 228 82 218 72 222 C 60 226 48 214 52 198 Z'
const PUDDING_CARAMEL_D =
  'M 76 68 C 82 54 158 54 164 68 L 172 104 C 164 114 156 96 148 112 C 140 126 130 98 120 116 C 110 98 100 126 92 112 C 84 96 76 114 68 104 Z'

export function PuddingArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  // 푸딩은 기본 팔레트가 노란 커스터드 톤이 잘 어울리도록 보정
  const base = CHAMELEON_PALETTES[(palIdx + 5) % CHAMELEON_PALETTES.length]
  const p = look.shiny ? { ...base, fur: '#FFF9C4', shade: '#FBC02D' } : base
  const clipId = `${uid}-pudding-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={PUDDING_BODY_D} />
        </clipPath>
      </defs>

      <UniversalWingLayer wingKind={look.mallang?.wingKind} p={p} />

      {/* 탱글한 카라멜 방울 귀 */}
      <g stroke={INK} strokeWidth={SW}>
        <circle cx={78} cy={66} r={14} fill="#6F3B17" />
        <circle cx={162} cy={66} r={14} fill="#6F3B17" />
        <circle cx={74} cy={62} r={4} fill="#A66332" strokeWidth={0} />
        <circle cx={158} cy={62} r={4} fill="#A66332" strokeWidth={0} />
      </g>

      {/* 커스터드 푸딩 메인 몸통 */}
      <path d={PUDDING_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={174} rx={44} ry={34} fill={`url(#${uid}-clay-belly)`} opacity={0.75} />

      {/* 상단 글로시 다크 카라멜 시럽 코팅 */}
      <path d={PUDDING_CARAMEL_D} fill="#6F3B17" stroke={INK} strokeWidth={SW} />
      <ellipse cx={104} cy={72} rx={22} ry={7} fill="#A66332" opacity={0.7} transform="rotate(-8 104 72)" />
      <ellipse cx={96} cy={70} rx={12} ry={4} fill="#FFFFFF" opacity={0.75} transform="rotate(-8 96 70)" />
      <circle cx={142} cy={74} r={4.5} fill="#FFFFFF" opacity={0.65} />

      {/* 푸딩 옆구리 탱글 하이라이트 */}
      <path d="M 68 128 L 60 176" stroke="#FFFFFF" strokeWidth={5} opacity={0.65} />

      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />
      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 앙증맞은 푸딩 손 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={58} cy={156} rx={11} ry={9} transform="rotate(24 58 156)" />
        <ellipse cx={182} cy={156} rx={11} ry={9} transform="rotate(-24 182 156)" />
      </g>

      {/* 얼굴: 달콤한 볼터치 + 초롱초롱 눈 + 행복한 미소 */}
      <ellipse cx={82} cy={148} rx={11} ry={6.5} fill={p.blush} opacity={0.88} />
      <ellipse cx={158} cy={148} rx={11} ry={6.5} fill={p.blush} opacity={0.88} />
      <Eye x={96} y={136} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={144} y={136} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <path d="M 110 146 Q 120 155 130 146" fill="none" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

export const pudding: SpeciesDef = {
  id: 'pudding',
  name: '말랑푸딩',
  element: 'earth',
  postureLabel: '자세 P · 탱글 카라멜 푸딩',
  silhouetteDesc: '달콤쌉싸름한 카라멜 시럽이 흐르는 탱글탱글 커스터드 푸딩',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: PuddingArt,
}

// 🐻 2. '쫀득 구미 젤리' 체형 (영롱한 반투명 유리알 광택 + 동글동글 구미베어 귀 + 몸속 과일 젤리 코어 하트와 기포)
const JELLY_HEAD_D =
  'M 120 56 C 160 56 180 80 178 112 C 176 138 156 148 120 148 C 84 148 64 138 62 112 C 60 80 80 56 120 56 Z'
const JELLY_BODY_D =
  'M 80 134 C 60 152 56 196 72 220 C 86 234 154 234 168 220 C 184 196 180 152 160 134 Z'

export function JellyArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const base = CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const clipId = `${uid}-jelly-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={JELLY_HEAD_D} />
          <path d={JELLY_BODY_D} />
        </clipPath>
      </defs>

      <UniversalWingLayer wingKind={look.mallang?.wingKind} p={p} />

      {/* 동글동글 반투명 구미베어 귀 */}
      <g stroke={INK} strokeWidth={SW} opacity={0.94}>
        <circle cx={74} cy={62} r={20} fill={p.fur} />
        <circle cx={74} cy={62} r={10} fill={p.inner} strokeWidth={0} opacity={0.75} />
        <circle cx={68} cy={55} r={4.5} fill="#FFFFFF" strokeWidth={0} opacity={0.85} />
        <circle cx={166} cy={62} r={20} fill={p.fur} />
        <circle cx={166} cy={62} r={10} fill={p.inner} strokeWidth={0} opacity={0.75} />
        <circle cx={160} cy={55} r={4.5} fill="#FFFFFF" strokeWidth={0} opacity={0.85} />
      </g>

      {/* 통통한 젤리빈 발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={88} cy={228} rx={19} ry={11} />
        <ellipse cx={152} cy={228} rx={19} ry={11} />
      </g>

      {/* 반투명 구미 젤리 몸통 & 머리 */}
      <g opacity={0.93}>
        <path d={JELLY_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
        {/* 젤리 몸속에 은은하게 비치는 과일 코어 하트 & 탄산 기포 */}
        <path
          d="M 120 198 C 102 186 100 170 110 166 C 116 164 120 170 120 174 C 120 170 124 164 130 166 C 140 170 138 186 120 198 Z"
          fill={p.accent}
          opacity={0.45}
        />
        <circle cx={90} cy={196} r={5} fill="#FFFFFF" opacity={0.6} />
        <circle cx={150} cy={188} r={6.5} fill="#FFFFFF" opacity={0.55} />
        <circle cx={144} cy={204} r={3.5} fill="#FFFFFF" opacity={0.6} />

        <path d={JELLY_HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      </g>

      {/* 영롱한 유리알 구미 이중 광택 하이라이트 */}
      <ellipse cx={94} cy={74} rx={24} ry={9.5} fill="#FFFFFF" opacity={0.82} transform="rotate(-16 94 74)" />
      <circle cx={130} cy={68} r={6} fill="#FFFFFF" opacity={0.78} />
      <path d="M 158 154 C 166 170 166 192 158 208" fill="none" stroke="#FFFFFF" strokeWidth={5.5} opacity={0.65} />

      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />
      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 쫀득한 구미 젤리 앞손 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={68} cy={170} rx={14} ry={11} transform="rotate(24 68 170)" />
        <ellipse cx={172} cy={170} rx={14} ry={11} transform="rotate(-24 172 170)" />
      </g>

      {/* 얼굴: 탱글 볼터치 + 반짝 눈 + 귀여운 젤리곰 코·입 */}
      <ellipse cx={82} cy={118} rx={11} ry={6.5} fill={p.blush} opacity={0.85} />
      <ellipse cx={158} cy={118} rx={11} ry={6.5} fill={p.blush} opacity={0.85} />
      <Eye x={96} y={104} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={144} y={104} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <ellipse cx={120} cy={112} rx={5.5} ry={4} fill={p.accent} stroke={INK} strokeWidth={2} />
      <path d="M 111 120 Q 115.5 126 120 120 Q 124.5 126 129 120" fill="none" stroke={INK} strokeWidth={2.6} />
    </g>
  )
}

export const jelly: SpeciesDef = {
  id: 'jelly',
  name: '쫀득젤리',
  element: 'water',
  postureLabel: '자세 J · 반투명 구미 젤리',
  silhouetteDesc: '영롱한 유리알 광택과 달콤한 과일 코어가 비치는 탱글 구미 젤리',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: JellyArt,
}

// 🍫 3. '달콤 퐁듀 초코' 체형 (진한 가나슈 트러플 몸통 + 사르르 녹아내리는 멜팅 초콜릿 퐁듀 & 골드 아몬드 토핑)
const CHOCO_BODY_D =
  'M 120 62 C 166 62 188 96 186 148 C 184 188 196 210 184 222 C 172 232 154 222 140 228 C 126 234 114 234 100 228 C 86 222 68 232 56 222 C 44 210 56 188 54 148 C 52 96 74 62 120 62 Z'
const CHOCO_MELT_D =
  'M 72 78 C 86 60 154 60 168 78 C 176 92 178 108 170 116 C 162 122 156 102 148 118 C 140 134 132 104 122 120 C 112 134 104 102 94 118 C 86 132 78 106 70 114 C 62 106 64 90 72 78 Z'

export function ChocoArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const meltColors = ['#FF8A9E', '#FFFDF9', '#FFE082', '#80DEEA', '#CE93D8', '#FFAB91']
  const meltColor = meltColors[palIdx % meltColors.length]
  const chocoMain = look.shiny ? '#795548' : '#4E342E'
  const chocoShade = look.shiny ? '#5D4037' : '#3E2723'
  const clipId = `${uid}-choco-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs
          uid={uid}
          fur={chocoMain}
          shade={chocoShade}
          belly="#6D4C41"
          accent={meltColor}
          accent2="#FFD54F"
        />
        <clipPath id={clipId}>
          <path d={CHOCO_BODY_D} />
        </clipPath>
      </defs>

      <UniversalWingLayer
        wingKind={look.mallang?.wingKind}
        p={CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]}
      />

      {/* 달콤한 키세스 초코칩 귀 */}
      <g stroke={INK} strokeWidth={SW}>
        <path d="M 68 82 C 58 64 62 46 78 44 C 86 54 92 66 90 78 Z" fill={chocoMain} />
        <path d="M 172 82 C 182 64 178 46 162 44 C 154 54 148 66 150 78 Z" fill={chocoMain} />
      </g>

      {/* 사르르 녹아내리는 가나슈 트러플 몸통 */}
      <path d={CHOCO_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={180} rx={44} ry={34} fill="#6D4C41" opacity={0.65} />

      {/* 머리 위에서 사르르 흘러내리는 스위트 퐁듀 코팅 */}
      <path d={CHOCO_MELT_D} fill={meltColor} stroke={INK} strokeWidth={SW} />
      <ellipse cx={100} cy={76} rx={22} ry={7.5} fill="#FFFFFF" opacity={0.75} transform="rotate(-10 100 76)" />
      <circle cx={136} cy={72} r={5} fill="#FFFFFF" opacity={0.7} />

      {/* 정수리 골드 아몬드 & 금박 토핑 */}
      <g stroke={INK} strokeWidth={2.4}>
        <ellipse cx={120} cy={58} rx={9} ry={14} transform="rotate(-12 120 58)" fill="#D99B52" />
        <path d="M 132 54 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" fill="#FFD54F" strokeWidth={1.4} />
      </g>

      <Pattern seed={look.patternSeed} color="#8D6E63" clipId={clipId} />
      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 쫀득한 초코 손 */}
      <g fill={chocoMain} stroke={INK} strokeWidth={SW}>
        <ellipse cx={58} cy={166} rx={13} ry={10} transform="rotate(20 58 166)" />
        <ellipse cx={182} cy={166} rx={13} ry={10} transform="rotate(-20 182 166)" />
      </g>

      {/* 얼굴: 핑크빛 볼터치 + 반짝이는 크림 눈동자 + 달콤한 미소 */}
      <ellipse cx={82} cy={144} rx={12} ry={7} fill="#FF8A9E" opacity={0.9} />
      <ellipse cx={158} cy={144} rx={12} ry={7} fill="#FF8A9E" opacity={0.9} />
      <Eye x={96} y={132} kind={look.expression} side={1} color="#261612" lid={chocoMain} />
      <Eye x={144} y={132} kind={look.expression} side={-1} color="#261612" lid={chocoMain} />
      <path d="M 110 144 Q 120 153 130 144" fill="none" stroke="#FFFDF9" strokeWidth={3} />
    </g>
  )
}

export const choco: SpeciesDef = {
  id: 'choco',
  name: '달콤초코',
  element: 'fire',
  postureLabel: '자세 K · 사르르 멜팅 초코',
  silhouetteDesc: '진한 가나슈 위에 따뜻한 퐁듀 시럽이 사르르 녹아내리는 달콤 초코',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: ChocoArt,
}

// 💚 4. '두바이 쫀득쿠키' 체형 (꾸덕한 다크초코 쿠키 반죽이 갈라지며 연두빛 피스타치오 스프레드와 바삭한 금빛 카다이프 면발이 쏟아져 나오는 체형)
const DUBAI_BODY_D =
  'M 120 64 C 170 64 196 98 192 152 C 188 202 168 228 120 228 C 72 228 52 202 48 152 C 44 98 70 64 120 64 Z'

export function DubaiCookieArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const cookieColor = look.shiny ? '#6D4C41' : '#4E342E'
  const cookieShade = '#3E2723'
  const pistachio = '#9CCC65'
  const pistachioDeep = '#7CB342'
  const clipId = `${uid}-dubai-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs
          uid={uid}
          fur={cookieColor}
          shade={cookieShade}
          belly={pistachio}
          accent="#FFD54F"
          accent2={pistachioDeep}
        />
        <clipPath id={clipId}>
          <path d={DUBAI_BODY_D} />
        </clipPath>
      </defs>

      <UniversalWingLayer
        wingKind={look.mallang?.wingKind}
        p={CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]}
      />

      {/* 피스타치오 크림이 삐죽 나온 초코 쿠키 귀 */}
      <g stroke={INK} strokeWidth={SW}>
        <circle cx={74} cy={72} r={19} fill={cookieColor} />
        <circle cx={74} cy={72} r={10} fill={pistachio} />
        <circle cx={166} cy={72} r={19} fill={cookieColor} />
        <circle cx={166} cy={72} r={10} fill={pistachio} />
      </g>

      {/* 꾸덕한 초코 쿠키 몸통 */}
      <path d={DUBAI_BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 배 한가운데가 꾸덕하게 갈라지며 드러나는 연두빛 피스타치오 카다이프 속살 */}
      <path
        d="M 70 162 C 88 148 152 148 170 162 C 178 184 164 216 120 218 C 76 216 62 184 70 162 Z"
        fill={pistachio}
        stroke={INK}
        strokeWidth={2.8}
      />
      <ellipse cx={120} cy={188} rx={38} ry={20} fill="#C5E1A5" opacity={0.65} />

      {/* 정수리에서도 터져 나온 피스타치오 크림 & 바삭한 황금빛 카다이프 면발(Crispy Kataifi Threads) */}
      <path
        d="M 88 68 C 96 50 144 50 152 68 C 142 78 98 78 88 68 Z"
        fill={pistachio}
        stroke={INK}
        strokeWidth={2.8}
      />
      {/* 바삭바삭 볶은 카다이프 황금 면발 디테일 (머리 위 & 배 중앙) */}
      <g stroke="#D97706" strokeWidth={2.6}>
        <line x1={102} y1={56} x2={112} y2={66} />
        <line x1={118} y1={52} x2={124} y2={65} />
        <line x1={136} y1={55} x2={128} y2={66} />
        <line x1={88} y1={174} x2={102} y2={182} />
        <line x1={108} y1={168} x2={122} y2={176} />
        <line x1={134} y1={170} x2={148} y2={178} />
        <line x1={96} y1={194} x2={112} y2={188} />
        <line x1={128} y1={192} x2={144} y2={198} />
      </g>
      <g stroke="#FEF08A" strokeWidth={2}>
        <line x1={108} y1={58} x2={116} y2={64} />
        <line x1={126} y1={56} x2={134} y2={63} />
        <line x1={94} y1={182} x2={108} y2={176} />
        <line x1={120} y1={184} x2={136} y2={180} />
        <line x1={106} y1={202} x2={122} y2={196} />
      </g>

      {/* 쿠키 표면의 초코 청크와 고소한 통피스타치오 알갱이 */}
      <circle cx={68} cy={128} r={5.5} fill="#261612" />
      <circle cx={172} cy={132} r={6} fill="#261612" />
      <ellipse cx={120} cy={54} rx={7} ry={4.5} fill="#7CB342" stroke={INK} strokeWidth={1.8} />

      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 쫀득한 쿠키 손발 */}
      <g fill={cookieColor} stroke={INK} strokeWidth={SW}>
        <ellipse cx={56} cy={166} rx={13} ry={10} transform="rotate(20 56 166)" />
        <ellipse cx={184} cy={166} rx={13} ry={10} transform="rotate(-20 184 166)" />
        <ellipse cx={86} cy={226} rx={17} ry={9} />
        <ellipse cx={154} cy={226} rx={17} ry={9} />
      </g>

      {/* 얼굴: 피스타치오 볼터치 + 초롱초롱 눈 + 바삭 미소 */}
      <ellipse cx={82} cy={122} rx={11} ry={6.5} fill="#FF8A9E" opacity={0.9} />
      <ellipse cx={158} cy={122} rx={11} ry={6.5} fill="#FF8A9E" opacity={0.9} />
      <Eye x={96} y={108} kind={look.expression} side={1} color="#261612" lid={cookieColor} />
      <Eye x={144} y={108} kind={look.expression} side={-1} color="#261612" lid={cookieColor} />
      <path d="M 109 120 Q 120 130 131 120" fill="none" stroke="#FFFDF9" strokeWidth={2.8} />
    </g>
  )
}

export const dubaiCookie: SpeciesDef = {
  id: 'dubai-cookie',
  name: '두바이쫀득쿠키',
  element: 'earth',
  postureLabel: '자세 D2 · 바사삭 피스타치오 카다이프',
  silhouetteDesc: '꾸덕한 초코 쿠키 속에 바삭한 금빛 카다이프와 피스타치오 크림이 가득 찬 캐릭터',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: DubaiCookieArt,
}

// 🍓 5. '유리알 탕후루' 체형 (투명하고 두꺼운 설탕 시럽 유리 코팅 갑옷 + 과일 알맹이 2단 + 대나무 꼬치)
const TANGHULU_TOP_D =
  'M 120 56 C 158 56 178 80 176 112 C 174 138 154 150 120 150 C 86 150 66 138 64 112 C 62 80 82 56 120 56 Z'
const TANGHULU_BOT_D =
  'M 120 138 C 162 138 184 162 182 194 C 180 220 158 232 120 232 C 82 232 60 220 58 194 C 56 162 78 138 120 138 Z'

export function TanghuluArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const berryColors = [
    { main: '#FF5252', sub: '#C62828', bottom: '#9CCC65' }, // 딸기 + 샤인머스캣
    { main: '#FF7043', sub: '#D84315', bottom: '#FFD54F' }, // 귤 + 파인애플
    { main: '#EC407A', sub: '#AD1457', bottom: '#AB47BC' }, // 체리 + 거봉
    { main: '#29B6F6', sub: '#0277BD', bottom: '#FF8A9E' }, // 소다 + 피치
    { main: '#AB47BC', sub: '#6A1B9A', bottom: '#9CCC65' }, // 블루베리 + 청포도
    { main: '#FFCA28', sub: '#F57F17', bottom: '#FF5252' }, // 망고 + 딸기
  ]
  const c = berryColors[palIdx % berryColors.length]
  const clipId = `${uid}-tanghulu-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={c.main} shade={c.sub} belly={c.bottom} accent="#FFFFFF" accent2="#4ADE80" />
        <clipPath id={clipId}>
          <path d={TANGHULU_TOP_D} />
          <path d={TANGHULU_BOT_D} />
        </clipPath>
      </defs>

      {/* 대나무 꼬치 막대 (머리 위와 발아래 살짝 보임) */}
      <line x1={120} y1={24} x2={120} y2={242} stroke="#D7B377" strokeWidth={7} />
      <line x1={120} y1={24} x2={120} y2={242} stroke={INK} strokeWidth={7} fill="none" opacity={0.25} />

      {/* 아래쪽 알맹이 (샤인머스캣/과일 2단) */}
      <path d={TANGHULU_BOT_D} fill={c.bottom} stroke={INK} strokeWidth={SW} />
      {/* 위쪽 알맹이 (메인 생딸기/과일 1단) */}
      <path d={TANGHULU_TOP_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 상큼한 초록 딸기 꼭지 모자 */}
      <path
        d="M 92 62 C 102 46 114 48 120 58 C 126 48 138 46 148 62 C 136 68 128 66 120 62 C 112 66 104 68 92 62 Z"
        fill="#4ADE80"
        stroke={INK}
        strokeWidth={2.6}
      />

      {/* 과일 씨앗 박힌 디테일 */}
      <g fill="#FEF08A" opacity={0.85}>
        <circle cx={78} cy={92} r={2} />
        <circle cx={162} cy={92} r={2} />
        <circle cx={76} cy={118} r={2} />
        <circle cx={164} cy={118} r={2} />
      </g>

      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 💎 핵심 포인트: 몸 전체를 감싸는 두껍고 투명한 '빠작!' 유리알 설탕 시럽 코팅막 */}
      <path
        d="M 120 50 C 166 50 186 78 182 114 C 180 128 174 136 168 142 C 182 152 190 172 188 196 C 186 226 162 238 120 238 C 78 238 54 226 52 196 C 50 172 58 152 72 142 C 66 136 60 128 58 114 C 54 78 74 50 120 50 Z"
        fill="#E0F7FA"
        fillOpacity={0.28}
        stroke="#FFFFFF"
        strokeWidth={3.5}
      />
      {/* 설탕 시럽이 굳어 만들어진 유리 물방울 & 영롱한 고광택 반사광 */}
      <ellipse cx={92} cy={74} rx={22} ry={8.5} fill="#FFFFFF" opacity={0.88} transform="rotate(-18 92 74)" />
      <ellipse cx={88} cy={162} rx={18} ry={7} fill="#FFFFFF" opacity={0.8} transform="rotate(-14 88 162)" />
      <path d="M 178 112 C 184 124 184 134 178 138 C 172 136 174 124 178 112 Z" fill="#FFFFFF" opacity={0.75} />

      {/* 앙증맞은 설탕코팅 손 */}
      <g fill={c.main} stroke={INK} strokeWidth={SW}>
        <ellipse cx={62} cy={166} rx={12} ry={9.5} transform="rotate(22 62 166)" />
        <ellipse cx={178} cy={166} rx={12} ry={9.5} transform="rotate(-22 178 166)" />
      </g>

      {/* 얼굴 */}
      <ellipse cx={84} cy={114} rx={10} ry={6} fill="#FFCDD2" opacity={0.9} />
      <ellipse cx={156} cy={114} rx={10} ry={6} fill="#FFCDD2" opacity={0.9} />
      <Eye x={96} y={102} kind={look.expression} side={1} color="#261612" lid={c.main} />
      <Eye x={144} y={102} kind={look.expression} side={-1} color="#261612" lid={c.main} />
      <path d="M 111 112 Q 120 121 129 112" fill="none" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

export const tanghulu: SpeciesDef = {
  id: 'tanghulu',
  name: '유리알탕후루',
  element: 'water',
  postureLabel: '자세 T · 빠작 설탕코팅 탕후루',
  silhouetteDesc: '투명하고 바삭한 유리알 설탕 시럽 코팅이 반짝이는 과일 탕후루',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: TanghuluArt,
}

// 🔥 6. '구운 스모어 마시멜로' 체형 (모닥불에 노릇하게 구워진 원통형 마시멜로 + 쫀득한 고양이 발바닥 분홍 젤리 육구)
const SMORE_BODY_D =
  'M 72 68 C 72 52 168 52 168 68 L 178 206 C 180 224 156 232 120 232 C 84 232 60 224 62 206 Z'

export function SmoreArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const clipId = `${uid}-smore-clip`
  const toastGradId = `${uid}-smore-toast`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id={toastGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="26%" stopColor="#F59E0B" />
          <stop offset="52%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FFFDF9" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={SMORE_BODY_D} />
        </clipPath>
      </defs>

      {/* 노릇하게 구워진 고양이 마시멜로 귀 */}
      <g stroke={INK} strokeWidth={SW}>
        <path d="M 74 72 C 62 48 74 36 94 56 Z" fill="#D97706" />
        <path d="M 166 72 C 178 48 166 36 146 56 Z" fill="#D97706" />
        <circle cx={78} cy={56} r={5} fill="#FF8A9E" strokeWidth={0} />
        <circle cx={162} cy={56} r={5} fill="#FF8A9E" strokeWidth={0} />
      </g>

      {/* 원통형 구운 스모어 마시멜로 몸통 */}
      <path d={SMORE_BODY_D} fill={`url(#${toastGradId})`} stroke={INK} strokeWidth={SW} />
      {/* 마시멜로 상단 노릇노릇 캐러멜 광택 */}
      <ellipse cx={120} cy={68} rx={46} ry={12} fill="#92400E" opacity={0.35} />
      <ellipse cx={102} cy={66} rx={22} ry={6} fill="#FFFFFF" opacity={0.65} />

      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 🐾 고양이 발바닥 분홍 젤리 육구 앞손 */}
      <g stroke={INK} strokeWidth={SW}>
        <circle cx={74} cy={174} r={16} fill="#FFFDF9" />
        <circle cx={166} cy={174} r={16} fill="#FFFDF9" />
      </g>
      <g fill="#FF8A9E">
        <ellipse cx={74} cy={177} rx={6} ry={4.5} />
        <circle cx={68} cy={169} r={2.5} />
        <circle cx={74} cy={167} r={2.5} />
        <circle cx={80} cy={169} r={2.5} />
        <ellipse cx={166} cy={177} rx={6} ry={4.5} />
        <circle cx={160} cy={169} r={2.5} />
        <circle cx={166} cy={167} r={2.5} />
        <circle cx={172} cy={169} r={2.5} />
      </g>

      {/* 얼굴: 포근한 볼터치 + 눈 + 사르르 녹는 입 */}
      <ellipse cx={84} cy={136} rx={12} ry={7} fill="#FF8A9E" opacity={0.88} />
      <ellipse cx={156} cy={136} rx={12} ry={7} fill="#FF8A9E" opacity={0.88} />
      <Eye x={96} y={122} kind={look.expression} side={1} color="#3B2F2F" lid="#FEF3C7" />
      <Eye x={144} y={122} kind={look.expression} side={-1} color="#3B2F2F" lid="#FEF3C7" />
      <path d="M 111 134 Q 115.5 140 120 134 Q 124.5 140 129 134" fill="none" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

export const smore: SpeciesDef = {
  id: 'smore',
  name: '스모어마시멜로',
  element: 'fire',
  postureLabel: '자세 S · 치익 구운 발바닥 마시멜로',
  silhouetteDesc: '모닥불에 노릇노릇하게 구워진 폭신쫀득 고양이 발바닥 마시멜로',
  paletteCount: CHAMELEON_PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: SmoreArt,
}

// 🫧 7. '톡톡 과즙 왁싱볼(히트캔디)' 체형 (반투명 파스텔 밀랍 왁스 캡슐 + 안쪽에 찰랑이는 고농축 과일 시럽 코어 + 톡! 크랙 & 과즙 방울)
const WAX_COLORS = [
  { shell: '#F3E5F5', rim: '#CE93D8', syrupTop: '#AB47BC', syrupBot: '#6A1B9A', drop: '#BA68C8' }, // 포도 과즙 왁싱볼
  { shell: '#E1F5FE', rim: '#81D4FA', syrupTop: '#29B6F6', syrupBot: '#0277BD', drop: '#4FC3F7' }, // 소다 과즙 왁싱볼
  { shell: '#FCE4EC', rim: '#F48FB1', syrupTop: '#EC407A', syrupBot: '#AD1457', drop: '#F06292' }, // 복숭아·딸기 왁싱볼
  { shell: '#FFF8E1', rim: '#FFE082', syrupTop: '#FFCA28', syrupBot: '#EF6C00', drop: '#FFD54F' }, // 망고·레몬 왁싱볼
  { shell: '#E8F5E9', rim: '#A5D6A7', syrupTop: '#66BB6A', syrupBot: '#2E7D32', drop: '#81C784' }, // 샤인머스캣 왁싱볼
]

export function WaxBallArt({ look, uid }: ArtProps & { look: MonsterLook & { mallang?: MallangCustom } }) {
  const palIdx = look.mallang?.skinPalette ?? look.palette
  const wc = WAX_COLORS[palIdx % WAX_COLORS.length]
  const clipId = `${uid}-wax-clip`
  const syrupGradId = `${uid}-wax-syrup-grad`
  const shellGradId = `${uid}-wax-shell-grad`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id={syrupGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wc.syrupTop} />
          <stop offset="100%" stopColor={wc.syrupBot} />
        </linearGradient>
        <radialGradient id={shellGradId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor={wc.shell} />
          <stop offset="100%" stopColor={wc.rim} />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx={120} cy={148} r={66} />
        </clipPath>
      </defs>

      <UniversalWingLayer wingKind={look.mallang?.wingKind} p={CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]} />

      {/* 왁싱볼 상단 밀랍 병마개(트위스트 꼭지) */}
      <g stroke={INK} strokeWidth={SW}>
        <path
          d="M 104 84 L 100 62 C 100 54 140 54 140 62 L 136 84 Z"
          fill={wc.shell}
        />
        <ellipse cx={120} cy={60} rx={20} ry={6} fill={wc.rim} />
        {/* 꼭지 틈에서 톡! 터져 흘러나오는 과즙 시럽 한 방울 */}
        <path
          d="M 132 64 C 142 68 144 80 136 84 C 130 86 128 76 132 64 Z"
          fill={wc.drop}
          strokeWidth={2.2}
        />
      </g>

      {/* 귀여운 밀랍 왁스 발 */}
      <g fill={wc.shell} stroke={INK} strokeWidth={SW}>
        <ellipse cx={92} cy={210} rx={16} ry={10} />
        <ellipse cx={148} cy={210} rx={16} ry={10} />
      </g>

      {/* 외곽 불투명~반투명 밀랍 왁스 캡슐 베이스 */}
      <circle cx={120} cy={148} r={66} fill={`url(#${shellGradId})`} stroke={INK} strokeWidth={SW} />

      {/* 🫧 내부에 찰랑찰랑 차 있는 고농축 과일 시럽 액체 코어 (반투명 왁스 껍질 너머로 비침) */}
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M 48 136 Q 84 126 120 136 T 192 136 L 192 224 L 48 224 Z"
          fill={`url(#${syrupGradId})`}
          opacity={0.78}
        />
        {/* 시럽 수면 물결 하이라이트 */}
        <path
          d="M 54 136 Q 86 128 120 136 T 186 136"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3.5}
          opacity={0.75}
        />
        {/* 과즙 속 뽀글뽀글 기포 방울들 */}
        <circle cx={88} cy={176} r={6} fill="#FFFFFF" opacity={0.45} />
        <circle cx={152} cy={168} r={8} fill="#FFFFFF" opacity={0.4} />
        <circle cx={136} cy={190} r={4.5} fill="#FFFFFF" opacity={0.5} />
      </g>

      <BodyPaintLayer custom={look.mallang} clipId={clipId} />

      {/* 밀랍 왁스 껍질의 두께감을 보여주는 안쪽 반투명 링 + '톡! 파삭~' 미세 크랙 디테일 */}
      <circle
        cx={120}
        cy={148}
        r={60}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={3}
        opacity={0.7}
      />
      {/* 깨물었을 때 생기는 경쾌한 왁스 크랙 무늬 & 뿜어져 나오는 과즙 방울 */}
      <path
        d="M 156 102 L 146 112 L 154 118 L 142 126 M 146 112 L 136 108"
        fill="none"
        stroke={INK}
        strokeWidth={2.2}
        opacity={0.75}
      />
      <path
        d="M 168 112 C 180 106 186 116 176 122 C 170 124 166 118 168 112 Z"
        fill={wc.drop}
        stroke={INK}
        strokeWidth={2}
      />

      {/* 영롱한 밀랍 구슬 하이라이트 광택 */}
      <ellipse cx={88} cy={106} rx={20} ry={9} fill="#FFFFFF" opacity={0.9} transform="rotate(-28 88 106)" />
      <circle cx={74} cy={122} r={4.5} fill="#FFFFFF" opacity={0.85} />

      {/* 앙증맞은 왁스 구슬 양손 */}
      <g fill={wc.shell} stroke={INK} strokeWidth={SW}>
        <ellipse cx={54} cy={150} rx={12} ry={9} transform="rotate(20 54 150)" />
        <ellipse cx={186} cy={150} rx={12} ry={9} transform="rotate(-20 186 150)" />
      </g>

      {/* 얼굴: 초롱초롱한 눈망울과 과즙 머금은 입 */}
      <ellipse cx={84} cy={146} rx={11} ry={6.5} fill="#FF8A9E" opacity={0.85} />
      <ellipse cx={156} cy={146} rx={11} ry={6.5} fill="#FF8A9E" opacity={0.85} />
      <Eye x={96} y={132} kind={look.expression} side={1} color="#261612" lid={wc.shell} />
      <Eye x={144} y={132} kind={look.expression} side={-1} color="#261612" lid={wc.shell} />
      <path d="M 112 142 Q 120 151 128 142" fill="none" stroke={INK} strokeWidth={2.8} />
    </g>
  )
}

export const waxBall: SpeciesDef = {
  id: 'wax-ball',
  name: '왁뿌볼',
  element: 'water',
  postureLabel: '자세 W · 아그작! 왁뿌볼',
  silhouetteDesc: '파스텔 왁스 껍질 속에 말랑한 점액이 찰랑이는 왁뿌볼 요정',
  paletteCount: WAX_COLORS.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: WaxBallArt,
}
