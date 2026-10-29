// M3 화면 3: 🏆 지인 디저트 쇼케이스 광장 & 파티세리 프로필 카드
// 지인들의 대표 디저트 몬스터를 구경하고, 직접 터치해 식감 ASMR과 손맛을 느껴보며,
// 한입 투표(좋아요)·응원 댓글을 남기거나 식감 ASMR 친선 대전을 신청합니다.

import { useEffect, useState } from 'react'
import { SKILL_NODES_T1 } from '../config/skills'
import { ELEMENT_INFO, personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { Nest, StatBars, totalStats } from '../ui/parts'
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
    setTimeout(() => setToast(null), 3200)
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
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🏆 지인 디저트 광장</h1>
        <span className="chip honey" style={{ fontWeight: 800 }}>
          🪙 {coins} 코인
        </span>
      </div>

      {/* 상단 광장 쇼케이스 캐러셀 바 (지인 디저트 선택) */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="small" style={{ fontWeight: 800, color: '#3B2F2F' }}>
            🍰 광장에 진열된 지인 디저트 ({entries.length}마리 · 터치해 구경하기)
          </span>
          <button
            className="chip coral"
            onClick={onOpenSkillTree}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11 }}
          >
            🌈 내 식감 스킬트리
          </button>
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          {entries.map((entry, idx) => {
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
                  padding: '7px 11px',
                  borderRadius: 999,
                  border: isSel ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                  background: isSel ? '#FFF2EC' : '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#3B2F2F',
                  cursor: 'pointer',
                }}
              >
                {entry.monster.name || spInfo?.name} · <span style={{ color: '#7A6A60' }}>{entry.ownerNickname}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택된 지인 몬스터의 파티세리 쇼케이스 프로필 카드 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #FFF7F9 0%, #FFFDF9 100%)',
          border: '2px dashed #FF8A65',
          paddingBottom: 16,
        }}
      >
        <div className="row wrap between" style={{ gap: 6 }}>
          <span className="chip coral">{current.badge}</span>
          <span className="chip honey" style={{ fontWeight: 800 }}>
            🥄 한입 투표 ❤️ {current.likes}
          </span>
        </div>

        <div
          style={{
            marginTop: 4,
            padding: '5px 12px',
            borderRadius: 999,
            background: '#FFF2EC',
            color: '#D85A3A',
            fontSize: 11,
            fontWeight: 800,
            textAlign: 'center',
          }}
        >
          👆 디저트 몸통을 여러 번 톡톡 눌러보세요! 실제 식감 ASMR과 손맛 콤보가 터져요!
        </div>

        {/* 오감 자극 인터랙티브 쇼케이스 스테이지 */}
        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', minHeight: 195, cursor: 'pointer' }}
          onClick={handleTouchFriendMonster}
        >
          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={burstBubble} combo={combo} />
          <div
            key={burstKey}
            className={reactionClass}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={190} title={current.monster.name ?? info?.name} />
          </div>
          <Nest width={215} lift={36} front={false} dessertBase={look.mallang?.dessertBase} />
        </div>

        {/* 이름 · 주인 · 식감 · 속성 소개 */}
        <div className="center-text stack" style={{ gap: 6, alignItems: 'center' }}>
          <h2 className="title-xl" style={{ fontSize: 23 }}>
            {current.monster.name} <span style={{ fontSize: 14, color: '#7A6A60' }}>({current.ownerNickname}님)</span>
          </h2>
          <div className="row wrap center" style={{ gap: 6 }}>
            <span className="chip">{info?.name ?? current.monster.species}</span>
            {info?.textureLabel && <span className="chip honey">{info.textureLabel}</span>}
            <span className="chip" style={{ paddingLeft: 6 }}>
              <ElementIcon element={current.monster.element} size={18} />
              {ELEMENT_INFO[current.monster.element].label}
            </span>
            <span className="chip coral">Lv.{current.monster.level}</span>
            <span className="chip">
              {personalityLabel(current.monster.personality_active, current.monster.personality_bond)}
            </span>
          </div>
          <p
            style={{
              marginTop: 2,
              padding: '8px 14px',
              borderRadius: 14,
              background: '#FFFFFF',
              border: '1.5px solid #F0DFB8',
              fontSize: 12,
              fontWeight: 700,
              color: '#3B2F2F',
            }}
          >
            “{current.bio}”
          </p>
        </div>

        {/* 광장 핵심 액션 버튼 2종: 한입 투표(좋아요) & 식감 ASMR 친선 대전 */}
        <div className="grid-2" style={{ marginTop: 8 }}>
          <button className="btn mint" onClick={handleLikeVote} style={{ padding: '11px 10px', fontSize: 13 }}>
            🥄 한입 투표 ❤️ ({current.likes})
          </button>
          <button
            className="btn"
            onClick={() => onChallenge(current)}
            style={{ padding: '11px 10px', fontSize: 13 }}
          >
            ⚔️ 식감 ASMR 친선전!
          </button>
        </div>

        {toast && (
          <div
            style={{
              marginTop: 6,
              padding: '8px 12px',
              borderRadius: 12,
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

      {/* 지인 몬스터의 장착 식감 스킬 & 능력치 카드 */}
      <div className="card">
        <div className="row between">
          <h3 className="title" style={{ fontSize: 17 }}>
            📊 프로필 능력치 & 장착 식감 스킬
          </h3>
          <span className="chip" style={{ fontSize: 11 }}>
            총점 {totalStats(current.monster.stats)} · 최애: {current.monster.fav_food ?? '생딸기 슈가시럽'}
          </span>
        </div>
        <StatBars stats={current.monster.stats} compact />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 6 }}>
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
                  padding: '7px 10px',
                  borderRadius: 12,
                  background: '#FFFBF2',
                  border: '1.5px solid #F0DFB8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 18 }}>{sk.icon}</span>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#3B2F2F' }}>{sk.name}</div>
                  <div style={{ fontSize: 9.5, color: '#D85A3A', fontWeight: 700 }}>{sk.onomatopoeia}</div>
                </div>
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/* 지인 방명록 / 응원 댓글 */}
      <div className="card">
        <h3 className="title" style={{ fontSize: 17 }}>
          💬 쇼케이스 한입 응원 ({current.comments.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {current.comments.map((c, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                borderRadius: 14,
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

        {/* 이모지 선택 + 응원 한줄 입력 */}
        <div className="row wrap" style={{ gap: 5, marginTop: 4 }}>
          {EMOJI_CHOICES.map((em) => (
            <button
              key={em}
              onClick={() => setSelectedEmoji(em)}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: selectedEmoji === em ? '2px solid #FF7A59' : '1px solid #E5D4B0',
                background: selectedEmoji === em ? '#FFF2EC' : '#FFFFFF',
                fontSize: 14,
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
              padding: '9px 12px',
              borderRadius: 999,
              border: '1.5px solid #F0DFB8',
              fontSize: 12,
            }}
          />
          <button
            className="btn"
            disabled={!commentInput.trim()}
            onClick={handleAddComment}
            style={{ padding: '9px 14px', fontSize: 12 }}
          >
            응원 남기기
          </button>
        </div>
      </div>
    </main>
  )
}

