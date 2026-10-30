// 🎧 디저트 펫 오감 식감 ASMR 사운드 스튜디오 (전 종족 청음실)
// 15종 전 종족의 고유 폴라 ASMR 사운드와 연타 콤보 음색을 한곳에서 직접 재생·비교·점검할 수 있는 스튜디오

import { useState } from 'react'
import {
  DESSERT_SOUND_CATALOG,
  playDessertAsmr,
  type DessertSoundKind,
  type SensoryCategory,
} from '../lib/sound'
import { SensoryBurst } from '../ui/SensoryFx'

interface Props {
  onClose: () => void
}

interface SoundCardItem {
  speciesId: string
  speciesName: string
  soundKind: DessertSoundKind
  textureLabel: string
  category: SensoryCategory
}

// 15종 전 종족 사운드 매핑 카탈로그
const SOUND_STUDIO_ITEMS: SoundCardItem[] = [
  {
    speciesId: 'dubai-cookie',
    speciesName: '두바이쫀득쿠키',
    soundKind: 'kataifi-crunch',
    textureLabel: '💚 바사삭 카다이프 & 쫀득 쿠키',
    category: 'crispy',
  },
  {
    speciesId: 'wax-ball',
    speciesName: '왁뿌볼',
    soundKind: 'wax-pop',
    textureLabel: '🫧 아그작! 왁뿌볼 껍질 & 말랑 속',
    category: 'crispy',
  },
  {
    speciesId: 'tanghulu',
    speciesName: '유리알탕후루',
    soundKind: 'sugar-crack',
    textureLabel: '🍓 빠작! 유리알 설탕 코팅',
    category: 'crispy',
  },
  {
    speciesId: 'mochi',
    speciesName: '찹쌀떡모찌',
    soundKind: 'mochi-squish',
    textureLabel: '🍡 쫀득~ 말랑말랑 찹쌀떡',
    category: 'chewy',
  },
  {
    speciesId: 'pudding',
    speciesName: '말랑푸딩',
    soundKind: 'pudding-jiggle',
    textureLabel: '🍮 탱글탱글~ 출렁 커스터드',
    category: 'jiggly',
  },
  {
    speciesId: 'jelly',
    speciesName: '쫀득젤리',
    soundKind: 'jelly-gummy',
    textureLabel: '🐻 탱글~ 뽀용 과일 구미',
    category: 'jiggly',
  },
  {
    speciesId: 'choco',
    speciesName: '달콤초코',
    soundKind: 'choco-melt',
    textureLabel: '🍫 사르르~ 꾸덕 퐁듀 가나슈',
    category: 'melty',
  },
  {
    speciesId: 'smore',
    speciesName: '스모어마시멜로',
    soundKind: 'smore-sizzle',
    textureLabel: '🔥 바삭 크래커 & 폭신 마시멜로',
    category: 'melty',
  },
  {
    speciesId: 'mongsil',
    speciesName: '몽실 (솜사탕 양)',
    soundKind: 'cotton-puff',
    textureLabel: '☁️ 폭신폭신 구름 솜사탕',
    category: 'melty',
  },
  {
    speciesId: 'kongkong',
    speciesName: '콩콩 (도토리 다람쥐)',
    soundKind: 'acorn-snap',
    textureLabel: '🌰 또각- 딱! 도토리 쿠키',
    category: 'crispy',
  },
  {
    speciesId: 'beongaekkori',
    speciesName: '번개꼬리 (스파클링 족제비)',
    soundKind: 'soda-fizz',
    textureLabel: '⚡ 톡톡 스파클링 소다캔디',
    category: 'crispy',
  },
  {
    speciesId: 'gangcheoldeung',
    speciesName: '강철등 (비스킷 가디언)',
    soundKind: 'biscuit-armor',
    textureLabel: '🛡️ 단단 바삭 비스킷 크러스트',
    category: 'crispy',
  },
  {
    speciesId: 'heugyeom',
    speciesName: '흑염 (다크초코 사자)',
    soundKind: 'flambe-crackle',
    textureLabel: '🔥 타닥타닥 크림 브륄레',
    category: 'melty',
  },
  {
    speciesId: 'byeolbineul',
    speciesName: '별비늘 (별사탕 아기용)',
    soundKind: 'starlight-ting',
    textureLabel: '✨ 팅- 챠르릉 별사탕 크리스탈',
    category: 'crispy',
  },
  {
    speciesId: 'chameleon',
    speciesName: '말랑카멜레온',
    soundKind: 'chameleon-morph',
    textureLabel: '🦎 뽀요용~ 만능 모찌 반죽',
    category: 'chewy',
  },
  {
    speciesId: 'choco-cookie-base',
    speciesName: '초코 쿠키 받침대',
    soundKind: 'cookie-crisp',
    textureLabel: '🍪 오독-오독 버터 쿠키 세 입',
    category: 'crispy',
  },
  {
    speciesId: 'topping-syrup',
    speciesName: '시럽 & 스프링클 토핑',
    soundKind: 'syrup-drizzle',
    textureLabel: '🌈 졸졸 시럽 & 통통 스프링클',
    category: 'chewy',
  },
]

const countOf = (category: SensoryCategory) => SOUND_STUDIO_ITEMS.filter((item) => item.category === category).length

