import opentype from 'opentype.js';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { symbolBody, NAVY } from './symbol.mjs';

const bold = opentype.parse(readFileSync('MPLUSRounded1c-Bold.ttf').buffer);
const medium = opentype.parse(readFileSync('MPLUSRounded1c-Medium.ttf').buffer);
const r = (n) => Math.round(n * 100) / 100;

// text -> path at origin; returns {d, w, h} with bbox normalized to (0,0)
function textPath(font, text, size, tracking = 0) {
  let x = 0; const parts = [];
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    parts.push(g.getPath(x, 0, size));
    x += (g.advanceWidth / font.unitsPerEm) * size + tracking;
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of parts) { const b = p.getBoundingBox(); if (b.x1 === b.x2) continue;
    minX = Math.min(minX, b.x1); minY = Math.min(minY, b.y1); maxX = Math.max(maxX, b.x2); maxY = Math.max(maxY, b.y2); }
  const d = parts.map((p) => { p.commands.forEach((c) => { for (const k of ['x','y','x1','y1','x2','y2']) if (k in c) c[k] = r(c[k] - (k.startsWith('x') ? minX : minY)); }); return p.toPathData(2); }).join('');
  return { d, w: maxX - minX, h: maxY - minY };
}
const jp = (s) => textPath(bold, 'ひぐま開発室', s);
const en = (s) => textPath(medium, 'HIGUMA LAB', s, s * 0.28);
const sym = (x, y, size, opts) => `<g transform="translate(${r(x)} ${r(y)}) scale(${r(size / 512 * 1000) / 1000})">${symbolBody(opts)}</g>`;
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const TITLE = 'ひぐま開発室 HIGUMA LAB';
const out = {};

// symbol (navy on transparent, cutouts white)
out['symbol.svg'] = svg(512, 512, symbolBody(), TITLE);
out['symbol-white.svg'] = svg(512, 512, symbolBody({ fg: '#FFFFFF', bg: NAVY }), TITLE);

// horizontal: symbol + text
{
  const S = 200, gap = 36, J = jp(84), E = en(30), lineGap = 22;
  const textH = J.h + lineGap + E.h, tx = S + gap, ty = (S - textH) / 2;
  const W = tx + Math.max(J.w, E.w);
  const body = sym(0, 0, S) + `<g fill="${NAVY}"><path transform="translate(${r(tx)} ${r(ty)})" d="${J.d}"/>`
    + `<path transform="translate(${r(tx + (J.w - E.w) / 2)} ${r(ty + J.h + lineGap)})" d="${E.d}"/></g>`;
  out['logo-horizontal.svg'] = svg(W, S, body, TITLE);
}
// stacked: symbol above text
{
  const S = 400, J = jp(120), E = en(44), g1 = 44, g2 = 30;
  const W = Math.max(S, J.w, E.w), H = S + g1 + J.h + g2 + E.h;
  const body = sym((W - S) / 2, 0, S) + `<g fill="${NAVY}"><path transform="translate(${r((W - J.w) / 2)} ${r(S + g1)})" d="${J.d}"/>`
    + `<path transform="translate(${r((W - E.w) / 2)} ${r(S + g1 + J.h + g2)})" d="${E.d}"/></g>`;
  out['logo-stacked.svg'] = svg(W, H, body, TITLE);
}
// SNS icons (square, safe for circle crop)
{
  const N = 1024, S = 760, o = (N - S) / 2 + 10;
  out['sns-icon-light.svg'] = svg(N, N, `<rect width="${N}" height="${N}" fill="#FFFFFF"/>` + sym((N - S) / 2, o, S), TITLE);
  out['sns-icon-dark.svg'] = svg(N, N, `<rect width="${N}" height="${N}" fill="${NAVY}"/>` + sym((N - S) / 2, o, S, { fg: '#FFFFFF', bg: NAVY }), TITLE);
}
// favicon: rounded square, white symbol without code
{
  const N = 512, S = 440, o = (N - S) / 2;
  out['favicon.svg'] = svg(N, N, `<rect width="${N}" height="${N}" rx="112" fill="${NAVY}"/>` + sym(o, o + 8, S, { fg: '#FFFFFF', bg: NAVY, withCode: false }), TITLE);
}

mkdirSync('out', { recursive: true });
for (const [f, s] of Object.entries(out)) writeFileSync(`out/${f}`, s);

// contact sheet
const png = (f, w, bg = '#ffffff') => sharp(Buffer.from(out[f])).resize({ width: w }).flatten({ background: bg }).png().toBuffer();
const tiles = [
  { input: await png('logo-horizontal.svg', 560), left: 20, top: 20 },
  { input: await png('logo-stacked.svg', 260), left: 620, top: 20 },
  { input: await png('sns-icon-light.svg', 160), left: 20, top: 300 },
  { input: await png('sns-icon-dark.svg', 160), left: 200, top: 300 },
  { input: await png('sns-icon-dark.svg', 48), left: 380, top: 300 },
  { input: await png('sns-icon-light.svg', 48), left: 440, top: 300 },
  { input: await png('favicon.svg', 32), left: 380, top: 370 },
  { input: await png('favicon.svg', 16), left: 425, top: 378 },
  { input: await png('symbol.svg', 64), left: 500, top: 300 },
  { input: await png('logo-horizontal.svg', 240), left: 20, top: 480 },
];
// circle-crop simulation for SNS icons
const mask = Buffer.from(`<svg width="160" height="160"><circle cx="80" cy="80" r="80"/></svg>`);
for (const [i, f] of ['sns-icon-light.svg', 'sns-icon-dark.svg'].entries()) {
  tiles.push({ input: await sharp(await png(f, 160)).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), left: 600 + i * 180, top: 360 });
}
await sharp({ create: { width: 980, height: 560, channels: 3, background: '#e6e6e6' } }).composite(tiles).png().toFile('sheet.png');
console.log(Object.keys(out).map((f) => `${f} ${out[f].length}B`).join('\n'));
