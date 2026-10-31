const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 27,
  timestamp: new Date().toISOString(),
  title: '5대 게임플레이 개선 및 레이아웃 최적화 완료',
  changes: [
    '타워 던전 시작 전 공격 모션/러닝/대미지 버그 원천 차단 및 185px 수호자 대기 스테이지 구현',
    '홈 화면 메뉴 8개 타일 컴팩트 복원 (식감스킬트리+장비강화+진화의전당 -> 성장·강화 통합 허브 모달, 탐험 배치)',
    '신규 M5 장기 탐험(1~8시간) 시스템 PWA 브라우저 자동 푸시 알림 예약 연동',
    '탐험 중 홈 화면 상단 Status Badge 및 훈련 화면 잠금 배너/버튼 차단 가드 적용',
    '홈 화면 펫 생각 말풍선 13px 확대, 볼드 폰트, 말풍선 꼬리표 추가, 헤드룸 상단 배치로 겹침 방지',
    '부티크 상점 장식품·가구·받침대·테마 가격 3~5배 상향 조정 (150~1500 리본 코인) 및 DB 마이그레이션 100% 동기화'
  ],
  verifiedScreenshots: [
    'after-92-home-8-tiles-and-balloon.png',
    'after-93-home-growth-hub-modal.png',
    'after-94-training-tower-standby-no-attack.png',
    'after-95-boutique-updated-prices.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v27-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v27.enc'), combined);

const meta = {
  summary: '5대 게임플레이 개선 및 레이아웃 최적화 완료 암호화 체크포인트 v27\n- [타워 액션 버그 해결]: 타워 시작 전 공격 모션 차단 및 출격 대기 스테이지 전환\n- [홈 화면 8개 타일 복원]: 성장·강화 통합 허브 모달 및 탐험 타일 배치\n- [M5 탐험 자동 알림]: PWA 시스템 알림 스케줄러 연계\n- [탐험 상태 뱃지 & 펫 말풍선]: 홈 뱃지, 훈련 잠금 배너, 13px 꼬리표 말풍선 헤드룸 배치\n- [부티크 장식품 가격 상향]: 3~5배 밸런스 조정 및 DB 마이그레이션 자동 동기화',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v27.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v27 successfully created and encrypted!');

