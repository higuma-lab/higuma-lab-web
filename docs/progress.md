# 進捗

セッションの開始時に読む。各フェーズの終わりに更新してコミットする。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md) を参照。

## 現在地

- **次の作業：Phase 5（コンテンツ実装）**
  - 全ページ（design.md 4章・12.3）、サービス・Works・ブログのデータ（未確定部分は `TODO:`）、NoteFlip のアプリ用ページ（`docs/content/apps/noteflip/` → `src/content/apps/noteflip/{doc}.{lang}.md`、Jekyll の変数を設定値に置き換え）
  - 終わったら `content-reviewer` で点検する
  - ブランチ `phase-5-content` で作業し、終わったら PR で `main` に取り込む（D-033）
- Phase 4 で作ったもの：
  - 設定：`astro.config.ts`（`trailingSlash: 'always'`、インライン化なし D-032、`astro:env`）、ESLint・Prettier、`.env.example`
  - `src/styles/tokens.css`・`global.css`、`src/config/site.ts`・`social.ts`
  - レイアウト：`BaseLayout`、`AppDocLayout`（`ArticleLayout` は Phase 5 で記事の形に合わせて作る）
  - 部品：`Header`（モバイルメニュー）、`Footer`、`SkipLink`、`Breadcrumbs`、`PageHeader`、`SeoHead`、`JsonLd`、`Analytics`、`Button`、`Card`、`Badge`、`SectionHeading`、`Prose`、`SocialLinks`、`LangSwitch`
  - コンテンツのスキーマ：`services`・`works`・`blog`・`apps`（`src/content.config.ts`）
  - トップページは仮（Hero のみ）
- ローカル確認：`.claude/launch.json` の `astro-preview`（`npm run build` の後に使う）

## 素材の場所

- ロゴ：`src/assets/brand/`（生成スクリプトは `scripts/brand/`、SNS 用 PNG は `docs/content/brand/`）
- マスコット：`src/assets/mascot/`
- NoteFlip のストア用ページの原稿：`docs/content/apps/noteflip/`

## オーナー側の未完了作業

- [ ] ドメイン `higuma-lab.jp` の取得（Whois 情報公開代行の確認）
- [ ] AWS アカウントの作成、ルートユーザーの MFA（Phase 8 まで）
- [ ] Zoho Mail の登録と `support@` の別名作成（Route 53 構築後、D-004・D-025）
- [ ] NoteFlip リポジトリの更新（指示文は渡し済み、D-024）
- [ ] 素材の用意（`docs/content/README.md` のチェックリスト）
- [ ] Node.js を最新の 24 LTS（24.16 以上）に更新（D-031）

## 完了したフェーズ

| フェーズ | 完了日 | 主な成果 |
|---|---|---|
| 準備 | 2026-10-08 | CLAUDE.md、要件、決定事項、レビュー用サブエージェント |
| Phase 1〜2 | 2026-10-08 | `docs/design.md`、git 初期化、非公開リポジトリ作成 |
| ロゴ・ブランド | 2026-10-08 | シンボル・ロゴ一式・マスコット（D-019〜D-021） |
| NoteFlip のページ方針 | 2026-10-08 | D-024、D-025、原稿の取り込み |
| Phase 3 | 2026-10-08 | `docs/design.md` 12章、見本 HTML、D-026〜D-030（配色・フォント・コピー・ラベル・アプリ用ページ） |
| Phase 4 | 2026-10-08 | Astro 7 の初期化、Lint・Formatter、トークン CSS、共通レイアウト・部品、コンテンツのスキーマ（D-031、D-032） |
