import crypto from 'crypto';
import fs from 'fs';

const data = {
  version: 'v85',
  timestamp: new Date().toISOString(),
  changes: [
    '디저트 광장 상단 헤더의 돌탑젠가 버튼 제거 및 광장 2.5D 맵 중앙 우측에 [우리 마을 펫 돌탑] 랜드마크 오브젝트 배치 (터치 시 젠가 입장)',
    '위태위태 펫 젠가 조작 메커니즘 개편: 자동 스윙 제거 -> 손가락/마우스로 직접 좌우 드래그 조준선(수직 레이저 가이드) 확인 후 손을 떼어(Drop) 정밀 낙하',
    '펫 크기 36px로 앙증맞게 축소하여 조준 난이도 및 균형 스릴 대폭 강화',
    '드롭 시 끊김/느려짐 원천 해결: 60FPS 순수 GPU 가속 translate3d 자유낙하 물리 애니메이션 적용',
    '안착 시 탑 전체가 좌우로 삐걱거리며 탄성 진동(Spring Sway)하는 심장 쫄깃한 서스펜스 흔들림 연출 구현'
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
fs.writeFileSync('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/checkpoint_v85.enc', payload);
console.log('Checkpoint v85 saved successfully.');
