// 몬스터 장식 7칸(머리·얼굴·목·등·손·배경·이펙트), 별조각 염색, 특수 변이(수정·그림자·황금), 육성 훈장 SVG 레이어
import { INK } from './Biped'
import type { MonsterDecorations, MonsterMedals } from './types'

export type DecoSlot = 'head' | 'face' | 'neck' | 'back' | 'hand' | 'bg' | 'effect'

export interface DecoItemDef {
  id: string
  slot: DecoSlot
  name: string
  rarity: 'common' | 'rare' | 'legendary'
  charm: number
  icon: string
  desc: string
}

// 별조각 염색 테마 6종 (기본 / 로즈베리 / 민트숲 / 골드선셋 / 오로라퍼플 / 미드나잇)
export interface DyeTheme {
  id: number
  name: string
  main: string
  sub: string
  gem: string
}

export const DYE_THEMES: DyeTheme[] = [
  { id: 0, name: '기본 컬러', main: '#6366F1', sub: '#FF8A65', gem: '#38BDF8' },
  { id: 1, name: '로즈베리', main: '#EC4899', sub: '#F43F5E', gem: '#FDE047' },
  { id: 2, name: '민트 포레스트', main: '#10B981', sub: '#34D399', gem: '#FEF08A' },
  { id: 3, name: '선셋 골드', main: '#F59E0B', sub: '#FB923C', gem: '#A855F7' },
  { id: 4, name: '오로라 퍼플', main: '#8B5CF6', sub: '#C084FC', gem: '#67E8F9' },
  { id: 5, name: '미드나잇 문', main: '#334155', sub: '#64748B', gem: '#FBBF24' },
]

