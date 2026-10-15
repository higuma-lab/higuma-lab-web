# 進捗

セッションの開始時に読む。各フェーズ・各作業の終わりに更新してコミットする。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md) を参照。

## 現在地

- Phase 1〜9 はすべて完了（2026-10-09）。今は公開に向けて、作業を1件ずつ片付ける段階（D-037。進め方は CLAUDE.md「Phase 9 の後の作業」）
- 進行中：なし

## 作業の一覧

作業が終わったら、ここを更新してコミットする。大きさ（小・中・大）は CLAUDE.md の表による。

### Claude Code の作業

- [x] プロフィールの経歴の記載を見直す（小、D-037）
- [x] NoteFlip のストア用ページにバックアップと復元の記述を反映（小。NoteFlip `6de9ae8` の内容。サポートの FAQ 追加、プライバシーポリシーの1文と最終更新日 2026-10-13）
- [x] 対応地域・経験年数・打ち合わせの方法を反映（小、D-039）
- [x] 料金・無料相談の範囲・モニター募集を反映（中、D-040）
- [ ] Webサイト制作の「基本デザイン」（お客様のサイトの土台）を作る（中〜大。モニターの1件目で作り、2件目で使い回せるか確かめる。D-040）
- [ ] 画面の「TODO:」の解消（小。情報が届いたものから。下の「オーナーの作業」の未確定の情報）
- [ ] 構築記録の記事（中、D-016・D-038）：インタビューをもとに書き直した下書きあり（約 2,900 文字、`draft: true`。開発サーバーで確認できる）→ サイトの公開時に数値と AWS の構築で分かったことを加えて公開、RSS を追加（D-034）
- [ ] 公開前の点検：site-auditor・content-reviewer（`docs/operations.md` 9章）
- [ ] Phase 8 で見送った提案（オーナーの判断待ち）：解析ありのビルドで E2E、CDK の推奨 feature flags（Dependabot は採用、OIDC の sub に ref を含めるのは見送り。D-044）
- [ ] Works の種別で絞り込むページ（中。Works が 6〜8 件以上になったら。decisions.md の TODO）

### オーナーの作業

- [ ] ドメイン `higuma-lab.jp` の取得（Whois 情報公開代行の確認）
- [ ] AWS アカウントの作成、ルートユーザーの MFA、AWS の構築（`infra/README.md` の手順0〜7）
- [ ] GitHub：environment `production`（main のみ）、Variables、`main` のブランチ保護、Dependabot のセキュリティ更新（`infra/README.md` 手順6）
- [ ] Zoho Mail の登録と `support@` の別名作成（Route 53 構築後、D-004・D-025）
- [ ] NoteFlip リポジトリの更新（指示文は渡し済み、D-024）
- [ ] 素材の用意（`docs/content/README.md` のチェックリスト）
- [ ] 構築記録の記事：下書きの言い回しを自分の言葉に直す（インタビューは回答済み、D-038）
- [ ] AWS の構築作業のメモ（かかった時間、困ったこと、最初の請求額）を残す。記事に使う
- [ ] リポジトリのライセンスを決める（公開前。README の TODO）
- [ ] 公開前のチェックリスト（`docs/operations.md` 9章）
- [ ] Node.js を最新の 24 LTS（24.16 以上）に更新（D-031）
- [x] 仮の文面の確認：サービス6件（`src/content/services/`）、特徴・ご相談の流れ・FAQ（`src/data/home.ts`）、About（`src/pages/about.astro`、`src/data/profile.ts`）、プライバシーポリシー（`src/content/pages/privacy.md`）（2026-10-15 確定、D-042・D-043）
- [ ] AI のクローラーを robots.txt で許可するか（今は全許可）
- [ ] SNS の URL（X・Instagram。GitHub はリポジトリの公開後。`src/config/social.ts`、D-012）
- [ ] プライバシーポリシーの制定日を公開日に入れる（`src/content/pages/privacy.md`。アクセスログは保存しないことに決定、D-043）
- [ ] 正規 URL を apex（`https://higuma-lab.jp`）にすることの最終確認（D-003）
- [ ] NoteFlip の公開予定時期・ストアの URL・スクリーンショット
  - 順番：Partner Center で名前を予約（Store ID が決まる。予約には期限があるので確認する）→ サイトを公開（審査でプライバシーポリシーの URL が開ける必要がある。D-024）→ 提出（公開のしかたは「手動」か「日時の指定」）→ 審査 → Store に公開。サイトの公開から Store への公開までの間、Store のリンクは出さない
- [x] 未確定の情報：対応地域・経験年数・打ち合わせの方法は D-039、料金は D-040、スキルとアプリの対応プラットフォームは D-041 で確定
- [x] プロフィールの経歴の記載が、勤務先の規程・守秘の範囲で問題ないかの確認（2026-10-15 確認済み）
- [ ] NoteFlip：2台目の PC に同じ Microsoft アカウントで入れ、購入済みとして起動するかを実機で確認（9-5 の購入テストのとき）。確認できたら、サポートと Works の「買い直し不要」の記述にある TODO コメントを消す
- [ ] NoteFlip のページ：数値（`src/content/works/noteflip.md`）を ADR と突き合わせる。ストア用ページの「販売しています」（未公開との整合）、無料試用 7 日、「数日以内にお返事」、「インターネットに接続しません」と Store・Windows の通信の書き分け、最終更新日

## メモ

- インフラのコマンド：`cd infra` で `npm test`・`npm run check`・`npm run synth`（AWS に接続しない。値は `infra/.env` か環境変数）
- 実環境の作業（AWS アカウント・DNS・GitHub の設定）は行わない。オーナーが `infra/README.md` の手順で行う
- OGP 画像などを作り直すとき：`node scripts/ogp/build.mjs`（D-034）
- Markdown（`src/content/`）の HTML コメント（`<!-- -->`）は公開ページの HTML にそのまま出る。オーナー向けのメモや TODO は書かず、この作業の一覧で管理する（front matter の YAML コメントは出ない）
- 画面に点線枠の「TODO:」が出ている箇所は、オーナーの確認・情報待ち。公開前にすべて解消する
- ローカル確認：`.claude/launch.json` の `astro-dev`（開発サーバー、4321 番。下書きも表示）と `astro-preview`（ビルド結果、4323 番。`npm run build` の後に使う）。E2E は 4322 番を使うので、ほかのサーバーに 4322 番を使わせない

## 素材の場所

- ロゴ：`src/assets/brand/`（生成スクリプトは `scripts/brand/`、SNS 用 PNG は `docs/content/brand/`）
- マスコット：`src/assets/mascot/`
- NoteFlip のストア用ページ：`src/content/apps/noteflip/`（原本。更新方法は `docs/content/apps/noteflip/README.md`）

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
| Phase 9 | 2026-10-09 | README・運用手順・Works の本文・構築記録の下書き、content-reviewer の指摘を反映 |
