// M3 화면 3: 🏆 지인 디저트 쇼케이스 광장 & 파티세리 프로필 카드 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 지인들의 대표 3D 디저트 몬스터를 구경하고, 직접 터치해 식감 ASMR과 손맛을 느껴보며,
// 한입 투표(좋아요)·응원 댓글·친선 대전을 스크롤 없이 한 화면에서 진행합니다.

import { useEffect, useState } from 'react'
import { SKILL_NODES_T1 } from '../config/skills'
import { ELEMENT_INFO, personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

interface Props {
  myMonster: MonsterRow
  myNickname: string
  coins: number
  onEarnCoins: (delta: number) => void
  onChallenge: (friend: PlazaFriendEntry) => void
  onOpenSkillTree: () => void
  onBack: () => void
}

const EMOJI_CHOICES = ['🥄', '💚', '🍓', '🍮', '🍫', '🔥', '💖', '👑']

// 입력값 엄격 검증 및 태그 제거 (Zero-Trust Sanitization)
function sanitizeComment(raw: string): string {
  return raw.replace(/[<>&"'`]/g, '').trim().slice(0, 50)
}

export default function DessertPlaza({
  myMonster,
  myNickname,
  coins,
  onEarnCoins,
  onChallenge,
  onOpenSkillTree,
  onBack,
}: Props) {
  const [entries, setEntries] = useState<PlazaFriendEntry[]>(PLAZA_SHOWCASE_FRIENDS)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [subTab, setSubTab] = useState<'skills' | 'comments'>('skills')
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🥄')
  const [commentInput, setCommentInput] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)

  // 오감 자극(시각·손맛·청각) 터치 상태
  const [burstKey, setBurstKey] = useState(0)
  const [burstBubble, setBurstBubble] = useState<string | null>(null)
  const [combo, setCombo] = useState(0)

  // 실제 DB에 등록된 지인들의 몬스터가 있으면 함께 불러와 광장에 병합
  useEffect(() => {
    let cancelled = false
    async function fetchRealFriends() {
      try {
        const { data: realMonsters } = await supabase
          .from('monsters')
          .select('*')
          .neq('id', myMonster.id)
          .not('name', 'is', null)
          .limit(10)
        if (cancelled || !realMonsters || realMonsters.length === 0) return

        const { data: players } = await supabase.from('players').select('id, nickname')
        const nickMap = new Map<string, string>()
        players?.forEach((p: { id: string; nickname: string }) => nickMap.set(p.id, p.nickname))

        const mapped: PlazaFriendEntry[] = (realMonsters as MonsterRow[]).map((m) => ({
          ownerNickname: nickMap.get(m.owner) ?? '파티시에지인',
          badge: '✨ 지인 파티시에',
          bio: m.bio ?? '정성껏 키운 나만의 디저트 몬스터예요! 한입 투표 눌러주세요 🍰',
          likes: m.likes_count ?? 18,
          monster: m,
          comments: [{ author: '민트파티시에', emoji: '🥄', text: '우와 너무 맛있어 보여요!!' }],
        }))

        setEntries([...mapped, ...PLAZA_SHOWCASE_FRIENDS])
      } catch {
        // 오프라인/로컬 환경에서는 기본 쇼케이스 파트너 유지
      }
    }
    void fetchRealFriends()
    return () => {
      cancelled = true
    }
  }, [myMonster.id])

  const current = entries[selectedIdx] ?? entries[0]
  const look = monsterLook(current.monster)
  const activeSpecies = look.mallang?.morphForm ?? current.monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[current.monster.species]
  const soundKind = getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase)
  const reactionClass = burstKey > 0 ? getSensoryReactionClass(soundKind) : ''

  function handleTouchFriendMonster() {
    const nextCombo = combo + 1
    setCombo(nextCombo)
    const meta = playDessertAsmr(soundKind, nextCombo)
    setBurstBubble(meta.onomatopoeia)
    setBurstKey((k) => k + 1)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleLikeVote() {
    const id = current.monster.id
    if (likedIds[id]) {
      handleTouchFriendMonster()
      showToast('💖 이미 오늘 한입 투표를 보낸 디저트예요!')
      return
    }
    setLikedIds((prev) => ({ ...prev, [id]: true }))
    setEntries((prev) =>
      prev.map((item, idx) => (idx === selectedIdx ? { ...item, likes: item.likes + 1 } : item)),
    )
    playDessertAsmr('syrup-drizzle', 2)
    setBurstBubble('🥄 한입 투표 완료! (+5 우정 코인)')
    setBurstKey((k) => k + 1)
    onEarnCoins(5)
    showToast(`🥄 [${current.monster.name}]에게 한입 투표를 보내고 +5 우정 코인을 받았어요!`)
  }

  function handleAddComment() {
    const clean = sanitizeComment(commentInput)
    if (!clean) return
    setEntries((prev) =>
      prev.map((item, idx) =>
        idx === selectedIdx
          ? {
              ...item,
              comments: [...item.comments, { author: myNickname, emoji: selectedEmoji, text: clean }],
            }
          : item,
      ),
    )
    setCommentInput('')
    playDessertAsmr('syrup-drizzle', 2)
    onEarnCoins(3)
    showToast('💬 다정한 한줄 응원을 남기고 +3 우정 코인을 받았어요!')
  }

  const equippedSkills = (current.monster.equipped_skills ?? ['kataifi-strike', 'sugar-shield', 'sweet-gaze', 'element-drizzle'])
    .map((id) => SKILL_NODES_T1.find((s) => s.id === id))
    .filter(Boolean)

  return (
    <main className="screen">
      {/* 상단 바 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 17 }}>🏆 지인 디저트 광장</h1>
        <div className="row" style={{ gap: 4 }}>
          <button
            className="chip coral"
            onClick={onOpenSkillTree}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
          >
            🌈 스킬트리
          </button>
          <span className="chip honey" style={{ fontWeight: 800, fontSize: 12, padding: '3px 8px' }}>
            🪙 {coins}
          </span>
        </div>
      </div>

      {/* 지인 디저트 선택 탭 바 (3×2 그리드) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5, flexShrink: 0 }}>
        {entries.slice(0, 6).map((entry, idx) => {
          const isSel = idx === selectedIdx
          const spInfo = SPECIES_INFO[entry.monster.species]
          return (
            <button
              key={entry.monster.id}
              onClick={() => {
                setSelectedIdx(idx)
                setCombo(0)
                const sKind = getSpeciesSoundKind(entry.monster.species)
                const meta = playDessertAsmr(sKind)
                setBurstBubble(meta.onomatopoeia)
                setBurstKey((k) => k + 1)
              }}
              style={{
                padding: '5px 6px',
                borderRadius: 10,
                border: isSel ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                background: isSel ? '#FFF2EC' : '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                color: '#3B2F2F',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
              }}
            >
              {entry.monster.name || spInfo?.name}
            </button>
          )
        })}
      </div>

      {/* 선택된 지인 몬스터의 3D 쇼케이스 카드 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #FFF7F9 0%, #FFFDF9 100%)',
          border: '2px dashed #FF8A65',
          padding: '10px 12px',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row wrap" style={{ gap: 4 }}>
            <span className="chip coral" style={{ fontSize: 12, padding: '2px 8px' }}>
              {current.badge}
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#3B2F2F' }}>
              {current.monster.name} <span style={{ fontSize: 12, color: '#7A6A60' }}>({current.ownerNickname})</span>
            </span>
          </div>
          <span className="chip honey" style={{ fontWeight: 800, fontSize: 12, padding: '2px 8px' }}>
            ❤️ {current.likes}
          </span>
        </div>

        {/* 3D 쇼케이스 스테이지 */}
        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', height: 156, minHeight: 156, padding: 2, cursor: 'pointer' }}
          onClick={handleTouchFriendMonster}
        >
          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={burstBubble} combo={combo} />
          <div key={burstKey} className={reactionClass} style={{ position: 'relative', zIndex: 1 }}>
            <MonsterView look={look} size={150} title={current.monster.name ?? info?.name} />
          </div>
        </div>

        <div className="row wrap center" style={{ gap: 4 }}>
          <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>{info?.name ?? current.monster.species}</span>
          {info?.textureLabel && <span className="chip honey" style={{ fontSize: 12, padding: '2px 7px' }}>{info.textureLabel}</span>}
          <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>
            <ElementIcon element={current.monster.element} size={14} />
            {ELEMENT_INFO[current.monster.element].label}
          </span>
          <span className="chip coral" style={{ fontSize: 12, padding: '2px 7px' }}>Lv.{current.monster.level}</span>
          <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>
            {personalityLabel(current.monster.personality_active, current.monster.personality_bond)}
          </span>
        </div>

        {/* 광장 핵심 액션 버튼 2종: 한입 투표 & 친선 대전 */}
        <div className="grid-2" style={{ gap: 6 }}>
          <button className="btn mint" onClick={handleLikeVote} style={{ padding: '9px 8px', fontSize: 12 }}>
            🥄 한입 투표 ❤️ ({current.likes})
          </button>
          <button className="btn" onClick={() => onChallenge(current)} style={{ padding: '9px 8px', fontSize: 12 }}>
            ⚔️ 식감 ASMR 친선전!
          </button>
        </div>

        {toast && (
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 10,
              background: '#E8F8F0',
              color: '#177051',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {toast}
          </div>
        )}
      </div>

      {/* 하단 원스크린 탭 덱: 장착 스킬·능력치 / 한입 응원록 */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setSubTab('skills')}
            style={{
              padding: '7px 6px',
              borderRadius: 12,
              border: subTab === 'skills' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: subTab === 'skills' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            ⚔️ 장착 스킬 · 능력치
          </button>
          <button
            onClick={() => setSubTab('comments')}
            style={{
              padding: '7px 6px',
              borderRadius: 12,
              border: subTab === 'comments' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: subTab === 'comments' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            💬 한입 응원록 ({current.comments.length})
          </button>
        </div>

        {subTab === 'skills' ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 5 }}>
              {equippedSkills.map((sk) =>
                sk ? (
                  <div
                    key={sk.id}
                    onClick={() => {
                      playDessertAsmr(sk.asmr)
                      setBurstBubble(`${sk.icon} ${sk.onomatopoeia}`)
                      setBurstKey((k) => k + 1)
                    }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 12,
                      background: '#FFFBF2',
                      border: '1px solid #F0DFB8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{sk.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>{sk.name}</div>
                      <div style={{ fontSize: 12, color: '#D85A3A', fontWeight: 700 }}>{sk.onomatopoeia}</div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
            <div className="row between" style={{ gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#5D4037', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                “{current.bio}”
              </span>
              <span className="chip" style={{ fontSize: 12, flexShrink: 0, padding: '2px 7px' }}>
                총점 {totalStats(current.monster.stats)}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
              {[
                { label: '체력', val: current.monster.stats.hp, color: '#F47C7C' },
                { label: '공격', val: current.monster.stats.atk, color: '#FF9F7A' },
                { label: '방어', val: current.monster.stats.def, color: '#F5B82E' },
                { label: '속도', val: current.monster.stats.spd, color: '#4FB888' },
                { label: '지능', val: current.monster.stats.int, color: '#4FA3E0' },
                { label: '매력', val: current.monster.stats.cha, color: '#B07CF0' },
              ].map((st) => (
                <div
                  key={st.label}
                  style={{
                    padding: '4px 2px',
                    borderRadius: 10,
                    background: '#FFFBF2',
                    border: '1px solid #F0DFB8',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#7A6A60' }}>{st.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: st.color }}>{st.val}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {current.comments.slice(-3).map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 12,
                    background: '#FFFBF2',
                    border: '1px solid #F0DFB8',
                    fontSize: 12,
                  }}
                >
                  <strong>
                    {c.emoji} {c.author}
                  </strong>
                  : {c.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="row wrap" style={{ gap: 4 }}>
                {EMOJI_CHOICES.map((em) => (
                  <button
                    key={em}
                    onClick={() => setSelectedEmoji(em)}
                    style={{
                      padding: '3px 7px',
                      borderRadius: 999,
                      border: selectedEmoji === em ? '2px solid #FF7A59' : '1px solid #E5D4B0',
                      background: selectedEmoji === em ? '#FFF2EC' : '#FFFFFF',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div className="row" style={{ gap: 6 }}>
                <input
                  value={commentInput}
                  maxLength={50}
                  placeholder="달콤한 한줄 응원을 남겨 보세요 (+3 코인)"
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 999,
                    border: '1.5px solid #F0DFB8',
                    fontSize: 12,
                  }}
                />
                <button
                  className="btn"
                  disabled={!commentInput.trim()}
                  onClick={handleAddComment}
                  style={{ padding: '8px 12px', fontSize: 12, flexShrink: 0 }}
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