// Stitch 10번 스튜디오 기준 장식 아이템 카탈로그 (7칸 전체 지원)
export const DECO_ITEMS: DecoItemDef[] = [
  // 1. 머리 (head)
  { id: 'cream-cherry', slot: 'head', name: '생크림 체리 모자', rarity: 'rare', charm: 28, icon: '🍒', desc: '봉긋한 생크림 방울 위에 새빨간 체리가 얹힌 디저트 토핑' },
  { id: 'birthday-candle', slot: 'head', name: '해피 생일 초', rarity: 'rare', charm: 22, icon: '🕯️', desc: '따뜻한 촛불이 타오르는 달콤한 생일 케이크 초' },
  { id: 'wizard-hat', slot: 'head', name: '별마법사 모자', rarity: 'legendary', charm: 35, icon: '🧙‍♂️', desc: '금빛 별무늬와 방울이 달린 마법사 고깔모자' },
  { id: 'berry-beret', slot: 'head', name: '딸기 베레모', rarity: 'common', charm: 12, icon: '🍓', desc: '상큼한 딸기 꼭지가 달린 폭신한 베레모' },
  { id: 'star-crown', slot: 'head', name: '별빛 미니 왕관', rarity: 'rare', charm: 24, icon: '👑', desc: '보석이 박힌 앙증맞은 황금 왕관' },
  { id: 'crown-emoji-floating', slot: 'head', name: '감정 이모티콘 크라운', rarity: 'rare', charm: 40, icon: '💖', desc: '펫의 기분에 맞춰 하트와 별빛이 퐁퐁 솟아오르는 이모티콘 크라운' },
  { id: 'spring-cherry-blossom-beret', slot: 'head', name: '살랑살랑 벚꽃잎 베레모', rarity: 'rare', charm: 32, icon: '🌸', desc: '살랑살랑 봄바람에 흩날리는 벚꽃잎과 은은한 펄 진주 핀이 달린 핑크 울 베레모' },
  { id: 'winter-fluffy-earmuffs', slot: 'head', name: '보송보송 눈꽃 털 귀마개', rarity: 'common', charm: 26, icon: '🎧', desc: '보송보송 솜사탕처럼 부드러운 화이트 폼폼 퍼(Fur) 밴드와 은빛 눈꽃 자수 귀마개' },
  { id: 'astral-sorcerer-hood', slot: 'head', name: '별빛 소서러 후드', rarity: 'rare', charm: 34, icon: '🔮', desc: '밤하늘 은하수가 수놓아진 딥네이비 마법사 후드와 흔들리는 황금 초승달 펜던트' },
  { id: 'fairy-sugar-winged-circlet', slot: 'head', name: '요정의 슈가 윙 서클릿', rarity: 'rare', charm: 32, icon: '🧚', desc: '무지갯빛 반투명 요정 날개 이어링과 에메랄드 이마 티아라' },
  { id: 'party-confetti-cone-hat', slot: 'head', name: '축하 폭죽 꼬깔모자', rarity: 'common', charm: 26, icon: '🎉', desc: '파티 분위기를 한껏 돋우는 알록달록 스프링클 꼬깔모자와 폼폼 방울' },
  { id: 'champagne-cork-topper', slot: 'head', name: '샴페인 버블 실크햇', rarity: 'legendary', charm: 44, icon: '🎩', desc: '황금 샴페인 코르크와 퐁퐁 솟아오르는 탄산 기포가 매력적인 로열 실크햇' },
  // 2. 얼굴 (face)
  { id: 'alchemy-glasses', slot: 'face', name: '연금술 동글안경', rarity: 'rare', charm: 20, icon: '👓', desc: '지적인 매력을 더해주는 황금 테 안경' },
  { id: 'round-gold-spectacles', slot: 'face', name: '스마트 골드 동글안경', rarity: 'rare', charm: 28, icon: '👓', desc: '지적인 매력과 똘똘함을 한껏 뽐내는 24K 순금테 클래식 동글안경' },
  { id: 'summer-cool-sunglasses', slot: 'face', name: '틴트 쿨 선글라스', rarity: 'common', charm: 26, icon: '🕶️', desc: '강렬한 여름 햇살을 쿨하게 막아주는 레트로 틴트 블루 라운드 선글라스' },
  { id: 'crystal-monocle', slot: 'face', name: '아케인 크리스탈 모노클', rarity: 'rare', charm: 28, icon: '💎', desc: '고대 마법 룬 문자가 새겨진 24K 골드 체인 외알 안경과 투명 굴절 크리스탈' },
  { id: 'arcane-rune-mask', slot: 'face', name: '신비의 룬 하프 가면', rarity: 'common', charm: 26, icon: '🎭', desc: '디저트 대현자의 지혜가 깃든 유선형 은빛 무도회 반가면과 문양' },
  { id: 'masquerade-feather-eyemask', slot: 'face', name: '무도회 깃털 가면', rarity: 'rare', charm: 30, icon: '🎭', desc: '화려한 공작 깃털과 자수정 보석이 돋보이는 가면무도회 레이스 아이마스크' },
  { id: 'party-whistle-blower', slot: 'face', name: '롤링 파티 피리', rarity: 'common', charm: 22, icon: '🎺', desc: '입에 물고 후- 불면 도로록 풀렸다 말려드는 알록달록 파티 롤링 피리' },
  { id: 'sleep-mask', slot: 'face', name: '포근 수면안대', rarity: 'common', charm: 10, icon: '💤', desc: '이마에 살짝 얹은 구름결 수면안대' },
  { id: 'star-patch', slot: 'face', name: '유성 볼 스티커', rarity: 'rare', charm: 18, icon: '🌟', desc: '양볼에 붙이는 반짝이는 별빛 페인팅' },
  // 3. 목 (neck)
  { id: 'chef-coat-tie', slot: 'neck', name: '명장 파티시에 제복 & 타이', rarity: 'legendary', charm: 45, icon: '🧑‍🍳', desc: '프랑스 수제 제과 명장의 더블 버튼 순백 셰프 자켓과 실크 레드 타이' },
  { id: 'preppy-school-tie', slot: 'neck', name: '브리티시 프레피 타이 & 칼라', rarity: 'rare', charm: 30, icon: '🎓', desc: '영국 명문 베이킹 아카데미 스타일의 타탄체크 리본 타이와 금장 단추 셔츠 칼라' },
  { id: 'bear-knit-suspenders', slot: 'neck', name: '곰돌이 니트 멜빵 보타이', rarity: 'rare', charm: 26, icon: '🧸', desc: '포근한 브라운 코듀로이 멜빵 스트랩과 앙증맞은 곰돌이 자수 보타이' },
  { id: 'sherlock-cape-coat', slot: 'neck', name: '셜록 하운드투스 케이프', rarity: 'legendary', charm: 42, icon: '🕵️‍♂️', desc: '안개 낀 베이커리 거리의 미스터리를 푸는 클래식 하운드투스 체크 케이프 망토' },
  { id: 'summer-marine-sailor-collar', slot: 'neck', name: '마린 세일러 칼라', rarity: 'rare', charm: 30, icon: '⚓', desc: '청량한 바다 내음이 느껴지는 네이비 & 화이트 스트라이프 세일러 깃과 골드 닻 타이' },
  { id: 'autumn-maple-knit-muffler', slot: 'neck', name: '단풍 버건디 니트 머플러', rarity: 'common', charm: 28, icon: '🧣', desc: '포근한 꽈배기 울 짜임새의 단풍빛 버건디 레드 니트 머플러와 풍성한 프린지 수술' },
  { id: 'winter-snow-padded-vest', slot: 'neck', name: '스노우 퐁퐁 패딩 조끼', rarity: 'legendary', charm: 44, icon: '❄️', desc: '영하의 칼바람도 따뜻하게 녹여주는 퐁퐁 스노우 화이트 누빔 패딩 조끼' },
  { id: 'celestial-wizard-robe', slot: 'neck', name: '천상 별자리 마법 로브', rarity: 'legendary', charm: 46, icon: '✨', desc: '별빛 궤도와 금빛 성운이 흐르는 최고위 마도사의 숄더 케이프와 마법석 브로치' },
  { id: 'moonlight-velvet-choker', slot: 'neck', name: '달빛 벨벳 젬 초커', rarity: 'common', charm: 24, icon: '🖤', desc: '부드러운 미드나잇 블랙 벨벳 밴드와 물방울 루비 드롭 펜던트' },
  { id: 'masquerade-tuxedo-bowtie', slot: 'neck', name: '턱시도 실크 윙 보타이', rarity: 'rare', charm: 32, icon: '🤵', desc: '고급스러운 블랙 벨벳 윙 칼라와 새틴 실크 보타이, 골드 핀 체인' },
  { id: 'birthday-cake-ruffle-collar', slot: 'neck', name: '케이크 크림 프릴 칼라', rarity: 'rare', charm: 35, icon: '🎂', desc: '생크림 깍지로 풍성하게 짠 달콤한 3단 프릴 칼라와 슈가 진주 장식' },
  { id: 'pretzel-ribbon', slot: 'neck', name: '솔티드 프레첼 리본', rarity: 'rare', charm: 20, icon: '🥨', desc: '노릇하게 구운 하트 모양 프레첼 과자 장식' },
  { id: 'rune-scarf', slot: 'neck', name: '룬 무늬 머플러', rarity: 'rare', charm: 18, icon: '🧣', desc: '고대 룬 문양이 수놓아진 따뜻한 목도리' },
  { id: 'bell-ribbon', slot: 'neck', name: '별방울 리본', rarity: 'common', charm: 12, icon: '🎀', desc: '움직일 때마다 딸랑거리는 금방울 리본' },
  // 4. 등 (back)
  { id: 'meteor-wings', slot: 'back', name: '유성 날개 망토', rarity: 'legendary', charm: 32, icon: '🪽', desc: '별똥별 궤적이 흐르는 반투명 천사 날개' },
  { id: 'wings-meringue-angel', slot: 'back', name: '천사 머랭 날개', rarity: 'legendary', charm: 45, icon: '🪽', desc: '바삭하고 폭신한 순백의 슈가 머랭 깃털 날개' },
  { id: 'vintage-leather-satchel', slot: 'back', name: '클래식 사첼 책가방', rarity: 'rare', charm: 32, icon: '🎒', desc: '고급 카라멜색 가죽으로 마감된 앤틱 버클 스쿨 사첼 백팩' },
  { id: 'explorer-pack', slot: 'back', name: '탐험가 미니 배낭', rarity: 'common', charm: 14, icon: '🎒', desc: '나침반과 지도가 든 작은 가죽 배낭' },
  // 5. 손 (hand)
  { id: 'spring-picnic-basket', slot: 'hand', name: '딸기 피크닉 라탄 바구니', rarity: 'rare', charm: 28, icon: '🧺', desc: '빨간 깅엄 체크 천 덮개 위로 달콤한 산딸기와 파운드 케이크가 담긴 라탄 바구니' },
  { id: 'autumn-artist-palette', slot: 'hand', name: '가을 감성 우드 팔레트', rarity: 'rare', charm: 28, icon: '🎨', desc: '가을 낙엽과 디저트 시럽 물감이 알록달록 짜여진 아티스트 나무 팔레트와 세필 붓' },
  { id: 'arcane-sugar-grimoire', slot: 'hand', name: '아케인 슈가 마도서', rarity: 'rare', charm: 32, icon: '📕', desc: '황금 장정 가죽 표지와 부유하는 룬 보석이 박힌 공중 부양 디저트 마도서' },
  { id: 'celestial-meteor-staff', slot: 'hand', name: '유성 소환 별빛 셉터', rarity: 'legendary', charm: 45, icon: '💫', desc: '회전하는 천체 궤도 링과 24K 황금 별자리 셉터, 영롱한 빛무리 파티클' },
  { id: 'sparkler-party-firework', slot: 'hand', name: '챠르릉 축제 스파클러', rarity: 'rare', charm: 32, icon: '🎆', desc: '타닥타닥 황금빛 불꽃이 춤추며 반짝이는 파티용 슈가 스파클러' },
  { id: 'royal-party-champagne-glass', slot: 'hand', name: '골드 버블 샴페인 글라스', rarity: 'rare', charm: 30, icon: '🥂', desc: '황금빛 스파클링 소다가 찰랑이며 마카롱 가니쉬가 꽂힌 파티 글라스' },
  { id: 'tiny-wood-rollingpin', slot: 'hand', name: '달콤 반죽 미니 밀대', rarity: 'rare', charm: 28, icon: '🥖', desc: '달콤한 쿠키 도우를 슥슥 밀어 펴는 단풍나무 제과용 미니 밀대' },
  { id: 'bubble-detective-magnifier', slot: 'hand', name: '황금 버블 돋보기', rarity: 'rare', charm: 30, icon: '🔍', desc: '디저트의 숨겨진 레시피를 찾으면 무지갯빛 비눗방울이 퐁퐁 솟아나는 탐정 돋보기' },
  { id: 'lollipop-wand', slot: 'hand', name: '롤리팝 캔디봉', rarity: 'rare', charm: 26, icon: '🍭', desc: '달콤한 파스텔 소용돌이 막대사탕' },
  { id: 'lantern-staff', slot: 'hand', name: '별빛 등불 지팡이', rarity: 'legendary', charm: 40, icon: '🏮', desc: '따스한 별빛을 비추는 마법 나무 지팡이' },
  { id: 'star-wand', slot: 'hand', name: '요술 별봉', rarity: 'rare', charm: 22, icon: '🪄', desc: '휘두르면 반짝이가 퍼지는 황금 요술봉' },
  // 신규 머리 (head)
  { id: 'iphone-headset', slot: 'head', name: '애플 맥스 실버 헤드셋', rarity: 'rare', charm: 32, icon: '🎧', desc: '알루미늄 아노다이징 실버 메탈과 메시 이어쿠션의 트렌디 하이파이 헤드폰' },
  { id: 'street-ball-cap', slot: 'head', name: '스트릿 스포티 볼캡', rarity: 'common', charm: 24, icon: '🧢', desc: '힙한 스트릿 감성의 자수 로고와 둥근 챙이 매력적인 캐주얼 볼캡' },
  { id: 'knit-beanie-hat', slot: 'head', name: '포근 쫀득 니트 비니', rarity: 'common', charm: 22, icon: '🧶', desc: '도톰한 골지 짜임과 롤업 커프가 귀여운 따스한 웜톤 니트 비니 모자' },
  { id: 'pastry-chef-toque', slot: 'head', name: '명장 파티시에 셰프 토크', rarity: 'rare', charm: 28, icon: '👨‍🍳', desc: '주름 잡힌 높은 돔 형태의 프랑스 정통 고급 디저트 셰프 모자' },
  { id: 'angel-holy-halo', slot: 'head', name: '성스러운 황금 엔젤 링', rarity: 'legendary', charm: 42, icon: '😇', desc: '머리 위 정수리에 둥둥 떠서 끊임없이 은은한 금빛을 뿜는 천사의 링' },
  { id: 'xmas-santa-fur-hat', slot: 'head', name: '루돌프 뿔 산타 털모자', rarity: 'rare', charm: 32, icon: '🎅', desc: '새빨간 벨벳 삼각모에 퐁퐁 흰 방울과 앙증맞은 사슴 뿔이 솟은 크리스마스 모자' },
  { id: 'birthday-party-cone-deluxe', slot: 'head', name: '무지개 스프링클 생일 꼬깔', rarity: 'common', charm: 22, icon: '🥳', desc: '생일 파티의 주인공! 알록달록 무지개 패턴에 폼폼 왕방울이 달린 파티 꼬깔모자' },
  { id: 'taeguk-glory-headband', slot: 'head', name: '광복 태극 리본 머리띠', rarity: 'rare', charm: 30, icon: '🇰🇷', desc: '대한독립 만세! 선명한 빨강과 파랑의 태극 문양 리본이 당당히 휘날리는 머리띠' },
  // 신규 얼굴 (face)
  { id: 'pince-nez-retro-specs', slot: 'face', name: '빈티지 핀치네 콧등 안경', rarity: 'rare', charm: 26, icon: '🧐', desc: '안경다리 없이 콧등에 살포시 걸쳐 쓰는 클래식 앤틱 골드 핀치네 안경' },
  { id: 'round-tortoise-glasses', slot: 'face', name: '레트로 호피 동글이 뿔테', rarity: 'common', charm: 20, icon: '👓', desc: '지적이고 단정한 분위기를 연출해 주는 브라운 호피 무늬 아세테이트 뿔테' },
  { id: 'cyber-pixel-shades', slot: 'face', name: '사이버 8비트 픽셀 셰이드', rarity: 'rare', charm: 28, icon: '🕶️', desc: '힙스터의 필수템! 계단식 8비트 도트 프레임의 블랙 픽셀 선글라스' },
  { id: 'lovely-heart-sunglasses', slot: 'face', name: '러블리 틴트 하트 선글라스', rarity: 'common', charm: 24, icon: '💖', desc: '사랑스러운 하트 쉐입 렌즈와 핑크 그라데이션 틴트가 돋보이는 바캉스 안경' },
  { id: 'party-blower-flute', slot: 'face', name: '롤링 휘슬 파티 피리', rarity: 'common', charm: 18, icon: '🎺', desc: '입에 물고 후- 불면 삐익 소리와 함께 앞으로 길게 펼쳐지는 신나는 파티 피리' },
  { id: 'snorkel-dive-mask', slot: 'face', name: '투명 오션 스노클링 마스크', rarity: 'common', charm: 25, icon: '🤿', desc: '바닷속 산호초를 선명하게 감상할 수 있는 방수 고글과 수중 숨대롱 세트' },
  // 신규 목 (neck)
  { id: 'xmas-holy-cape', slot: 'neck', name: '골드벨 산타 윈터 망토', rarity: 'rare', charm: 36, icon: '🎄', desc: '도톰한 하얀 밍크 퍼 트리밍과 딸랑딸랑 금빛 종이 달린 크리스마스 케이프' },
  { id: 'vintage-film-camera', slot: 'neck', name: '레트로 필름 스트랩 카메라', rarity: 'rare', charm: 30, icon: '📷', desc: '가죽 스트랩으로 목에 걸어 언제든 디저트 풍경을 찰칵 남기는 아날로그 카메라' },
  // 신규 등 (back)
  { id: 'taeguk-hero-cape', slot: 'back', name: '영웅의 태극기 펄럭 망토', rarity: 'legendary', charm: 45, icon: '🇰🇷', desc: '건곤감리 사괘와 태극 문양이 웅장하게 수놓아진 자랑스러운 태극기 망토' },
  { id: 'surfing-wave-board', slot: 'back', name: '트로피컬 파도 서핑보드', rarity: 'rare', charm: 36, icon: '🏄‍♂️', desc: '푸른 바다의 에메랄드 파도 그래픽이 시원하게 그려진 에어로 다이내믹 서프보드' },
  { id: 'snow-polar-sled-board', slot: 'back', name: '은빛 눈꽃 설원 썰매보드', rarity: 'rare', charm: 38, icon: '🏂', desc: '새하얀 눈밭을 가르며 활주하는 고속 스노보드 겸 루돌프 썰매 플레이트' },
  // 신규 손 (hand)
  { id: 'travel-roller-suitcase', slot: 'hand', name: '여행 스티커 캐리어 가방', rarity: 'rare', charm: 34, icon: '🧳', desc: '전 세계 디저트 명소 스티커가 붙은 손잡이 달린 앙증맞은 미니 캐리어' },
  // 하이엔드 럭셔리 명품 장신구 컬렉션
  { id: 'lux-gold-rolex-watch', slot: 'hand', name: '골드 오이스터 럭셔리 워치', rarity: 'legendary', charm: 48, icon: '⌚', desc: '24K 순금 브레이슬릿과 쥬얼 인덱스가 빛나는 스위스 마스터 크로노그래프 시계' },
  { id: 'lux-tweed-pearl-beret', slot: 'head', name: '오뜨 트위드 진주 베레모', rarity: 'legendary', charm: 44, icon: '👒', desc: '프랑스 명품 하우스의 블랙&화이트 부클레 트위드 원단과 남양 진주 브로치 베레모' },
  { id: 'lux-hermes-silk-twilly', slot: 'neck', name: '에르메스풍 오렌지 실크 트윌리', rarity: 'rare', charm: 38, icon: '🧣', desc: '시그니처 오렌지 컬러와 말안장 기하학 일러스트가 수놓아진 100% 실크 트윌리 스카프' },
  { id: 'lux-cartier-trinity-ring', slot: 'hand', name: '트리니티 3색 골드 링', rarity: 'legendary', charm: 45, icon: '💍', desc: '옐로우·화이트·핑크 골드가 조화롭게 얽혀 영원한 사랑을 상징하는 명품 뱅글 링' },
  { id: 'lux-diamond-camellia-brooch', slot: 'neck', name: '다이아 까멜리아 브로치', rarity: 'legendary', charm: 46, icon: '💎', desc: '순백의 꽃잎마다 최상급 브릴리언트 다이아몬드가 촘촘히 파베 세팅된 명품 브로치' },
  { id: 'lux-celebrity-oversized-shades', slot: 'face', name: 'VIP 오버사이즈 캣아이 셰이드', rarity: 'rare', charm: 35, icon: '🕶️', desc: '런웨이 프론트로우 셀럽의 품격을 완성하는 볼드한 블랙 아세테이트와 골드 템플 안경' },
  // 6. 배경 (bg)
  { id: 'night-observatory', slot: 'bg', name: '밤하늘 천문대', rarity: 'legendary', charm: 28, icon: '🌌', desc: '초승달과 은하수가 흐르는 밤하늘 무대' },
  { id: 'sunny-meadow', slot: 'bg', name: '햇살 클로버 언덕', rarity: 'common', charm: 12, icon: '🍀', desc: '따사로운 햇살과 꽃잎이 날리는 들판' },
  // 7. 이펙트 (effect)
  { id: 'constellation-aura', slot: 'effect', name: '황금 별자리 오라', rarity: 'legendary', charm: 36, icon: '✨', desc: '몸 주위를 맴도는 황금빛 별자리 궤도' },
  { id: 'blossom-breeze', slot: 'effect', name: '봄바람 꽃보라', rarity: 'rare', charm: 22, icon: '🌸', desc: '포근하게 흩날리는 분홍 벚꽃잎 이펙트' },
  { id: 'aura-galaxy-orbit', slot: 'effect', name: '영롱한 궤도 오라', rarity: 'legendary', charm: 50, icon: '💫', desc: '은하수 궤도를 따라 마카롱 위성과 별빛이 펫 주변을 공전하는 환상 오라' },
  { id: 'footprint-honey-dew', slot: 'effect', name: '달콤 슈가 발자국', rarity: 'rare', charm: 35, icon: '🐾', desc: '발걸음마다 촉촉한 꿀물 방울과 슈가파우더가 퐁퐁 피어나는 발자국 FX' },
]

