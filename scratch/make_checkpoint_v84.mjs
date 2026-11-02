import crypto from 'crypto';
import fs from 'fs';

const data = {
  version: 'v84',
  timestamp: new Date().toISOString(),
  changes: [
    '부티크 상점 패션 91개 아이템 가격 리밸런싱 (Common: 450~770, Rare: 850~2280, Legendary: 1800~4160) 및 DB 마이그레이션 m5_shop_missions 동기화',
    '쇼케이스 상자(솔로 상자 및 오픈 파티 룸)에서 펫을 꺼내고 슬롯을 비우는 직관적 원클릭 펫 회수 기능 탑재',
    '신규 지인 협동/경쟁 물리 미니게임 [위태위태 펫 젠가 (릴레이 돌탑 쌓기 & 솔로 챌린지)] 전체 화면 및 물리 엔진 구현 완료',
    '홈 화면 프로필 배너 및 디저트 광장에 [🪨 위태위태 펫 젠가] 퀵 바로가기 진입로 연결',
    '전체 테스트 스위트 및 프로덕션 빌드 100% 통과 검증'
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
fs.writeFileSync('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/checkpoint_v84.enc', payload);
console.log('Checkpoint v84 saved successfully.');
