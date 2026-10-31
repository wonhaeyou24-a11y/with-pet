import fs from 'node:fs';

let code = fs.readFileSync('src/ui/ui.css', 'utf8');

const bounceRule = `
/* 🌟 전역 터치 햅틱/반응성 극대화: 쫀득한 버튼 눌림 피드백 */
button:active:not(:disabled),
.btn:active:not(:disabled),
.active-bounce:active:not(:disabled) {
  transform: scale(0.97) translateY(2px) !important;
  filter: brightness(0.94) !important;
  transition: transform 0.06s cubic-bezier(0.2, 0, 0, 1) !important;
}
`;

if (!code.includes('쫀득한 버튼 눌림 피드백')) {
  code = code + bounceRule;
  fs.writeFileSync('src/ui/ui.css', code, 'utf8');
  console.log('ui.css: Global active bounce rule added');
}

