const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 36,
  timestamp: new Date().toISOString(),
  title: '보스레이드 비동기 협동 레이드 참여 전우 진형(누적 피해량 뱃지 및 주둔 구도) & 단독 맹공 탈진 연출 완벽 구현',
  changes: [
    '1. [비동기 협동 레이드 참전 전우 구도]: 단순 관전 응원단이 아닌, 먼저 레이드에 참여하여 보스를 타격 완료한 실제 지인 펫들(몽실, 별비늘, 슈슈, 마포, 흑염, 콩콩)이 거대보스 앞에 주둔.',
    '2. [지인별 누적 피해량 뱃지]: 각 지인 펫 머리 위에 닉네임과 함께 실제 입힌 피해량([🍓 몽실 님 -420], [✨ 별비늘 님 -580], [🍫 마포 님 -610] 등)을 표시하여 누가 와서 공격했는지 한눈에 직관적으로 체감.',
    '3. [상단 HUD 협력 연합 상태바]: 상단 체력바에 [참전 7인 연합 (지인 누적 -2830)]을 표시하여 보스 피를 깎아둔 협력의 성취감과 전우애 극대화.',
    '4. [공격 순번 및 탈진 연출]: 내 펫 머리 위에 [⚔️ 현재 공격 순번: 내 펫 (탈진까지 맹공!)] 표기 및 탈진 시 [😵 탈진... (기여 완료!)]로 이어지는 감동적인 레이드 흐름 완성.'
  ],
  verifiedScreenshots: [
    'after-119-boss-raid-many-allies-and-solo-attack.png',
    'after-120-pokedex-72-showroom-grid.png',
    'after-121-pokedex-3d-eye-detail-modal.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v36-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v36.enc'), combined);

const meta = {
  summary: '보스레이드 비동기 협동 레이드 참전 전우 구도 및 누적 피해량 뱃지 암호화 체크포인트 v36\n- [비동기 협동 참전자]: 먼저 와서 공격을 마친 지인 펫 6마리가 전장에 주둔\n- [누적 피해량 표기]: 지인 머리 위 [몽실 님 -420], [별비늘 님 -580] 등 딜량 표기\n- [HUD 7인 연합]: 지인 누적 -2830 DMG 깎아둔 상태에서 내 펫이 단독 맹공 및 탈진 기여',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v36.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v36 successfully created and encrypted!');

