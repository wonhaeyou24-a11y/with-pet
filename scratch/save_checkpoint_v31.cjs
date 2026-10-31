const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 31,
  timestamp: new Date().toISOString(),
  title: '강화 10강 및 전설 드롭률 1% 하향 + 장기 라이브 서비스 종합 확장 Phase 1 완벽 구현',
  changes: [
    '1. [하드코어 파밍 밸런스]: 10강(MAX) 강화 성공률 1% 및 비용 5,000코인, 30층 이상 타워 보스 전설 장비 드롭률 1% 하향 적용 및 DB 마이그레이션 동기화 (npm run test:gear 통과)',
    '2. [부티크 신규 4종 특수효과 FX]: 영롱한 궤도 오라(💫), 달콤 슈가 발자국(🐾), 천사 머랭 날개(🪽), 감정 이모티콘 크라운(💖) 추가 및 DB 가격표/마이그레이션 동기화 (npm run test:shop 통과)',
    '3. [미니룸 가구 실시간 상호작용 & Living Room]: 펫이 가구 터치 및 자율 산책 시 소파 낮잠(zzz 플로팅), 트램펄린 뽀용 점프, 초코분수 냠냠 모션 구현 및 발자국 파티클 트레일 연동',
    '4. [미니룸 공간 규격 확장 시스템]: 1단 아늑한 다락방, 2단 복층 카페(2층 난간/계단), 3단 슈가 팰리스(샹들리에) 테라스 3단계 확장 기능 해금',
    '5. [디저트 월드 보스 레이드 스케줄러]: 매일 12:30 슈가 크리스탈 골렘, 20:00 다이맥스 카다이프 드래곤 정기 출현 타임테이블 및 DESSERT MAX 4인 협력 파티 레이드 토벌 연동'
  ],
  verifiedScreenshots: [
    'after-104-home-live-ready.png',
    'after-105-myroom-living-interaction.png',
    'after-106-boutique-new-fx-items.png',
    'after-107-plaza-world-boss-scheduler.png',
    'after-108-gear-1percent-balance.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v31-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v31.enc'), combined);

const meta = {
  summary: '10강 1% 밸런스 및 장기 라이브 서비스 확장 Phase 1 암호화 체크포인트 v31\n- [1% 하드코어 밸런스]: 10강 1% & 타워 30층 전설 드롭률 1% 엄격 적용\n- [부티크 4종 FX]: 궤도 오라, 슈가 발자국, 천사 머랭 날개, 이모티콘 크라운\n- [미니룸 Living Room]: 가구 낮잠/점프 자율 인터랙션 & 복층 테마 확장\n- [월드 보스 레이드]: 12:30 슈가 골렘, 20:00 카다이프 드래곤 실시간 정기 출현 스케줄러 연동',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v31.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v31 successfully created and encrypted!');

