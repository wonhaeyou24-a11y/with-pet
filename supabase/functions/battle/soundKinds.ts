// 식감 ASMR 사운드 종류와 종족별 고유 사운드 매핑 (순수 코드: 서버 대전 엔진과 클라이언트가 같이 쓴다)

export type DessertSoundKind =
  | 'kataifi-crunch' // 💚 두바이 쫀득쿠키: 바사삭! 카다이프 면발 & 피스타치오 크런치
  | 'wax-pop' // 🫧 왁뿌볼: 단단한 왁스 껍질이 꾹 눌리다 아-그-작 깨지고, 속의 말랑한 점액이 쭈욱 새는 소리
  | 'wax-tap' // 🫧 왁뿌볼 선택음: 버튼을 누를 때 나는 짧은 아그작 (기본 버튼 소리)
  | 'cookie-crisp' // 🍪 초코칩 쿠키 / 크로플: 오독오독 바삭한 버터 쿠키 베어무는 소리
  | 'sugar-crack' // 🍓 유리알 탕후루: 빠작! 톡! 얇고 투명한 설탕 코팅이 경쾌하게 깨지는 소리
  | 'mochi-squish' // 🍡 찹쌀떡 모찌: 쫀득~ 말랑말랑 찰떡 반죽이 늘어났다 떼어지는 소리
  | 'pudding-jiggle' // 🍮 말랑 푸딩: 탱글탱글~ 뽀용! 부드럽게 출렁이는 탄성 진동음
  | 'jelly-gummy' // 🐻 쫀득 젤리: 쫘압- 쫀득쫀득 고탄성 과일 구미 젤리 씹는 소리
  | 'choco-melt' // 🍫 달콤 퐁듀 초코: 사르르~ 꾸덕하고 따뜻한 가나슈·시럽 기포 소리
  | 'cotton-puff' // ☁️ 몽실 솜사탕: 사르르~ 입안에서 보송보송 녹아내리는 극상의 에어리 사운드
  | 'acorn-snap' // 🌰 콩콩 도토리: 또각- 딱! 고소하고 야무진 너츠 크래킹 소리
  | 'soda-fizz' // ⚡ 번개꼬리 탄산 소다: 톡톡 파바박! 탄산 기포가 청량하게 터지는 스파클링 소리
  | 'biscuit-armor' // 🛡️ 강철등 비스킷: 콰득- 단단한 통밀 비스킷 판갑이 묵직하게 부서지는 소리
  | 'flambe-crackle' // 🔥 흑염 다크초코: 타닥타닥- 진한 다크초코 카라멜라이징 크림 브륄레 소리
  | 'starlight-ting' // ✨ 별비늘 별사탕: 팅- 챠르릉! 투명한 설탕 결정체가 부딪치는 영롱한 크리스탈 소리
  | 'chameleon-morph' // 🦎 말랑 카멜레온: 뽀요용~ 찰떡 반죽이 카멜레온처럼 변형되는 마법 모찌음
  | 'syrup-drizzle' // 🍒 시럽 & 스프링클 토핑: 쪼르륵~ 반짝반짝 토핑 구슬이 쏟아지는 소리
  | 'smore-sizzle' // 🔥 구운 스모어 마시멜로: 치익~ 노릇하게 구워진 마시멜로 껍질 바스락 & 폭신 사운드

// 종족/변신 체형에 따른 1:1 고유 리얼 ASMR 사운드 매핑 (15종 전 종족 중복 배제)
export function getSpeciesSoundKind(speciesId: string, dessertBase?: string): DessertSoundKind {
  // 1. 15종 개별 고유 종족 매핑
  if (speciesId === 'dubai-cookie') return 'kataifi-crunch'
  if (speciesId === 'wax-ball') return 'wax-pop'
  if (speciesId === 'tanghulu') return 'sugar-crack'
  if (speciesId === 'smore') return 'smore-sizzle'
  if (speciesId === 'pudding') return 'pudding-jiggle'
  if (speciesId === 'jelly') return 'jelly-gummy'
  if (speciesId === 'choco') return 'choco-melt'
  if (speciesId === 'mongsil') return 'cotton-puff'
  if (speciesId === 'kongkong') return 'acorn-snap'
  if (speciesId === 'beongaekkori') return 'soda-fizz'
  if (speciesId === 'gangcheoldeung') return 'biscuit-armor'
  if (speciesId === 'heugyeom') return 'flambe-crackle'
  if (speciesId === 'byeolbineul') return 'starlight-ting'
  if (speciesId === 'chameleon') return 'chameleon-morph'
  if (speciesId === 'mochi') return 'mochi-squish'

  // 2. 플레이팅 받침대 폴백
  if (dessertBase === 'choco-cookie') return 'cookie-crisp'
  if (dessertBase === 'custard-pudding') return 'pudding-jiggle'
  if (dessertBase === 'parfait-cup') return 'soda-fizz'
  if (dessertBase === 'macaron-cushion') return 'cotton-puff'
  return 'mochi-squish'
}
