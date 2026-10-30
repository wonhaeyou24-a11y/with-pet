// 대전 계산은 서버(battle 함수)와 같은 파일을 쓴다: supabase/functions/battle/engine.ts
export * from '../../supabase/functions/battle/engine.ts'

import type { MonsterRow } from './api'

// 지인 디저트 쇼케이스 광장 기본 파트너 5인 (실제 유저 몬스터와 함께 광장에 전시되어 언제든 구경·좋아요·친선전 가능)
export interface PlazaFriendEntry {
  ownerNickname: string
  badge: string
  bio: string
  likes: number
  monster: MonsterRow
  comments: { author: string; emoji: string; text: string }[]
}

export const PLAZA_SHOWCASE_FRIENDS: PlazaFriendEntry[] = [
  {
    ownerNickname: '민트파티시에',
    badge: '🥄 연습 상대',
    bio: '피스타치오 크림을 듬뿍 채운 바사삭 두바이 쫀득쿠키예요! 소리 켜고 눌러보세요 💚',
    likes: 84,
    comments: [],
    monster: {
      id: 'friend-dubai-1',
      owner: 'friend-1',
      name: '카다이프킹',
      species: 'dubai-cookie',
      element: 'earth',
      element2: 'fire',
      level: 5,
      trait: '황금카다이프',
      fav_food: '피스타치오 크림',
      discovered_fav: true,
      personality_active: 28,
      personality_bond: 15,
      is_shiny: true,
      mutation: 'gold',
      hatched_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      talents: { hp: 12, atk: 14, def: 11, spd: 8, int: 10, cha: 15 },
      stats: { hp: 58, atk: 48, def: 46, spd: 34, int: 40, cha: 56 },
      equipped_skills: ['kataifi-strike', 'cookie-flurry', 'sugar-shield', 'element-drizzle'],
      battle_stance: 'aggressive',
      parts: {
        palette: 0,
        bodyType: 'chubby',
        scale: 1.05,
        ears: 1,
        tail: 0,
        top: 0,
        expression: 'round',
        patternSeed: 777,
        shiny: true,
        mallang: {
          morphForm: 'dubai-cookie',
          dessertBase: 'choco-cookie',
          syrups: ['choco-drizzle', 'matcha-powder'],
          decorations: { head: 'cream-cherry', effect: 'star-powder', dye: 3 },
        },
      },
    },
  },
]
