# 進捗

セッションの開始時に読む。各フェーズの終わりに更新してコミットする。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md) を参照。

## 現在地

- **Phase 8（AWS デプロイ用設定）★ 完了、オーナーの承認待ち**
  - PR：`phase-8-infra` → `main`（オーナーがマージする）。マージしても、AWS を構築して GitHub の Variables を登録するまではデプロイのジョブは飛ばされる
  - 成果：`infra/`（CDK 4スタック、CloudFront Function、テスト 25 件）、`.github/workflows/ci.yml`・`deploy.yml`、構築手順書 `infra/README.md`（D-036）
  - infra-reviewer：重大0・要修正3（すべて修正）・提案7（一部反映、残りは下記）
  - 見送った提案（オーナーの判断待ち）：Dependabot で Actions・npm を自動更新、OIDC の sub に ref を含めるカスタマイズ、本番と同じ設定（解析あり）のビルドを CI で E2E、CDK の推奨 feature flags の設定
- **次の作業：Phase 9（README・運用手順）**
  - `README.md`、`docs/operations.md`（記事の追加、デプロイ、DNS 切り替え、メール設定、Search Console、費用アラート）。`infra/README.md` と重複させず参照する
  - ブログ1本目（構築記録）の下書き（D-016、`docs/content/build-log.md`）
- インフラのコマンド：`cd infra` で `npm test`・`npm run check`・`npm run synth`（AWS に接続しない。値は `infra/.env` か環境変数）
- 実環境の作業（AWS アカウント・DNS・GitHub の設定）は行わない。オーナーが `infra/README.md` の手順で行う
- OGP 画像などを作り直すとき：`node scripts/ogp/build.mjs`（D-034）
- 画面に点線枠の「TODO:」が出ている箇所は、オーナーの確認・情報待ち（下の「オーナー側の未完了作業」）。公開前にすべて解消する
- ローカル確認：`.claude/launch.json` の `astro-preview`（`npm run build` の後に使う）

## 素材の場所

- ロゴ：`src/assets/brand/`（生成スクリプトは `scripts/brand/`、SNS 用 PNG は `docs/content/brand/`）
- マスコット：`src/assets/mascot/`
- NoteFlip のストア用ページ：`src/content/apps/noteflip/`（原本。更新方法は `docs/content/apps/noteflip/README.md`）

## オーナー側の未完了作業

- [ ] ドメイン `higuma-lab.jp` の取得（Whois 情報公開代行の確認）
- [ ] AWS アカウントの作成、ルートユーザーの MFA、AWS の構築（`infra/README.md` の手順0〜7）
- [ ] GitHub：environment `production`（main のみ）、Variables、`main` のブランチ保護（`infra/README.md` 手順6）
- [ ] Zoho Mail の登録と `support@` の別名作成（Route 53 構築後、D-004・D-025）
- [ ] NoteFlip リポジトリの更新（指示文は渡し済み、D-024）
- [ ] 素材の用意（`docs/content/README.md` のチェックリスト）
- [ ] Node.js を最新の 24 LTS（24.16 以上）に更新（D-031）
- [ ] 仮の文面の確認：サービス6件（`src/content/services/`）、特徴・ご相談の流れ・FAQ（`src/data/home.ts`）、About（`src/pages/about.astro`、`src/data/profile.ts`）
- [ ] AI のクローラーを robots.txt で許可するか（今は全許可）
- [ ] 未確定の情報：活動地域・経験年数、相談の費用・料金の目安、打ち合わせの方法、対応地域、対応できるアプリのプラットフォーム、掲載するスキル
- [ ] プロフィールの「医療機器向け」等の記載が、勤務先の規程・守秘の範囲で問題ないかの確認
- [ ] NoteFlip のページ：数値（`src/content/works/noteflip.md`）を ADR と突き合わせる。ストア用ページの「販売しています」（未公開との整合）、無料試用 7 日、「数日以内にお返事」、「インターネットに接続しません」と Store・Windows の通信の書き分け、最終更新日

## 完了したフェーズ

| フェーズ | 完了日 | 主な成果 |
|---|---|---|
| 準備 | 2026-10-08 | CLAUDE.md、要件、決定事項、レビュー用サブエージェント |
| Phase 1〜2 | 2026-10-08 | `docs/design.md`、git 初期化、非公開リポジトリ作成 |
| ロゴ・ブランド | 2026-10-08 | シンボル・ロゴ一式・マスコット（D-019〜D-021） |
| NoteFlip のページ方針 | 2026-10-08 | D-024、D-025、原稿の取り込み |
| Phase 3 | 2026-10-08 | `docs/design.md` 12章、見本 HTML、D-026〜D-030（配色・フォント・コピー・ラベル・アプリ用ページ） |
| Phase 4 | 2026-10-08 | Astro 7 の初期化、Lint・Formatter、トークン CSS、共通レイアウト・部品、コンテンツのスキーマ（D-031、D-032） |
| Phase 5 | 2026-10-09 | 全ページ・データ・NoteFlip のアプリ用ページ、content-reviewer の指摘を反映（D-033） |
| Phase 6 | 2026-10-09 | サイトマップ・robots.txt・構造化データ・OGP 画像・CSS の1ファイル化、site-auditor の指摘を反映（D-034） |
| Phase 7 | 2026-10-09 | Vitest 24件・E2E 79件（axe 含む）・リンク切れチェック、メールの案内文、site-auditor の指摘を反映（D-035） |
| Phase 8 | 2026-10-09 | CDK 4スタック・CloudFront Function・CI/デプロイのワークフロー・構築手順書、infra-reviewer の指摘を反映（D-036） |