// 배경(bg) & 뒤쪽 이펙트 + 등(back) 장식 렌더링 (몬스터 몸통 뒤에 그려짐)
export function BackDecorations({ deco }: { deco?: MonsterDecorations }) {
  if (!deco) return null
  const dye = DYE_THEMES[(deco.dye ?? 0) % DYE_THEMES.length]

  return (
    <g>
      {/* 6. 배경 (bg) */}
      {deco.bg === 'night-observatory' && (
        <g opacity={0.9}>
          <circle cx={120} cy={132} r={96} fill="#1E1B4B" opacity={0.16} />
          <circle cx={120} cy={132} r={82} fill="none" stroke="#818CF8" strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55} />
          {/* 초승달 & 별자리 */}
          <path d="M 52 52 A 14 14 0 1 0 68 68 A 11 11 0 1 1 52 52 Z" fill="#FDE047" stroke={INK} strokeWidth={1.8} />
          <path d="M 176 48 L 192 62 L 182 80" fill="none" stroke="#FDE047" strokeWidth={1.4} strokeDasharray="2 2" />
          <circle cx={176} cy={48} r={2.5} fill="#FEF08A" />
          <circle cx={192} cy={62} r={2.2} fill="#FEF08A" />
          <circle cx={182} cy={80} r={2.5} fill="#FEF08A" />
        </g>
      )}
      {deco.bg === 'sunny-meadow' && (
        <g opacity={0.9}>
          <circle cx={120} cy={136} r={92} fill="#DCFCE7" opacity={0.45} />
          <ellipse cx={120} cy={226} rx={84} ry={18} fill="#86EFAC" opacity={0.5} />
          <circle cx={56} cy={64} r={14} fill="#FDE047" opacity={0.7} />
        </g>
      )}

      {/* 7. 이펙트 뒤쪽 궤도 (effect) */}
      {deco.effect === 'constellation-aura' && (
        <g className="mon-twinkle">
          <circle cx={120} cy={136} r={88} fill="none" stroke="#F59E0B" strokeWidth={1.6} strokeDasharray="5 5" opacity={0.65} />
          <ellipse cx={120} cy={142} rx={96} ry={32} fill="none" stroke="#FBBF24" strokeWidth={2} opacity={0.55} transform="rotate(-14 120 142)" />
        </g>
      )}
      {deco.effect === 'aura-galaxy-orbit' && (
        <g className="mon-twinkle">
          {/* 은하수 궤도 타원 2겹 */}
          <ellipse cx={120} cy={138} rx={102} ry={38} fill="none" stroke="#C084FC" strokeWidth={2.4} strokeDasharray="4 6" opacity={0.75} transform="rotate(-18 120 138)" />
          <ellipse cx={120} cy={138} rx={90} ry={30} fill="none" stroke="#F472B6" strokeWidth={1.8} strokeDasharray="6 4" opacity={0.6} transform="rotate(22 120 138)" />
          {/* 뒤편 공전 위성 (미니 마카롱 & 별) */}
          <circle cx={40} cy={118} r={6} fill="#FDE047" opacity={0.8} />
          <circle cx={40} cy={118} r={3} fill="#FFFFFF" />
          <circle cx={198} cy={156} r={5} fill="#67E8F9" opacity={0.85} />
        </g>
      )}

      {/* 4. 등 장식 (back) */}
      {deco.back === 'wings-meringue-angel' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round" className="deco-anim-wings">
          {/* 왼쪽 폭신한 천사 머랭 날개 */}
          <path
            d="M 76 130 C 38 96 12 110 8 138 C 4 162 26 178 52 170 C 64 166 72 156 76 142 Z"
            fill="#FFFDF7"
          />
          <path
            d="M 52 120 C 32 108 20 118 18 136 C 30 142 46 138 58 130 Z"
            fill="#FEE2E2"
            opacity={0.7}
            strokeWidth={0}
          />
          <circle cx={28} cy={132} r={3} fill="#FDE047" strokeWidth={0} />
          <circle cx={44} cy={144} r={2.5} fill="#FDE047" strokeWidth={0} />

          {/* 오른쪽 폭신한 천사 머랭 날개 */}
          <path
            d="M 164 130 C 202 96 228 110 232 138 C 236 162 214 178 188 170 C 176 166 168 156 164 142 Z"
            fill="#FFFDF7"
          />
          <path
            d="M 188 120 C 208 108 220 118 222 136 C 210 142 194 138 182 130 Z"
            fill="#FEE2E2"
            opacity={0.7}
            strokeWidth={0}
          />
          <circle cx={212} cy={132} r={3} fill="#FDE047" strokeWidth={0} />
          <circle cx={196} cy={144} r={2.5} fill="#FDE047" strokeWidth={0} />
        </g>
      )}
      {deco.back === 'meteor-wings' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round" className="deco-anim-wings">
          {/* 왼쪽 유성 날개 */}
          <path d="M 78 134 C 46 112 24 120 20 142 C 18 160 40 170 58 162 C 66 158 72 152 76 146 Z" fill="#E0E7FF" />
          <path d="M 66 142 C 44 130 30 136 28 148 C 40 152 54 150 66 144 Z" fill={dye.gem} opacity={0.55} strokeWidth={0} />
          <path d="M 52 122 L 30 102" stroke="#FBBF24" strokeWidth={2.4} strokeDasharray="3 3" />
          {/* 오른쪽 유성 날개 */}
          <path d="M 162 134 C 194 112 216 120 220 142 C 222 160 200 170 182 162 C 174 158 168 152 164 146 Z" fill="#E0E7FF" />
          <path d="M 174 142 C 196 130 210 136 212 148 C 200 152 186 150 174 144 Z" fill={dye.gem} opacity={0.55} strokeWidth={0} />
          <path d="M 188 122 L 210 102" stroke="#FBBF24" strokeWidth={2.4} strokeDasharray="3 3" />
        </g>
      )}
      {deco.back === 'vintage-leather-satchel' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 가방 바디 */}
          <rect x={76} y={136} width={88} height={64} rx={12} fill="#A0522D" />
          {/* 가방 덮개 플랩 */}
          <path d="M 74 136 L 74 162 C 74 172 166 172 166 162 L 166 136 Z" fill="#8B4513" />
          {/* 좌우 버클 스트랩 */}
          <rect x={92} y={142} width={10} height={34} rx={3} fill="#6D3B17" />
          <rect x={90} y={160} width={14} height={10} rx={2} fill="#FFD700" strokeWidth={1.5} />
          <rect x={138} y={142} width={10} height={34} rx={3} fill="#6D3B17" />
          <rect x={136} y={160} width={14} height={10} rx={2} fill="#FFD700" strokeWidth={1.5} />
          {/* 상단 손잡이 */}
          <path d="M 106 136 C 106 126 134 126 134 136" fill="none" stroke="#6D3B17" strokeWidth={4} />
        </g>
      )}
      {deco.back === 'explorer-pack' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
          <rect x={60} y={142} width={24} height={38} rx={10} fill={dye.sub} />
          <rect x={156} y={142} width={24} height={38} rx={10} fill={dye.sub} />
          <circle cx={72} cy={156} r={5} fill="#FDE047" />
          <circle cx={168} cy={156} r={5} fill="#FDE047" />
        </g>
      )}
    </g>
  )
}

