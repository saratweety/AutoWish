// Turns src/game/confetti.html into src/game/confettiHtml.ts, so the game ships inside the app
// (no web server needed). Run after editing the HTML: npm run build:game
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'game');
const html = fs.readFileSync(path.join(dir, 'confetti.html'), 'utf8');
const out = `// Made by scripts/build-game.js from confetti.html. Don't edit by hand.\nexport const CONFETTI_HTML = ${JSON.stringify(html)};\n`;
fs.writeFileSync(path.join(dir, 'confettiHtml.ts'), out);
console.log('Wrote src/game/confettiHtml.ts');
