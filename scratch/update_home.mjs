import fs from 'node:fs';

let code = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');

// 1. import exploreState, Trip, serverNow
if (!code.includes('exploreState')) {
  code = code.replace(
    "import { monsterLook, type MonsterRow } from '../lib/api'",
    "import { monsterLook, serverNow, type MonsterRow } from '../lib/api'\nimport { exploreState, type Trip } from '../lib/exploreApi'"
  );
}

// 2. state addition
if (!code.includes('showGrowthModal')) {
  code = code.replace(
    'const [showSoundStudio, setShowSoundStudio] = useState<boolean>(false)',
    'const [showSoundStudio, setShowSoundStudio] = useState<boolean>(false)\n  const [showGrowthModal, setShowGrowthModal] = useState<boolean>(false)\n  const [exploreTrip, setExploreTrip] = useState<Trip | null>(null)\n  const [exploreLeftSec, setExploreLeftSec] = useState<number>(0)'
  );
}

// 3. exploreState polling in useEffect
if (!code.includes('checkExplore')) {
  code = code.replace(
    '  useEffect(() => {\n    const timer = window.setInterval(() => {',
    `  // 🧭 M5 장기 탐험 상태 동기화 (3초 간격)
  useEffect(() => {
    let mounted = true
    const checkExplore = () => {
      exploreState(monster.id)
        .then((st) => {
          if (!mounted) return
          setExploreTrip(st.trip)
          if (st.trip) {
            const left = Math.max(0, Math.ceil((Date.parse(st.trip.finishAt) - serverNow()) / 1000))
            setExploreLeftSec(left)
          } else {
            setExploreLeftSec(0)
          }
        })
        .catch(() => {})
    }
    checkExplore()
    const expTimer = window.setInterval(checkExplore, 3000)
    return () => {
      mounted = false
      window.clearInterval(expTimer)
    }
  }, [monster.id])

  const isExploring = !!exploreTrip && exploreLeftSec > 0

  useEffect(() => {
    const timer = window.setInterval(() => {`
  );
}

fs.writeFileSync('src/screens/MonsterHome.tsx', code, 'utf8');
console.log('Step 1 applied successfully');

