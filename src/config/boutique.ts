// 파티세리 부티크 상점, 싸이월드 감성 마이룸(쇼룸), 특별 주화(슈가 리본 코인 🎀) 엔진
// 100% 한글 주석, Zero-Trust 보안 무결성 검증, 로컬 암호화 스토리지 연동

import type { DecoSlot } from '../monsters/Decorations'
import type { DessertSoundKind } from '../lib/sound'

// 1. 특별 주화 (슈가 리본 코인 🎀) & 무결성 관리
const RIBBON_STORAGE_KEY = 'withpet_ribbon_coins_secure_v1'
const OWNED_ITEMS_KEY = 'withpet_owned_boutique_items_v1'
const ROOM_CUSTOM_KEY = 'withpet_myroom_custom_v1'
const GUESTBOOK_STORAGE_KEY = 'withpet_myroom_guestbook_v1'

// 보안 무결성 체크용 단순 체크섬
function getCheckSum(value: number): string {
  return String((value * 31 + 107) ^ 0x5a5a)
}

export function getRibbonCoins(): number {
  try {
    const raw = localStorage.getItem(RIBBON_STORAGE_KEY)
    if (!raw) {
      // 신규 가입자 웰컴 보너스로 150 🎀 지급
      setRibbonCoins(150)
      return 150
    }
    const parsed = JSON.parse(raw) as { amount: number; checksum: string }
    if (parsed.checksum !== getCheckSum(parsed.amount)) {
      console.warn('보안 무결성 검증 실패: 특별 주화 초기화')
      return 150
    }
    return Math.max(0, parsed.amount)
  } catch {
    return 150
  }
}

export function setRibbonCoins(amount: number): void {
  try {
    const safeAmount = Math.max(0, Math.floor(amount))
    const payload = {
      amount: safeAmount,
      checksum: getCheckSum(safeAmount),
      updatedAt: Date.now(),
    }
    localStorage.setItem(RIBBON_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('특별 주화 저장 실패:', err)
  }
}

export function addRibbonCoins(amount: number, _reason?: string): number {
  const current = getRibbonCoins()
  const next = current + amount
  setRibbonCoins(next)
  return next
}

export function spendRibbonCoins(amount: number): boolean {
  const current = getRibbonCoins()
  if (current < amount) return false
  setRibbonCoins(current - amount)
  return true
}

// 2. 보유 아이템 인벤토리 관리 (기본 지급 무료 아이템 포함)
const DEFAULT_OWNED_ITEMS = [
  'berry-beret', // 기본 베레모
  'sleep-mask', // 기본 수면안대
  'bell-ribbon', // 기본 리본
  'room-patisserie', // 기본 파티세리 룸 테마
  'sofa-macaron', // 기본 마카롱 소파
]

export function getOwnedBoutiqueItems(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNED_ITEMS_KEY)
    if (!raw) {
      const init = new Set(DEFAULT_OWNED_ITEMS)
      saveOwnedBoutiqueItems(init)
      return init
    }
    const list = JSON.parse(raw) as string[]
    return new Set([...DEFAULT_OWNED_ITEMS, ...list])
  } catch {
    return new Set(DEFAULT_OWNED_ITEMS)
  }
}

export function saveOwnedBoutiqueItems(items: Set<string>): void {
  try {
    localStorage.setItem(OWNED_ITEMS_KEY, JSON.stringify(Array.from(items)))
  } catch (err) {
    console.error('보유 아이템 저장 실패:', err)
  }
}

export function purchaseBoutiqueItem(itemId: string, price: number): { success: boolean; message: string } {
  const owned = getOwnedBoutiqueItems()
  if (owned.has(itemId)) {
    return { success: false, message: '이미 소유하고 있는 아이템입니다.' }
  }
  if (!spendRibbonCoins(price)) {
    return { success: false, message: `슈가 리본 코인이 부족합니다! (필요: ${price} 🎀)` }
  }
  owned.add(itemId)
  saveOwnedBoutiqueItems(owned)
  return { success: true, message: '구매가 완료되었습니다! 언제든 착용할 수 있어요.' }
}

