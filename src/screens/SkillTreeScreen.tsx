// M3 화면 1: 🌈 식감 스킬 트리 1단계 & 전투 성향 장착소
// 6개 식감 가지(크런치 맹공, 슈가코팅 철벽, 달콤 교감, 퐁듀 요술, 깜짝 레시피, 원소 플레이팅)의
// 1단계 스킬 18종을 해금하고, 대전에서 사용할 액티브 스킬 4칸과 전투 성향을 설정합니다.

import { useState } from 'react'
import {
  BATTLE_STANCES,
  DEFAULT_EQUIPPED_SKILLS,
  DEFAULT_UNLOCKED_SKILLS,
  SKILL_BRANCHES,
  SKILL_NODES_T1,
  type BattleStanceId,
  type SkillBranchId,
  type SkillNodeDef,
} from '../config/skills'
import { SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { playDessertAsmr, type DessertSoundKind } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'
import { Nest } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

interface Props {
  monster: MonsterRow
  onUpdateMonster: (updated: MonsterRow) => void
  onBack: () => void
}

export default function SkillTreeScreen({ monster, onUpdateMonster, onBack }: Props) {
  const [branch, setBranch] = useState<SkillBranchId>('assault')
  const [unlocked, setUnlocked] = useState<string[]>(() => monster.unlocked_skills ?? DEFAULT_UNLOCKED_SKILLS)
  const [equipped, setEquipped] = useState<string[]>(() => monster.equipped_skills ?? DEFAULT_EQUIPPED_SKILLS)
  const [stance, setStance] = useState<BattleStanceId>(() => monster.battle_stance ?? 'balanced')
  const [sp, setSp] = useState<number>(() => Math.max(monster.sp ?? 2, 2))
  const [toast, setToast] = useState<string | null>(null)

  // 오감 자극(시각·손맛·청각) 프리뷰 상태
  const [burstKey, setBurstKey] = useState(0)
  const [burstKind, setBurstKind] = useState<DessertSoundKind>('kataifi-crunch')
  const [burstBubble, setBurstBubble] = useState<string | null>(null)
  const [combo, setCombo] = useState(0)

  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  function triggerSensoryPreview(kind: DessertSoundKind, customBubble?: string) {
    const nextCombo = combo + 1
    setCombo(nextCombo)
    const meta = playDessertAsmr(kind, nextCombo)
    setBurstKind(kind)
    setBurstBubble(customBubble ?? meta.onomatopoeia)
    setBurstKey((k) => k + 1)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  function persistChanges(nextUnlocked: string[], nextEquipped: string[], nextStance: BattleStanceId, nextSp: number) {
    const updated: MonsterRow = {
      ...monster,
      unlocked_skills: nextUnlocked,
      equipped_skills: nextEquipped,
      battle_stance: nextStance,
      sp: nextSp,
    }
    try {
      localStorage.setItem(
        `pet_m3_skills_${monster.id}`,
        JSON.stringify({ unlocked: nextUnlocked, equipped: nextEquipped, stance: nextStance, sp: nextSp }),
      )
    } catch {
      // 로컬 저장소 제한 시 안전 무시
    }
    onUpdateMonster(updated)
  }

  function handleUnlock(node: SkillNodeDef) {
    if (unlocked.includes(node.id)) return
    if (sp < node.spCost) {
      showToast('⚠️ 스킬 포인트(SP)가 부족해요! 레벨업하거나 아래 [체험 SP 받기]를 눌러보세요.')
      return
    }
    const nextSp = sp - node.spCost
    const nextUnlocked = [...unlocked, node.id]
    let nextEquipped = [...equipped]
    if (node.kind === 'active' && nextEquipped.length < 4 && !nextEquipped.includes(node.id)) {
      nextEquipped = [...nextEquipped, node.id]
    }
    setSp(nextSp)
    setUnlocked(nextUnlocked)
    setEquipped(nextEquipped)
    triggerSensoryPreview(node.asmr, `${node.icon} ${node.name} 습득! (${node.onomatopoeia})`)
    persistChanges(nextUnlocked, nextEquipped, stance, nextSp)
    showToast(`✨ [${node.name}] 스킬을 배웠어요!`)
  }

  function handleToggleEquip(node: SkillNodeDef) {
    triggerSensoryPreview(node.asmr, `${node.icon} ${node.onomatopoeia}`)
    if (node.kind === 'passive') {
      showToast('💡 패시브 스킬은 배우기만 해도 대전에 자동 적용돼요!')
      return
    }
    if (equipped.includes(node.id)) {
      if (equipped.length <= 1) {
        showToast('⚠️ 최소 1개의 액티브 스킬은 장착해야 해요!')
        return
      }
      const nextEq = equipped.filter((id) => id !== node.id)
      setEquipped(nextEq)
      persistChanges(unlocked, nextEq, stance, sp)
      return
    }
    const nextEq = equipped.length >= 4 ? [...equipped.slice(1), node.id] : [...equipped, node.id]
    setEquipped(nextEq)
    persistChanges(unlocked, nextEq, stance, sp)
    showToast(`🎯 [${node.name}] 스킬을 대전 슬롯에 장착했어요!`)
  }

  function handleChangeStance(nextStance: BattleStanceId) {
    setStance(nextStance)
    triggerSensoryPreview('syrup-drizzle')
    persistChanges(unlocked, equipped, nextStance, sp)
  }

  function handleGrantBonusSp() {
    const nextSp = sp + 2
    setSp(nextSp)
    triggerSensoryPreview('sugar-crack', '빠작-! 보너스 SP +2 획득! ⭐')
    persistChanges(unlocked, equipped, stance, nextSp)
    showToast('🎁 파티세리 연구 보너스로 SP +2를 받았어요!')
  }

  const branchMeta = SKILL_BRANCHES.find((b) => b.id === branch) ?? SKILL_BRANCHES[0]
  const branchNodes = SKILL_NODES_T1.filter((n) => n.branch === branch)
  const reactionClass = burstKey > 0 ? getSensoryReactionClass(burstKind) : ''

  return (
    <main className="screen">
      {/* 상단 바 */}
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🌈 식감 스킬 트리 & 장착</h1>
        <span className="chip honey" style={{ fontWeight: 800 }}>
          ⭐ 보유 SP: {sp}
        </span>
      </div>

      {/* 상단 오감 자극 스킬 시연 스테이지 */}
      <div className="card" style={{ paddingBottom: 14 }}>
        <div className="row wrap between" style={{ gap: 6 }}>
          <span className="chip coral">
            {info?.name ?? monster.species} · Lv.{monster.level}
          </span>
          <button
            className="chip honey"
            onClick={handleGrantBonusSp}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11 }}
          >
            🎁 연구 보너스 SP +2 받기
          </button>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', minHeight: 165, cursor: 'pointer' }}
          onClick={() => triggerSensoryPreview(burstKind)}
          title="캐릭터나 스킬을 누르면 식감 ASMR과 손맛 이펙트가 터져요!"
        >
          <SensoryBurst kind={burstKind} triggerKey={burstKey} bubble={burstBubble} combo={combo} />
          <div
            key={burstKey}
            className={reactionClass}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={160} title={info?.name} />
          </div>
          <Nest width={190} lift={32} front={false} dessertBase={look.mallang?.dessertBase} />
        </div>

        {/* 현재 장착한 액티브 스킬 4칸 */}
        <div>
          <div className="row between" style={{ marginBottom: 6 }}>
            <span className="small" style={{ fontWeight: 800, color: '#3B2F2F' }}>
              ⚔️ 대전 장착 스킬 (최대 4칸 · 누르면 식감 사운드 시연!)
            </span>
            <span className="small" style={{ color: '#FF7A59', fontWeight: 800 }}>
              {equipped.length}/4 장착 중
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[0, 1, 2, 3].map((idx) => {
              const skillId = equipped[idx]
              const skill = SKILL_NODES_T1.find((s) => s.id === skillId)
              return (
                <div
                  key={idx}
                  onClick={() => skill && triggerSensoryPreview(skill.asmr, `${skill.icon} ${skill.onomatopoeia}`)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 14,
                    background: skill ? '#FFF4EE' : '#FAF6EE',
                    border: skill ? '2px solid #FF8A65' : '1.5px dashed #D8C7A8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: skill ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{skill?.icon ?? '➕'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                      {skill ? skill.name : `빈 슬롯 ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 10, color: '#D85A3A', fontWeight: 700 }}>
                      {skill ? skill.onomatopoeia : '아래에서 스킬을 골라 장착하세요'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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

      {/* 전투 성향 4종 선택 카드 */}
      <div className="card">
        <div className="small" style={{ fontWeight: 800, color: '#3B2F2F', marginBottom: 4 }}>
          🧭 자동 대전 전투 성향 (내 디저트가 어떤 스타일로 싸울까요?)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {BATTLE_STANCES.map((st) => {
            const active = stance === st.id
            return (
              <button
                key={st.id}
                onClick={() => handleChangeStance(st.id)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 14,
                  border: active ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                  background: active ? '#FFF2EC' : '#FFFFFF',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                  {st.icon} {st.name}
                </div>
                <div style={{ fontSize: 10, color: '#7A6A60', marginTop: 2 }}>{st.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 6개 식감 스킬 가지 탭 & 노드 목록 */}
      <div className="card">
        <h2 className="title" style={{ fontSize: 18 }}>
          🌳 6대 식감 스킬 가지 (1단계)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {SKILL_BRANCHES.map((b) => {
            const selected = branch === b.id
            return (
              <button
                key={b.id}
                onClick={() => setBranch(b.id)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 14,
                  border: selected ? `2px solid ${b.color}` : '1.5px solid #F0DFB8',
                  background: selected ? '#FFF8F0' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>{b.name}</span>
              </button>
            )
          })}
        </div>

        <div
          style={{
            padding: '8px 12px',
            borderRadius: 14,
            background: '#FFFBF2',
            border: '1.5px solid #F0DFB8',
            fontSize: 11.5,
            color: '#5D4037',
            fontWeight: 700,
          }}
        >
          {branchMeta.icon} <strong>{branchMeta.name}</strong> — {branchMeta.desc}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {branchNodes.map((node) => {
            const isUnlocked = unlocked.includes(node.id)
            const isEquipped = equipped.includes(node.id)
            return (
              <div
                key={node.id}
                style={{
                  padding: '12px',
                  borderRadius: 18,
                  border: isEquipped ? '2px solid #FF7A59' : isUnlocked ? '1.5px solid #76C7A2' : '1.5px solid #F0DFB8',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 28 }}>{node.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="row wrap" style={{ gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#3B2F2F' }}>{node.name}</span>
                    <span
                      className="chip"
                      style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        background: node.kind === 'active' ? '#FFF2EC' : '#E8F8F0',
                        color: node.kind === 'active' ? '#D85A3A' : '#177051',
                      }}
                    >
                      {node.kind === 'active' ? `액티브 · 위력 ${node.power || '보조'}` : '패시브 상시'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#D85A3A', fontWeight: 800, marginTop: 2 }}>
                    🔊 {node.onomatopoeia}
                  </div>
                  <div style={{ fontSize: 11, color: '#7A6A60', marginTop: 2 }}>{node.effectText}</div>
                </div>

                {!isUnlocked ? (
                  <button
                    className="btn"
                    onClick={() => handleUnlock(node)}
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    ⭐ {node.spCost} SP 습득
                  </button>
                ) : node.kind === 'active' ? (
                  <button
                    className={isEquipped ? 'btn mint' : 'btn'}
                    onClick={() => handleToggleEquip(node)}
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    {isEquipped ? '✓ 장착 중' : '장착하기'}
                  </button>
                ) : (
                  <span className="chip mint" style={{ fontSize: 11, fontWeight: 800 }}>
                    ✓ 패시브 적용중
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

