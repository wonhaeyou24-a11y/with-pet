// 📜 파티세리 일일 & 주간 미션 모달
// 100dvh 모바일 최적화, 무스크롤 덱 구조, Zero-Crash 무결성

import { useEffect, useState } from 'react'
import {
  claimMissionReward,
  DAILY_MISSIONS,
  loadMissionProgress,
  WEEKLY_MISSIONS,
  type MissionDef,
  type MissionProgressState,
} from '../config/missions'
import { playDessertAsmr } from '../lib/sound'
import { refreshAccount } from '../lib/shopApi'
import { IS_DEV_MOCK } from '../lib/devMode'

interface Props {
  onRewardCoins: (amount: number) => void
  // 실제 서비스: 서버가 알려 준 코인 총액
  onSetCoins?: (coins: number) => void
  onClose: () => void
}

export default function MissionModal({ onRewardCoins, onSetCoins, onClose }: Props) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily')
  const [progress, setProgress] = useState<MissionProgressState>(() => loadMissionProgress())
  const [toast, setToast] = useState<string | null>(null)

  // 실제 서비스: 열 때마다 서버의 최신 진행도를 받아 온다
  useEffect(() => {
    if (IS_DEV_MOCK) return
    void refreshAccount().then(() => setProgress(loadMissionProgress()))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  const handleClaim = async (mission: MissionDef) => {
    const res = await claimMissionReward(mission.id, (coins, _ribbons, absoluteCoins) => {
      if (absoluteCoins !== undefined) onSetCoins?.(absoluteCoins)
      else onRewardCoins(coins)
    })

    if (res.success) {
      setProgress(loadMissionProgress())
      showToast(res.message)
    } else {
      showToast(res.message)
    }
  }

  const missions = tab === 'daily' ? DAILY_MISSIONS : WEEKLY_MISSIONS

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 20, 25, 0.65)',
        backdropFilter: 'blur(5px)',
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
          maxWidth: 360,
          background: '#FFFDF9',
          borderRadius: 24,
          border: '2px solid #FFD54F',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90dvh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF0C2 100%)',
            borderBottom: '1.5px solid #FFE082',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>📜</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#6D4C41' }}>
                파티세리 미션
              </h2>
              <p style={{ margin: 0, fontSize: 10, color: '#8D6E63', fontWeight: 700 }}>
                매일·매주 달콤한 미션을 달성하고 특별 보상을 받으세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #FFE082',
              borderRadius: 10,
              width: 28,
              height: 28,
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              color: '#8D6E63',
            }}
          >
            ✕
          </button>
        </div>

        {/* 일일 vs 주간 탭 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '8px 14px 2px',
            gap: 6,
          }}
        >
          <button
            onClick={() => {
              setTab('daily')
              playDessertAsmr('mochi-squish')
            }}
            style={{
              padding: '8px 0',
              borderRadius: 12,
              border: tab === 'daily' ? '2px solid #FF9800' : '1px solid #FFE082',
              background: tab === 'daily' ? 'linear-gradient(180deg, #FFF8E1 0%, #FFE082 100%)' : '#FFFFFF',
              color: tab === 'daily' ? '#E65100' : '#8D6E63',
              fontWeight: 900,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ☀️ 일일 미션 (자정 리셋)
          </button>
          <button
            onClick={() => {
              setTab('weekly')
              playDessertAsmr('cookie-crisp')
            }}
            style={{
              padding: '8px 0',
              borderRadius: 12,
              border: tab === 'weekly' ? '2px solid #FF9800' : '1px solid #FFE082',
              background: tab === 'weekly' ? 'linear-gradient(180deg, #FFF8E1 0%, #FFE082 100%)' : '#FFFFFF',
              color: tab === 'weekly' ? '#E65100' : '#8D6E63',
              fontWeight: 900,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            🌟 주간 챌린지 (월요 리셋)
          </button>
        </div>

        {/* 미션 목록 */}
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            maxHeight: 380,
          }}
        >
          {missions.map((mission) => {
            const cur = progress.counts[mission.id] ?? 0
            const isDone = cur >= mission.targetCount
            const isClaimed = progress.claimed[mission.id] ?? false
            const pct = Math.min(100, Math.round((cur / mission.targetCount) * 100))

            return (
              <div
                key={mission.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 16,
                  background: isClaimed ? '#F5F5F5' : '#FFFFFF',
                  border: isDone && !isClaimed ? '2px solid #FFB300' : '1px solid #FFE082',
                  boxShadow: isDone && !isClaimed ? '0 2px 8px rgba(255,179,0,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  opacity: isClaimed ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{mission.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#4E342E' }}>
                      {mission.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#8D6E63',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mission.desc}
                    </div>

                    {/* 진척도 게이지 바 */}
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: '#F0E6D8',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isDone
                              ? 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)'
                              : 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#6D4C41', flexShrink: 0 }}>
                        {cur} / {mission.targetCount}
                      </span>
                    </div>

                    {/* 보상 정보 뱃지 */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: '#FFF8E1',
                          color: '#E65100',
                          border: '1px solid #FFE082',
                        }}
                      >
                        🪙 +{mission.rewardCoins}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 6,
                          background: '#FDF2F8',
                          color: '#BE185D',
                          border: '1px solid #FBCFE8',
                        }}
                      >
                        🎀 +{mission.rewardRibbons}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div style={{ flexShrink: 0 }}>
                  {isClaimed ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: '#9E9E9E',
                        background: '#EEEEEE',
                        padding: '6px 10px',
                        borderRadius: 10,
                      }}
                    >
                      수령완료
                    </span>
                  ) : isDone ? (
                    <button
                      onClick={() => handleClaim(mission)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(245,124,0,0.3)',
                        animation: 'bounce 1.5s infinite ease-in-out',
                      }}
                    >
                      보상 받기
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#BDBDBD',
                        background: '#FAFAFA',
                        padding: '6px 8px',
                        borderRadius: 10,
                        border: '1px solid #E0E0E0',
                      }}
                    >
                      진행 중
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 토스트 알림 */}
        {toast && (
          <div
            style={{
              padding: '8px 12px',
              background: '#3E2723',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

