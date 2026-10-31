const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d';
const checkpointData = {
  version: 28,
  timestamp: new Date().toISOString(),
  title: '8대 신규 개선 및 3대 콘텐츠 확장 로드맵 수립 완료',
  changes: [
    '장비 강화 화면 3D 몬스터뷰(MonsterView) 복원 (prefer2D 제거, 110px 늠름한 3D 캐릭터 렌더링)',
    '펫 자율 의견(훈련·돌보기 등) 발생 시 백그라운드 PWA 시스템 알림 연동',
    '시스템 알림 정책 최적화: 게임 화면 포그라운드(visible) 상태 시 알림 차단, 앱 백그라운드(hidden) 및 종료 시에만 발송',
    '광장 사계절 및 이벤트 테마 수동 선택창 숨김 처리 및 지인 시점 현실 계절 동기화 뱃지로 보안 잠금',
    '전역 버튼 및 훈련코스/디저트타워 터치 쫀득한 눌림 피드백(:active) 및 0ms 즉각 사운드/햅틱 반응성 개선',
    '로그인 및 인증 대기 중 알이 무지개색으로 생동감 있게 물들며 차오르는 애니메이션(EggArt rainbowLoading) 추가',
    '장비 강화 1~9강 성공 임팩트 효과 및 10강(MAX) 달성 시 화면 중앙 부유 + 신의 광선(God-rays) + 거대 황금 시네마틱 연출 구현',
    '디저트 펫 라이브 서비스를 위한 3대 핵심 콘텐츠(부티크·보스·룸) 확장 종합 개발 로드맵 수립 완료'
  ],
  verifiedScreenshots: [
    'after-96-gear-3d-monster-restored.png',
    'after-97-plaza-theme-selector-hidden.png',
    'after-98-login-egg-rainbow-loading.png'
  ],
  roadmapArtifact: 'game_expansion_roadmap.md'
};

const jsonStr = JSON.stringify(checkpointData, null, 2);
const key = crypto.scryptSync('antigravity-zero-trust-v28-salt', 'salt', 32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(jsonStr, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const tag = cipher.getAuthTag();

const combined = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(path.join(outDir, 'checkpoint_v28.enc'), combined);

const meta = {
  summary: '8대 신규 개선 및 3대 콘텐츠 확장 로드맵 수립 완료 암호화 체크포인트 v28\n- [장비 3D 복원]: 장비강화 화면 3D MonsterView 복원\n- [알림 정책 최적화]: 백그라운드 전용 알림 & 펫 자율 의견 푸시 연동\n- [광장 테마 잠금]: 지인 시점 수동 선택창 숨김 및 사계절 뱃지 적용\n- [버튼 반응성/손맛]: 0ms 즉각 반응 & 쫀득한 액티브 눌림 피드백\n- [로그인 무지개 알]: 로그인 중 알 무지개 충전 애니메이션\n- [10강 MAX 연출]: 화면 중앙 부유 & 신의 광선 시네마틱 임팩트\n- [종합 로드맵]: 부티크·보스·룸 인테리어 확장 개발 계획서 수립',
  updatedAt: new Date().toISOString(),
  userFacing: true
};
fs.writeFileSync(path.join(outDir, 'checkpoint_v28.enc.metadata.json'), JSON.stringify(meta, null, 2));

console.log('Checkpoint v28 successfully created and encrypted!');

