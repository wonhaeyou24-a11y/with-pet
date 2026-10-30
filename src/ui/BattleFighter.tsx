// 대전 캐릭터: 3D 모델을 한 번 찍어 둔 사진으로 보여 주고, 움직임은 GPU 변환으로만 처리해서 부드럽다.
// (턴마다 3D 화면을 다시 만들던 이전 방식을 대신한다.) 돌진할 때는 뒤따르는 잔상이 붙는다.

import { useEffect, useRef, useState } from 'react'
import MonsterView from '../monsters/MonsterView'
import { getMonsterSnapshot, snapshotKey } from '../monsters/snapshotRenderer'
import type { MallangCustom } from '../monsters/MallangChameleon'
import type { MonsterLook } from '../monsters/types'

type Look = MonsterLook & { mallang?: MallangCustom }

export interface Pose {
  transform: string
  ms: number
  ease: string
}

interface Props {
  look: Look
  size: number
  title?: string
  pose: Pose
  // 맞았을 때 한 번 재생하는 식감별 반응 애니메이션 이름(mon-react-*)과, 같은 이름을 다시 재생하기 위한 번호
  hitClass?: string
  hitKey: number
  // 맞은 순간 하얗게 번쩍
  flash?: boolean
  // 돌진 중이면 잔상을 보여 준다
  trail?: boolean
}

const GHOSTS = [
  { delay: 38, opacity: 0.42 },
  { delay: 76, opacity: 0.26 },
  { delay: 114, opacity: 0.14 },
]

export default function BattleFighter({ look, size, title, pose, hitClass, hitKey, flash, trail }: Props) {
  const key = snapshotKey(look)
  const [url, setUrl] = useState<string | null | undefined>(undefined)
  const hitRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setUrl(getMonsterSnapshot(look)), 0)
    return () => window.clearTimeout(id)
    // look 전체 대신 모양을 결정하는 key만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // 맞을 때마다 같은 반응 애니메이션을 처음부터 다시 재생한다 (요소를 새로 만들지 않고 클래스만 다시 붙인다)
  useEffect(() => {
    const el = hitRef.current
    if (!el || !hitClass) return
    el.classList.remove(hitClass)
    void el.offsetWidth
    el.classList.add(hitClass)
    const id = window.setTimeout(() => el.classList.remove(hitClass), 700)
    return () => window.clearTimeout(id)
  }, [hitKey, hitClass])

  const move = `transform ${pose.ms}ms ${pose.ease}`

  return (
    <div style={{ position: 'relative', width: size, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {url &&
        GHOSTS.map((g, i) => (
          <img
            key={i}
            src={url}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: size,
              height: size,
              opacity: trail ? g.opacity : 0,
              transform: pose.transform,
              transition: trail ? `${move} ${g.delay}ms, opacity 60ms linear` : 'opacity 90ms linear',
              filter: 'saturate(1.5) brightness(1.15) blur(0.6px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        ))}

      <div style={{ position: 'relative', zIndex: 2, transform: pose.transform, transition: move, willChange: 'transform' }}>
        <div ref={hitRef} style={{ filter: flash ? 'brightness(2.4) saturate(0.35)' : 'none', transition: 'filter 90ms linear' }}>
          {url === null ? (
            <MonsterView look={look} size={size} prefer2D title={title} />
          ) : (
            <img
              src={url ?? undefined}
              alt={title ?? ''}
              width={size}
              height={size}
              draggable={false}
              className="mon-breathe"
              style={{ display: 'block', width: size, height: size, visibility: url ? 'visible' : 'hidden', pointerEvents: 'none' }}
            />
          )}
        </div>
        {/* 발밑 타원형 그림자 */}
        <div
          style={{
            width: size * 0.7,
            height: 16,
            margin: '-10px auto 0',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(62,39,35,0.35) 0%, rgba(62,39,35,0.1) 60%, transparent 80%)',
          }}
        />
      </div>
    </div>
  )
}
