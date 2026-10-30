// 3D 모양 그대로, 가볍게: 광장처럼 여러 마리가 한 화면에 나오는 곳에서 쓰는 펫 그림.
// 3D 모델을 한 번만 찍은 사진을 보여 주고, 사진을 못 만들면 2D 그림으로 대신한다.

import { useEffect, useState } from 'react'
import MonsterView from './MonsterView'
import { getMonsterSnapshot, snapshotKey } from './snapshotRenderer'
import type { MallangCustom } from './MallangChameleon'
import type { MonsterLook } from './types'

type Look = MonsterLook & { mallang?: MallangCustom }

export default function MonsterSnapshot({ look, size, title }: { look: Look; size: number; title?: string }) {
  const key = snapshotKey(look)
  const [url, setUrl] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    // 여러 마리가 한꺼번에 처음 그려질 때 화면이 멈추지 않도록 한 프레임씩 나눠서 찍는다
    const id = window.setTimeout(() => setUrl(getMonsterSnapshot(look)), Math.random() * 120)
    return () => window.clearTimeout(id)
    // look 전체 대신 모양을 결정하는 key만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (url === null) return <MonsterView look={look} size={size} prefer2D title={title} />
  return (
    <img
      src={url ?? undefined}
      alt={title ?? ''}
      width={size}
      height={size}
      draggable={false}
      className="mon-breathe"
      style={{ display: 'block', width: size, height: size, visibility: url ? 'visible' : 'hidden', pointerEvents: 'none' }}
    />
  )
}
