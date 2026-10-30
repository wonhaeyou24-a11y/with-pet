// ✨ Stitch MCP 디자인 시스템 기반: 디저트 몬스터 비주얼 에셋 쇼룸
// - 몬스터 5종, 황금 페이스트리 보물상자, 5대 훈련 도구, 부티크 가구 5종, 4계절 광장 데코 전시
// - 100% 한국어, Zero-Crash 무결성 예외 처리, ASMR 사운드 즉시 인터랙션

import { useState } from 'react'
import { BOUTIQUE_FASHION_ITEMS, ROOM_FURNITURE_CATALOG } from '../config/boutique'
import { PLAZA_THEMES, type PlazaThemeId } from './DessertPlaza'
import { playDessertAsmr, type DessertSoundKind } from '../lib/sound'

interface Props {
  onClose: () => void
  onNavigateToBoutique?: () => void
}

type TabKey = 'monsters' | 'chest' | 'training' | 'furniture' | 'plaza'

interface ShowcaseMonster {
  id: string
  name: string
  type: string
  element: string
  color: string
  icon: string
  desc: string
  asmr: DessertSoundKind
  signatureSkill: string
}

const SHOWCASE_MONSTERS: ShowcaseMonster[] = [
  {
    id: 'dubai-chewy',
    name: '두바이쫀득이',
    type: '피스타치오 초콜릿',
    element: '땅',
    color: '#8D6E63',
    icon: '🍫✨',
    desc: '바삭바삭 볶은 카다이프면과 고소한 피스타치오 페이스트가 가득 든 시그니처 쫀득 디저트 몬스터',
    asmr: 'kataifi-crunch',
    signatureSkill: '골든 카다이프 크런치 블래스트',
  },
  {
    id: 'kadaif-king',
    name: '카다이프킹',
    type: '로열 페이스트리',
    element: '땅',
    color: '#D7CCC8',
    icon: '👑🌰',
    desc: '황금빛으로 노릇하게 구워진 카다이프 왕관을 쓴 든든하고 위엄 넘치는 디저트 타워의 지배자',
    asmr: 'cookie-crisp',
    signatureSkill: '황금 왕관 바게트 브레이크',
  },
  {
    id: 'macaron-bear',
    name: '마카롱베어',
    type: '달콤 베리 마카롱',
    element: '바람',
    color: '#F8BBD0',
    icon: '🐻🍬',
    desc: '두 장의 푹신한 아몬드 꼬끄 사이에 상큼한 라즈베리 가나슈 필링이 듬뿍 들어간 귀여운 곰돌이',
    asmr: 'mochi-squish',
    signatureSkill: '아몬드 꼬끄 토네이도',
  },
  {
    id: 'pudding-cat',
    name: '푸딩캣',
    type: '탱글 커스터드',
    element: '물',
    color: '#FFF9C4',
    icon: '🐱🍮',
    desc: '쌉싸름한 흑설탕 캬라멜 시럽이 얹힌 말랑말랑 커스터드 푸딩. 건드리면 푸딩젤리가 찰랑거립니다.',
    asmr: 'pudding-jiggle',
    signatureSkill: '탱글 캬라멜 스플래시',
  },
  {
    id: 'jelly-dragon',
    name: '젤리드래곤',
    type: '스파클링 소다 젤리',
    element: '빛',
    color: '#B3E5FC',
    icon: '🐉💎',
    desc: '톡톡 터지는 탄산 소다 시럽과 보석 젤리 비늘을 품고 하늘을 누비는 전설의 디저트 드래곤',
    asmr: 'soda-fizz',
    signatureSkill: '소다 버블 하이퍼 캐논',
  },
]

interface TrainingTool {
  id: string
  name: string
  category: string
  icon: string
  bg: string
  desc: string
  sound: DessertSoundKind
  stat: string
}

