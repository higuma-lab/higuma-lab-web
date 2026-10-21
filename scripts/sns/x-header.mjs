/**
 * X（旧 Twitter）のヘッダー画像（1500×500）を作る。
 *
 * 実行：node scripts/sns/x-header.mjs（リポジトリのルートで）
 * - 作りは scripts/ogp/build.mjs と同じ（sharp は Astro の依存として入っているもの、文字は BIZ UDPゴシック Bold）
 * - 出力は docs/content/brand/（サイトでは配信しない。X にアップロードする）
 * - 左下はプロフィールのアイコンが重なるため、何も置かない（x < 400 かつ y > 330 のあたり）
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const NAVY = '#17325B';
const BROWN = '#AB663C'; // マスコットの茶色。装飾にだけ使う（D-026）
const BROWN_TEXT = '#8E4F2A';
const BG = '#FBF8F3';
const FONT_FILE = process.env.OGP_FONT_FILE ?? 'C:/Windows/Fonts/BIZ-UDGothicB.ttc';
const TAGLINE = ['小さな困りごとから、', '開発まで。'];
const SERVICES = 'Webサイト制作・アプリ開発・IT／AI のご相談';
const DOMAIN = 'higuma-lab.jp';
const OUT = 'docs/content/brand/x-header-1500x500.png';

const text = (value, size, color) =>
  sharp({
    text: {
      text: `<span foreground="${color}" size="${size * 1024}" weight="bold">${value}</span>`,
      font: 'BIZ UDPGothic Bold',
      fontfile: FONT_FILE,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });

mkdirSync('docs/content/brand', { recursive: true });

const W = 1500;
const H = 500;
const LEFT = 110;

const mascot = await sharp('src/assets/mascot/mascot-laptop.png')
  .resize({ height: 340 })
  .png()
  .toBuffer({ resolveWithObject: true });
const lines = await Promise.all(TAGLINE.map((line) => text(line, 68, NAVY)));
const services = await text(SERVICES, 30, BROWN_TEXT);
const domain = await text(DOMAIN, 26, NAVY);

const MASCOT_RIGHT = 80;
const MASCOT_TOP = 60;

await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
  .composite([
    ...lines.map((line, i) => ({ input: line.data, left: LEFT, top: 72 + i * 88 })),
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="6"><rect width="64" height="6" rx="3" fill="${BROWN}"/></svg>`,
      ),
      left: LEFT,
      top: 252,
    },
    { input: services.data, left: LEFT, top: 280 },
    { input: mascot.data, left: W - MASCOT_RIGHT - mascot.info.width, top: MASCOT_TOP },
    {
      input: domain.data,
      left: W - MASCOT_RIGHT - domain.info.width,
      top: MASCOT_TOP + mascot.info.height + 24,
    },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile(OUT);

console.log(OUT);