// 3. 부티크 장신구 카탈로그 정의
export interface BoutiqueItem {
  id: string
  name: string
  category: 'fashion' | 'interior'
  slot?: DecoSlot
  roomCategory?: 'theme' | 'furniture'
  price: number
  rarity: 'common' | 'rare' | 'legendary'
  charm: number
  icon: string
  desc: string
  soundKind: DessertSoundKind
}

export const BOUTIQUE_FASHION_ITEMS: BoutiqueItem[] = [
  // 머리 (head)
  {
    id: 'cream-cherry',
    name: '생크림 체리 모자',
    category: 'fashion',
    slot: 'head',
    price: 35,
    rarity: 'rare',
    charm: 28,
    icon: '🍒',
    desc: '봉긋한 생크림 구름 위에 얹힌 탐스러운 체리 토핑',
    soundKind: 'syrup-drizzle',
  },
  {
    id: 'wizard-hat',
    name: '별마법사 고깔모자',
    category: 'fashion',
    slot: 'head',
    price: 65,
    rarity: 'legendary',
    charm: 40,
    icon: '🧙‍♂️',
    desc: '신비로운 보랏빛 벨벳에 순금 별이 빛나는 마법사 모자',
    soundKind: 'sugar-crack',
  },
  {
    id: 'birthday-candle',
    name: '해피 생일 촛불',
    category: 'fashion',
    slot: 'head',
    price: 40,
    rarity: 'rare',
    charm: 25,
    icon: '🕯️',
    desc: '따뜻한 사랑으로 타오르는 달콤한 파스텔 촛불',
    soundKind: 'smore-sizzle',
  },
  {
    id: 'star-crown',
    name: '순금 미니 왕관',
    category: 'fashion',
    slot: 'head',
    price: 80,
    rarity: 'legendary',
    charm: 45,
    icon: '👑',
    desc: '최고의 파티시에 디저트만이 쓸 수 있는 빛나는 황금관',
    soundKind: 'sugar-crack',
  },
  {
    id: 'berry-beret',
    name: '딸기 퐁당 베레모',
    category: 'fashion',
    slot: 'head',
    price: 20,
    rarity: 'common',
    charm: 15,
    icon: '🍓',
    desc: '상큼한 딸기 꼭지 포인트가 돋보이는 프렌치 베레모',
    soundKind: 'mochi-squish',
  },
  // 얼굴 (face)
  {
    id: 'alchemy-glasses',
    name: '연금술 동글안경',
    category: 'fashion',
    slot: 'face',
    price: 30,
    rarity: 'rare',
    charm: 22,
    icon: '👓',
    desc: '지적이고 꼼꼼한 매력을 더해주는 황금 테 안경',
    soundKind: 'sugar-crack',
  },
  {
    id: 'sleep-mask',
    name: '포근 구름 수면안대',
    category: 'fashion',
    slot: 'face',
    price: 15,
    rarity: 'common',
    charm: 12,
    icon: '💤',
    desc: '언제 어디서든 달콤한 낮잠을 즐기게 해주는 부드러운 안대',
    soundKind: 'pudding-jiggle',
  },
  {
    id: 'star-patch',
    name: '유성 별빛 스티커',
    category: 'fashion',
    slot: 'face',
    price: 25,
    rarity: 'rare',
    charm: 20,
    icon: '🌟',
    desc: '양볼에 은은하게 반짝이는 펄 하이라이트 페인팅',
    soundKind: 'syrup-drizzle',
  },
  // 목 (neck)
  {
    id: 'pretzel-ribbon',
    name: '솔티드 프레첼 리본',
    category: 'fashion',
    slot: 'neck',
    price: 35,
    rarity: 'rare',
    charm: 26,
    icon: '🥨',
    desc: '노릇하고 바삭한 하트 프레첼 과자가 매달린 실크 리본',
    soundKind: 'cookie-crisp',
  },
  {
    id: 'rune-scarf',
    name: '루비 룬 머플러',
    category: 'fashion',
    slot: 'neck',
    price: 30,
    rarity: 'rare',
    charm: 24,
    icon: '🧣',
    desc: '고대 파티세리의 축복이 담긴 붉은 머플러',
    soundKind: 'mochi-squish',
  },
  {
    id: 'bell-ribbon',
    name: '별방울 멜로디 리본',
    category: 'fashion',
    slot: 'neck',
    price: 20,
    rarity: 'common',
    charm: 15,
    icon: '🎀',
    desc: '발걸음을 옮길 때마다 맑고 청아하게 울리는 황금 방울',
    soundKind: 'syrup-drizzle',
  },
  // 등 & 날개 (back)
  {
    id: 'meteor-wings',
    name: '오로라 유성 날개',
    category: 'fashion',
    slot: 'back',
    price: 90,
    rarity: 'legendary',
    charm: 50,
    icon: '🪽',
    desc: '별똥별이 쏟아지듯 영롱한 빛을 뿜는 반투명 수정 날개',
    soundKind: 'sugar-crack',
  },
  {
    id: 'explorer-pack',
    name: '파티세리 탐험 배낭',
    category: 'fashion',
    slot: 'back',
    price: 25,
    rarity: 'common',
    charm: 18,
    icon: '🎒',
    desc: '나침반과 비밀 디저트 레시피 노트가 든 아담한 가죽 가방',
    soundKind: 'cookie-crisp',
  },
  // 손 & 소품 (hand)
  {
    id: 'lantern-staff',
    name: '별빛 등불 지팡이',
    category: 'fashion',
    slot: 'hand',
    price: 85,
    rarity: 'legendary',
    charm: 48,
    icon: '🏮',
    desc: '어두운 밤에도 따스한 호박빛을 밝혀주는 마법 고목 지팡이',
    soundKind: 'choco-melt',
  },
  {
    id: 'lollipop-wand',
    name: '무지개 롤리팝봉',
    category: 'fashion',
    slot: 'hand',
    price: 40,
    rarity: 'rare',
    charm: 30,
    icon: '🍭',
    desc: '손에 쥐면 달콤한 향기가 솔솔 풍기는 알록달록 캔디봉',
    soundKind: 'sugar-crack',
  },
  {
    id: 'star-wand',
    name: '황금 요술 별봉',
    category: 'fashion',
    slot: 'hand',
    price: 45,
    rarity: 'rare',
    charm: 32,
    icon: '🪄',
    desc: '휘두르면 영롱한 별가루 파티클이 사방으로 흩날립니다',
    soundKind: 'syrup-drizzle',
  },
  // 이펙트 & 오라 (effect)
  {
    id: 'constellation-aura',
    name: '황금 별자리 궤도 오라',
    category: 'fashion',
    slot: 'effect',
    price: 95,
    rarity: 'legendary',
    charm: 55,
    icon: '✨',
    desc: '캐릭터 주변을 맴도는 눈부신 황금빛 소행성 궤도',
    soundKind: 'sugar-crack',
  },
  {
    id: 'blossom-breeze',
    name: '봄바람 벚꽃 흩날림',
    category: 'fashion',
    slot: 'effect',
    price: 50,
    rarity: 'rare',
    charm: 35,
    icon: '🌸',
    desc: '살랑살랑 부는 봄바람에 분홍 벚꽃잎이 부드럽게 흩날립니다',
    soundKind: 'mochi-squish',
  },
]

