import crypto from 'crypto';
import fs from 'fs';

const data = {
  version: 'v83',
  timestamp: new Date().toISOString(),
  changes: [
    '거대 보스 대전 시 보스 스킬 말상자와 플레이어 스킬 상자 겹침 원천 차단 (actor 분리 배너)',
    '펫 터치 시 Web Speech API + Web Audio API 듀얼 하모닉스로 진짜 아기 음성(까르르, 헤헤헤, 아잉, 꺄앙) 발성 및 사운드 출력',
    'MonsterHome 및 MonsterDetail에 펫 터치 시 아기 음성 및 말풍선 싱크 연동',
    '신규 지인 협동/경쟁 콘텐츠 [위태위태 펫 젠가 (지인 릴레이 펫 돌탑 쌓기)] 기획 및 밸런스 설계'
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
fs.writeFileSync('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/checkpoint_v83.enc', payload);
console.log('Checkpoint v83 saved successfully.');
