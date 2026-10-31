import fs from 'node:fs';
let code = fs.readFileSync('src/screens/ExploreScreen.tsx', 'utf8');

code = code.replace(
  'scheduleExploreNotification(monster.name, s.trip)',
  "scheduleExploreNotification(monster.name || '디저트', s.trip)"
);

code = code.replace(
  'scheduleExploreNotification(monster.name, r.trip)',
  "scheduleExploreNotification(monster.name || '디저트', r.trip)"
);

fs.writeFileSync('src/screens/ExploreScreen.tsx', code, 'utf8');
console.log('Fixed ExploreScreen.tsx');