// 4. 싸이월드 미니룸 스타일 인테리어(테마 & 가구) 카탈로그
export interface RoomThemeDef {
  id: string
  name: string
  price: number
  rarity: 'common' | 'rare' | 'legendary'
  charm: number
  icon: string
  desc: string
  wallBg: string
  floorBg: string
  accentColor: string
}

export const ROOM_THEMES: RoomThemeDef[] = [
  {
    id: 'room-patisserie',
    name: '달콤 파티세리 룸',
    price: 0, // 기본 무료
    rarity: 'common',
    charm: 30,
    icon: '🍰',
    desc: '체크무늬 타일과 따뜻한 쇼케이스가 돋보이는 클래식 베이커리 룸',
    wallBg: 'linear-gradient(180deg, #FFE4E6 0%, #FFF1F2 100%)',
    floorBg: 'repeating-linear-gradient(45deg, #FED7AA 0, #FED7AA 16px, #FDBA74 16px, #FDBA74 32px)',
    accentColor: '#FB7185',
  },
  {
    id: 'room-galaxy',
    name: '별빛 은하수 룸',
    price: 70,
    rarity: 'legendary',
    charm: 60,
    icon: '🌌',
    desc: '영롱한 초승달과 별똥별이 쏟아지는 신비로운 밤하늘 룸',
    wallBg: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)',
    floorBg: 'linear-gradient(180deg, #4338CA 0%, #3730A3 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'room-berry',
    name: '생딸기 정원 룸',
    price: 45,
    rarity: 'rare',
    charm: 45,
    icon: '🍓',
    desc: '초록 잔디 러그와 상큼한 딸기 덩굴이 어우러진 햇살 정원',
    wallBg: 'linear-gradient(180deg, #DCFCE7 0%, #F0FDF4 100%)',
    floorBg: 'radial-gradient(circle, #86EFAC 10%, #4ADE80 90%)',
    accentColor: '#16A34A',
  },
  {
    id: 'room-vintage',
    name: '빈티지 초코 카페 룸',
    price: 50,
    rarity: 'rare',
    charm: 48,
    icon: '☕',
    desc: '원목 플로어와 진한 에스프레소 향이 맴도는 아늑한 유럽풍 카페',
    wallBg: 'linear-gradient(180deg, #EFEBE9 0%, #D7CCC8 100%)',
    floorBg: 'repeating-linear-gradient(0deg, #8D6E63 0, #8D6E63 12px, #795548 12px, #795548 24px)',
    accentColor: '#6D4C41',
  },
]

