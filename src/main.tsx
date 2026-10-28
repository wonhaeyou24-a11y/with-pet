import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

if (import.meta.env.DEV && location.hash.startsWith('#/dev/monsters')) {
  import('./dev/MonsterPreview.tsx').then(({ default: MonsterPreview }) => root.render(<MonsterPreview />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
