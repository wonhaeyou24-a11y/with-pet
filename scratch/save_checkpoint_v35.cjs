const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 35,
  timestamp: new Date().toISOString(),
  title: '보스레이드 지인 펫 옹기종기 미니 배치 & 머리위 닉네임 라벨 & 내 펫 단독 전면 돌격 탈진 타격 액션, 5대 개성 3D 눈매 시스템, 72종 전종 디저트 도감 쇼룸 모드 완벽 구현',
  changes: [
    '1. [보스레이드 지인 참여자 옹기종기 미니 구도]: 4인 고정에서 벗어나 6~8명의 지인 펫(몽실, 별비늘, 슈슈, 마포, 흑염, 콩콩)을 34px 아담한 미니 크기로 거대보스 앞 좌우 뒤편에 겹침 없이 옹기종기 배치. 각 펫 머리 위에 [🍓 몽실 님 펫] 소유자 뱃지와 콩콩 응원 모션 연동.',
    '2. [내 펫 단독 전면 돌격 & 탈진 타격 연출]: 공격하는 나(내 펫)만 지인들 앞 중앙으로 튀어나와 72px 당당한 체구로 거대보스를 홀로 타격하며, 탈진(cHp <= 0) 시 [😵 탈진... (쓰러짐)] 뱃지와 함께 바닥에 쓰러지는 극적 연출 적용.',
    '3. [디저트 펫 3D 눈매 5대 다양화 시스템]: Monster3DView.tsx에 종족 및 진화 분기(sleepy, sharp, star, round)에 따른 3D 눈매 형태, 각도, 십자 별빛/다이아몬드 하이라이트, 디저트 속성별 눈동자 색상 차별화 로직 구현.',
    '4. [전체 72종 전종 도감 쇼룸 모드]: DessertPokedex.tsx에 getBranchExpression을 연결하여 72종마다 고유한 눈매를 부여하고, 헤더에 [👁️ 72종 쇼룸 ON] 모드를 탑재하여 8대 종족 × 9개 진화 형태 총 72종의 3D 모델과 스토리, ASMR을 즉시 모두 감상할 수 있도록 구현.'
  ],
  verifiedScreenshots: [
    'after-119-boss-raid-many-allies-and-solo-attack.png',
    'after-120-pokedex-72-showroom-grid.png',
    'after-121-pokedex-3d-eye-detail-modal.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v35-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v35.enc'), combined);

const meta = {
  summary: '보스레이드 지인 펫 옹기종기 미니 배치 & 머리위 라벨, 내 펫 단독 전면 돌격 탈진 타격 액션, 5대 개성 3D 눈매 시스템, 72종 전종 도감 쇼룸 암호화 체크포인트 v35\n- [보스레이드 구도]: 지인 펫 34px 미니 옹기종기 응원단 + 내 펫 72px 단독 돌격 타격 & 탈진 연출\n- [3D 눈매 다양화]: sleepy 반달눈, sharp 캣아이, star 십자별빛눈, round 왕방울눈 5대 스타일 차별화\n- [전체 72종 쇼룸]: 도감 내 72종 쇼룸 모드 ON으로 전 종족(8종×9단계) 3D 외형과 눈매 즉시 풀 감상',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v35.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v35 successfully created and encrypted!');