export default function DessertSoundStudioModal({ onClose }: Props) {
  const [filter, setFilter] = useState<string>('all')
  const [playingKind, setPlayingKind] = useState<DessertSoundKind | null>(null)
  const [activeBubble, setActiveBubble] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [lastCombo, setLastCombo] = useState<number>(1)

  const filteredItems = SOUND_STUDIO_ITEMS.filter((item) => {
    if (filter === 'all') return true
    return item.category === filter
  })

  const handlePlaySound = (kind: DessertSoundKind, combo: number) => {
    setPlayingKind(kind)
    setLastCombo(combo)
    const meta = playDessertAsmr(kind, combo - 1)
    setActiveBubble(`${meta.onomatopoeia} (${combo}연타)`)
    setBurstKey((k) => k + 1)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          height: '92vh',
          maxHeight: 760,
          background: '#FFFDF9',
          borderRadius: 24,
          border: '2.5px solid #FFB74D',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 오감 ASMR 이펙트 오버레이 */}
        {playingKind && (
          <SensoryBurst
            kind={playingKind}
            triggerKey={burstKey}
            bubble={activeBubble}
            combo={lastCombo}
          />
        )}

        {/* 1. 스튜디오 헤더 */}
        <div
          style={{
            padding: '14px 16px 10px',
            background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
            borderBottom: '1.5px solid #FFE082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🎧</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#4E342E' }}>
                디저트 펫 ASMR 사운드 스튜디오
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#E65100', marginTop: 1 }}>
                {SOUND_STUDIO_ITEMS.length}종 디저트 식감 ASMR 청음실
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
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              color: '#5D4037',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. 카테고리 필터 탭 */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 14px',
            background: '#FFFFFF',
            borderBottom: '1px solid #F0DFB8',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'all', label: `전체 (${SOUND_STUDIO_ITEMS.length}종)` },
            { id: 'crispy', label: `바삭 크런치 (${countOf('crispy')}종)` },
            { id: 'chewy', label: `쫀득 말랑 (${countOf('chewy')}종)` },
            { id: 'jiggly', label: `탱글 출렁 (${countOf('jiggly')}종)` },
            { id: 'melty', label: `사르르 멜팅 (${countOf('melty')}종)` },
          ].map((tab) => {
            const isSel = filter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 10,
                  border: isSel ? '1.5px solid #FF9800' : '1px solid #E0D3C5',
                  background: isSel ? '#FFF3E0' : '#FFFDF9',
                  color: isSel ? '#E65100' : '#6D4C41',
                  fontWeight: isSel ? 900 : 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 3. 종족별 사운드 청음 카드 목록 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {filteredItems.map((item) => {
            const meta = DESSERT_SOUND_CATALOG[item.soundKind]
            const isPlaying = playingKind === item.soundKind

            return (
              <div
                key={item.speciesId}
                style={{
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: isPlaying ? '#FFFDE7' : '#FFFFFF',
                  border: isPlaying ? '2px solid #FFC107' : '1px solid #EFEBE9',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* 상단 펫 이름 & 사운드명 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 20 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#3E2723' }}>
                        {item.speciesName}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#D84315' }}>
                        {meta.label}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background:
                        item.category === 'crispy'
                          ? '#FFF3E0'
                          : item.category === 'chewy'
                            ? '#FCE4EC'
                            : item.category === 'jiggly'
                              ? '#E8F5E9'
                              : '#EDE7F6',
                      color:
                        item.category === 'crispy'
                          ? '#E65100'
                          : item.category === 'chewy'
                            ? '#C2185B'
                            : item.category === 'jiggly'
                              ? '#2E7D32'
                              : '#512DA8',
                    }}
                  >
                    {item.textureLabel}
                  </span>
                </div>

                {/* 의성어 & 사운드 설명 */}
                <div
                  style={{
                    background: '#FAFAFA',
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: 10,
                    color: '#5D4037',
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#E65100', marginBottom: 2 }}>
                    📢 의성어: {meta.onomatopoeia}
                  </div>
                  <div>{meta.desc}</div>
                </div>

                {/* 청음 컨트롤 버튼 그룹 (1회, 3연타, 5연타) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 6, marginTop: 2 }}>
                  <button
                    onClick={() => handlePlaySound(item.soundKind, 1)}
                    style={{
                      padding: '7px 0',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      boxShadow: '0 2px 5px rgba(245,124,0,0.25)',
                    }}
                  >
                    <span>▶️</span>
                    <span>1회 청음</span>
                  </button>

                  <button
                    onClick={() => handlePlaySound(item.soundKind, 3)}
                    style={{
                      padding: '7px 0',
                      borderRadius: 10,
                      border: '1.5px solid #FFB74D',
                      background: '#FFF8E1',
                      color: '#E65100',
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    <span>⚡</span>
                    <span>3연타</span>
                  </button>

                  <button
                    onClick={() => handlePlaySound(item.soundKind, 5)}
                    style={{
                      padding: '7px 0',
                      borderRadius: 10,
                      border: '1.5px solid #FF8A65',
                      background: '#FBE9E7',
                      color: '#D84315',
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    <span>🔥</span>
                    <span>5연타 버스트</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 4. 하단 닫기 안내 바 */}
        <div
          style={{
            padding: '10px 14px',
            background: '#FFFFFF',
            borderTop: '1px solid #F0DFB8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 10, color: '#795548', fontWeight: 800 }}>
            💡 연타 시 피치와 파쇄음이 더욱 고조되어 실감나는 손맛을 냅니다.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#5D4037',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  )
}