const SHOWCASE_TRAINING_TOOLS: TrainingTool[] = [
  {
    id: 'sugar-dumbbell',
    name: '골든 슈가 덤벨',
    category: '근력 단련',
    icon: '🏋️🍬',
    bg: 'linear-gradient(135deg, #FF9800, #F57C00)',
    desc: '사탕 결정 바벨과 크런치 추로 이루어진 고강도 파티세리 단련 기구. 공격력 대폭 상승!',
    sound: 'kataifi-crunch',
    stat: '공격 +2 (매섭고 단단한 타격)',
  },
  {
    id: 'cocoa-sandbag',
    name: '카카오 샌드백',
    category: '방어 코팅',
    icon: '🥊🍫',
    bg: 'linear-gradient(135deg, #795548, #4E342E)',
    desc: '다크 초콜릿 셸을 거칠게 연마하여 외부 충격을 부드럽게 흡수하는 특수 방어 훈련 도구',
    sound: 'choco-melt',
    stat: '방어 +2 (슈가 쉴드 내구도)',
  },
  {
    id: 'golden-whisk',
    name: '황금 거품기',
    category: '민첩 스피드',
    icon: '⚡🥄',
    bg: 'linear-gradient(135deg, #FFCA28, #FFA000)',
    desc: '초당 300회 회전하며 푹신한 머랭을 올리는 파티세리 스피드 단련 도구. 이동속도와 회피율 상승!',
    sound: 'cookie-crisp',
    stat: '속도 +2 (초고속 머랭 대시)',
  },
  {
    id: 'starlight-grimoire',
    name: '별빛 레시피 마도서',
    category: '마법 지능',
    icon: '📖✨',
    bg: 'linear-gradient(135deg, #AB47BC, #7B1FA2)',
    desc: '전설의 파티시에가 남긴 마법 룬 레시피가 적힌 비전서. 디저트 마력과 힐링 효과 증폭!',
    sound: 'starlight-ting',
    stat: '지능 +2 (스킬 쿨다운 감소)',
  },
  {
    id: 'jelly-trampoline',
    name: '마시멜로 트램펄린',
    category: '활력 체력',
    icon: '🎪🧁',
    bg: 'linear-gradient(135deg, #EC407A, #C2185B)',
    desc: '탱글탱글한 거대 딸기 마시멜로 시트 위에서 점프하며 펫의 기초 체력과 지구력을 증진합니다.',
    sound: 'mochi-squish',
    stat: '체력 +2 (최대 HP 증가)',
  },
]

