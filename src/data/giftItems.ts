// My Gift: the dressed-up gift and its 30 hats, 30 ribbons, 30 cards and 30 stickers.
// Ported from the "AutoWish My Gift" design. Each piece is SVG markup, drawn with <SvgXml>.
// The hex colours here are artwork (like the Lottie files), not UI colours.

export type GiftKind = 'hat' | 'ribbon' | 'theme' | 'sticker';

export type GiftItem = {
  id: string;
  t: GiftKind;
  name: string;
  cost: number;
  none?: boolean;
  svg?: string; // hats and stickers
  r?: string; // ribbon colour
  kn?: string; // ribbon knot colour
  p?: string; // pattern: solid / dots / stripes (ribbons), plain / hearts / stripes (cards)
  bg?: string; // card background
  fg?: string; // card text colour
};

function starPath(cx: number, cy: number, r: number, ri = r * 0.45, n = 5) {
  let d = '';
  for (let i = 0; i < n * 2; i++){
    const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? ri : r;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}
const S = (cx: number, cy: number, r: number, c: string) => `<path d="${starPath(cx, cy, r)}" fill="${c}"/>`;
const SP = (cx: number, cy: number, r: number, c: string) => `<path d="M${cx} ${cy-r}L${cx+r*.28} ${cy-r*.28}L${cx+r} ${cy}L${cx+r*.28} ${cy+r*.28}L${cx} ${cy+r}L${cx-r*.28} ${cy+r*.28}L${cx-r} ${cy}L${cx-r*.28} ${cy-r*.28}Z" fill="${c}"/>`;
const HEART = (cx: number, cy: number, s: number, c: string) => `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 9C0 9-10 3-10-3A5 5 0 0 1 0-6A5 5 0 0 1 10-3C10 3 0 9 0 9Z" fill="${c}"/>`;
const C = { navy:'#2F3550', muted:'#5D6585', pink:'#FFB4B4', pinkL:'#FDE3E4', coral:'#F9A39C', heart:'#EF7A70', blue:'#789BD9', blueL:'#A9C1E6', mist:'#DAE3EA', orange:'#FFA618', yellow:'#FFD961', gold:'#F2C94C', white:'#FFFFFF', mint:'#B7E4C7', mintD:'#7CC49A', lilac:'#CDB8F0', lilacD:'#9F86D9', peach:'#FFC9A3', teal:'#9ED8DB', tealD:'#5FB3B8', line:'#E6DFD3' };

/** The gift (same shapes as the app icon) with a ribbon colour and pattern, in a 200 x 230 space. */
export function giftSVG(ribbon: string, knot: string, pattern?: string) {
  let overlay = '';
  if (pattern === 'dots') for (let y = 92; y <= 176; y += 14) overlay += `<circle cx="100" cy="${y}" r="3.2" fill="#FFFFFF" opacity=".85"/>`;
  if (pattern === 'stripes') for (let y = 90; y <= 176; y += 12) overlay += `<rect x="88" y="${y}" width="24" height="4" fill="#FFFFFF" opacity=".6"/>`;
  if (pattern === 'dots') overlay += `<circle cx="78" cy="70" r="3" fill="#FFFFFF" opacity=".85"/><circle cx="122" cy="70" r="3" fill="#FFFFFF" opacity=".85"/>`;
  if (pattern === 'stripes') overlay += `<path d="M70 64L86 78" stroke="#FFFFFF" stroke-width="3" opacity=".6"/><path d="M130 64L114 78" stroke="#FFFFFF" stroke-width="3" opacity=".6"/>`;
  return `<g transform="translate(0 30)">
  <rect x="40" y="104" width="120" height="78" rx="12" fill="#F9A39C"/><rect x="40" y="104" width="120" height="8" fill="#EE8C84"/>
  <rect x="30" y="84" width="140" height="26" rx="9" fill="#FFB4B4"/><rect x="88" y="84" width="24" height="98" fill="${ribbon}"/>
  <path d="M100 84C84 52 54 58 62 82Z" fill="${ribbon}"/><path d="M100 84C116 52 146 58 138 82Z" fill="${ribbon}"/>${overlay}
  <path d="M100 84L84 104L90 106Z" fill="${knot}"/><path d="M100 84L116 104L110 106Z" fill="${knot}"/><circle cx="100" cy="80" r="10" fill="${knot}"/></g>`;
}

// 30 hats, drawn in the 200 x 230 gift space (the bow top is near y 92, the lid top y 114).
const HATS: [string, string, string][] = [
  ['party',    'Party hat',      `<path d="M74 96L100 28L126 96Z" fill="${C.yellow}"/><path d="M89 56L111 56L116 68L84 68Z" fill="${C.pink}"/><path d="M80 80L120 80L123 88L77 88Z" fill="${C.blueL}"/><circle cx="100" cy="28" r="9" fill="${C.heart}"/>`],
  ['cap',      'Cool cap',       `<path d="M66 96C66 62 134 62 134 96Z" fill="${C.blue}"/><rect x="64" y="90" width="90" height="8" rx="4" fill="${C.blueL}"/><circle cx="100" cy="62" r="5" fill="${C.yellow}"/>`],
  ['bow',      'Big bow',        `<path d="M100 74L66 54L68 96Z" fill="${C.heart}"/><path d="M100 74L134 54L132 96Z" fill="${C.heart}"/><circle cx="100" cy="76" r="11" fill="${C.pink}"/><circle cx="80" cy="70" r="3" fill="#fff"/><circle cx="120" cy="70" r="3" fill="#fff"/>`],
  ['beanie',   'Pom-pom beanie', `<path d="M64 98C64 50 136 50 136 98Z" fill="${C.heart}"/><rect x="62" y="86" width="76" height="14" rx="7" fill="${C.pink}"/><circle cx="100" cy="46" r="11" fill="#fff"/><path d="M78 70v14M90 62v20M110 62v20M122 70v14" stroke="${C.pink}" stroke-width="3" stroke-linecap="round"/>`],
  ['flowers',  'Flower crown',   `<path d="M58 98C70 84 130 84 142 98" stroke="${C.mintD}" stroke-width="4" fill="none"/>${[[66,90,C.pink],[84,82,C.yellow],[100,79,C.heart],[116,82,C.yellow],[134,90,C.pink]].map(([x,y,c])=>`<g transform="translate(${x} ${y})"><circle r="9" fill="${c}"/><circle r="3.5" fill="#fff"/></g>`).join('')}`],
  ['sunhat',   'Sun hat',        `<ellipse cx="100" cy="94" rx="60" ry="12" fill="${C.gold}"/><path d="M72 94C72 60 128 60 128 94Z" fill="${C.yellow}"/><rect x="72" y="84" width="56" height="8" fill="${C.pink}"/>${HEART(126,84,.7,C.heart)}`],
  ['beret',    'Beret',          `<ellipse cx="100" cy="84" rx="42" ry="15" fill="${C.heart}" transform="rotate(-8 100 84)"/><rect x="97" y="62" width="6" height="10" rx="3" fill="${C.heart}"/>`],
  ['halo',     'Halo',           `<ellipse cx="100" cy="58" rx="34" ry="10" stroke="${C.gold}" stroke-width="7" fill="none"/>${SP(140,44,6,C.gold)}`],
  ['catears',  'Cat ears',       `<path d="M42 116L56 80L74 114Z" fill="${C.muted}"/><path d="M50 112L57 92L66 112Z" fill="${C.pink}"/><path d="M126 114L144 80L158 116Z" fill="${C.muted}"/><path d="M134 112L143 92L150 112Z" fill="${C.pink}"/>`],
  ['bearears', 'Bear ears',      `<circle cx="52" cy="110" r="16" fill="${C.peach}"/><circle cx="52" cy="110" r="8" fill="${C.pinkL}"/><circle cx="148" cy="110" r="16" fill="${C.peach}"/><circle cx="148" cy="110" r="8" fill="${C.pinkL}"/>`],
  ['bunny',    'Bunny ears',     `<ellipse cx="82" cy="58" rx="11" ry="32" fill="#fff" stroke="${C.line}" stroke-width="2" transform="rotate(-12 82 58)"/><ellipse cx="82" cy="60" rx="5" ry="22" fill="${C.pink}" transform="rotate(-12 82 60)"/><ellipse cx="118" cy="58" rx="11" ry="32" fill="#fff" stroke="${C.line}" stroke-width="2" transform="rotate(12 118 58)"/><ellipse cx="118" cy="60" rx="5" ry="22" fill="${C.pink}" transform="rotate(12 118 60)"/>`],
  ['headband', 'Heart headband', `<path d="M56 108C56 66 144 66 144 108" stroke="${C.heart}" stroke-width="7" fill="none" stroke-linecap="round"/>${HEART(100,60,1.6,C.heart)}`],
  ['daisy',    'Daisy clip',     `<g transform="translate(130 90)">${[0,45,90,135,180,225,270,315].map(a=>`<ellipse cx="0" cy="-11" rx="5" ry="9" fill="#fff" stroke="${C.line}" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="${C.yellow}"/></g>`],
  ['eid',      'Eid moon',       `<path d="M112 22a26 26 0 1 0 6 44 21 21 0 1 1-6-44z" fill="${C.yellow}"/>${SP(130,34,7,C.gold)}`],
  ['candle',   'Birthday candle',`<rect x="92" y="46" width="16" height="50" rx="4" fill="${C.blueL}"/><path d="M92 58l16-6M92 72l16-6M92 86l16-6" stroke="#fff" stroke-width="3"/><path d="M100 22c8 9 8 17 0 20-8-3-8-11 0-20z" fill="${C.orange}"/><path d="M100 30c4 5 4 9 0 10-4-1-4-5 0-10z" fill="${C.yellow}"/>`],
  ['cupcake',  'Cupcake hat',    `<path d="M78 96L122 96L117 72L83 72Z" fill="${C.blueL}"/><path d="M88 72v24M100 72v24M112 72v24" stroke="${C.blue}" stroke-width="2"/><circle cx="86" cy="66" r="12" fill="${C.pink}"/><circle cx="114" cy="66" r="12" fill="${C.pink}"/><circle cx="100" cy="58" r="14" fill="${C.pink}"/><circle cx="100" cy="40" r="6" fill="${C.heart}"/>`],
  ['chef',     'Chef hat',       `<rect x="80" y="62" width="40" height="34" rx="4" fill="#fff" stroke="${C.line}" stroke-width="2"/><circle cx="82" cy="58" r="15" fill="#fff" stroke="${C.line}" stroke-width="2"/><circle cx="118" cy="58" r="15" fill="#fff" stroke="${C.line}" stroke-width="2"/><circle cx="100" cy="48" r="18" fill="#fff" stroke="${C.line}" stroke-width="2"/><rect x="81" y="64" width="38" height="16" fill="#fff"/>`],
  ['sailor',   'Sailor hat',     `<path d="M68 96C68 64 132 64 132 96Z" fill="#fff" stroke="${C.line}" stroke-width="2"/><rect x="62" y="88" width="76" height="10" rx="5" fill="${C.navy}"/>${S(100,74,7,C.blue)}`],
  ['beanie2',  'Winter beanie',  `<path d="M66 98C66 56 134 56 134 98Z" fill="${C.blueL}"/><rect x="64" y="86" width="72" height="14" rx="7" fill="${C.blue}"/><path d="M76 74h48" stroke="#fff" stroke-width="4" stroke-dasharray="6 6"/>`],
  ['rainbow',  'Rainbow',        `<path d="M58 98A42 42 0 0 1 142 98" stroke="${C.heart}" stroke-width="8" fill="none"/><path d="M66 98A34 34 0 0 1 134 98" stroke="${C.yellow}" stroke-width="8" fill="none"/><path d="M74 98A26 26 0 0 1 126 98" stroke="${C.blueL}" stroke-width="8" fill="none"/><circle cx="56" cy="98" r="8" fill="#fff" stroke="${C.line}"/><circle cx="144" cy="98" r="8" fill="#fff" stroke="${C.line}"/>`],
  ['propeller','Propeller cap',  `<path d="M66 96C66 62 100 62 100 96Z" fill="${C.yellow}"/><path d="M100 96C100 62 134 62 134 96Z" fill="${C.blue}"/><rect x="98" y="50" width="4" height="16" fill="${C.navy}"/><ellipse cx="86" cy="50" rx="16" ry="5" fill="${C.heart}"/><ellipse cx="114" cy="50" rx="16" ry="5" fill="${C.blueL}"/><circle cx="100" cy="50" r="4" fill="${C.navy}"/>`],
  ['balloons', 'Balloon bunch',  `<path d="M100 96L80 52M100 96L100 40M100 96L120 52" stroke="${C.muted}" stroke-width="2"/><ellipse cx="80" cy="40" rx="13" ry="16" fill="${C.heart}"/><ellipse cx="120" cy="40" rx="13" ry="16" fill="${C.blue}"/><ellipse cx="100" cy="26" rx="13" ry="16" fill="${C.yellow}"/>`],
  ['headphones','Headphones',    `<path d="M58 112C58 40 142 40 142 112" stroke="${C.navy}" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="48" y="96" width="20" height="32" rx="9" fill="${C.blue}"/><rect x="132" y="96" width="20" height="32" rx="9" fill="${C.blue}"/>`],
  ['graduation','Graduation cap',`<path d="M78 72L78 92Q100 100 122 92L122 72Z" fill="${C.navy}"/><path d="M58 66L100 48L142 66L100 84Z" fill="${C.muted}"/><path d="M100 66L134 74L134 92" stroke="${C.yellow}" stroke-width="3" fill="none"/><circle cx="134" cy="94" r="5" fill="${C.yellow}"/>`],
  ['tophat',   'Top hat',        `<rect x="76" y="38" width="48" height="54" rx="4" fill="${C.navy}"/><rect x="62" y="88" width="76" height="9" rx="4.5" fill="${C.navy}"/><rect x="76" y="74" width="48" height="9" fill="${C.heart}"/>${HEART(112,62,.6,C.pink)}`],
  ['cowboy',   'Cowboy hat',     `<ellipse cx="100" cy="94" rx="56" ry="10" fill="${C.orange}"/><path d="M74 94C72 58 84 56 100 66C116 56 128 58 126 94Z" fill="${C.peach}"/><rect x="74" y="80" width="52" height="8" fill="${C.heart}"/>`],
  ['unicorn',  'Unicorn horn',   `<path d="M90 98L100 32L110 98Z" fill="${C.yellow}"/><path d="M92 84L108 78M94 70L106 64M96 56L104 52" stroke="${C.gold}" stroke-width="3"/><circle cx="80" cy="94" r="7" fill="${C.pink}"/><circle cx="120" cy="94" r="7" fill="${C.lilac}"/>`],
  ['tiara',    'Tiara',          `<path d="M64 98L72 74L86 88L100 60L114 88L128 74L136 98Z" fill="none" stroke="${C.gold}" stroke-width="5" stroke-linejoin="round"/><circle cx="100" cy="60" r="6" fill="${C.heart}"/><circle cx="72" cy="74" r="4" fill="${C.blueL}"/><circle cx="128" cy="74" r="4" fill="${C.blueL}"/>`],
  ['starcrown','Star crown',     `<path d="M60 100C72 86 128 86 140 100" stroke="${C.gold}" stroke-width="5" fill="none"/>${S(68,86,9,C.yellow)}${S(84,74,10,C.yellow)}${S(100,66,13,C.gold)}${S(116,74,10,C.yellow)}${S(132,86,9,C.yellow)}`],
  ['crown',    'Royal crown',    `<path d="M66 96L70 50L86 70L100 40L114 70L130 50L134 96Z" fill="${C.yellow}"/><rect x="66" y="88" width="68" height="10" rx="4" fill="${C.gold}"/><circle cx="100" cy="62" r="5" fill="${C.heart}"/><circle cx="82" cy="80" r="4" fill="${C.blueL}"/><circle cx="118" cy="80" r="4" fill="${C.blueL}"/>${SP(100,30,6,C.gold)}`],
];

// 30 ribbons: 10 colours, each solid, dotty and striped.
const RIB_COLORS = [['sky','Sky',C.blueL,C.blue],['sunny','Sunny',C.yellow,C.gold],['cream','Cream',C.white,C.line],['mint','Mint',C.mint,C.mintD],['lilac','Lilac',C.lilac,C.lilacD],['peach','Peach',C.peach,C.orange],['teal','Ocean',C.teal,C.tealD],['coral','Coral',C.heart,'#D9574D'],['gold','Gold','#F2C94C','#C99A12'],['navy','Midnight','#5D6585',C.navy]];
const RIBBONS: [string, string, string, string, string][] = [];
['solid','dots','stripes'].forEach(p => RIB_COLORS.forEach(([k,n,r,kn]) => RIBBONS.push([`${k}_${p}`, p === 'solid' ? n : `${n} ${p === 'dots' ? 'dots' : 'stripes'}`, r, kn, p])));

// 30 card themes for the Today card: 10 colours, each plain, with hearts and striped.
const CARD_COLORS = [['pink','Pink','#FFB4B4',C.navy],['sky','Sky','#DAE3EA',C.navy],['sun','Sunshine','#FFD961',C.navy],['blush','Blush','#FDE3E4',C.navy],['mint','Mint','#CDEFD9',C.navy],['lilac','Lilac','#E4DAF7',C.navy],['peach','Peach','#FFE0CC',C.navy],['paper','Paper','#FFFFFF',C.navy],['ocean','Ocean','#BFE3E6',C.navy],['night','Night','#2F3550','#FFFFFF']];
const CARDS: [string, string, string, string, string][] = [];
['plain','hearts','stripes'].forEach(p => CARD_COLORS.forEach(([k,n,bg,fg]) => CARDS.push([`${k}_${p}`, p === 'plain' ? n : `${n} ${p}`, bg, fg, p])));

// 30 stickers (64 x 64).
const STICKERS: [string, string, string][] = [
  ['heart','Heart', HEART(32,30,2.6,C.heart)],
  ['star','Star', S(32,32,26,C.gold)],
  ['sparkles','Sparkles', SP(24,26,14,C.gold)+SP(46,44,9,C.yellow)+SP(46,14,6,C.yellow)],
  ['sun','Sun', `<g stroke="${C.orange}" stroke-width="4" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="32" y1="6" x2="32" y2="12" transform="rotate(${a} 32 32)"/>`).join('')}</g><circle cx="32" cy="32" r="14" fill="${C.yellow}"/>`],
  ['flower','Flower', [0,72,144,216,288].map(a=>`<circle cx="32" cy="18" r="10" fill="${C.pink}" transform="rotate(${a} 32 32)"/>`).join('')+`<circle cx="32" cy="32" r="8" fill="${C.yellow}"/>`],
  ['cloud','Cloud', `<g fill="#fff" stroke="${C.line}" stroke-width="2"><circle cx="22" cy="36" r="12"/><circle cx="34" cy="28" r="14"/><circle cx="46" cy="38" r="10"/><rect x="18" y="36" width="30" height="12" stroke="none"/></g><path d="M12 48h40" stroke="${C.line}" stroke-width="2"/>`],
  ['gift','Mini gift', `<rect x="12" y="28" width="40" height="26" rx="5" fill="${C.coral}"/><rect x="9" y="22" width="46" height="10" rx="4" fill="${C.pink}"/><rect x="28" y="22" width="8" height="32" fill="${C.blueL}"/><path d="M32 22C26 10 16 12 19 21ZM32 22C38 10 48 12 45 21Z" fill="${C.blueL}"/>`],
  ['balloons','Balloons', `<path d="M24 40L30 62M42 38L32 62" stroke="${C.muted}" stroke-width="2"/><ellipse cx="22" cy="24" rx="13" ry="16" fill="${C.heart}"/><ellipse cx="44" cy="22" rx="13" ry="16" fill="${C.blue}"/>`],
  ['cake','Cake', `<rect x="12" y="30" width="40" height="24" rx="6" fill="${C.pink}"/><path d="M12 36q5 6 10 0t10 0 10 0 10 0V34H12z" fill="${C.pinkL}"/><rect x="29" y="14" width="6" height="16" rx="2" fill="${C.blueL}"/><path d="M32 4c4 5 4 9 0 10-4-1-4-5 0-10z" fill="${C.orange}"/>`],
  ['cupcake','Cupcake', `<path d="M16 34L48 34L44 56L20 56Z" fill="${C.blueL}"/><circle cx="22" cy="30" r="9" fill="${C.pink}"/><circle cx="42" cy="30" r="9" fill="${C.pink}"/><circle cx="32" cy="24" r="11" fill="${C.pink}"/><circle cx="32" cy="10" r="5" fill="${C.heart}"/>`],
  ['donut','Donut', `<circle cx="32" cy="32" r="24" fill="${C.peach}"/><circle cx="32" cy="32" r="20" fill="${C.pink}"/><circle cx="32" cy="32" r="8" fill="#fff"/><path d="M20 22l4 2M40 18l3 3M44 36l4-1M24 44l-2 3M36 46l3 2" stroke="${C.blue}" stroke-width="3" stroke-linecap="round"/>`],
  ['icecream','Ice cream', `<path d="M20 30L44 30L32 60Z" fill="${C.peach}"/><circle cx="24" cy="26" r="10" fill="${C.pink}"/><circle cx="40" cy="26" r="10" fill="${C.mint}"/><circle cx="32" cy="16" r="10" fill="${C.yellow}"/>`],
  ['lollipop','Lollipop', `<rect x="30" y="34" width="4" height="26" rx="2" fill="${C.line}"/><circle cx="32" cy="24" r="18" fill="${C.pink}"/><path d="M32 24m-12 0a12 12 0 1 0 24 0a8 8 0 1 0-16 0a4 4 0 1 0 8 0" stroke="#fff" stroke-width="3" fill="none"/>`],
  ['cherry','Cherries', `<path d="M22 40C24 24 30 14 40 8M42 42C40 26 40 14 40 8" stroke="${C.mintD}" stroke-width="3" fill="none"/><circle cx="22" cy="44" r="11" fill="${C.heart}"/><circle cx="42" cy="46" r="11" fill="${C.heart}"/><circle cx="18" cy="40" r="3" fill="#fff" opacity=".7"/>`],
  ['chai','Chai cup', `<path d="M14 26h32v14a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" fill="${C.blueL}"/><path d="M46 30h4a6 6 0 0 1 0 12h-4" stroke="${C.blueL}" stroke-width="4" fill="none"/><rect x="14" y="26" width="32" height="6" fill="${C.peach}"/><path d="M24 20c-3-4 3-6 0-10M34 20c-3-4 3-6 0-10" stroke="${C.muted}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`],
  ['moon','Eid moon', `<path d="M38 6a26 26 0 1 0 20 38 22 22 0 1 1-20-38z" fill="${C.yellow}"/>${SP(50,16,6,C.gold)}`],
  ['lantern','Lantern', `<rect x="26" y="6" width="12" height="6" rx="2" fill="${C.gold}"/><path d="M18 14h28l-4 36H22z" fill="${C.yellow}"/><rect x="24" y="20" width="16" height="22" rx="4" fill="${C.orange}" opacity=".6"/><rect x="20" y="50" width="24" height="6" rx="3" fill="${C.gold}"/>`],
  ['kite','Kite', `<path d="M32 4L54 26L32 48L10 26Z" fill="${C.heart}"/><path d="M32 4V48M10 26H54" stroke="#fff" stroke-width="2"/><path d="M32 48c-4 6 4 8 0 14" stroke="${C.blue}" stroke-width="2.5" fill="none"/>`],
  ['popper','Party popper', `<path d="M10 56L22 22L44 44Z" fill="${C.yellow}"/><path d="M14 46L30 30M18 52L36 40" stroke="${C.heart}" stroke-width="3"/><circle cx="44" cy="14" r="3" fill="${C.heart}"/><rect x="50" y="24" width="8" height="3" rx="1.5" fill="${C.blue}" transform="rotate(30 54 25)"/><circle cx="36" cy="10" r="2.5" fill="${C.blue}"/><rect x="52" y="38" width="7" height="3" rx="1.5" fill="${C.pink}"/>`],
  ['letter','Love letter', `<rect x="8" y="16" width="48" height="34" rx="5" fill="#fff" stroke="${C.line}" stroke-width="2"/><path d="M8 18L32 36L56 18" stroke="${C.line}" stroke-width="2" fill="none"/>${HEART(32,30,1.1,C.heart)}`],
  ['ring','Ring', `<circle cx="32" cy="40" r="16" fill="none" stroke="${C.gold}" stroke-width="6"/><path d="M24 18L32 8L40 18L32 26Z" fill="${C.blueL}"/>`],
  ['tulip','Tulip', `<path d="M32 60V30" stroke="${C.mintD}" stroke-width="3"/><path d="M32 46C24 40 18 42 16 48C22 50 28 50 32 46Z" fill="${C.mint}"/><path d="M20 14L26 22L32 12L38 22L44 14V28A12 12 0 0 1 20 28Z" fill="${C.heart}"/>`],
  ['butterfly','Butterfly', `<ellipse cx="20" cy="24" rx="12" ry="14" fill="${C.lilac}"/><ellipse cx="44" cy="24" rx="12" ry="14" fill="${C.lilac}"/><ellipse cx="22" cy="44" rx="9" ry="10" fill="${C.pink}"/><ellipse cx="42" cy="44" rx="9" ry="10" fill="${C.pink}"/><rect x="30" y="16" width="4" height="36" rx="2" fill="${C.navy}"/>`],
  ['rainbow','Rainbow', `<path d="M8 50A24 24 0 0 1 56 50" stroke="${C.heart}" stroke-width="6" fill="none"/><path d="M15 50A17 17 0 0 1 49 50" stroke="${C.yellow}" stroke-width="6" fill="none"/><path d="M22 50A10 10 0 0 1 42 50" stroke="${C.blueL}" stroke-width="6" fill="none"/>`],
  ['music','Music note', `<path d="M24 46V14L50 8V40" stroke="${C.navy}" stroke-width="4" fill="none" stroke-linejoin="round"/><ellipse cx="18" cy="48" rx="8" ry="6" fill="${C.blue}"/><ellipse cx="44" cy="42" rx="8" ry="6" fill="${C.blue}"/>`],
  ['crown','Crown', `<path d="M8 50L12 18L24 32L32 12L40 32L52 18L56 50Z" fill="${C.yellow}"/><rect x="8" y="46" width="48" height="8" rx="3" fill="${C.gold}"/><circle cx="32" cy="34" r="4" fill="${C.heart}"/>`],
  ['trophy','Trophy', `<path d="M18 8h28v14a14 14 0 0 1-28 0z" fill="${C.gold}"/><path d="M18 12H10a8 8 0 0 0 10 12M46 12h8a8 8 0 0 1-10 12" stroke="${C.gold}" stroke-width="4" fill="none"/><rect x="28" y="34" width="8" height="12" fill="${C.gold}"/><rect x="18" y="46" width="28" height="8" rx="3" fill="${C.navy}"/>${S(32,18,6,'#fff')}`],
  ['smiley','Smiley', `<circle cx="32" cy="32" r="24" fill="${C.yellow}"/><circle cx="24" cy="26" r="3.5" fill="${C.navy}"/><circle cx="40" cy="26" r="3.5" fill="${C.navy}"/><path d="M22 38q10 10 20 0" stroke="${C.navy}" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="18" cy="36" r="4" fill="${C.pink}"/><circle cx="46" cy="36" r="4" fill="${C.pink}"/>`],
  ['confetti','Confetti burst', `<rect x="8" y="12" width="12" height="5" rx="2.5" fill="${C.heart}" transform="rotate(-30 14 14)"/><rect x="40" y="8" width="12" height="5" rx="2.5" fill="${C.blue}" transform="rotate(25 46 10)"/><circle cx="30" cy="22" r="4" fill="${C.yellow}"/><rect x="12" y="40" width="10" height="10" rx="2" fill="${C.pink}" transform="rotate(20 17 45)"/><circle cx="48" cy="42" r="5" fill="${C.mint}"/><rect x="28" y="44" width="12" height="5" rx="2.5" fill="${C.lilac}" transform="rotate(-15 34 46)"/>${SP(30,36,6,C.gold)}`],
  ['thumbs','Thumbs up', `<rect x="10" y="30" width="10" height="24" rx="3" fill="${C.blue}"/><path d="M22 54V30L32 10C38 10 40 14 38 22L36 28H50A5 5 0 0 1 55 34L50 50A6 6 0 0 1 44 54Z" fill="${C.yellow}"/>`],
];

// The first item in each tab is free. The game can be replayed for stars as often as you like,
// so prices are 4x the old gentle curve: 65 stars for the cheapest, 1,340 for the last.
const price = (i: number) => i < 1 ? 0 : 5 * Math.round((10 + i * 6 + i * i * 0.18) * 4 / 5);

export const GIFT_ITEMS: GiftItem[] = [
  { id: 'hat_none', t: 'hat', name: 'No hat', cost: 0, none: true },
  ...HATS.map(([k, n, svg], i): GiftItem => ({ id: 'hat_' + k, t: 'hat', name: n, cost: price(i), svg })),
  ...RIBBONS.map(([k, n, r, kn, p], i): GiftItem => ({ id: 'rib_' + k, t: 'ribbon', name: n, cost: price(i), r, kn, p })),
  ...CARDS.map(([k, n, bg, fg, p], i): GiftItem => ({ id: 'card_' + k, t: 'theme', name: n, cost: price(i), bg, fg, p })),
  { id: 'st_none', t: 'sticker', name: 'No sticker', cost: 0, none: true },
  ...STICKERS.map(([k, n, svg], i): GiftItem => ({ id: 'st_' + k, t: 'sticker', name: n, cost: price(i), svg })),
];

export const giftItem = (id: string) => GIFT_ITEMS.find((i) => i.id === id);

/** What every new user starts with: the plain AutoWish look. */
export const FREE_ITEMS = GIFT_ITEMS.filter((i) => i.cost === 0).map((i) => i.id);

export type Equipped = Record<GiftKind, string>;
export const DEFAULT_EQUIPPED: Equipped = { hat: 'hat_none', ribbon: 'rib_sky_solid', theme: 'card_pink_plain', sticker: 'st_none' };

/**
 * The whole dressed-up gift (ribbon + hat), viewBox "0 0 200 230".
 * `centered` crops to a square around what's drawn, for round frames: the gift alone spans
 * about x 30-170, y 92-212; a hat can reach up to y 19, so with a hat the square is taller.
 */
export function dressedGiftSVG(equipped: Equipped, centered = false) {
  const rb = giftItem(equipped.ribbon) ?? giftItem(DEFAULT_EQUIPPED.ribbon)!;
  const hat = giftItem(equipped.hat);
  const hasHat = !!hat && !hat.none;
  const viewBox = !centered ? '0 0 200 230' : hasHat ? '-15 0 230 230' : '25 77 150 150';
  return `<svg viewBox="${viewBox}">${giftSVG(rb.r!, rb.kn!, rb.p)}${hasHat ? hat.svg : ''}</svg>`;
}

/** A grid tile or sheet picture for one item. */
export function itemArtSVG(it: GiftItem) {
  const ring = (vb: string, cx: number, cy: number, r: number) =>
    `<svg viewBox="${vb}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#A0AFCC" stroke-width="4" stroke-dasharray="6 6"/></svg>`;
  if (it.t === 'hat') return it.none ? ring('40 14 120 110', 100, 66, 30) : `<svg viewBox="40 14 120 110"><g transform="translate(0 -4)">${it.svg}</g></svg>`;
  if (it.t === 'ribbon') return `<svg viewBox="20 40 160 180">${giftSVG(it.r!, it.kn!, it.p)}</svg>`;
  if (it.t === 'sticker') return it.none ? ring('0 0 64 64', 32, 32, 20) : `<svg viewBox="0 0 64 64">${it.svg}</svg>`;
  // Cards: a little card with a yellow chip and a text line.
  return `<svg viewBox="0 0 58 42">${cardPattern(it, 58, 42, 22)}<rect x="8" y="8" width="18" height="6" rx="3" fill="#FFD961"/><rect x="8" y="20" width="30" height="5" rx="2.5" fill="${it.fg}" opacity=".8"/></svg>`;
}

/**
 * A card theme's background as SVG shapes for a w x h area: the colour, plus soft hearts or stripes.
 * `tile` is the pattern size (48 on the Today card, smaller on the tiny previews).
 */
export function cardPattern(it: GiftItem, w: number, h: number, tile = 48) {
  const dark = it.fg === '#FFFFFF';
  let pattern = '';
  if (it.p === 'hearts') {
    const a = dark ? '#FFD961' : '#FFFFFF';
    const b = dark ? '#FFFFFF' : '#EF7A70';
    const s = tile / 48;
    const h1 = (x: number, y: number, sc: number, c: string, o: number) =>
      `<path transform="translate(${x * s} ${y * s}) scale(${sc * s})" d="M0 9C0 9-10 3-10-3A5 5 0 0 1 0-6A5 5 0 0 1 10-3C10 3 0 9 0 9Z" fill="${c}" opacity="${o}"/>`;
    pattern = `<defs><pattern id="p" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse">${h1(12, 12, 0.55, a, 0.9)}${h1(36, 34, 0.45, b, dark ? 0.5 : 0.35)}</pattern></defs><rect width="${w}" height="${h}" fill="url(#p)"/>`;
  }
  if (it.p === 'stripes') {
    const c = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';
    const step = 20 * (tile / 48) + 8;
    pattern = `<defs><pattern id="p" width="${step}" height="${step}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${step / 2}" height="${step}" fill="${c}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#p)"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="${it.bg}"/>${pattern}`;
}
