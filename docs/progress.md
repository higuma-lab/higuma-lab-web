# 進捗

セッションの開始時に読む。各フェーズ・各作業の終わりに更新してコミットする。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md) を参照。

## 現在地

- Phase 1〜9 はすべて完了（2026-10-09）。今は公開に向けて、作業を1件ずつ片付ける段階（D-037。進め方は CLAUDE.md「Phase 9 の後の作業」）
- 基本デザインの 1 件目（サンプルサイト）を仮の URL で公開し、Works と料金のページに反映した（D-049）
- 2 件目のサンプル（架空の整体院）を公開し、基本デザインをテンプレートにした。Works に追加し、作業時間の見込みを直した（D-050）
- ドメインを取得し、AWS の構築を手順5（デプロイ用のロール）まで終えた。Zoho Mail で `info@`・`support@` の送受信ができる（2026-10-19）

## 公開までの順番

Partner Center の登録を待たずに、サイトを先に公開する（D-056）。NoteFlip の提出までにプライバシーポリシーの URL が開ければよい（D-024）。各項目の詳細は下の「作業の一覧」と `docs/operations.md` 9章。

1. **並行して進めるもの**（順番は問わない）
   - [x] オーナー：GitHub の設定のうち、手順6 の 1（environment）・3（ブランチ保護）・4（Dependabot）（2026-10-21）
   - オーナー：決めること（ライセンス、正規 URL を apex にすることの最終確認、Cloudflare Web Analytics を使うか）
   - オーナー：NoteFlip のページの突き合わせ（数値・「販売しています」の文言・最終更新日）。直す文面が決まったら Claude Code が反映する
   - オーナー：SNS のプロフィールのうち、サイトの URL 以外（アイコンは `docs/content/brand/`、名前、紹介文）。勤務先や経歴を推測させる内容は書かない
   - Claude Code：情報が届いたものから「TODO:」を消す
2. **構築記録の記事を仕上げる**：オーナーが下書きを自分の言葉に直す → AWS の構築で分かったこと（手順0〜5 の分）を加える。数値は 4 で公開時点のものにする
3. **点検**（文面を固めてから）：content-reviewer、site-auditor、外部リンクを手で開く、Lighthouse、iPhone の Safari。指摘を直す
4. **公開の PR**（Claude Code）：プライバシーポリシーの制定日、記事を `draft: false` にして公開日と数値を入れる、RSS の追加、ライセンスを README に書く、履歴に個人情報・秘密情報がないことの確認。オーナーがマージする（Variables を登録する前なので、まだデプロイされない）
5. **公開の当日**（オーナー）
   1. リポジトリを Public にし、外部からの PR のワークフローに承認を必要とする設定にする。`main` のルールと environment の制限が効いていることを確かめる（無料のプランでは、非公開のリポジトリでは効かないため、公開してから効く）
   2. 手順6 の 2（Variables）→ 5（初回のデプロイ）
   3. 手順7 の確認（ステータス・リダイレクト・ヘッダー・404・CSP）、`info@`・`support@` の送受信
   4. Search Console に登録し、サイトマップを送る
   5. SNS のプロフィールにサイトの URL を入れ、1 回目の告知（サイトの公開、できること、モニター募集、構築記録の記事）
6. **公開の後**
   - Claude Code：GitHub のリンクを `src/config/social.ts` と Works に入れる PR、Works から構築記録の記事へのリンク
   - オーナー：AWS の構築作業のメモの残り（手順6〜7、最初の請求額）
7. **NoteFlip**（DUNS の取得の後）：Partner Center の登録 → 名前の予約 → 提出 → 審査 → Store に公開。Store の公開後に、ストアの URL・スクリーンショットを Works に入れて、SNS で 2 回目の告知

## 作業の一覧

作業が終わったら、ここを更新してコミットする。大きさ（小・中・大）は CLAUDE.md の表による。

### Claude Code の作業

- [x] プロフィールの経歴の記載を見直す（小、D-037）
- [x] NoteFlip のストア用ページにバックアップと復元の記述を反映（小。NoteFlip `6de9ae8` の内容。サポートの FAQ 追加、プライバシーポリシーの1文と最終更新日 2026-10-13）
- [x] 対応地域・経験年数・打ち合わせの方法を反映（小、D-039）
- [x] 料金・無料相談の範囲・モニター募集を反映（中、D-040）
- [x] Webサイト制作の「基本デザイン」の 1 件目（架空のパン屋のサンプルサイト。D-048・D-049。進捗は `site-template` の `docs/`）
  - [x] Works にサンプル制作として追加、料金のページで「基本デザイン」と書く（中、D-049）
  - [x] Works のリンク（こむぎと湯気・からだ休符の 2 件）を `higuma-lab.jp` のサブドメイン（`<店名>.sample.higuma-lab.jp`）に差し替える（2026-10-19、D-051）。2 つのサンプルのリポジトリの URL の差し替えは、それぞれのリポジトリの PR
  - [x] 2 件目のサンプル（別の業種）で、基本デザインを使い回せるか確かめる（2026-10-18、D-050。Works に追加）
  - [x] お店の方が自分で更新できる仕組みを、Webサイト制作のプランに含めるか決める：希望する方に含める（2026-10-19、D-053）