export default function DessertShowroomModal({ onClose, onNavigateToBoutique }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('monsters')
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null)
  const [interactNotice, setInteractNotice] = useState<string | null>(null)

  const handlePlayAssetSound = (name: string, sound: DessertSoundKind, msg: string) => {
    try {
      playDessertAsmr(sound)
      setSelectedItemName(name)
      setInteractNotice(msg)
      window.setTimeout(() => setInteractNotice(null), 2500)
    } catch {
      // Zero-Crash 방어
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(30, 20, 20, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        userSelect: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '90dvh',
          background: '#FFFDF9',
          borderRadius: 24,
          border: '2px solid #FFD54F',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 */}
        <div
          style={{
            padding: '14px 16px 10px',
            background: 'linear-gradient(180deg, #FFF8E1 0%, #FFECB3 100%)',
            borderBottom: '1px solid #FFE082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#4E342E' }}>
                Stitch 디저트 비주얼 쇼룸
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#8D6E63' }}>
                3D 클레이 아트 & 고품질 디저트 비주얼 키트
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #D7CCC8',
              background: '#FFFFFF',
              color: '#5D4037',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. 인터랙션 알림 배너 */}
        {interactNotice && (
          <div
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(90deg, #FF6F00, #FFA000)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(255,111,0,0.3)',
              animation: 'pulseGlow 1s infinite alternate',
            }}
          >
            🔊 {interactNotice}
          </div>
        )}

        {/* 3. 상단 카테고리 탭 (5종) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            gap: 4,
            background: '#F5F5F5',
            borderBottom: '1px solid #EEEEEE',
            overflowX: 'auto',
          }}
        >
          {(
            [
              { key: 'monsters', label: '몬스터', icon: '🍰' },
              { key: 'chest', label: '보물상자·장식', icon: '🎁' },
              { key: 'training', label: '5대 훈련도구', icon: '🏋️' },
              { key: 'furniture', label: '부티크 가구', icon: '🛋️' },
              { key: 'plaza', label: '4계절 광장', icon: '🍁' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key)
                playDessertAsmr('sugar-crack')
              }}
              style={{
                flex: '0 0 auto',
                padding: '6px 10px',
                borderRadius: 12,
                border: activeTab === t.key ? '1.5px solid #FFA000' : '1px solid transparent',
                background: activeTab === t.key ? '#FFFFFF' : 'transparent',
                color: activeTab === t.key ? '#E65100' : '#757575',
                fontSize: 11,
                fontWeight: activeTab === t.key ? 900 : 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: activeTab === t.key ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 4. 탭 콘텐츠 영역 (스크롤 가능) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* ======================================================== */}
          {/* [1. 몬스터 컬렉션] */}
          {/* ======================================================== */}
          {activeTab === 'monsters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D4C41' }}>
                🌟 Stitch 3D 클레이 스타일 디저트 몬스터 (터치 시 고유 사운드)
              </div>
              {SHOWCASE_MONSTERS.map((m) => {
                const isSelected = selectedItemName === m.name
                return (
                  <div
                    key={m.id}
                    onClick={() =>
                      handlePlayAssetSound(
                        m.name,
                        m.asmr,
                        `${m.name}의 ${m.signatureSkill} 시전 사운드 재생!`,
                      )
                    }
                    style={{
                      padding: 10,
                      borderRadius: 16,
                      background: isSelected ? '#FFF8E1' : '#FFFFFF',
                      border: isSelected ? '2px solid #FFB300' : '1.5px solid #F0EAE1',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        background: m.color,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 26,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        flexShrink: 0,
                      }}
                    >
                      {m.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#3E2723' }}>
                          {m.name}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: '#ECEFF1',
                            color: '#455A64',
                          }}
                        >
                          {m.type}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#795548',
                          lineHeight: 1.35,
                          marginBottom: 4,
                        }}
                      >
                        {m.desc}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#D84315' }}>
                        ⚡ 시그니처: {m.signatureSkill}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* [2. 보물상자 & 특별 장식] */}
          {/* ======================================================== */}
          {activeTab === 'chest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 황금 페이스트리 보물상자 하이라이트 카드 */}
              <div
                onClick={() =>
                  handlePlayAssetSound(
                    '황금 페이스트리 보물상자',
                    'sugar-crack',
                    '상자가 열리며 전설의 슈가 젬과 코인이 쏟아집니다! 🎁',
                  )
                }
                style={{
                  padding: 14,
                  borderRadius: 20,
                  background: 'linear-gradient(145deg, #FFF9C4 0%, #FFE082 100%)',
                  border: '2px solid #FFD54F',
                  boxShadow: '0 6px 16px rgba(255, 179, 0, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* 3D 황금 상자 비주얼 */}
                <div
                  style={{
                    width: 60,
                    height: 52,
                    background: 'linear-gradient(180deg, #FFE082 0%, #FFB300 45%, #FF8F00 100%)',
                    borderRadius: '14px 14px 10px 10px',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 6px 16px rgba(255, 143, 0, 0.5), inset 0 2px 0 rgba(255,255,255,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      width: 54,
                      height: 10,
                      borderRadius: 999,
                      background: '#FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #FFE082',
                    }}
                  />
                  <div style={{ fontSize: 20, marginTop: 4 }}>🍓</div>
                  <div style={{ position: 'absolute', top: -8, right: -4, fontSize: 13 }}>✨</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#E65100' }}>
                      황금 페이스트리 보물상자
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: '#FF6F00',
                        color: '#FFFFFF',
                      }}
                    >
                      전설
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#5D4037', lineHeight: 1.4 }}>
                    생크림 웨이브 덮개와 루비 딸기 보석 자물쇠로 봉인된 디저트 타워의 최고 보물상자
                  </div>
                </div>
              </div>

              {/* 특별 장식 3종 (부티크 연동) */}
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D4C41' }}>
                🗡️ Stitch 특별 파티세리 무기 & 날개 (부티크 구매 가능)
              </div>
              {BOUTIQUE_FASHION_ITEMS.filter((i) =>
                ['golden-recipe-grimoire', 'crystal-sugar-shield', 'syrup-glider-blades'].includes(
                  i.id,
                ),
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    handlePlayAssetSound(
                      item.name,
                      item.soundKind,
                      `${item.name} 장착 효과음을 재생합니다!`,
                    )
                  }
                  style={{
                    padding: 10,
                    borderRadius: 16,
                    background: '#FFFFFF',
                    border: '1.5px solid #F0EAE1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#FFF8E1',
                      border: '1px solid #FFE082',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#3E2723' }}>
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: item.rarity === 'legendary' ? '#FFF3E0' : '#E1F5FE',
                          color: item.rarity === 'legendary' ? '#E65100' : '#0277BD',
                        }}
                      >
                        {item.rarity === 'legendary' ? '전설' : '희귀'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#795548', lineHeight: 1.3 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* [3. 5대 훈련 도구] */}
          {/* ======================================================== */}
          {activeTab === 'training' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D4C41' }}>
                🏋️ Stitch 5대 파티세리 훈련 기구 (탭하여 ASMR 사운드 체험)
              </div>
              {SHOWCASE_TRAINING_TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() =>
                    handlePlayAssetSound(
                      tool.name,
                      tool.sound,
                      `${tool.name} 훈련 사운드를 재생합니다!`,
                    )
                  }
                  style={{
                    padding: 10,
                    borderRadius: 16,
                    background: '#FFFFFF',
                    border: '1.5px solid #F0EAE1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      background: tool.bg,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 24,
                      color: '#FFFFFF',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      flexShrink: 0,
                    }}
                  >
                    {tool.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#3E2723' }}>
                        {tool.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: '#FFF3E0',
                          color: '#E65100',
                        }}
                      >
                        {tool.category}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#795548',
                        lineHeight: 1.35,
                        marginBottom: 4,
                      }}
                    >
                      {tool.desc}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#1565C0' }}>
                      📊 {tool.stat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* [4. 부티크 가구 5종] */}
          {/* ======================================================== */}
          {activeTab === 'furniture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D4C41' }}>
                🛋️ Stitch 부티크 럭셔리 디저트 가구 (마이룸 배치 가능)
              </div>
              {ROOM_FURNITURE_CATALOG.filter((f) =>
                ['sofa-parfait', 'lamp-fondue', 'stool-macaron', 'clock-pretzel', 'rug-waffle'].includes(
                  f.id,
                ),
              ).map((f) => (
                <div
                  key={f.id}
                  onClick={() =>
                    handlePlayAssetSound(
                      f.name,
                      f.soundKind,
                      `${f.name} 상호작용 ASMR 사운드 재생!`,
                    )
                  }
                  style={{
                    padding: 10,
                    borderRadius: 16,
                    background: '#FFFFFF',
                    border: '1.5px solid #FCE4EC',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      background: 'radial-gradient(circle, #FCE4EC 0%, #F8BBD0 100%)',
                      border: '1px solid #F48FB1',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#880E4F' }}>
                        {f.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: '#F8BBD0',
                          color: '#880E4F',
                        }}
                      >
                        매력 +{f.charm}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#6A1B9A',
                        lineHeight: 1.35,
                        marginBottom: 3,
                      }}
                    >
                      {f.desc}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#AD1457' }}>
                      💖 터치 모션: "{f.actionLabel}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* [5. 4계절 광장 데코] */}
          {/* ======================================================== */}
          {activeTab === 'plaza' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6D4C41' }}>
                🍂 Stitch 4계절 광장 풍경 및 파티클 (광장 테마 연동)
              </div>
              {(['autumn', 'spring', 'summer', 'winter'] as PlazaThemeId[]).map((themeId) => {
                const theme = PLAZA_THEMES[themeId]
                return (
                  <div
                    key={theme.id}
                    onClick={() =>
                      handlePlayAssetSound(
                        theme.name,
                        'cookie-crisp',
                        `${theme.name}의 계절 풍경 효과음을 재생합니다!`,
                      )
                    }
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      background: theme.bgGradient,
                      border: '1.5px solid rgba(0,0,0,0.1)',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.8)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {theme.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#3E2723' }}>
                          {theme.name}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.7)',
                            color: '#4E342E',
                          }}
                        >
                          {theme.seasonLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#4E342E', lineHeight: 1.35, marginBottom: 3 }}>
                        {theme.desc}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#BF360C' }}>
                        흩날리는 파티클: {theme.leafIcons.slice(0, 5).join(' ')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 5. 모달 푸터 버튼 */}
        <div
          style={{
            padding: '10px 14px',
            background: '#FFFDF9',
            borderTop: '1px solid #FFE082',
            display: 'flex',
            gap: 8,
          }}
        >
          {onNavigateToBoutique && (
            <button
              onClick={() => {
                onClose()
                onNavigateToBoutique()
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span>🛍️ 부티크에서 아이템 장착하러 가기</span>
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: 12,
              border: '1px solid #D7CCC8',
              background: '#F5F5F5',
              color: '#5D4037',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
