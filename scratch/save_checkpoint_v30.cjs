const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 30,
  timestamp: new Date().toISOString(),
  title: '홈화면 하부 중복 의견 창 제거 및 펫창 공간 극대화 완료',
  changes: [
    '홈화면 펫창 하부에 중복 표시되던 자율 제안 카드 제거',
    '펫 머리 위 말풍선 원터치 상호작용으로 소통 UX 단일화',
    '펫창 상하 세로 공간 55px+ 시원하게 확장되어 3D 펫의 존재감 및 화면 개방감 극대화'
  ],
  verifiedScreenshots: [
    'after-103-home-clean-spacious-pet-box.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v30-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v30.enc'), combined);

const meta = {
  summary: '홈화면 하부 중복 의견 창 제거 및 펫창 공간 극대화 완료 암호화 체크포인트 v30\n- [중복 UI 제거]: 펫창 하단 자율 의견 카드 제거\n- [소통 UX 단일화]: 펫 말풍선 원터치 이동으로 단일화\n- [공간 극대화]: 펫창 55px+ 시원하게 확장되어 100dvh 황금비율 완성',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v30.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v30 successfully created and encrypted!');