// 앞쪽 장식(머리·얼굴·목·손·앞 이펙트) + 육성 훈장 + 특수 변이 파티클 렌더링
export function FrontDecorations({
  deco,
  medals,
  mutation,
}: {
  deco?: MonsterDecorations
  medals?: MonsterMedals
  mutation?: string | null
}) {
  const dye = DYE_THEMES[(deco?.dye ?? 0) % DYE_THEMES.length]
  const showMedals = medals?.enabled !== false

  return (
    <g>
      {/* 특수 변이 오버레이 효과 (수정 몸 / 그림자 몸 / 황금 몸) */}
      {mutation === 'crystal' && (
        <g opacity={0.85} className="mon-twinkle">
          <polygon points="62,72 70,56 78,72 70,80" fill="#67E8F9" stroke="#0891B2" strokeWidth={1.8} />
          <polygon points="168,84 176,68 184,84 176,92" fill="#A5F3FC" stroke="#0891B2" strokeWidth={1.8} />
          <polygon points="116,162 120,152 124,162 120,170" fill="#CFFAFE" stroke="#06B6D4" strokeWidth={1.5} />
        </g>
      )}
      {mutation === 'shadow' && (
        <g opacity={0.75}>
          <path d="M 64 218 C 56 196 68 182 62 164 C 72 176 76 196 74 218 Z" fill="#4C1D95" />
          <path d="M 176 218 C 184 196 172 182 178 164 C 168 176 164 196 166 218 Z" fill="#4C1D95" />
          <circle cx={68} cy={92} r={4} fill="#C084FC" />
          <circle cx={172} cy={98} r={3.5} fill="#C084FC" />
        </g>
      )}
      {mutation === 'gold' && (
        <g opacity={0.9} className="mon-twinkle">
          <circle cx={120} cy={136} r={80} fill="none" stroke="#FBBF24" strokeWidth={2.5} strokeDasharray="2 8" />
          <path d="M 52 110 l 4 9 l 9 4 l -9 4 l -4 9 l -4 -9 l -9 -4 l 9 -4 Z" fill="#FDE047" stroke="#B45309" strokeWidth={1.2} />
          <path d="M 188 118 l 4 9 l 9 4 l -9 4 l -4 9 l -4 -9 l -9 -4 l 9 -4 Z" fill="#FDE047" stroke="#B45309" strokeWidth={1.2} />
        </g>
      )}

      {/* 육성 훈장 표식 (시련의 탑 별표식 / 보스 토벌 흉터 / 주간 챔피언 왕관) */}
      {showMedals && medals?.towerStar && (
        <path
          d="M 120 80 L 122.8 86 L 129.2 87 L 124.5 91.2 L 125.8 97.5 L 120 94.2 L 114.2 97.5 L 115.5 91.2 L 110.8 87 L 117.2 86 Z"
          fill="#FBBF24"
          stroke="#92400E"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      )}
      {showMedals && medals?.bossScar && (
        <path
          d="M 150 112 L 158 108 L 154 115 L 162 113"
          fill="none"
          stroke="#EF4444"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showMedals && medals?.championCrown && !deco?.head && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <path d="M 102 48 L 105 30 L 114 40 L 120 26 L 126 40 L 135 30 L 138 48 Z" fill="#FDE047" />
          <circle cx={120} cy={24} r={3} fill="#FF8A65" />
        </g>
      )}

      {/* 3. 목 장식 (neck) */}
      {deco?.neck === 'rune-scarf' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
          <path
            d="M 80 144 C 92 153 148 153 160 144 C 165 151 160 161 144 165 C 120 169 92 167 80 158 C 77 152 77 147 80 144 Z"
            fill={dye.sub}
          />
          <path
            d="M 136 158 C 138 174 145 186 149 188 C 154 190 161 188 162 180 C 163 170 159 157 154 150 Z"
            fill={dye.sub}
          />
          <circle cx={98} cy={155} r={2.4} fill="#FEF08A" strokeWidth={0} />
          <circle cx={118} cy={158} r={2.4} fill="#FEF08A" strokeWidth={0} />
          <circle cx={138} cy={155} r={2.4} fill="#FEF08A" strokeWidth={0} />
          <path d="M 148 170 L 154 176 M 154 170 L 148 176" stroke="#FEF08A" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {deco?.neck === 'bell-ribbon' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <path d="M 86 148 Q 120 160 154 148" fill="none" stroke={dye.sub} strokeWidth={6} strokeLinecap="round" />
          <path d="M 120 154 L 102 144 L 104 164 Z" fill={dye.main} />
          <path d="M 120 154 L 138 144 L 136 164 Z" fill={dye.main} />
          <circle cx={120} cy={156} r={7.5} fill="#FBBF24" />
          <path d="M 117 158 H 123" stroke={INK} strokeWidth={2} />
        </g>
      )}
      {deco?.neck === 'pretzel-ribbon' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <path
            d="M 120 162 C 102 148 96 138 106 134 C 114 132 120 142 120 148 C 120 142 126 132 134 134 C 144 138 138 148 120 162 Z"
            fill="none"
            stroke="#B45309"
            strokeWidth={7}
          />
          <circle cx={108} cy={140} r={1.8} fill="#FFFBEB" strokeWidth={0} />
          <circle cx={132} cy={140} r={1.8} fill="#FFFBEB" strokeWidth={0} />
          <circle cx={120} cy={154} r={1.8} fill="#FFFBEB" strokeWidth={0} />
        </g>
      )}

      {deco?.neck === 'chef-coat-tie' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 순백 더블 브레스트 자켓 */}
          <path d="M 82 144 C 82 178 158 178 158 144 Z" fill="#FFFDF9" />
          {/* 라펠 칼라 */}
          <path d="M 88 144 L 108 162 L 120 150 L 132 162 L 152 144" fill="none" stroke="#E2E8F0" strokeWidth={2} />
          {/* 금장 버튼 4개 */}
          <circle cx={104} cy={155} r={2.5} fill="#FFD700" strokeWidth={1} stroke="#B45309" />
          <circle cx={104} cy={166} r={2.5} fill="#FFD700" strokeWidth={1} stroke="#B45309" />
          <circle cx={136} cy={155} r={2.5} fill="#FFD700" strokeWidth={1} stroke="#B45309" />
          <circle cx={136} cy={166} r={2.5} fill="#FFD700" strokeWidth={1} stroke="#B45309" />
          {/* 실크 레드 타이 */}
          <path d="M 116 148 L 124 148 L 126 168 L 120 174 L 114 168 Z" fill="#DC2626" stroke="#991B1B" strokeWidth={1.5} />
        </g>
      )}
      {deco?.neck === 'preppy-school-tie' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 화이트 셔츠 깃 칼라 */}
          <polygon points="104,144 120,154 112,144" fill="#FFFFFF" />
          <polygon points="136,144 120,154 128,144" fill="#FFFFFF" />
          {/* 타탄 리본 타이 */}
          <path d="M 120 152 L 106 145 L 108 160 Z" fill="#1E3A8A" />
          <path d="M 120 152 L 134 145 L 132 160 Z" fill="#1E3A8A" />
          <path d="M 116 156 L 114 172 L 120 170 L 126 172 L 124 156 Z" fill="#DC2626" />
          <circle cx={120} cy={152} r={3.5} fill="#FFD700" stroke="#B45309" strokeWidth={1} />
        </g>
      )}
      {deco?.neck === 'bear-knit-suspenders' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 어깨 멜빵 스트랩 2가닥 */}
          <rect x={92} y={142} width={10} height={38} rx={3} fill="#8D6E63" />
          <rect x={138} y={142} width={10} height={38} rx={3} fill="#8D6E63" />
          <rect x={91} y={168} width={12} height={6} rx={2} fill="#D7CCC8" strokeWidth={1} />
          <rect x={137} y={168} width={12} height={6} rx={2} fill="#D7CCC8" strokeWidth={1} />
          {/* 레드 나비 보타이 */}
          <path d="M 120 148 L 108 142 L 110 156 Z" fill="#E11D48" />
          <path d="M 120 148 L 132 142 L 130 156 Z" fill="#E11D48" />
          {/* 곰돌이 얼굴 센터 */}
          <circle cx={120} cy={148} r={5.5} fill="#FFCC80" stroke="#8D6E63" strokeWidth={1.2} />
          <circle cx={116} cy={144} r={2} fill="#FFCC80" stroke="#8D6E63" strokeWidth={1} />
          <circle cx={124} cy={144} r={2} fill="#FFCC80" stroke="#8D6E63" strokeWidth={1} />
        </g>
      )}
      {deco?.neck === 'sherlock-cape-coat' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 셜록 체크 숄 케이프 망토 */}
          <path d="M 78 142 C 78 176 162 176 162 142 C 140 148 100 148 78 142 Z" fill="#A1887F" />
          <path d="M 94 148 L 146 148" stroke="#5D4037" strokeWidth={2} strokeDasharray="3 3" />
          <path d="M 104 158 L 136 158" stroke="#5D4037" strokeWidth={2} strokeDasharray="3 3" />
          {/* 앤틱 황동 클립 */}
          <rect x={112} y={143} width={16} height={6} rx={2} fill="#FFB300" stroke="#8D6E63" strokeWidth={1.2} />
        </g>
      )}
      {deco?.neck === 'summer-marine-sailor-collar' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 마린 세일러 칼라 */}
          <path d="M 82 140 L 68 168 L 110 166 L 120 148 L 130 166 L 172 168 L 158 140 Z" fill="#1E3A8A" />
          <path d="M 74 162 L 106 161 M 134 161 L 166 162" stroke="#FFFFFF" strokeWidth={2.2} />
          {/* V넥 화이트 셔츠 & 골드 닻 타이 */}
          <polygon points="112,146 120,162 128,146" fill="#FFFFFF" strokeWidth={1.5} />
          <circle cx={120} cy={162} r={3.5} fill="#F59E0B" stroke="#B45309" strokeWidth={1} />
          <path d="M 120 165 L 120 174 M 116 172 Q 120 176 124 172" fill="none" stroke="#F59E0B" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
      {deco?.neck === 'autumn-maple-knit-muffler' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 단풍 버건디 니트 머플러 */}
          <ellipse cx={120} cy={148} rx={38} ry={13} fill="#881337" />
          <path d="M 94 148 Q 120 156 146 148" fill="none" stroke="#BE123C" strokeWidth={2.5} strokeDasharray="3 3" />
          {/* 길게 늘어뜨려진 자락과 술 */}
          <path d="M 124 154 L 138 184 L 152 182 L 136 152 Z" fill="#9F1239" />
          <line x1={138} y1={184} x2={137} y2={191} stroke="#E11D48" strokeWidth={2} strokeLinecap="round" />
          <line x1={143} y1={183} x2={143} y2={191} stroke="#E11D48" strokeWidth={2} strokeLinecap="round" />
          <line x1={148} y1={183} x2={149} y2={190} stroke="#E11D48" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {deco?.neck === 'winter-snow-padded-vest' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 스노우 퐁퐁 패딩 조끼 */}
          <path d="M 80 144 C 76 182 164 182 160 144 C 142 148 98 148 80 144 Z" fill="#F8FAFC" />
          {/* 3단 엠보싱 누빔 라인 */}
          <path d="M 84 154 C 102 160 138 160 156 154" fill="none" stroke="#CBD5E1" strokeWidth={2.4} />
          <path d="M 86 165 C 104 171 136 171 154 165" fill="none" stroke="#CBD5E1" strokeWidth={2.4} />
          {/* 중앙 지퍼 및 은빛 눈꽃 슬라이더 */}
          <line x1={120} y1={145} x2={120} y2={178} stroke="#64748B" strokeWidth={2.2} />
          <circle cx={120} cy={155} r={3} fill="#38BDF8" stroke="#0284C7" strokeWidth={1} />
        </g>
      )}
      {deco?.neck === 'celestial-wizard-robe' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 천상 별자리 마법 로브 */}
          <path d="M 76 142 C 72 186 168 186 164 142 C 142 148 98 148 76 142 Z" fill="#312E81" />
          <path d="M 88 152 Q 120 162 152 152" fill="none" stroke="#FDE047" strokeWidth={2} strokeDasharray="4 4" />
          <circle cx={98} cy={166} r={2.5} fill="#FDE047" strokeWidth={0} />
          <circle cx={142} cy={166} r={2.5} fill="#67E8F9" strokeWidth={0} />
          {/* 중앙 에메랄드 마법석 브로치 */}
          <polygon points="120,146 128,154 120,162 112,154" fill="#10B981" stroke="#F59E0B" strokeWidth={1.8} />
        </g>
      )}
      {deco?.neck === 'moonlight-velvet-choker' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 달빛 벨벳 젬 초커 */}
          <rect x={94} y={145} width={52} height={8} rx={3} fill="#0F172A" />
          <path d="M 120 153 C 124 153 126 157 124 162 C 122 166 120 169 120 169 C 120 169 118 166 116 162 C 114 157 116 153 120 153 Z" fill="#E11D48" stroke="#FFD700" strokeWidth={1.2} />
        </g>
      )}
      {deco?.neck === 'masquerade-tuxedo-bowtie' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 턱시도 실크 윙 보타이 */}
          <polygon points="98,144 120,156 106,144" fill="#FFFFFF" />
          <polygon points="142,144 120,156 134,144" fill="#FFFFFF" />
          {/* 새틴 레드 나비 보타이 */}
          <path d="M 120 152 L 104 144 L 106 162 Z" fill="#DC2626" />
          <path d="M 120 152 L 136 144 L 134 162 Z" fill="#DC2626" />
          <circle cx={120} cy={152} r={3.5} fill="#B91C1C" stroke="#FFD700" strokeWidth={1} />
          {/* 골드 체인 링크 */}
          <path d="M 112 158 Q 120 166 128 158" fill="none" stroke="#F59E0B" strokeWidth={1.5} />
        </g>
      )}
      {deco?.neck === 'birthday-cake-ruffle-collar' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 3단 케이크 크림 프릴 칼라 */}
          <path d="M 76 146 C 78 178 162 178 164 146 C 146 150 94 150 76 146 Z" fill="#FFFDF9" />
          <path d="M 80 154 Q 90 162 100 154 Q 110 162 120 154 Q 130 162 140 154 Q 150 162 160 154" fill="none" stroke="#FBCFE8" strokeWidth={2.2} />
          {/* 슈가 진주 4알 */}
          <circle cx={92} cy={160} r={2.5} fill="#F472B6" strokeWidth={0} />
          <circle cx={110} cy={162} r={2.5} fill="#FDE047" strokeWidth={0} />
          <circle cx={130} cy={162} r={2.5} fill="#67E8F9" strokeWidth={0} />
          <circle cx={148} cy={160} r={2.5} fill="#A78BFA" strokeWidth={0} />
        </g>
      )}

      {/* 2. 얼굴 장식 (face) */}
      {deco?.face === 'masquerade-feather-eyemask' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 로열 무도회 깃털 안경가면 */}
          <path d="M 82 104 C 84 94 116 94 118 108 C 122 94 154 94 158 104 C 158 116 138 122 120 114 C 102 122 82 116 82 104 Z" fill="#581C87" />
          <ellipse cx={100} cy={108} rx={7} ry={4.5} fill="#E0E7FF" fillOpacity={0.4} stroke="#C084FC" strokeWidth={1.5} />
          <ellipse cx={140} cy={108} rx={7} ry={4.5} fill="#E0E7FF" fillOpacity={0.4} stroke="#C084FC" strokeWidth={1.5} />
          {/* 좌측 화려한 공작 깃털 */}
          <path d="M 82 102 C 64 80 58 64 72 58 C 84 56 82 82 84 98 Z" fill="#0D9488" stroke="#10B981" strokeWidth={1.5} />
          <circle cx={72} cy={66} r={3} fill="#FDE047" strokeWidth={0} />
          <circle cx={84} cy={100} r={3.2} fill="#A855F7" stroke="#FFD700" strokeWidth={1.2} />
        </g>
      )}
      {deco?.face === 'party-whistle-blower' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 롤링 파티 피리 */}
          <rect x={114} y={122} width={12} height={8} rx={2} fill="#FDE047" />
          <path d="M 126 126 C 142 124 156 114 158 124 C 160 134 148 136 142 130 C 138 126 142 124 146 128" fill="none" stroke="#EC4899" strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'round-gold-spectacles' && (
        <g>
          {/* 24K 순금테 동글안경 */}
          <circle cx={99} cy={109} r={14.5} fill="#E0F2FE" fillOpacity={0.35} stroke="#FFD700" strokeWidth={3.2} />
          <path d="M 92 101 L 98 107" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={141} cy={109} r={14.5} fill="#E0F2FE" fillOpacity={0.35} stroke="#FFD700" strokeWidth={3.2} />
          <path d="M 134 101 L 140 107" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M 113.5 108 C 117 103 123 103 126.5 108" fill="none" stroke="#FFD700" strokeWidth={3.2} strokeLinecap="round" />
          <path d="M 84.5 109 L 72 110 M 155.5 109 L 168 110" stroke="#B45309" strokeWidth={2.6} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'crystal-monocle' && (
        <g>
          {/* 아케인 크리스탈 모노클 (우측 외알) */}
          <circle cx={141} cy={109} r={15.5} fill="#E0F2FE" fillOpacity={0.4} stroke="#FFD700" strokeWidth={3.5} />
          <path d="M 134 100 L 142 108" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M 141 124.5 Q 152 142 154 162" fill="none" stroke="#FFD700" strokeWidth={1.8} strokeDasharray="2 3" />
          <circle cx={141} cy={109} r={3} fill="#A855F7" opacity={0.6} strokeWidth={0} />
        </g>
      )}
      {deco?.face === 'arcane-rune-mask' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 신비의 룬 하프 가면 */}
          <path d="M 80 100 C 85 88 120 92 120 106 C 120 92 155 88 160 100 C 158 118 135 120 120 114 C 105 120 82 118 80 100 Z" fill="#F1F5F9" />
          <ellipse cx={99} cy={105} rx={8} ry={5} fill="#1E293B" strokeWidth={0} />
          <ellipse cx={141} cy={105} rx={8} ry={5} fill="#1E293B" strokeWidth={0} />
          <path d="M 120 95 L 120 103" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'summer-cool-sunglasses' && (
        <g>
          {/* 틴트 쿨 선글라스 */}
          <circle cx={99} cy={109} r={14.5} fill="#0284C7" fillOpacity={0.65} stroke="#0F172A" strokeWidth={3.2} />
          <path d="M 92 102 L 98 108" stroke="#BAE6FD" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={141} cy={109} r={14.5} fill="#0284C7" fillOpacity={0.65} stroke="#0F172A" strokeWidth={3.2} />
          <path d="M 134 102 L 140 108" stroke="#BAE6FD" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M 113.5 108 C 117 103 123 103 126.5 108" fill="none" stroke="#0F172A" strokeWidth={3.2} strokeLinecap="round" />
          <path d="M 84.5 109 L 72 110 M 155.5 109 L 168 110" stroke="#0F172A" strokeWidth={2.8} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'alchemy-glasses' && (
        <g>
          <circle cx={99} cy={109} r={14} fill="#E0F2FE" fillOpacity={0.38} stroke="#D97706" strokeWidth={3} />
          <path d="M 92 102 L 97 107" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={141} cy={109} r={14} fill="#E0F2FE" fillOpacity={0.38} stroke="#D97706" strokeWidth={3} />
          <path d="M 134 102 L 139 107" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
          <path d="M 113 108 C 117 104 123 104 127 108" fill="none" stroke="#D97706" strokeWidth={3} strokeLinecap="round" />
          <path d="M 85 109 L 72 110 M 155 109 L 168 110" stroke="#92400E" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'sleep-mask' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <rect x={82} y={66} width={76} height={24} rx={12} fill={dye.main} />
          <path d="M 94 78 Q 102 83 110 78 M 130 78 Q 138 83 146 78" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      )}
      {deco?.face === 'star-patch' && (
        <g fill="#FDE047" stroke="#D97706" strokeWidth={1.4}>
          <path d="M 82 120 l 2.5 5 l 5 2 l -5 2 l -2.5 5 l -2.5 -5 l -5 -2 l 5 -2 Z" />
          <path d="M 158 120 l 2.5 5 l 5 2 l -5 2 l -2.5 5 l -2.5 -5 l -5 -2 l 5 -2 Z" />
        </g>
      )}

      {/* 1. 머리 장식 (head) */}
      {deco?.head === 'wizard-hat' && (
        <g stroke={INK} strokeWidth={3} strokeLinejoin="round">
          <path d="M 80 68 C 92 30 108 8 140 2 C 132 18 150 40 158 68 Z" fill={dye.main} />
          <path d="M 114 30 L 116 35 L 121 36 L 117 39 L 118 44 L 114 41 L 110 44 L 111 39 L 107 36 L 112 35 Z" fill="#FDE047" strokeWidth={0} />
          <circle cx={132} cy={20} r={3} fill="#FDE047" strokeWidth={0} />
          <circle cx={98} cy={48} r={2.4} fill="#FDE047" strokeWidth={0} />
          <path d="M 140 2 C 148 0 156 6 158 14" fill="none" stroke={dye.main} strokeWidth={5} strokeLinecap="round" />
          <circle cx={159} cy={17} r={5.5} fill="#F59E0B" stroke={INK} strokeWidth={2} />
          <path d="M 66 69 C 82 60 158 60 174 69 C 176 75 164 80 120 80 C 76 80 64 75 66 69 Z" fill="#FBBF24" />
          <rect x={113} y={63} width={14} height={11} rx={3.5} fill={dye.gem} stroke={INK} strokeWidth={2} />
        </g>
      )}
      {deco?.head === 'berry-beret' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
          <ellipse cx={122} cy={52} rx={44} ry={18} transform="rotate(-6 122 52)" fill={dye.sub} />
          <path d="M 120 34 C 114 24 104 26 108 34 C 114 36 118 36 120 34 Z" fill="#4ADE80" />
          <path d="M 120 34 C 126 24 136 26 132 34 C 126 36 122 36 120 34 Z" fill="#4ADE80" />
          <circle cx={106} cy={50} r={2.2} fill="#FEF08A" strokeWidth={0} />
          <circle cx={124} cy={46} r={2.2} fill="#FEF08A" strokeWidth={0} />
          <circle cx={138} cy={54} r={2.2} fill="#FEF08A" strokeWidth={0} />
        </g>
      )}
      {deco?.head === 'star-crown' && (
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
          <path d="M 94 58 L 96 32 L 110 46 L 120 24 L 130 46 L 144 32 L 146 58 Z" fill="#FBBF24" />
          <circle cx={120} cy={46} r={4.5} fill={dye.gem} strokeWidth={1.8} />
          <circle cx={96} cy={29} r={3} fill="#FEF08A" strokeWidth={1.5} />
          <circle cx={120} cy={21} r={3.5} fill="#FEF08A" strokeWidth={1.5} />
          <circle cx={144} cy={29} r={3} fill="#FEF08A" strokeWidth={1.5} />
        </g>
      )}
      {deco?.head === 'cream-cherry' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 폭신한 생크림 방울 */}
          <path
            d="M 90 60 C 86 48 98 40 106 44 C 110 34 130 34 134 44 C 142 40 154 48 150 60 C 142 64 98 64 90 60 Z"
            fill="#FFFDF9"
          />
          {/* 새빨간 체리 2알과 초록 꼭지 */}
          <path d="M 113 36 C 114 20 124 14 132 10 M 127 36 C 126 22 128 16 132 10" fill="none" stroke="#15803D" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M 132 10 C 140 8 144 14 136 16 Z" fill="#4ADE80" strokeWidth={1.8} />
          <circle cx={112} cy={38} r={8.5} fill="#E11D48" />
          <circle cx={128} cy={38} r={8.5} fill="#F43F5E" />
          <circle cx={109} cy={35} r={2.2} fill="#FFFFFF" strokeWidth={0} />
          <circle cx={125} cy={35} r={2.2} fill="#FFFFFF" strokeWidth={0} />
        </g>
      )}
      {deco?.head === 'birthday-candle' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <ellipse cx={120} cy={58} rx={22} ry={8} fill="#FFFDF9" />
          <rect x={114} y={28} width={12} height={28} rx={4} fill="#FF8A9E" />
          <path d="M 114 36 L 126 42 M 114 46 L 126 52" stroke="#FFFFFF" strokeWidth={2.4} />
          <path d="M 120 10 C 127 18 127 25 120 27 C 113 25 113 18 120 10 Z" fill="#FDE047" stroke="#D97706" strokeWidth={2} />
          <circle cx={120} cy={21} r={3} fill="#FF7A59" strokeWidth={0} />
        </g>
      )}
      {deco?.head === 'crown-emoji-floating' && (
        <g className="mon-twinkle deco-anim-crown">
          {/* 황금 미니 티아라 베이스 */}
          <path d="M 104 46 L 108 28 L 115 36 L 120 22 L 125 36 L 132 28 L 136 46 Z" fill="#FDE047" stroke="#B45309" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={120} cy={22} r={3} fill="#F43F5E" />
          {/* 머리 위로 떠오르는 감정 이모티콘 (하트, 별, 음표) */}
          {/* 하트 */}
          <path d="M 94 22 C 90 14 96 8 102 14 C 108 8 114 14 110 22 C 106 28 102 30 102 30 C 102 30 98 28 94 22 Z" fill="#EC4899" opacity={0.9} />
          {/* 별빛 */}
          <path d="M 138 18 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" fill="#FBBF24" opacity={0.9} />
          {/* 미니 음표 */}
          <circle cx={124} cy={10} r={2.5} fill="#38BDF8" />
          <path d="M 126 10 L 126 3 L 132 5" fill="none" stroke="#38BDF8" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
      {deco?.head === 'spring-cherry-blossom-beret' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 살랑살랑 벚꽃잎 핑크 울 베레모 */}
          <ellipse cx={124} cy={50} rx={42} ry={16} transform="rotate(-6 124 50)" fill="#FBCFE8" />
          <ellipse cx={124} cy={48} rx={36} ry={12} transform="rotate(-6 124 48)" fill="#F472B6" opacity={0.3} strokeWidth={0} />
          {/* 벚꽃잎 5엽 꽃송이 & 펄 진주 핀 */}
          <circle cx={104} cy={44} r={4.5} fill="#FFFDF9" stroke="#E2E8F0" strokeWidth={1.5} />
          <path d="M 112 40 C 114 34 122 34 124 40 C 122 46 114 46 112 40 Z" fill="#F472B6" strokeWidth={1.2} />
          <path d="M 124 38 C 130 36 134 42 128 46 C 122 46 122 40 124 38 Z" fill="#FDA4AF" strokeWidth={1.2} />
        </g>
      )}
      {deco?.head === 'winter-fluffy-earmuffs' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 보송보송 눈꽃 털 귀마개 아치 밴드 */}
          <path d="M 82 72 C 84 32 156 32 158 72" fill="none" stroke="#64748B" strokeWidth={4} strokeLinecap="round" />
          {/* 양옆 폭신한 화이트 퍼(Fur) 폼폼 볼 */}
          <circle cx={78} cy={74} r={15} fill="#F8FAFC" />
          <circle cx={78} cy={74} r={8} fill="#E2E8F0" opacity={0.6} strokeWidth={0} />
          <path d="M 78 70 L 78 78 M 74 74 L 82 74" stroke="#38BDF8" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={162} cy={74} r={15} fill="#F8FAFC" />
          <circle cx={162} cy={74} r={8} fill="#E2E8F0" opacity={0.6} strokeWidth={0} />
          <path d="M 162 70 L 162 78 M 158 74 L 166 74" stroke="#38BDF8" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
      {deco?.head === 'astral-sorcerer-hood' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          {/* 별빛 소서러 후드 */}
          <path d="M 70 70 C 72 20 168 20 170 70 C 154 62 140 68 120 66 C 100 68 86 62 70 70 Z" fill="#1E1B4B" />
          <path d="M 94 48 C 104 38 136 38 146 48" fill="none" stroke="#FDE047" strokeWidth={2} strokeDasharray="3 3" />
          {/* 황금 초승달 펜던트 */}
          <path d="M 120 30 C 124 30 126 34 124 38 C 122 36 118 36 116 38 C 114 34 116 30 120 30 Z" fill="#FBBF24" stroke="#B45309" strokeWidth={1} />
        </g>
      )}
      {deco?.head === 'fairy-sugar-winged-circlet' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          {/* 요정의 슈가 윙 서클릿 */}
          <path d="M 88 56 Q 120 62 152 56" fill="none" stroke="#FFD700" strokeWidth={3} strokeLinecap="round" />
          <circle cx={120} cy={59} r={4.5} fill="#10B981" stroke="#FFD700" strokeWidth={1.2} />
          {/* 좌우 요정 날개 귀 장식 */}
          <path d="M 86 54 C 62 38 52 52 68 64 C 76 58 84 56 86 54 Z" fill="#E0F2FE" fillOpacity={0.65} stroke="#38BDF8" strokeWidth={1.8} />
          <path d="M 154 54 C 178 38 188 52 172 64 C 164 58 156 56 154 54 Z" fill="#E0F2FE" fillOpacity={0.65} stroke="#38BDF8" strokeWidth={1.8} />
        </g>
      )}
      {deco?.head === 'party-confetti-cone-hat' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 축하 폭죽 꼬깔모자 */}
          <polygon points="120,24 94,68 146,68" fill="#F43F5E" />
          {/* 스트라이프 & 스프링클 */}
          <path d="M 102,54 L 138,54" stroke="#FDE047" strokeWidth={3} />
          <circle cx={112} cy={42} r={2.5} fill="#67E8F9" strokeWidth={0} />
          <circle cx={128} cy={44} r={2.5} fill="#A78BFA" strokeWidth={0} />
          {/* 꼭대기 폼폼 털방울 */}
          <circle cx={120} cy={22} r={5} fill="#FEF08A" stroke="#F59E0B" strokeWidth={1.5} />
        </g>
      )}
      {deco?.head === 'champagne-cork-topper' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          {/* 샴페인 버블 실크햇 */}
          <ellipse cx={120} cy={66} rx={36} ry={12} fill="#1E293B" />
          <path d="M 96 64 L 100 36 L 140 36 L 144 64 Z" fill="#D97706" />
          <ellipse cx={120} cy={36} rx={20} ry={7} fill="#B45309" />
          {/* 골드 리본 밴드 */}
          <rect x={98} y={54} width={44} height={7} rx={1} fill="#FFD700" strokeWidth={1} />
          {/* 퐁퐁 솟아오르는 탄산 기포 */}
          <circle cx={138} cy={22} r={3.5} fill="#FEF08A" opacity={0.8} strokeWidth={0} />
          <circle cx={146} cy={12} r={2.5} fill="#FEF08A" opacity={0.6} strokeWidth={0} />
        </g>
      )}

      {/* 5. 손 장식 (hand) */}
      {deco?.hand === 'sparkler-party-firework' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 챠르릉 축제 스파클러 */}
          <line x1={54} y1={134} x2={66} y2={204} stroke="#94A3B8" strokeWidth={3.5} strokeLinecap="round" />
          {/* 스파클 코어 & 불꽃 파티클 */}
          <circle cx={54} cy={134} r={5} fill="#FEF08A" stroke="#F59E0B" strokeWidth={1.5} />
          <path d="M 54 118 L 54 126 M 54 142 L 54 150 M 42 134 L 50 134 M 58 134 L 66 134" stroke="#FBBF24" strokeWidth={2} strokeLinecap="round" />
          <path d="M 45 125 L 50 130 M 58 138 L 63 143 M 63 125 L 58 130 M 50 138 L 45 143" stroke="#F43F5E" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
      {deco?.hand === 'royal-party-champagne-glass' && (
        <g stroke={INK} strokeWidth={2.2} strokeLinejoin="round" className="deco-anim-hand">
          {/* 골드 버블 샴페인 글라스 */}
          <path d="M 46 132 L 62 132 L 58 154 C 58 158 50 158 50 154 Z" fill="#FEF08A" fillOpacity={0.65} stroke="#E2E8F0" strokeWidth={1.8} />
          <line x1={54} y1={157} x2={54} y2={178} stroke="#CBD5E1" strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={54} cy={178} rx={10} ry={3.5} fill="#E2E8F0" strokeWidth={1.5} />
          {/* 림에 꽂힌 미니 핑크 마카롱 */}
          <ellipse cx={46} cy={132} rx={4.5} ry={3} fill="#F472B6" strokeWidth={1} />
        </g>
      )}
      {deco?.hand === 'arcane-sugar-grimoire' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 아케인 슈가 마도서 (공중 부양) */}
          <rect x={36} y={130} width={34} height={44} rx={4} fill="#4C1D95" />
          <rect x={40} y={134} width={26} height={36} rx={2} fill="#5B21B6" strokeWidth={1} />
          <path d="M 36 130 L 44 126 L 74 126 L 70 130 Z" fill="#FDE047" strokeWidth={1} />
          {/* 중앙 마법 룬 보석 */}
          <polygon points="53,146 59,152 53,158 47,152" fill="#F43F5E" stroke="#FFD700" strokeWidth={1.4} />
        </g>
      )}
      {deco?.hand === 'celestial-meteor-staff' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 유성 소환 별빛 셉터 */}
          <line x1={56} y1={120} x2={66} y2={212} stroke="#FFD700" strokeWidth={4.5} strokeLinecap="round" />
          {/* 천체 궤도 링 */}
          <ellipse cx={54} cy={118} rx={16} ry={7} fill="none" stroke="#67E8F9" strokeWidth={2} transform="rotate(-25 54 118)" />
          {/* 꼭대기 황금 별 */}
          <path d="M 54 104 L 56 112 L 64 114 L 58 119 L 60 127 L 54 122 L 48 127 L 50 119 L 44 114 L 52 112 Z" fill="#FBBF24" stroke="#B45309" strokeWidth={1.5} />
        </g>
      )}
      {deco?.hand === 'spring-picnic-basket' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 라탄 바구니 아치 손잡이 */}
          <path d="M 40 142 C 40 122 68 122 68 142" fill="none" stroke="#8D6E63" strokeWidth={3.5} strokeLinecap="round" />
          {/* 라탄 바구니 본체 */}
          <rect x={36} y={142} width={36} height={26} rx={4} fill="#D7CCC8" />
          <line x1={36} y1={150} x2={72} y2={150} stroke="#A1887F" strokeWidth={1.5} />
          <line x1={36} y1={158} x2={72} y2={158} stroke="#A1887F" strokeWidth={1.5} />
          {/* 깅엄 체크 천 덮개 */}
          <path d="M 34 142 C 42 146 66 146 74 142 L 72 148 L 36 148 Z" fill="#EF4444" />
          {/* 딸기 토핑 */}
          <circle cx={54} cy={138} r={5} fill="#E11D48" strokeWidth={1} />
          <polygon points="52,134 54,131 56,134" fill="#22C55E" strokeWidth={0} />
        </g>
      )}
      {deco?.hand === 'autumn-artist-palette' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 가을 감성 우드 팔레트 */}
          <path d="M 36 146 C 36 128 72 128 74 150 C 76 168 44 172 38 160 C 34 152 36 146 36 146 Z" fill="#D7CCC8" />
          <circle cx={44} cy={158} r={3.5} fill="#4E342E" strokeWidth={1} />
          {/* 4색 단풍 물감 팟 */}
          <circle cx={46} cy={138} r={3.2} fill="#DC2626" strokeWidth={0} />
          <circle cx={56} cy={136} r={3.2} fill="#F59E0B" strokeWidth={0} />
          <circle cx={66} cy={142} r={3.2} fill="#D97706" strokeWidth={0} />
          <circle cx={68} cy={154} r={3.2} fill="#78350F" strokeWidth={0} />
          {/* 세필 붓 */}
          <line x1={32} y1={130} x2={62} y2={164} stroke="#8D6E63" strokeWidth={3} strokeLinecap="round" />
          <path d="M 32 130 L 28 126" stroke="#DC2626" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      )}
      {deco?.hand === 'lantern-staff' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round" className="deco-anim-hand">
          <path d="M 56 106 L 58 214" stroke="#78350F" strokeWidth={5} strokeLinecap="round" />
          <path d="M 56 108 C 54 92 40 90 38 98 C 36 106 42 114 46 116" fill="none" stroke="#92400E" strokeWidth={4} strokeLinecap="round" />
          <line x1={40} y1={102} x2={40} y2={112} stroke="#D97706" strokeWidth={2.2} />
          <rect x={31} y={112} width={18} height={24} rx={5} fill="#FEF3C7" stroke="#92400E" strokeWidth={2.4} />
          <circle cx={40} cy={124} r={5.5} fill="#F59E0B" strokeWidth={0} />
          <path d="M 29 112 H 51 M 30 136 H 50" stroke="#78350F" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {deco?.hand === 'star-wand' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round" className="deco-anim-hand">
          <line x1={58} y1={134} x2={68} y2={204} stroke={dye.sub} strokeWidth={4.5} strokeLinecap="round" />
          <path
            d="M 56 116 L 60 125 L 70 126 L 62 132 L 65 142 L 56 136 L 47 142 L 50 132 L 42 126 L 52 125 Z"
            fill="#FDE047"
          />
          <circle cx={56} cy={130} r={3.5} fill={dye.gem} strokeWidth={1.5} />
        </g>
      )}
      {deco?.hand === 'tiny-wood-rollingpin' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 달콤 반죽 미니 밀대 */}
          <line x1={42} y1={120} x2={78} y2={186} stroke="#D7CCC8" strokeWidth={5} strokeLinecap="round" />
          <line x1={48} y1={130} x2={72} y2={174} stroke="#FFE0B2" strokeWidth={11} strokeLinecap="round" />
          <circle cx={60} cy={152} r={3} fill="#E11D48" strokeWidth={0} />
        </g>
      )}
      {deco?.hand === 'bubble-detective-magnifier' && (
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" className="deco-anim-hand">
          {/* 황금 버블 돋보기 */}
          <line x1={54} y1={148} x2={66} y2={196} stroke="#B45309" strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={50} cy={134} r={14} fill="#E0F2FE" fillOpacity={0.4} stroke="#FFD700" strokeWidth={3.5} />
          <path d="M 44 128 L 50 134" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
          {/* 무지개 비눗방울 */}
          <circle cx={34} cy={120} r={4.5} fill="#F472B6" fillOpacity={0.65} stroke="#FFFFFF" strokeWidth={1} />
          <circle cx={66} cy={122} r={3.5} fill="#60A5FA" fillOpacity={0.65} stroke="#FFFFFF" strokeWidth={1} />
        </g>
      )}
      {deco?.hand === 'lollipop-wand' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round" className="deco-anim-hand">
          <line x1={58} y1={138} x2={68} y2={204} stroke="#FFFDF9" strokeWidth={5} strokeLinecap="round" />
          <circle cx={56} cy={126} r={16} fill="#FF8A9E" />
          <path d="M 56 126 C 52 122 56 116 62 120 C 68 124 62 136 52 134 C 42 132 44 116 56 114" fill="none" stroke="#FFFDF9" strokeWidth={3.2} strokeLinecap="round" />
        </g>
      )}

      {/* 7. 앞쪽 이펙트 (effect) */}
      {deco?.effect === 'constellation-aura' && (
        <g fill="#F59E0B" className="mon-twinkle deco-anim-aura">
          <path d="M 32 74 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 l 8 -3.5 Z" />
          <path d="M 206 78 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 l 8 -3.5 Z" />
          <circle cx={42} cy={186} r={3} fill="#A78BFA" />
          <circle cx={198} cy={182} r={3.5} fill="#34D399" />
        </g>
      )}
      {deco?.effect === 'blossom-breeze' && (
        <g fill="#F472B6" opacity={0.88} className="mon-twinkle deco-anim-aura">
          <ellipse cx={42} cy={82} rx={6} ry={3.5} transform="rotate(-30 42 82)" />
          <ellipse cx={196} cy={72} rx={6.5} ry={3.8} transform="rotate(25 196 72)" />
          <ellipse cx={36} cy={162} rx={5.5} ry={3.2} transform="rotate(40 36 162)" />
          <ellipse cx={202} cy={156} rx={6} ry={3.5} transform="rotate(-20 202 156)" />
        </g>
      )}
      {deco?.effect === 'aura-galaxy-orbit' && (
        <g className="mon-twinkle deco-anim-aura">
          {/* 앞쪽을 가로지르는 은하수 펄과 공전 마카롱 */}
          <circle cx={202} cy={122} r={7} fill="#F472B6" stroke="#FFFFFF" strokeWidth={1.5} />
          <circle cx={202} cy={122} r={3.5} fill="#FDE047" />
          <path d="M 48 168 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" fill="#FDE047" />
          <circle cx={88} cy={186} r={4} fill="#C084FC" opacity={0.85} />
          <circle cx={152} cy={182} r={3} fill="#67E8F9" opacity={0.9} />
        </g>
      )}
      {deco?.effect === 'footprint-honey-dew' && (
        <g className="mon-twinkle deco-anim-aura">
          {/* 발밑 주변에 몽실몽실 떠오르는 달콤한 꿀물 방울 & 벚꽃 슈가 파우더 */}
          {/* 꿀물 방울 */}
          <circle cx={84} cy={218} r={5.5} fill="#F59E0B" opacity={0.8} />
          <circle cx={82} cy={216} r={2} fill="#FFFBEB" />
          <circle cx={156} cy={220} r={6} fill="#F59E0B" opacity={0.8} />
          <circle cx={154} cy={218} r={2} fill="#FFFBEB" />
          <circle cx={120} cy={228} r={4.5} fill="#FBBF24" opacity={0.85} />
          {/* 슈가 벚꽃잎 & 펄 */}
          <ellipse cx={68} cy={222} rx={4} ry={2.5} fill="#F472B6" opacity={0.7} transform="rotate(25 68 222)" />
          <ellipse cx={172} cy={224} rx={4} ry={2.5} fill="#F472B6" opacity={0.7} transform="rotate(-20 172 224)" />
        </g>
      )}
    </g>
  )
}