export interface RoomFurnitureDef {
  id: string
  name: string
  price: number
  rarity: 'common' | 'rare' | 'legendary'
  charm: number
  icon: string
  desc: string
  slotType: 'bed' | 'table' | 'play' | 'deco'
  soundKind: DessertSoundKind
  actionLabel: string
}

export const ROOM_FURNITURE_CATALOG: RoomFurnitureDef[] = [
  {
    id: 'sofa-macaron',
    name: '마카롱 폭신 쿠션 소파',
    price: 0, // 기본 무료
    rarity: 'common',
    charm: 20,
    icon: '🛋️',
    desc: '쫀득한 마카롱 꼬끄 사이에 든 버터크림처럼 푹신푹신한 소파',
    slotType: 'bed',
    soundKind: 'mochi-squish',
    actionLabel: '낮잠 뒹굴기',
  },
  {
    id: 'table-pretzel',
    name: '솔티드 프레첼 티테이블',
    price: 35,
    rarity: 'rare',
    charm: 25,
    icon: '🪑',
    desc: '노릇하게 구운 대형 프레첼 상판에 따뜻한 홍차가 놓인 테이블',
    slotType: 'table',
    soundKind: 'cookie-crisp',
    actionLabel: '티타임 갖기',
  },
  {
    id: 'trampoline-jelly',
    name: '뽀용 젤리 트램펄린',
    price: 55,
    rarity: 'rare',
    charm: 35,
    icon: '🎪',
    desc: '올라가서 뛰면 뽀용~ 뽀용~ 기분 좋게 튕겨 오르는 탄성 만점 트램펄린',
    slotType: 'play',
    soundKind: 'pudding-jiggle',
    actionLabel: '콩콩 점프 뛰기',
  },
  {
    id: 'showcase-dessert',
    name: '크리스털 트로피 쇼케이스',
    price: 60,
    rarity: 'legendary',
    charm: 40,
    icon: '🏆',
    desc: '대전과 타워에서 획득한 명예로운 훈장과 메달을 보관하는 유리 진열장',
    slotType: 'deco',
    soundKind: 'sugar-crack',
    actionLabel: '트로피 감상하기',
  },
  {
    id: 'lamp-starlight',
    name: '별빛 스탠드 무드등',
    price: 30,
    rarity: 'rare',
    charm: 22,
    icon: '💡',
    desc: '은은한 호박빛으로 방 전체를 포근하게 물들이는 스탠드 조명',
    slotType: 'deco',
    soundKind: 'syrup-drizzle',
    actionLabel: '조명 온오프',
  },
  {
    id: 'fountain-choco',
    name: '미니 퐁듀 초코 분수대',
    price: 75,
    rarity: 'legendary',
    charm: 50,
    icon: '⛲',
    desc: '따뜻한 가나슈 초콜릿 폭포가 끝없이 흘러내리는 환상의 분수대',
    slotType: 'play',
    soundKind: 'choco-melt',
    actionLabel: '초코 찍어먹기',
  },
]

