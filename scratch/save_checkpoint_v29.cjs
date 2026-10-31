const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 29,
  timestamp: new Date().toISOString(),
  title: '5대 사용자 피드백 반영 및 감성 BGM·능력치 확장 완료',
  changes: [
    '홈 화면 펫창 아래 레벨 뱃지 1줄 일렬 정렬 (flexWrap nowrap 및 칩 패딩 최적화)',
    '펫 컨테이너 하향 이동(paddingTop 34px) 및 말풍선 헤드룸 분리로 펫 머리 겹침 원천 차단',
    '확률 밸런싱: 장비 10강 성공률 20% -> 5% (비용 3500), 9강 15%, 8강 25%, 30층 이상 전설 장비 드롭률 30% -> 15%로 희소성 강화 및 DB 동기화',
    '미니룸 4대 감성 BGM 엔진 탑재: 파도소리(ocean), 숲속바람(forest), 짐노페디 클래식 오르골(classical), 파티세리 왈츠(waltz) 및 선택 팝오버 모달 구현',
    '능력치 게이지 한계 동적 확장: 진화 단계별 100 -> 180 -> 300+ 자동 확장 적용'
  ],
  verifiedScreenshots: [
    'after-99-home-pet-single-line-and-headroom.png',
    'after-100-home-pet-single-line-and-headroom.png',
    'after-101-training-dynamic-stat-bars.png',
    'after-102-myroom-bgm-picker-modal-real.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v29-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v29.enc'), combined);

const meta = {
  summary: '5대 사용자 피드백 반영 및 감성 BGM·능력치 확장 완료 암호화 체크포인트 v29\n- [홈 레벨 뱃지 1줄 정렬]: 종족·식감·속성·레벨 뱃지 일렬 정렬\n- [말풍선 겹침 해소]: 펫 위치 34px 하향 및 헤드룸 확보로 펫 머리 노출\n- [하드코어 확률 밸런싱]: 10강 성공률 5%, 전설 드롭률 15% 조정 및 DB 마이그레이션 100% 동기화\n- [미니룸 4대 BGM 선택]: 파도소리·숲속바람·짐노페디 클래식 오르골·파티세리 왈츠 신디사이저 탑재\n- [능력치 한계 동적 확장]: 진화 단계별 100/180/300+ 자동 확장',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v29.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v29 successfully created and encrypted!');

