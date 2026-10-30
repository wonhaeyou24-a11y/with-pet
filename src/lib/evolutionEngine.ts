// M4 디저트 몬스터 진화 판정 & 실행 엔진
// 1단계 베이비 -> 2단계 파티세리 디저트 (Lv.8) -> 3단계 로얄 마스터 디저트 (Lv.15)
// 4대 분기: sweet-melty(달콤 멜팅), crispy-crunch(크런치 바삭), royal-chef(로얄 셰프), gourmet-rainbow(고메 레인보우)

import { EVO_BRANCHES, SPECIES_EVOLUTIONS } from '../config/evolution'
import { checkEvolutionEligibility as checkEligibility, computeEvolution, type EvoBranchId, type EvolutionEligibility } from '../../supabase/functions/battle/evolution.ts'
import type { MonsterRow, Stats } from './api'
import { IS_DEV_MOCK } from './devMode'
import { SERVER_TIMEOUT_MS, withTimeout } from './net'
import { playDessertAsmr } from './sound'
import { supabase } from './supabase'

export interface EvolutionResult {
  success: boolean
  updatedMonster: MonsterRow
  oldStage: number
  newStage: number
  branch: EvoBranchId
  branchName: string
  newSpeciesTitle: string
  newSpeciesName: string
  statBoost: Partial<Stats>
  bonusSp: number
}

export type { EvolutionEligibility, EvoBranchId }

// 진화 가능 여부 및 추천 갈래 (서버와 같은 계산)
export function checkEvolutionEligibility(monster: MonsterRow): EvolutionEligibility {
  return checkEligibility(monster)
}

// 진화 실행: 스탯 증폭·보너스 SP 계산은 서버와 같은 공용 파일(computeEvolution)을 쓴다.
// 실제 서비스에서는 서버가 이미 진화시킨 몬스터(serverMonster)를 넘겨 받아 이름·소리·도감만 붙인다.
export function executeEvolution(monster: MonsterRow, chosenBranch?: EvoBranchId, serverMonster?: MonsterRow): EvolutionResult {
  const evo = computeEvolution(monster, chosenBranch)
  const { nextStage, branch, statBoost, bonusSp } = evo
  const branchMeta = EVO_BRANCHES[branch]
  const newStats: Stats = serverMonster?.stats ?? evo.newStats
  const currentStage = evo.oldStage

  // 종족 진화 명칭 조회
  const evoData = SPECIES_EVOLUTIONS[monster.species]
  let newSpeciesName = `${monster.name} (${branchMeta.name})`
  let newSpeciesTitle = `${branchMeta.name} 파티세리`

  if (evoData) {
    if (nextStage === 2) {
      newSpeciesName = evoData.stageNames[2]?.[branch] ?? newSpeciesName
      newSpeciesTitle = evoData.titles[2]?.[branch] ?? newSpeciesTitle
    } else if (nextStage === 3) {
      newSpeciesName = evoData.stageNames[3]?.[branch] ?? newSpeciesName
      newSpeciesTitle = evoData.titles[3]?.[branch] ?? newSpeciesTitle
    }
  }

  const updatedMonster: MonsterRow = {
    ...(serverMonster ?? monster),
    evo_stage: nextStage,
    evo_branch: branch,
    stats: newStats,
    sp: serverMonster?.sp ?? evo.newSp,
    title: newSpeciesTitle,
  }

  // 진화 고유 ASMR 사운드 재생
  try {
    playDessertAsmr(branchMeta.asmr)
    setTimeout(() => {
      playDessertAsmr('sugar-crack')
    }, 400)
  } catch (err) {
    console.warn('[Evolution] ASMR 사운드 재생 예외 안전 격리:', err)
  }

  // 개발용 로컬 모드에서만 기기에 기록한다 (실서비스는 서버 트리거가 기록)
  if (IS_DEV_MOCK) recordDiscoveredDexEntry(monster.species, nextStage, branch)

  return {
    success: true,
    updatedMonster,
    oldStage: currentStage,
    newStage: nextStage,
    branch,
    branchName: branchMeta.name,
    newSpeciesTitle,
    newSpeciesName,
    statBoost: statBoost as Partial<Stats>,
    bonusSp,
  }
}

const DEX_STORAGE_KEY = 'pet_dessert_dex_unlocked_v1'

// 도감 해금 기록 함수
export function recordDiscoveredDexEntry(species: string, stage: number, branch?: EvoBranchId): void {
  try {
    const raw = localStorage.getItem(DEX_STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const key = `${species}_stage${stage}_${branch || 'base'}`
    if (!list.includes(key)) {
      list.push(key)
      localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify(list))
    }
  } catch (e) {
    console.warn('[Dex] 도감 기록 저장 실패 방어:', e)
  }
}

// 도감 해금 목록 조회: 실서비스는 서버(players.dex_unlocked), 개발용 로컬 모드는 기기 저장소
export async function fetchDiscoveredDexEntries(): Promise<Set<string>> {
  if (IS_DEV_MOCK) return getDiscoveredDexEntries()
  const { data: sess } = await supabase.auth.getSession()
  const uid = sess.session?.user.id
  if (!uid) return new Set()
  const { data, error } = await withTimeout(
    Promise.resolve(supabase.from('players').select('dex_unlocked').eq('id', uid).maybeSingle()),
    SERVER_TIMEOUT_MS,
  )
  if (error) throw error
  const list = (data as { dex_unlocked?: unknown } | null)?.dex_unlocked
  return new Set(Array.isArray(list) ? (list as string[]) : [])
}

export function getDiscoveredDexEntries(): Set<string> {
  try {
    const raw = localStorage.getItem(DEX_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