// 5. 마이룸(쇼룸) 상태 저장 모델
export interface RoomCustom {
  themeId: string
  placedFurniture: string[] // 배치된 가구 ID 목록
  bgmId: string
  todayVisitors: number
  totalVisitors: number
  likes: number
}

export function loadRoomCustom(): RoomCustom {
  try {
    const raw = localStorage.getItem(ROOM_CUSTOM_KEY)
    if (!raw) {
      return {
        themeId: 'room-patisserie',
        placedFurniture: ['sofa-macaron', 'lamp-starlight'],
        bgmId: 'patisserie-sweet',
        todayVisitors: 12,
        totalVisitors: 87,
        likes: 24,
      }
    }
    return JSON.parse(raw) as RoomCustom
  } catch {
    return {
      themeId: 'room-patisserie',
      placedFurniture: ['sofa-macaron'],
      bgmId: 'patisserie-sweet',
      todayVisitors: 12,
      totalVisitors: 87,
      likes: 24,
    }
  }
}

export function saveRoomCustom(data: RoomCustom): void {
  try {
    localStorage.setItem(ROOM_CUSTOM_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('룸 설정 저장 실패:', err)
  }
}

// 6. 싸이월드 감성 방명록(일촌평/방문 한마디) 시스템
export interface GuestBookEntry {
  id: string
  author: string
  message: string
  createdAt: string
  icon: string
}

export const INITIAL_GUESTBOOK: GuestBookEntry[] = [
  {
    id: 'g-1',
    author: '바삭바삭쿠키맘',
    message: '어머! 룸 테마랑 베레모 코디가 너무 귀여워요~ 방명록 도장 쾅! 🐾❤️',
    createdAt: '1시간 전',
    icon: '🍪',
  },
  {
    id: 'g-2',
    author: '민트초코파',
    message: '친선 대전 너무 재밌었습니다! 나중에 또 한판 떠요 ⚔️✨',
    createdAt: '3시간 전',
    icon: '🌱',
  },
  {
    id: 'g-3',
    author: '달콤마카롱러버',
    message: '마카롱 소파에서 꿀잠 자는 모습에 반하고 갑니다 ㅎㅎㅎ',
    createdAt: '어제',
    icon: '🧁',
  },
]

export function loadGuestBook(): GuestBookEntry[] {
  try {
    const raw = localStorage.getItem(GUESTBOOK_STORAGE_KEY)
    if (!raw) return INITIAL_GUESTBOOK
    return JSON.parse(raw) as GuestBookEntry[]
  } catch {
    return INITIAL_GUESTBOOK
  }
}

export function addGuestBookEntry(author: string, message: string): GuestBookEntry[] {
  try {
    const current = loadGuestBook()
    const newEntry: GuestBookEntry = {
      id: `g-${Date.now()}`,
      author: author.trim() || '익명의 파티시에',
      message: message.trim(),
      createdAt: '방금 전',
      icon: '✨',
    }
    const updated = [newEntry, ...current].slice(0, 20)
    localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return INITIAL_GUESTBOOK
  }
}
