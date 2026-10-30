// 개발용 로컬 모드: 서버 없이 화면만 확인하는 가짜 로그인·로컬 부화·로컬 돌보기.
// 개발 서버(npm run dev)에서 주소 끝에 ?dev=true 를 붙이거나 localStorage.dev_bypass=true 일 때만 켜진다.
// 배포 빌드에서는 import.meta.env.DEV 가 false 라서 이 값이 항상 false 이고, 로컬 모드 코드는 실행되지 않는다.
export const IS_DEV_MOCK: boolean =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  (window.location.search.includes('dev=true') || localStorage.getItem('dev_bypass') === 'true')
