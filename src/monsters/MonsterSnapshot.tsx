// 3D 모양 그대로, 가볍게: 광장처럼 여러 마리가 한 화면에 나오는 곳에서 쓰는 펫 뷰.
// 실시간 3D 스냅샷을 즉시 캐시하여 2D 레거시 캐릭터가 전혀 노출되지 않도록 보장합니다.

import { useEffect, useState } from 'react'
import Monster3DView from './Monster3DView'
import { getMonsterSnapshot, snapshotKey } from './snapshotRenderer'
import type { MallangCustom } from './MallangChameleon'
import type { MonsterLook } from './types'

type Look = MonsterLook & { mallang?: MallangCustom }

export default function MonsterSnapshot({ look, size, title }: { look: Look; size: number; title?: string }) {
  const key = snapshotKey(look)
  // 💡 최초 마운트 시 즉시 동기 스냅샷 획득 시도 (2D 캐릭터 깜빡임 원천 차단)
  const [url, setUrl] = useState<string | null>(() => {
    try {
      return getMonsterSnapshot(look)
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      const snap = getMonsterSnapshot(look)
      if (snap) {
        setUrl(snap)
      } else {
        const id = window.setTimeout(() => setUrl(getMonsterSnapshot(look)), 50)
        return () => window.clearTimeout(id)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // 💡 스냅샷 획득 실패 시에도 2D 이전 캐릭터 대신 무조건 3D 실시간 뷰로 렌더링 (2D 오류 영구 방지)
  if (!url) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={title}>
        <Monster3DView look={look} size={size} interactive={false} />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={title ?? ''}
      width={size}
      height={size}
      draggable={false}
      className="mon-breathe"
      style={{ display: 'block', width: size, height: size, pointerEvents: 'none' }}
    />
  )
}
