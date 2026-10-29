import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

// 개발 중에만 쓰는 확인 페이지 (운영 빌드에서는 이 분기가 통째로 빠진다)
if (import.meta.env.DEV && location.hash.startsWith('#/dev/monsters')) {
  import('./dev/MonsterPreview.tsx').then(({ default: Page }) => root.render(<Page />))
} else if (import.meta.env.DEV && location.hash.startsWith('#/dev/screens')) {
  import('./dev/ScreenGallery.tsx').then(({ default: Page }) => root.render(<Page />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
