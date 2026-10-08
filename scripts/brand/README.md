# ロゴ生成スクリプト

`src/assets/brand/*.svg` を生成するスクリプト。シンボルの形を直したいときは `symbol.mjs` の座標を編集して再生成する。

- `symbol.mjs`：H とクマを組み合わせたシンボルの形（viewBox 0 0 512 512）とブランドカラー
- `build.mjs`：シンボル＋文字のロゴ、SNS アイコン、ファビコンを `out/` に出力し、確認用の一覧画像 `sheet.png` を作る

## 実行方法

サイトの依存に含めないため、作業用フォルダで実行する。

```bash
mkdir brand-work && cd brand-work
cp ../scripts/brand/*.mjs .
npm init -y && npm i opentype.js sharp
curl -sSLO https://github.com/google/fonts/raw/main/ofl/mplusrounded1c/MPLUSRounded1c-Bold.ttf
curl -sSLO https://github.com/google/fonts/raw/main/ofl/mplusrounded1c/MPLUSRounded1c-Medium.ttf
node build.mjs
cp out/*.svg ../src/assets/brand/
```

## フォント

- 文字は M PLUS Rounded 1c（Bold／Medium）をアウトライン化している。
- ライセンス：SIL Open Font License 1.1。ロゴとして文字をアウトライン化して使うことは許可されている。フォントファイル自体はリポジトリに含めない。
