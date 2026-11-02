import crypto from 'crypto';
import fs from 'fs';

const data = {
  version: 'v87',
  timestamp: new Date().toISOString(),
  changes: [
    '1단부터 위로 올라갈수록 펫의 크기가 뚜렷하게 작아지는 피라미드 스케일링 적용 (1단 54px부터 48px, 42px, 36px, 30px, 25px, 20px로 확실한 체감 축소)',
    '돌쌓기(펫 젠가) 더미 테스터(베이커리 마스터, 민트초코 지인 등) 전면 제거: 0층 황금 받침대에서 유저와 지인이 직접 1단부터 시작',
    '지인 디저트 광장에 연습용 지인 1명(민트파티시에)만 남기고 나머지 불필요한 더미 봇 전면 제거 및 실제 DB 지인 우선 연동',
    'DESSERT MAX 거대 보스 레이드에서 가짜 테스터 봇(말랑 님, 젤리 님 등 12명) 전면 제거: 홀로 1:1 보스전 또는 실제 참여 지인만 참전'
  ],
  status: 'verified_and_tested'
};

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let enc = cipher.update(JSON.stringify(data), 'utf8');
enc = Buffer.concat([enc, cipher.final()]);
const tag = cipher.getAuthTag();

const payload = Buffer.concat([iv, tag, enc]);
fs.writeFileSync('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/checkpoint_v87.enc', payload);
console.log('Checkpoint v87 saved successfully.');
