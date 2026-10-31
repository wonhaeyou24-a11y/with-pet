import fs from 'node:fs';

// 1. idleActivity.ts 수정
let idleCode = fs.readFileSync('src/lib/idleActivity.ts', 'utf8');

const targetNotification = `export function sendIdleNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  try {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return`;

const replacementNotification = `export function sendIdleNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  try {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    // 🛡️ [규칙]: 알림은 앱을 나가 있거나 꺼져 있을 때만 발송 (게임 중에는 모바일 알림 생략)
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      return
    }`;

if (idleCode.includes(targetNotification)) {
  idleCode = idleCode.replace(targetNotification, replacementNotification);
  fs.writeFileSync('src/lib/idleActivity.ts', idleCode, 'utf8');
  console.log('idleActivity: Background-only notifications enforced');
} else {
  console.log('idleActivity target not found');
}

// 2. MonsterHome.tsx에 펫 자율 의견 알림 연동
let homeCode = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');

if (!homeCode.includes('sendIdleNotification')) {
  homeCode = homeCode.replace(
    'scheduleAutoIdleNotifications,',
    'scheduleAutoIdleNotifications,\n  sendIdleNotification,'
  );
}

const targetSug = `      if (sug && !suggestion) {
        setSuggestion(sug)
      }`;

const replacementSug = `      if (sug && !suggestion) {
        setSuggestion(sug)
        // 🔔 펫이 자율 의견을 제시할 때 백그라운드 시스템 알림 연동 (앱이 꺼져있을 때 수신)
        sendIdleNotification(
          \`💭 [\${monster.name || '디저트'}] 펫의 속삭임\`,
          sug.bannerText || sug.balloon || '주인님! 디저트 펫이 새로운 활동을 하고 싶어해요!'
        )
      }`;

if (homeCode.includes(targetSug)) {
  homeCode = homeCode.replace(targetSug, replacementSug);
  fs.writeFileSync('src/screens/MonsterHome.tsx', homeCode, 'utf8');
  console.log('MonsterHome: Autonomous suggestion notification linked');
} else {
  console.log('MonsterHome targetSug not found');
}

