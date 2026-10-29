// M4 디저트 3단계 진화 시스템 & 4대 갈래 카탈로그 설정
// 1단계 베이비 디저트 ➔ 2단계 파티세리 디저트 ➔ 3단계 로얄 마스터 디저트

import type { Stats } from '../lib/api'
import type { DessertSoundKind } from '../lib/sound'

export type EvoBranchId = 'sweet-melty' | 'crispy-crunch' | 'royal-chef' | 'gourmet-rainbow'

export interface EvoBranchInfo {
  id: EvoBranchId
  name: string
  subtitle: string
  icon: string
  color: string
  auraColor: string
  desc: string
  favoredStats: (keyof Stats)[]
  conditionHint: string
  asmr: DessertSoundKind
}

export const EVO_BRANCHES: Record<EvoBranchId, EvoBranchInfo> = {
  'sweet-melty': {
    id: 'sweet-melty',
    name: '달콤 멜팅계',
    subtitle: '사르르 녹아내리는 크림·시럽',
    icon: '💖',
    color: '#FF4081',
    auraColor: '#FF80AB',
    desc: '당충전과 달콤함을 듬뿍 받고 자라난 부드럽고 사랑스러운 디저트 계통입니다.',
    favoredStats: ['hp', 'cha'],
    conditionHint: '달콤함 80 이상 유지 & 달콤 토핑 위주 급여 & 응석 성향',
    asmr: 'syrup-drizzle',
  },
  'crispy-crunch': {
    id: 'crispy-crunch',
    name: '크런치 바삭계',
    subtitle: '단단하고 고소한 카다이프·견과',
    icon: '🌾',
    color: '#FF9800',
    auraColor: '#FFB74D',
    desc: '혹독한 토핑 다지기 훈련과 디저트 타워를 돌파하며 단단한 크런치 껍질을 다진 계통입니다.',
    favoredStats: ['atk', 'def'],
    conditionHint: '근력/방어 훈련 집중 & 디저트 타워 3층 이상 돌파 & 활발 성향',
    asmr: 'kataifi-crunch',
  },
  'royal-chef': {
    id: 'royal-chef',
    name: '로얄 파티세리계',
    subtitle: '지혜로운 황금 레시피 마스터',
    icon: '👑',
    color: '#7C4DFF',
    auraColor: '#B388FF',
    desc: '비밀 파티세리 레시피를 연구하고 지능을 갈고닦아 궁극의 조화로운 맛을 빚는 계통입니다.',
    favoredStats: ['int', 'spd'],
    conditionHint: '시크릿 레시피 훈련 집중 & 지능 40 이상 & 차분 성향',
    asmr: 'sugar-crack',
  },
  'gourmet-rainbow': {
    id: 'gourmet-rainbow',
    name: '고메 레인보우계',
    subtitle: '모든 식감이 어우러진 올라운더',
    icon: '🌈',
    color: '#00B0FF',
    auraColor: '#80D8FF',
    desc: '모든 영양소와 토핑을 골고루 맛보고 6대 능력치가 균형 있게 성장한 전설의 미식 계통입니다.',
    favoredStats: ['hp', 'atk', 'def', 'spd', 'int', 'cha'],
    conditionHint: '골고루 토핑 3종 급여 & 전 능력치 편차 10 이내',
    asmr: 'wax-pop',
  },
}

export interface SpeciesEvoData {
  baseSpecies: string
  stageNames: {
    1: string
    2: Record<EvoBranchId, string>
    3: Record<EvoBranchId, string>
  }
  titles: {
    1: string
    2: Record<EvoBranchId, string>
    3: Record<EvoBranchId, string>
  }
}

