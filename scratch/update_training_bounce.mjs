import fs from 'node:fs';

let code = fs.readFileSync('src/screens/PatisserieTraining.tsx', 'utf8');

// 1. handleStartTraining 즉각 반응성 개선
const oldStartTrain = `    if (!IS_DEV_MOCK) {
      setBusy(true)
      const res = await callActivity(monster.id, 'train_start', { courseId: selectedCourse.id })
      setBusy(false)
      if (!res.ok || !res.session) {
        setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
        setTimeout(() => setToast(null), 3000)
        return
      }
      const sess = saveServerTrainingSession(monster.id, selectedCourse, res.session.startedAt, res.session.finishAt)
      setTrainSession(sess)
      setTrainTimeLeft(Math.max(0, Math.ceil((sess.finishAt - serverNow()) / 1000)))
      triggerAsmr(selectedCourse.asmr)
      setToast(\`💪 "\${selectedCourse.name}" 훈련 시작! 앱을 나가도 현실 시간으로 계속 훈련해요.\`)
      setTimeout(() => setToast(null), 3000)
      return
    }`;

const newStartTrain = `    // ⚡ 즉각적인 터치 반응 (0ms 사운드 & 햅틱 진동)
    triggerAsmr(selectedCourse.asmr)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 20, 60])
    }

    if (!IS_DEV_MOCK) {
      setBusy(true)
      const res = await callActivity(monster.id, 'train_start', { courseId: selectedCourse.id })
      setBusy(false)
      if (!res.ok || !res.session) {
        setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
        setTimeout(() => setToast(null), 3000)
        return
      }
      const sess = saveServerTrainingSession(monster.id, selectedCourse, res.session.startedAt, res.session.finishAt)
      setTrainSession(sess)
      setTrainTimeLeft(Math.max(0, Math.ceil((sess.finishAt - serverNow()) / 1000)))
      setToast(\`💪 "\${selectedCourse.name}" 훈련 시작! 앱을 나가도 현실 시간으로 계속 훈련해요.\`)
      setTimeout(() => setToast(null), 3000)
      return
    }`;

code = code.replace(oldStartTrain, newStartTrain);

// 2. handleStartExplore 즉각 반응성 개선
const oldStartExplore = `  function handleStartExplore() {
    if (isExploring) {
      setToast('🧭 현재 펫이 탐험 중입니다! 탐험 복귀 후에 타워에 입장할 수 있어요.')
      setTimeout(() => setToast(null), 3000)
      return
    }
    if (tooTired || busy || towerSession) return
    if (!IS_DEV_MOCK) {
      setBusy(true)
      callActivity(monster.id, 'tower_start').then((res) => {
        setBusy(false)
        if (!res.ok || !res.session) {
          setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
          setTimeout(() => setToast(null), 3500)
          return
        }
        const sess = towerFromServer(monster.id, res.session)
        setTowerSession(sess)
        if (typeof res.towerEntriesLeft === 'number') setTowerEntriesLeft(res.towerEntriesLeft)
        triggerAsmr('kataifi-crunch')
        setToast(\`🏰 \${sess.startFloor}층~\${sess.targetFloor}층 탐험 출발! 앱을 꺼도 펫이 스스로 층을 돌파해요.\`)
        setTimeout(() => setToast(null), 3500)
      })
      return
    }`;

const newStartExplore = `  function handleStartExplore() {
    if (isExploring) {
      setToast('🧭 현재 펫이 탐험 중입니다! 탐험 복귀 후에 타워에 입장할 수 있어요.')
      setTimeout(() => setToast(null), 3000)
      return
    }
    if (tooTired || busy || towerSession) return

    // ⚡ 즉각적인 터치 반응 (0ms 타워 개방 사운드 & 햅틱 진동)
    triggerAsmr('kataifi-crunch')
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 80])
    }

    if (!IS_DEV_MOCK) {
      setBusy(true)
      callActivity(monster.id, 'tower_start').then((res) => {
        setBusy(false)
        if (!res.ok || !res.session) {
          setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
          setTimeout(() => setToast(null), 3500)
          return
        }
        const sess = towerFromServer(monster.id, res.session)
        setTowerSession(sess)
        if (typeof res.towerEntriesLeft === 'number') setTowerEntriesLeft(res.towerEntriesLeft)
        setToast(\`🏰 \${sess.startFloor}층~\${sess.targetFloor}층 탐험 출발! 앱을 꺼도 펫이 스스로 층을 돌파해요.\`)
        setTimeout(() => setToast(null), 3500)
      })
      return
    }`;

code = code.replace(oldStartExplore, newStartExplore);

// 3. 버튼 쫀득한 눌림 CSS 추가 (.active-bounce)
const bounceCss = `
        /* 쫀득한 버튼 및 카드 터치 눌림 효과 */
        .active-bounce {
          transition: transform 0.08s ease, filter 0.08s ease, box-shadow 0.08s ease !important;
          will-change: transform;
        }
        .active-bounce:active:not(:disabled) {
          transform: scale(0.96) translateY(2px) !important;
          filter: brightness(0.92) !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        }
`;

code = code.replace('<style>{`', '<style>{`' + bounceCss);

// 4. 주요 버튼들에 active-bounce 클래스 추가
code = code.replace(
  'onClick={handleStartTraining}\n            disabled={tooTired || busy || isExploring || Boolean(trainSession && trainTimeLeft > 0)}',
  'onClick={handleStartTraining}\n            className="active-bounce"\n            disabled={tooTired || busy || isExploring || Boolean(trainSession && trainTimeLeft > 0)}'
);

code = code.replace(
  'onClick={handleStartExplore}\n            disabled={tooTired || busy || isExploring || Boolean(towerSession)}',
  'onClick={handleStartExplore}\n            className="active-bounce"\n            disabled={tooTired || busy || isExploring || Boolean(towerSession)}'
);

fs.writeFileSync('src/screens/PatisserieTraining.tsx', code, 'utf8');
console.log('PatisserieTraining: Instant 0ms response and active-bounce applied');

