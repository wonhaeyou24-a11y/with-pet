// 실제 서비스의 친선 대전: 서버에 대전을 요청해서 받은 결과(시드·턴 기록)를 그대로 재생한다.
// 승패·보상·전적은 서버가 정하고, 화면은 재생만 한다.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MonsterRow } from '../lib/api'
import { callBattle } from '../lib/battleApi'
import type { BattleSimulationResult } from '../lib/battleEngine'
import AsmrBattleArena from './AsmrBattleArena'

interface Props {
  challenger: MonsterRow
  defender: MonsterRow
  defenderOwnerName: string
  onCoins: (coins: number) => void
  onBack: () => void
}

export default function ServerBattle({ challenger, defender, defenderOwnerName, onCoins, onBack }: Props) {
  const [result, setResult] = useState<BattleSimulationResult | null>(null)
  const [battleKey, setBattleKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const busyRef = useRef(false)

  const fight = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(true)
    setError(null)
    const res = await callBattle('fight', { monsterId: challenger.id, defenderId: defender.id })
    busyRef.current = false
    setLoading(false)
    if (!res.ok || !res.result) {
      setError(res.message ?? '대전을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    setResult(res.result)
    setBattleKey((k) => k + 1)
    if (res.coins !== undefined) onCoins(res.coins)
  }, [challenger.id, defender.id, onCoins])

  useEffect(() => {
    void fight()
    // 화면에 들어올 때 한 번만 대전을 요청한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (result && !loading) {
    return (
      <AsmrBattleArena
        key={battleKey}
        challenger={challenger}
        defender={defender}
        defenderOwnerName={defenderOwnerName}
        precomputed={result}
        onRematch={fight}
        onBack={onBack}
      />
    )
  }

  return (
    <main className="screen center center-text" style={{ minHeight: '100dvh', gap: 14 }}>
      {error ? (
        <>
          <p className="title">⚔️ 대전을 시작하지 못했어요</p>
          <p className="sub">{error}</p>
          <button className="btn" onClick={() => void fight()}>다시 시도</button>
          <button className="btn-link" onClick={onBack}>광장으로 돌아가기</button>
        </>
      ) : (
        <>
          <p className="title">⚔️ 상대와 만나는 중…</p>
          <p className="sub">달콤한 대전 준비 중이에요</p>
        </>
      )}
    </main>
  )
}
