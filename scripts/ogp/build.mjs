/**
 * OGP 共通画像・apple-touch-icon・構造化データ用ロゴの PNG を作る（docs/design.md 12.8）。
 *
 * 実行：node scripts/ogp/build.mjs（リポジトリのルートで）
 * - sharp は Astro の依存として入っているものを使う（サイトの依存には追加しない）
 * - キャッチコピーの文字は BIZ UDPゴシック Bold（SIL OFL 1.1、Windows 10 1809 以降に標準搭載）で描く。
 *   フォントの場所は環境変数 OGP_FONT_FILE で変えられる。フォント自体はリポジトリに含めない
 * - 出力は public/ に置き、生成した PNG をコミットする（ビルドのたびには作らない）
 */
import { mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

const NAVY = '#17325B';
const BG = '#FBF8F3';
const FONT_FILE = process.env.OGP_FONT_FILE ?? 'C:/Windows/Fonts/BIZ-UDGothicB.ttc';
const TAGLINE = ['小さな困りごとから、', '開発まで。'];
const DOMAIN = 'higuma-lab.jp';

mkdirSync('public/og', { recursive: true });
mkdirSync('public/brand', { recursive: true });

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

// OGP 共通画像（1200×630）：左にロゴとキャッチコピー、右にマスコット、下端に紺の帯とドメイン
{
  const W = 1200;
  const H = 630;
  const BAND = 64;
  const logo = await sharp(readFileSync('src/assets/brand/logo-horizontal.svg'), { density: 300 })
    .resize({ width: 470 })
    .png()
    .toBuffer({ resolveWithObject: true });
  const mascot = await sharp('src/assets/mascot/mascot-laptop.png')
    .resize({ height: 380 })
    .png()
    .toBuffer({ resolveWithObject: true });
  const lines = await Promise.all(TAGLINE.map((line) => text(line, 58, NAVY)));
  const domain = await text(DOMAIN, 26, '#FFFFFF');

  const LEFT = 80;
  const composites = [
    { input: logo.data, left: LEFT, top: 96 },
    ...lines.map((line, i) => ({ input: line.data, left: LEFT, top: 290 + i * 84 })),
    {
      input: mascot.data,
      left: W - mascot.info.width - 40,
      top: H - BAND - mascot.info.height - 40,
    },
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAND}"><rect width="${W}" height="${BAND}" fill="${NAVY}"/></svg>`,
      ),
      left: 0,
      top: H - BAND,
    },
    {
      input: domain.data,
      left: LEFT,
      top: H - BAND + Math.round((BAND - domain.info.height) / 2),
    },
  ];

  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true })
    .toFile('public/og/default.png');
}

// apple-touch-icon（180×180）：iOS が角を丸めるため、角丸のない正方形にする
await sharp(readFileSync('src/assets/brand/sns-icon-light.svg'), { density: 300 })
  .resize(180, 180)
  .flatten({ background: NAVY })
  .png()
  .toFile('public/apple-touch-icon.png');

// 構造化データ（Organization.logo）用の 512×512 のロゴ
await sharp(readFileSync('src/assets/brand/sns-icon-light.svg'), { density: 300 })
  .resize(512, 512)
  .png()
  .toFile('public/brand/logo-512.png');

console.log('public/og/default.png, public/apple-touch-icon.png, public/brand/logo-512.png');
