const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 34,
  timestamp: new Date().toISOString(),
  title: 'Stitch 콘셉트 거대보스 전용 3D 모델, 전투 HUD/버튼 비율 확대, 부재 중 방어전 기록 카드 & 복수전 신청, 돌보기 3종 밸런스(포만감/피로도), 미니룸 펫 터치 디저트 ASMR 사운드 완벽 구현',
  changes: [
    '1. [Stitch 콘셉트 거대보스 전용 3D 뷰]: WorldBoss3DView.tsx 구현 (다크초콜릿 화산 암석 바디, 끓어오르는 마그마 퐁듀 시럽, 슈가 크리스탈 드래곤 뿔 & 등 가시, 실시간 날개짓 애니메이션, 피격 진동 및 용암 시럽 파편 튀김). AsmrBattleArena에 전용 연동 완료.',
    '2. [전투 화면 HUD & 버튼 비율 확대]: AsmrBattleArena의 상단 HUD 체력바 높이 6px->9px, 폰트 10.5px->12px, 보스 x7 레이어 표기, 하단 MAX 게이지바 높이 8px->11px, MAX 스트라이크/응원 버튼 패딩 11px 14px 및 폰트 13.5px, 조작 버튼 12px로 터치감 대폭 향상.',
    '3. [부재 중 방어전 기록 카드 & 복수전/재도전 신청]: src/lib/pvpHistory.ts 생성 및 DessertPlaza 내 파트너 노드 클릭 연동. 부재 중 지인들이 신청한 대전 승패 카드(승리/패배 배지, 상대 프로필, RP 변동, 시간) 확인 및 [⚔️ 복수전 / 재도전 신청] 즉시 대전 연계. 지인 클릭 모달에도 맞대결 전적 뱃지 노출.',
    '4. [돌보기 3종 무한 사용 제한 & 밸런스 개편]: careApi.ts 및 CarePantry.tsx에 포만감 가드 적용(hunger 100% 시 배부름 알림 및 추가 섭취 차단), 놀아주기 시 fatigue +16 누적 소모 및 fatigue 80 이상 시 잠금, 낮잠/휴식 시 fatigue 10 이하 쌩쌩함 가드 및 휴식 시 소화(당 소모 -10) 연쇄 작용으로 유기적 선순환 달성.',
    '5. [미니룸 펫 터치 고유 디저트 ASMR 사운드 연동]: MyRoomScreen 3D 펫 컨테이너에 클릭 핸들러 연동. 터치 시 펫 고유 종족/베이스 기반 playDessertAsmr() 재생, 뽀용 점프 바운스 및 말풍선 반응. 지인 미니룸 방문 시에도 지인의 펫 쓰다듬기 및 호감도(리본 코인) 상호작용 피드백 반영.'
  ],
  verifiedScreenshots: [
    'after-115-world-boss-dragon-and-bars.png',
    'after-116-plaza-defense-history-modal.png',
    'after-117-care-fullness-balance.png',
    'after-118-myroom-touch-asmr.png'
  ]
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v34-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v34.enc'), combined);

const meta = {
  summary: 'Stitch 콘셉트 거대보스 전용 3D 뷰, 전투 HUD 및 조작 버튼 비율 확대, 부재 중 방어전 기록 카드 및 복수전/재도전 신청, 돌보기 3종 밸런스(포만감/피로도), 미니룸 펫 터치 디저트 ASMR 사운드 암호화 체크포인트 v34\n- [Stitch 거대보스 3D]: WorldBoss3DView 마그마 초코 퐁듀 슈가 드래곤 전용 연동\n- [전투 HUD/버튼 확대]: 체력바 9px, 게이지 11px, 버튼 13.5px 터치감 최적화\n- [방어전 기록 & 복수전]: 부재 중 방어전 카드 확인 및 즉시 복수전/재도전 연계\n- [돌보기 밸런스]: 포만감 100% 과식 차단, 놀기 피로도 +16, 낮잠 소화 연계\n- [미니룸 터치 ASMR]: 내 펫 및 지인 펫 터치 시 고유 디저트 ASMR 사운드 & 뽀용 바운스',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v34.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v34 successfully created and encrypted!');

