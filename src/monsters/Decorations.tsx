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
  // 2. 얼굴 (face)
  { id: 'alchemy-glasses', slot: 'face', name: '연금술 동글안경', rarity: 'rare', charm: 20, icon: '👓', desc: '지적인 매력을 더해주는 황금 테 안경' },
  { id: 'sleep-mask', slot: 'face', name: '포근 수면안대', rarity: 'common', charm: 10, icon: '💤', desc: '이마에 살짝 얹은 구름결 수면안대' },
  { id: 'star-patch', slot: 'face', name: '유성 볼 스티커', rarity: 'rare', charm: 18, icon: '🌟', desc: '양볼에 붙이는 반짝이는 별빛 페인팅' },
  // 3. 목 (neck)
  { id: 'pretzel-ribbon', slot: 'neck', name: '솔티드 프레첼 리본', rarity: 'rare', charm: 20, icon: '🥨', desc: '노릇하게 구운 하트 모양 프레첼 과자 장식' },
  { id: 'rune-scarf', slot: 'neck', name: '룬 무늬 머플러', rarity: 'rare', charm: 18, icon: '🧣', desc: '고대 룬 문양이 수놓아진 따뜻한 목도리' },
  { id: 'bell-ribbon', slot: 'neck', name: '별방울 리본', rarity: 'common', charm: 12, icon: '🎀', desc: '움직일 때마다 딸랑거리는 금방울 리본' },
  // 4. 등 (back)
  { id: 'meteor-wings', slot: 'back', name: '유성 날개 망토', rarity: 'legendary', charm: 32, icon: '🪽', desc: '별똥별 궤적이 흐르는 반투명 천사 날개' },
  { id: 'wings-meringue-angel', slot: 'back', name: '천사 머랭 날개', rarity: 'legendary', charm: 45, icon: '🪽', desc: '바삭하고 폭신한 순백의 슈가 머랭 깃털 날개' },
  { id: 'explorer-pack', slot: 'back', name: '탐험가 미니 배낭', rarity: 'common', charm: 14, icon: '🎒', desc: '나침반과 지도가 든 작은 가죽 배낭' },
  // 5. 손 (hand)
  { id: 'lollipop-wand', slot: 'hand', name: '롤리팝 캔디봉', rarity: 'rare', charm: 26, icon: '🍭', desc: '달콤한 파스텔 소용돌이 막대사탕' },
  { id: 'lantern-staff', slot: 'hand', name: '별빛 등불 지팡이', rarity: 'legendary', charm: 40, icon: '🏮', desc: '따스한 별빛을 비추는 마법 나무 지팡이' },
  { id: 'star-wand', slot: 'hand', name: '요술 별봉', rarity: 'rare', charm: 22, icon: '🪄', desc: '휘두르면 반짝이가 퍼지는 황금 요술봉' },
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
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
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
        <g stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
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

      {/* 2. 얼굴 장식 (face) */}
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
        <g className="mon-twinkle">
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

      {/* 5. 손 장식 (hand) */}
      {deco?.hand === 'lantern-staff' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <path d="M 56 106 L 58 214" stroke="#78350F" strokeWidth={5} strokeLinecap="round" />
          <path d="M 56 108 C 54 92 40 90 38 98 C 36 106 42 114 46 116" fill="none" stroke="#92400E" strokeWidth={4} strokeLinecap="round" />
          <line x1={40} y1={102} x2={40} y2={112} stroke="#D97706" strokeWidth={2.2} />
          <rect x={31} y={112} width={18} height={24} rx={5} fill="#FEF3C7" stroke="#92400E" strokeWidth={2.4} />
          <circle cx={40} cy={124} r={5.5} fill="#F59E0B" strokeWidth={0} />
          <path d="M 29 112 H 51 M 30 136 H 50" stroke="#78350F" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {deco?.hand === 'star-wand' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <line x1={58} y1={134} x2={68} y2={204} stroke={dye.sub} strokeWidth={4.5} strokeLinecap="round" />
          <path
            d="M 56 116 L 60 125 L 70 126 L 62 132 L 65 142 L 56 136 L 47 142 L 50 132 L 42 126 L 52 125 Z"
            fill="#FDE047"
          />
          <circle cx={56} cy={130} r={3.5} fill={dye.gem} strokeWidth={1.5} />
        </g>
      )}
      {deco?.hand === 'lollipop-wand' && (
        <g stroke={INK} strokeWidth={2.6} strokeLinejoin="round">
          <line x1={58} y1={138} x2={68} y2={204} stroke="#FFFDF9" strokeWidth={5} strokeLinecap="round" />
          <circle cx={56} cy={126} r={16} fill="#FF8A9E" />
          <path d="M 56 126 C 52 122 56 116 62 120 C 68 124 62 136 52 134 C 42 132 44 116 56 114" fill="none" stroke="#FFFDF9" strokeWidth={3.2} strokeLinecap="round" />
        </g>
      )}

      {/* 7. 앞쪽 이펙트 (effect) */}
      {deco?.effect === 'constellation-aura' && (
        <g fill="#F59E0B" className="mon-twinkle">
          <path d="M 32 74 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 l 8 -3.5 Z" />
          <path d="M 206 78 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 l 8 -3.5 Z" />
          <circle cx={42} cy={186} r={3} fill="#A78BFA" />
          <circle cx={198} cy={182} r={3.5} fill="#34D399" />
        </g>
      )}
      {deco?.effect === 'blossom-breeze' && (
        <g fill="#F472B6" opacity={0.88} className="mon-twinkle">
          <ellipse cx={42} cy={82} rx={6} ry={3.5} transform="rotate(-30 42 82)" />
          <ellipse cx={196} cy={72} rx={6.5} ry={3.8} transform="rotate(25 196 72)" />
          <ellipse cx={36} cy={162} rx={5.5} ry={3.2} transform="rotate(40 36 162)" />
          <ellipse cx={202} cy={156} rx={6} ry={3.5} transform="rotate(-20 202 156)" />
        </g>
      )}
      {deco?.effect === 'aura-galaxy-orbit' && (
        <g className="mon-twinkle">
          {/* 앞쪽을 가로지르는 은하수 펄과 공전 마카롱 */}
          <circle cx={202} cy={122} r={7} fill="#F472B6" stroke="#FFFFFF" strokeWidth={1.5} />
          <circle cx={202} cy={122} r={3.5} fill="#FDE047" />
          <path d="M 48 168 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" fill="#FDE047" />
          <circle cx={88} cy={186} r={4} fill="#C084FC" opacity={0.85} />
          <circle cx={152} cy={182} r={3} fill="#67E8F9" opacity={0.9} />
        </g>
      )}
      {deco?.effect === 'footprint-honey-dew' && (
        <g className="mon-twinkle">
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
