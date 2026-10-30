import { EggArt } from './EggArt'

// 서버 응답을 기다리는 동안 빈 화면 대신 보여 주는 로딩 화면
export default function Loading({ text = '달콤한 알을 불러오는 중…' }: { text?: string }) {
  return (
    <main className="screen center center-text" style={{ alignItems: 'center' }} aria-busy="true">
      <div className="egg-sway">
        <EggArt rarity="common" mood="sleep" size={120} />
      </div>
      <p className="sub" role="status">
        {text}
      </p>
    </main>
  )
}
