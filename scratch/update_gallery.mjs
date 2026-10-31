import fs from 'node:fs';

let code = fs.readFileSync('src/dev/ScreenGallery.tsx', 'utf8');

if (!code.includes('알 부화 및 무지개 충전')) {
  code = code.replace(
    "'파티세리 부티크': () => (",
    `'알 부화 및 무지개 충전': () => (
    <div style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, height: '100%', background: '#FFFDF9' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#3E2723' }}>🌈 로그인 무지개 충전 알</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8D6E63' }}>로그인 및 인증 중 알이 생동감 있게 물들며 춤을 춥니다.</p>
      </div>
      <EggArt rarity="common" mood="happy" size={180} rainbowLoading={true} />
    </div>
  ),
  '파티세리 부티크': () => (`
  );
  fs.writeFileSync('src/dev/ScreenGallery.tsx', code, 'utf8');
  console.log('ScreenGallery: Rainbow egg added to gallery');
}

