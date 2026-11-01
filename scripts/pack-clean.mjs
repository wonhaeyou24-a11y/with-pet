// 배포 및 공유용 클린 압축 패키지 생성 스크립트
// 보안 및 최적화를 위해 .git, node_modules, .env.local, dist, 임시 로그 등을 완전히 배제합니다.
import { execSync } from 'node:child_process'

const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const outName = `pet-together-clean-${dateStr}.zip`

console.log(`📦 클린 배포 아카이브 생성 시작: ${outName}...`)

try {
  // git archive 명령어로 버전 관리 대상 정규 소스만 안전하고 신속하게 압축 (.git, node_modules, .env.local 자동 제외)
  execSync(`git archive -o "${outName}" HEAD`, { stdio: 'inherit' })
  console.log(`✅ 클린 압축 파일 생성 완료: ${outName}`)
} catch (err) {
  console.error('❌ 압축 패키징 중 오류 발생:', err.message)
}
