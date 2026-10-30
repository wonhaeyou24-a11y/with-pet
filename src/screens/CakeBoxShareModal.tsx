// 🎁 파티세리 케이크 상자 포장 자랑 카드 모달 (M5 소셜 자랑 마일스톤)
// 투명 아크릴 창이 달린 고급 케이크 패키지 박스 프레임 안에 3D 펫을 담아 SNS 자랑 및 공유
// 100dvh 모바일 최적화, Zero-Crash 무결성

import { useState } from 'react'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { playDessertAsmr } from '../lib/sound'
import Monster3DView from '../monsters/Monster3DView'
import { ElementIcon } from '../ui/Icons'
import { totalStats } from '../ui/parts'

interface Props {
  monster: MonsterRow
  ownerNickname: string
  onClose: () => void
}

export default function CakeBoxShareModal({ monster, ownerNickname, onClose }: Props) {
  const [copied, setCopied] = useState<boolean>(false)
  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  const charmScore =
    (monster.stats.cha ?? 20) +
    (look.decorations
      ? Object.values(look.decorations).filter(Boolean).length * 15
      : 15)

  const handleShare = async () => {
    playDessertAsmr('sugar-crack')
    const shareText = `🍰 [펫과함께] 나의 시그니처 디저트 펫 "${monster.name}"을(를) 소개합니다!\n✨ 종족: ${info?.name ?? monster.species} (Lv.${monster.level})\n🎀 매력도: ${charmScore}점 · 능력치 총점: ${totalStats(monster.stats)}\n지금 달콤한 파티세리 룸에서 함께 놀아요! 👉 https://with-pet.vercel.app/`

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // 무시
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 10, 15, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          maxHeight: '92dvh',
          background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF5EC 100%)',
          borderRadius: 24,
          border: '3px solid #F472B6',
          boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 케이크 상자 손잡이 리본 장식 */}
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
            color: '#FFFFFF',
            padding: '4px 16px',
            borderRadius: '0 0 12px 12px',
            fontSize: 10,
            fontWeight: 900,
            boxShadow: '0 2px 8px rgba(236,72,153,0.3)',
            zIndex: 10,
          }}
        >
          🎀 PATISSERIE SIGNATURE
        </div>

        {/* 상단 타이틀 */}
        <div
          style={{
            padding: '18px 16px 8px',
            textAlign: 'center',
            borderBottom: '1px dashed #FBCFE8',
          }}
        >
          <div style={{ fontSize: 11, color: '#BE185D', fontWeight: 800 }}>
            오직 하나뿐인 수제 디저트 스페셜 에디션
          </div>
          <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 900, color: '#831843' }}>
            {monster.name}
          </h2>
          <div style={{ fontSize: 10, color: '#9D174D', fontWeight: 600 }}>
            수석 파티시에: @{ownerNickname}
          </div>
        </div>

        {/* 중앙 투명 쇼윈도 케이크 상자 뷰어 */}
        <div
          style={{
            margin: '10px 14px',
            height: 180,
            borderRadius: 18,
            background: 'radial-gradient(circle, #FFF1F2 0%, #FFE4E6 100%)',
            border: '2px solid #FBCFE8',
            boxShadow: 'inset 0 2px 12px rgba(244,114,182,0.12)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 금빛 스탬프 라벨 */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid #F472B6',
              fontSize: 9,
              fontWeight: 900,
              color: '#BE185D',
              zIndex: 5,
            }}
          >
            ★ 최고급 슈가 코팅
          </div>

          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              padding: '2px 7px',
              borderRadius: 6,
              background: '#FFF8E1',
              border: '1px solid #FFD54F',
              fontSize: 9,
              fontWeight: 900,
              color: '#E65100',
              zIndex: 5,
            }}
          >
            매력 {charmScore}점
          </div>

          {/* 3D 펫 모델 */}
          <div style={{ width: '100%', height: '100%' }}>
            <Monster3DView look={look} size={170} fluid interactive />
          </div>
        </div>

        {/* 하단 스펙 & 인증 태그 */}
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 8px',
              borderRadius: 12,
              background: '#FFF5F7',
              border: '1px solid #FCE7F3',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#9D174D', fontWeight: 700 }}>종족</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#4E342E' }}>
                {info?.name ?? monster.species}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#9D174D', fontWeight: 700 }}>속성</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#4E342E', display: 'flex', alignItems: 'center', gap: 2 }}>
                <ElementIcon element={monster.element} size={11} />
                {ELEMENT_INFO[monster.element].label}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#9D174D', fontWeight: 700 }}>레벨</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#E11D48' }}>Lv.{monster.level}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#9D174D', fontWeight: 700 }}>전투력</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#4E342E' }}>
                {totalStats(monster.stats)}
              </div>
            </div>
          </div>

          {/* 공유 액션 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
            <button
              onClick={handleShare}
              style={{
                padding: '9px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(219,39,119,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span>{copied ? '✅ 복사 완료!' : '📸 자랑 카드 복사'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '9px 0',
                borderRadius: 12,
                border: '1px solid #FBCFE8',
                background: '#FFFFFF',
                color: '#9D174D',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

