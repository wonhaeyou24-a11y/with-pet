import fs from 'node:fs';
let code = fs.readFileSync('src/lib/idleActivity.ts', 'utf8');

const target = `    // 3. 신규 M5 탐험 완료 자동 시스템 알림
    try {
      const rawExplore = localStorage.getItem(\`pet_explore_trip_\${monsterId}\`)
      if (rawExplore) {
        const trip = JSON.parse(rawExplore)
        if (trip && trip.finishAt) {
          scheduleExploreNotification(monsterName, trip)
        }
      }
    } catch {}
      }
    }
  } catch {
    // 무중단
  }
}`;

const replacement = `    // 3. 신규 M5 탐험 완료 자동 시스템 알림
    try {
      const rawExplore = localStorage.getItem(\`pet_explore_trip_\${monsterId}\`)
      if (rawExplore) {
        const trip = JSON.parse(rawExplore)
        if (trip && trip.finishAt) {
          scheduleExploreNotification(monsterName, trip)
        }
      }
    } catch {}
  } catch {
    // 무중단
  }
}`;

code = code.replace(/\r\n/g, '\n');
const targetLf = target.replace(/\r\n/g, '\n');
const replacementLf = replacement.replace(/\r\n/g, '\n');

if (code.includes(targetLf)) {
  code = code.replace(targetLf, replacementLf);
  fs.writeFileSync('src/lib/idleActivity.ts', code, 'utf8');
  console.log('Fixed idleActivity');
} else {
  console.log('targetLf not found');
}