// 8대 메인 디저트 종족별 3단계 진화 명칭 및 칭호 데이터베이스
export const SPECIES_EVOLUTIONS: Record<string, SpeciesEvoData> = {
  mochi: {
    baseSpecies: 'mochi',
    stageNames: {
      1: '아기 딸기모찌',
      2: {
        'sweet-melty': '생크림 딸기모찌',
        'crispy-crunch': '구운 카다이프모찌',
        'royal-chef': '파티세리 모찌쉐프',
        'gourmet-rainbow': '무지개 글레이즈모찌',
      },
      3: {
        'sweet-melty': '로얄 멜팅 스트로베리 퀸',
        'crispy-crunch': '패왕 크런치 모찌 엠페러',
        'royal-chef': '그랜드 마스터 모찌 대현자',
        'gourmet-rainbow': '천상의 무지개 고메 모찌신',
      },
    },
    titles: {
      1: '말랑말랑 햇찹쌀떡',
      2: {
        'sweet-melty': '포근한 딸기생크림',
        'crispy-crunch': '바삭하게 구운 찹쌀',
        'royal-chef': '일급 레시피 조리장',
        'gourmet-rainbow': '오색 무지개 미식가',
      },
      3: {
        'sweet-melty': '달콤한 사랑의 딸기 여왕',
        'crispy-crunch': '부서지지 않는 바삭함의 지배자',
        'royal-chef': '파티세리 왕국의 전설',
        'gourmet-rainbow': '오감을 초월한 절대 미식',
      },
    },
  },
  'dubai-cookie': {
    baseSpecies: 'dubai-cookie',
    stageNames: {
      1: '두바이 쫀득쿠키',
      2: {
        'sweet-melty': '피스타치오 가나슈쿠키',
        'crispy-crunch': '황금 카다이프 크런치쿠키',
        'royal-chef': '두바이 황실 골드쿠키',
        'gourmet-rainbow': '에메랄드 고메쿠키',
      },
      3: {
        'sweet-melty': '초콜릿 오아시스 멜팅술사',
        'crispy-crunch': '사막의 패자 카다이프 워로드',
        'royal-chef': '황금 궁전의 로얄 파티시에',
        'gourmet-rainbow': '천일야화의 기적 두바이 군주',
      },
    },
    titles: {
      1: '피스타치오와 카다이프의 만남',
      2: {
        'sweet-melty': '진한 피스타치오 가나슈',
        'crispy-crunch': '사막을 뒤흔드는 바삭함',
        'royal-chef': '두바이 황실 조달 장인',
        'gourmet-rainbow': '일곱 빛깔 에메랄드',
      },
      3: {
        'sweet-melty': '달콤함으로 녹아내리는 기적',
        'crispy-crunch': '백만 가닥의 카다이프 군주',
        'royal-chef': '세계 최고의 황금 레시피',
        'gourmet-rainbow': '영원히 바삭한 황금 신화',
      },
    },
  },
  'wax-ball': {
    baseSpecies: 'wax-ball',
    stageNames: {
      1: '톡톡 과즙 왁싱볼',
      2: {
        'sweet-melty': '멜팅 시럽 왁스볼',
        'crispy-crunch': '크래킹 밀랍 왁싱볼',
        'royal-chef': '연금술 크리스탈 왁스볼',
        'gourmet-rainbow': '오로라 쥬시 왁스볼',
      },
      3: {
        'sweet-melty': '과즙 퐁듀 여왕 볼',
        'crispy-crunch': '파열의 굉음 왁스 타이탄',
        'royal-chef': '비약의 대가 크리스탈 군주',
        'gourmet-rainbow': '무지개 과즙의 신화적 결정체',
      },
    },
    titles: {
      1: '톡 터지는 과즙 밀랍 구슬',
      2: {
        'sweet-melty': '달콤한 과일 시럽 코어',
        'crispy-crunch': '경쾌한 파열음의 명수',
        'royal-chef': '농축 과즙 연금술사',
        'gourmet-rainbow': '빛나는 프리즘 과즙',
      },
      3: {
        'sweet-melty': '온 세상을 달콤하게 물들이는 자',
        'crispy-crunch': '천지를 진동시키는 크래킹',
        'royal-chef': '신비의 비약 제조 장인',
        'gourmet-rainbow': '오감 자극의 절대 군주',
      },
    },
  },
  tanghulu: {
    baseSpecies: 'tanghulu',
    stageNames: {
      1: '유리알 탕후루',
      2: {
        'sweet-melty': '허니 시럽 탕후루',
        'crispy-crunch': '다이아몬드 크리스탈 탕후루',
        'royal-chef': '슈가 크래프트 탕후루',
        'gourmet-rainbow': '무지개 과일 모둠 탕후루',
      },
      3: {
        'sweet-melty': '달콤한 유리궁전 탕후루 퀸',
        'crispy-crunch': '철옹성 슈가 아머 엠페러',
        'royal-chef': '설탕 공예의 전설 마이스터',
        'gourmet-rainbow': '영원의 무지개 보석 탕후루신',
      },
    },
    titles: {
      1: '빠작거리는 설탕 코팅',
      2: {
        'sweet-melty': '꿀처럼 흐르는 글레이즈',
        'crispy-crunch': '다이아몬드 설탕 껍질',
        'royal-chef': '섬세한 설탕 결정 세공사',
        'gourmet-rainbow': '다채로운 과일의 하모니',
      },
      3: {
        'sweet-melty': '유리알처럼 투명한 사랑',
        'crispy-crunch': '뚫을 수 없는 다이아몬드 코팅',
        'royal-chef': '왕실 공인 유리공예 거장',
        'gourmet-rainbow': '빛을 굴절시키는 찬란한 신성',
      },
    },
  },
  pudding: {
    baseSpecies: 'pudding',
    stageNames: {
      1: '말랑 푸딩',
      2: {
        'sweet-melty': '커스터드 멜팅 푸딩',
        'crispy-crunch': '브륄레 크러스트 푸딩',
        'royal-chef': '로얄 카라멜 푸딩',
        'gourmet-rainbow': '레인보우 젤리 푸딩',
      },
      3: {
        'sweet-melty': '사르르 카라멜 푸딩 여왕',
        'crispy-crunch': '크렘브륄레 브레이커',
        'royal-chef': '벨벳 커스터드 대공작',
        'gourmet-rainbow': '탱글함의 정점 푸딩 대성자',
      },
    },
    titles: {
      1: '탱글탱글 흔들리는 커스터드',
      2: {
        'sweet-melty': '카라멜이 찰랑이는 푸딩',
        'crispy-crunch': '윗면을 바삭하게 태운 브륄레',
        'royal-chef': '황금 배합 커스터드 장인',
        'gourmet-rainbow': '탱글한 오색 젤리 레이어',
      },
      3: {
        'sweet-melty': '모든 피로를 녹이는 달콤함',
        'crispy-crunch': '바삭함과 탱글함의 완벽한 반전',
        'royal-chef': '벨벳처럼 매끄러운 왕실 디저트',
        'gourmet-rainbow': '절대 흔들리지 않는 중심',
      },
    },
  },
  jelly: {
    baseSpecies: 'jelly',
    stageNames: {
      1: '쫀득 젤리',
      2: {
        'sweet-melty': '시럽 구미 젤리',
        'crispy-crunch': '슈가파우더 구미베어',
        'royal-chef': '엘릭서 젤리 메이지',
        'gourmet-rainbow': '오로라 트위스트 젤리',
      },
      3: {
        'sweet-melty': '말랑 탄력의 구미 엠프레스',
        'crispy-crunch': '수정 결정 젤리 골렘',
        'royal-chef': '기적의 마법 젤리 대현자',
        'gourmet-rainbow': '우주를 품은 환상의 젤리신',
      },
    },
    titles: {
      1: '통통 튀는 구미베어',
      2: {
        'sweet-melty': '촉촉한 과일시럽 코팅',
        'crispy-crunch': '설탕가루를 입힌 강탄력',
        'royal-chef': '영양 가득 젤리 조제사',
        'gourmet-rainbow': '빛을 머금은 프리즘',
      },
      3: {
        'sweet-melty': '부드럽고 끈끈한 사랑의 힘',
        'crispy-crunch': '무적의 탄성을 지닌 수호자',
        'royal-chef': '무한한 맛을 창조하는 마법',
        'gourmet-rainbow': '영롱하게 반짝이는 은하수',
      },
    },
  },
  choco: {
    baseSpecies: 'choco',
    stageNames: {
      1: '달콤 초코',
      2: {
        'sweet-melty': '퐁듀 가나슈 초코',
        'crispy-crunch': '크런치 초코바',
        'royal-chef': '수제 트러플 쇼콜라티에',
        'gourmet-rainbow': '마블 프랄린 초코',
      },
      3: {
        'sweet-melty': '다크 가나슈 퐁듀 엠페러',
        'crispy-crunch': '흑철 크런치 초코 타이탄',
        'royal-chef': '쇼콜라티에 최고 거장',
        'gourmet-rainbow': '환상의 카카오 마법 군주',
      },
    },
    titles: {
      1: '진하고 쌉싸름한 카카오',
      2: {
        'sweet-melty': '따뜻하게 녹아내리는 퐁듀',
        'crispy-crunch': '오독오독 아몬드 초코',
        'royal-chef': '장인의 손길이 담긴 트러플',
        'gourmet-rainbow': '화려한 마블링의 예술품',
      },
      3: {
        'sweet-melty': '지친 영혼을 녹이는 힐러',
        'crispy-crunch': '단단한 다크초콜릿 철벽',
        'royal-chef': '카카오 왕국의 최고 권위자',
        'gourmet-rainbow': '천상의 풍미를 빚는 마스터',
      },
    },
  },
  smore: {
    baseSpecies: 'smore',
    stageNames: {
      1: '스모어 마시멜로',
      2: {
        'sweet-melty': '멜팅 카라멜 스모어',
        'crispy-crunch': '그레이엄 크래커 스모어',
        'royal-chef': '캠프파이어 수석 쉐프',
        'gourmet-rainbow': '파스텔 마시멜로 스모어',
      },
      3: {
        'sweet-melty': '골든 멜팅 스모어 퀸',
        'crispy-crunch': '비스킷 크러스트 브레이커',
        'royal-chef': '화염의 마스터 바비큐 킹',
        'gourmet-rainbow': '오색 불꽃의 전설적 스모어',
      },
    },
    titles: {
      1: '노릇노릇 구운 마시멜로',
      2: {
        'sweet-melty': '쭉 늘어나는 달콤함',
        'crispy-crunch': '바삭한 크래커의 샌드',
        'royal-chef': '모닥불 레시피 지휘자',
        'gourmet-rainbow': '폭신하고 따스한 온기',
      },
      3: {
        'sweet-melty': '영원히 따뜻한 온기',
        'crispy-crunch': '단단한 크래커 방패',
        'royal-chef': '불꽃을 자유자재로 다루는 자',
        'gourmet-rainbow': '빛나는 밤하늘의 축제',
      },
    },
  },
  chameleon: {
    baseSpecies: 'chameleon',
    stageNames: {
      1: '말랑 카멜레온',
      2: {
        'sweet-melty': '시럽 글레이즈 카멜레온',
        'crispy-crunch': '바삭 슈가스케일 카멜레온',
        'royal-chef': '아르카나 쉐프 카멜레온',
        'gourmet-rainbow': '무지개 미라클 카멜레온',
      },
      3: {
        'sweet-melty': '사르르 위장의 멜팅 로드',
        'crispy-crunch': '강철 비늘의 크런치 가디언',
        'royal-chef': '대현자 파티세리 카멜레온',
        'gourmet-rainbow': '전지전능한 천상의 무지개룡',
      },
    },
    titles: {
      1: '어떤 색으로든 변신하는 친구',
      2: {
        'sweet-melty': '달콤한 시럽 보호색',
        'crispy-crunch': '단단한 설탕 비늘',
        'royal-chef': '변신의 마법을 깨달은 자',
        'gourmet-rainbow': '모든 디저트의 빛을 품은 자',
      },
      3: {
        'sweet-melty': '마음을 녹이는 절대 은신',
        'crispy-crunch': '파괴할 수 없는 바삭한 비늘',
        'royal-chef': '모든 조리법을 통달한 현자',
        'gourmet-rainbow': '오감을 지배하는 무지개 신룡',
      },
    },
  },
}

// 진화 단계별 요구 레벨 및 스탯 성장치
export const EVO_STAGE_REQUIREMENTS = {
  1: { level: 1, label: '베이비' },
  2: { level: 8, label: '파티세리' }, // 1차 진화: 8레벨 달성 시
  3: { level: 15, label: '로얄 마스터' }, // 2차 최종 진화: 15레벨 달성 시
} as const

