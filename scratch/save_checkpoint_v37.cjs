const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const checkpointData = {
  version: 'v37',
  timestamp: new Date().toISOString(),
  description: '1. 홈 미니룸 새 글 배지 연동, 2. 광장 맵 3D 거대보스 직접 출현 및 레이드 진입 연동, 3. 4인 레이드 잔재 완전 제거 + 지인 펫 8마리 24px 축소 주둔 + 전면 단독 돌격 + 우측 상단 참전 펫 피해량 보드 박스 구현 완료',
  changes: [
    'src/screens/MonsterHome.tsx: loadGuestBook() 연동 및 미니룸 MenuTile에 guestBookCount > 0 ? 새 글 N : undefined 배지 적용',
    'src/screens/DessertPlaza.tsx: 헤더 보스 출현 버튼 제거, 광장 맵 상단 중앙에 WorldBoss3DView 실시간 렌더링 및 클릭 레이드 모달 오픈 연동, 4인 레이드 잔재 문구 수정',
    'src/screens/AsmrBattleArena.tsx: 4인 관련 모든 주석/HUD/텍스트 완전 제거, 지인 펫 8마리 정의 및 prefer2D 24px 초소형 앙증맞은 주둔 진형 배치, 내 펫 단독 전면 돌격 타격, 우측 상단 플로팅 참전 펫 피해량 보드 박스(실시간 내 딜량 포함 랭킹/게이지) 탑재',
  ],
  verifiedArtifacts: [
    'after-122-home-miniroom-badge.png',
    'after-123-plaza-world-boss-3d.png',
    'after-124-boss-raid-damage-board-and-allies.png',
  ],
}

// Zero-Trust Security: AES-256-GCM 암호화
const key = crypto.scryptSync('dessert-pet-master-key-2026', 'salt-dessert-secure-storage-v1', 32)
const iv = crypto.randomBytes(12)
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

let encrypted = cipher.update(JSON.stringify(checkpointData, null, 2), 'utf8', 'hex')
encrypted += cipher.final('hex')
const authTag = cipher.getAuthTag().toString('hex')

const payload = JSON.stringify({
  iv: iv.toString('hex'),
  authTag,
  data: encrypted,
})

const outPath = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d\\checkpoint_v37.enc'
fs.writeFileSync(outPath, payload, 'utf8')
console.log('Checkpoint v37 successfully encrypted and saved to:', outPath)