- [ ] 画面の「TODO:」の解消（小。情報が届いたものから。下の「オーナーの作業」の未確定の情報）
- [ ] 構築記録の記事（中、D-016・D-038）：インタビューをもとに書き直した下書きあり（約 2,900 文字、`draft: true`。開発サーバーで確認できる）→ サイトの公開時に数値と AWS の構築で分かったことを加えて公開、RSS を追加（D-034）
- [ ] 公開前の点検：site-auditor・content-reviewer（`docs/operations.md` 9章）
- [x] Phase 8 で見送った提案：Dependabot と CDK の推奨 feature flags は採用、OIDC の sub に ref を含めるのと解析ありのビルドで E2E は見送り（D-044・D-045）
- [ ] Works の種別で絞り込むページ（中。Works が 6〜8 件以上になったら。decisions.md の TODO）

### オーナーの作業

- [x] ドメイン `higuma-lab.jp` の取得（2026-10-19。`higuma-lab.com` も合わせて取得）
- [x] `higuma-lab.com` の扱い：転送せず持っておくだけ（2026-10-19、D-054）
- [x] `higuma-lab.com` のなりすまし対策：お名前.com の DNS に null MX（`0 .`）・SPF（`v=spf1 -all`）・DMARC（`_dmarc` に `v=DMARC1; p=reject`）を置いた（2026-10-20、公開の DNS で反映を確認。D-054）
- [ ] 両ドメインの更新の料金を確かめる（取得はキャンペーンの価格だった）。`.com` を更新するかは更新の時期に決める
- [ ] AWS の構築（`infra/README.md` の手順0〜7）：手順0〜5 は完了（2026-10-19。証明書・S3・CloudFront・デプロイ用のロールまで。バケットは空）。手順6 の 1・3・4 は完了（2026-10-21）。**手順6 の 2（Variables）と 5（初回のデプロイ）は、公開前の点検の後**（登録すると `main` へのマージで公開される）
- [ ] GitHub：environment `production`（main のみ）・`main` のルール（Rulesets）・Dependabot の alerts とセキュリティ更新は設定済み（2026-10-21）。無料のプランのため、ルールと environment の制限はリポジトリを Public にしてから効く。残りは Variables（`infra/README.md` 手順6 の 2）
- [x] Zoho Mail の登録と `support@` の別名作成（2026-10-19。所有確認・MX・SPF・DKIM は `infra/config/mail.ts`、表示名と署名は事業の名前、D-004・D-025）
- [ ] DMARC の監視（`p=none` で開始。レポートで問題がなければ `quarantine` → `reject` に強める）
- [ ] NoteFlip リポジトリの更新（指示文は渡し済み、D-024）
- [ ] 素材の用意（`docs/content/README.md` のチェックリスト）
- [ ] 構築記録の記事：下書きの言い回しを自分の言葉に直す（インタビューは回答済み、D-038）
- [ ] AWS の構築作業のメモ：手順0〜2 とメールの分は `build-log.md` に記録済み。残りは手順3〜7 と、最初の請求額
- [ ] リポジトリのライセンスを決める（公開前。README の TODO）
- [ ] 公開前のチェックリスト（`docs/operations.md` 9章）
- [ ] Node.js を最新の 24 LTS（24.16 以上）に更新（D-031）
- [x] 仮の文面の確認：サービス6件（`src/content/services/`）、特徴・ご相談の流れ・FAQ（`src/data/home.ts`）、About（`src/pages/about.astro`、`src/data/profile.ts`）、プライバシーポリシー（`src/content/pages/privacy.md`）（2026-10-15 確定、D-042・D-043）
- [x] AI のクローラーを robots.txt で許可するか：全部許可（2026-10-19、D-052）
- [x] SNS の URL：X・Instagram は設定済み（2026-10-15、`src/config/social.ts`、D-012）。GitHub はリポジトリの公開後
- [ ] プライバシーポリシーの制定日を公開日に入れる（`src/content/pages/privacy.md`。アクセスログは保存しないことに決定、D-043）
- [ ] 正規 URL を apex（`https://higuma-lab.jp`）にすることの最終確認（D-003）
- [ ] NoteFlip の公開予定時期・ストアの URL・スクリーンショット
  - 順番：サイトを公開（審査でプライバシーポリシーの URL が開ける必要がある。D-024。DUNS の取得を待つ間に先に公開する）→ Partner Center で名前を予約（Store ID が決まる。予約には期限があるので確認する）→ 提出（公開のしかたは「手動」か「日時の指定」）→ 審査 → Store に公開。サイトの公開から Store への公開までの間、Store のリンクは出さない
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
