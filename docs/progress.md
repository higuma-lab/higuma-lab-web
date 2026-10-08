# 進捗

セッションの開始時に読む。各フェーズの終わりに更新してコミットする。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md) を参照。

## 現在地

- **次の作業：Phase 4（基本実装）**
  - Astro の初期化、ESLint・Prettier、`tokens.css`（design.md 12.1〜12.3）、BaseLayout・Header・Footer・SkipLink、SeoHead、コンテンツのスキーマ（design.md 5章）、`AppDocLayout`（12.6）
  - UI の見本：`docs/design-preview.html`（画像を表示するにはリポジトリのルートをローカルサーバーで配信して開く）
  - 依存パッケージを追加するときは理由を説明する（CLAUDE.md）

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

## 完了したフェーズ

| フェーズ | 完了日 | 主な成果 |
|---|---|---|
| 準備 | 2026-10-08 | CLAUDE.md、要件、決定事項、レビュー用サブエージェント |
| Phase 1〜2 | 2026-10-08 | `docs/design.md`、git 初期化、非公開リポジトリ作成 |
| ロゴ・ブランド | 2026-10-08 | シンボル・ロゴ一式・マスコット（D-019〜D-021） |
| NoteFlip のページ方針 | 2026-10-08 | D-024、D-025、原稿の取り込み |
| Phase 3 | 2026-10-08 | `docs/design.md` 12章、見本 HTML、D-026〜D-030（配色・フォント・コピー・ラベル・アプリ用ページ） |
