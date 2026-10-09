# 運用手順

ひぐま開発室 Webサイトの日々の運用の手順。初回の AWS 構築は [infra/README.md](../infra/README.md) を参照する。
方針は [decisions.md](decisions.md)、設計は [design.md](design.md)。

## 目次

1. [変更の流れ（ブランチ → PR → デプロイ）](#1-変更の流れ)
2. [コンテンツの更新](#2-コンテンツの更新)（ブログ、制作物、サービス、プロフィール、SNS、アプリ用ページ、画像）
3. [デプロイの確認と戻し方](#3-デプロイの確認と戻し方)
4. [DNS・メール](#4-dnsメール)
5. [Google Search Console](#5-google-search-console)
6. [アクセス解析（Cloudflare Web Analytics）](#6-アクセス解析cloudflare-web-analytics)
7. [費用の確認](#7-費用の確認)
8. [定期的な保守](#8-定期的な保守)
9. [公開前のチェックリスト](#9-公開前のチェックリスト)
10. [困ったとき](#10-困ったとき)

---

## 1. 変更の流れ

`main` へのマージは、そのまま本番へのデプロイになる。`main` に直接コミットしない（D-033）。

1. `main` を最新にして、ブランチを切る
   ```bash
   git switch main
   git pull
   git switch -c blog/2026-11-first-post
   ```
   ブランチ名の例：`blog/...`（記事）、`works/...`（制作物）、`fix/...`（修正）、`docs/...`（文書）
2. 変更して、手元で確認する
   ```bash
   npm run dev
   ```
   http://localhost:4321 で表示を確認する。
3. コミット前に検証する（CI と同じ内容。E2E は数分かかる）
   ```bash
   npm run format
   npm run lint
   npm run check
   npm test
   npm run test:links
   npm run test:e2e
   ```
4. push して PR を作る。CI（`Site`・`Infra`）が通るのを待つ。
   ```bash
   git push -u origin HEAD
   gh pr create --fill
   ```
5. PR をマージする（マージコミット）。GitHub Actions の **Deploy** が動き、数分で本番に反映される。

### 文章を確認したいとき

公開前の確認には、`.claude/agents/` のレビュー用サブエージェントを使える（Claude Code で「content-reviewer で点検して」等と頼む）。

| エージェント | 使うとき |
|---|---|
| `content-reviewer` | 記事・制作物・プロフィールを追加・変更したとき |
| `site-auditor` | 大きな変更の後、公開前 |
| `infra-reviewer` | `infra/` や `.github/workflows/` を変更したとき |

---

## 2. コンテンツの更新

コンテンツはすべてリポジトリ内のファイル。保存するとビルド時にスキーマで検証され、項目の不足や型の誤りはビルドエラーになる。

### 2.1 ブログ記事を追加する

1. `src/content/blog/{スラッグ}.md` を作る。スラッグは英小文字とハイフン（例：`building-this-site`）。URL は `/blog/{スラッグ}/` になる。
2. 先頭に front matter を書く。
   ```markdown
   ---
   title: 記事のタイトル
   description: 検索結果や SNS に出る説明文（70〜120 文字程度）
   publishedAt: 2026-11-01
   # updatedAt: 2026-11-10        # 更新したときに追加
   tags: [Astro, AWS]
   # cover: ../../assets/blog/building-this-site/cover.png   # 任意。OGP 画像にも使う
   # coverAlt: 画像の説明
   draft: true                     # 書いている間は true。公開するときに false にする
   ---

   本文（Markdown）。見出しは ## から使う（# はページのタイトルに使われる）。
   ```
3. `draft: true` の間はビルドに含まれない（本番にも出ない）。手元で見たいときは一時的に `false` にして `npm run dev` で確認する。
4. 公開するときは `draft: false` にし、`publishedAt` を公開日にして PR を出す。

- 公開する記事が1本もない間は、ブログの一覧ページとナビの「ブログ」は出ない。1本目を公開すると自動で出る。
- **1本目を公開するときに RSS（`/rss.xml`）を追加する**（`@astrojs/rss`、D-017・D-034）。記事が0本のフィードを出さないため、それまでは入れていない。Claude Code に「RSS を追加して」と頼めばよい。
- 1本目は「このサイトの構築記録」（D-016）。下書きは `src/content/blog/building-this-site.md`（`draft: true`）。

### 2.2 制作物（Works）を追加する

1. `src/content/works/{スラッグ}.md` を作る。URL は `/works/{スラッグ}/`。
2. front matter：
   ```markdown
   ---
   title: 制作物の名前
   kind: own-product      # own-product（自社プロダクト）/ sample（サンプル制作）/ experiment（技術検証）/ client（お客様案件）
   summary: 一覧に出る1〜2文の説明
   status: released       # released（公開中）/ upcoming（公開予定）/ in-progress（開発中）
   tech: [Astro, TypeScript]
   links:
     - label: GitHub
       url: https://github.com/...
   featured: false        # true ならトップページに出す
   publishedAt: 2026-11-01
   ---
   ```
3. 本文を書くと詳細ページができる。本文が空なら一覧にだけ載る。本文の流れは「課題 → 設計 → 技術 → 工夫点」。
4. 並び順：`featured: true` が先、その中は `publishedAt` の新しい順。

- **お客様案件（`client`）は、掲載の許可を得たものだけ**。社名・製品名・数値は許可の範囲で書く。架空の実績は書かない（CLAUDE.md）。
- Works が増えたら（目安 6〜8 件以上）、種別で絞り込むページを追加する（decisions.md の TODO）。

### 2.3 サービス・料金

- サービス：`src/content/services/*.yaml`（6件。`group` は web / app / consulting、`order` で並び順）。
- 料金の目安が決まったら、各サービスの `priceNote` に書く（D-010）。決まるまでは書かない。
- 実際に提供していないサービスは追加しない。

### 2.4 トップページ・プロフィール・お問い合わせ

| 内容 | ファイル |
|---|---|
| キャッチコピー・説明文・屋号・メールアドレス | `src/config/site.ts` |
| トップの「特徴」・ご相談の流れ・FAQ | `src/data/home.ts` |
| プロフィール（活動地域・経験年数・スキル） | `src/data/profile.ts`、`src/pages/about.astro` |
| プライバシーポリシー | `src/content/pages/privacy.md`（制定日は `establishedAt`。変えたら `updatedAt` を変更日にする） |
| robots.txt（AI クローラーの許可） | `src/pages/robots.txt.ts` |

- 本名・顔写真・市区町村以下の住所・勤務先名は載せない（D-009）。
- キャッチコピーやロゴを変えたら、OGP 画像を作り直す：`node scripts/ogp/build.mjs`（Windows の BIZ UDPゴシックを使う。D-034）。生成された `public/og/default.png` をコミットする。

### 2.5 SNS のリンク

`src/config/social.ts` の `url` に入れる。空の項目は表示されない。

- GitHub はリポジトリを公開した後に設定する（D-007）。
- 構造化データ（Organization の `sameAs`）にも自動で入る。

### 2.6 未確定の箇所（TODO）

- 仮の内容は、ソースに `TODO:` と書くと画面にも点線枠の「TODO:」で表示される。公開前にすべて解消する。
- 残っている箇所の確認：
  ```bash
  npm run build
  grep -rl "TODO" dist --include=*.html
  grep -rn "TODO" src
  ```

### 2.7 アプリ（NoteFlip）のページ

- プライバシーポリシーとサポート（日英）：`src/content/apps/noteflip/`。手順は [docs/content/apps/noteflip/README.md](content/apps/noteflip/README.md)。
- アプリがデータの扱いを変えたら、日英の両方を直し、`updatedAt` を変える。
- URL（`/apps/noteflip/en/privacy/` など）は Microsoft Store に登録しているため、変えない。

### 2.8 画像

- ページで使う画像は `src/assets/` に置く（ビルド時に WebP 等に変換・縮小される）。例：`src/assets/blog/{スラッグ}/`、`src/assets/works/{スラッグ}/`。
- そのまま配信したいファイル（favicon 等）だけ `public/` に置く。
- 画像には必ず代替テキスト（Markdown の `![説明](パス)`、`coverAlt`）を付ける。
- スクリーンショットに個人情報・勤務先の情報・他人の名前が写っていないか確かめる。
- 撮った写真は、位置情報（Exif）を消してから置く。

---

## 3. デプロイの確認と戻し方

### 確認

1. GitHub の Actions → **Deploy** が緑になったことを確かめる（検証 → デプロイの順に動く。合計 5 分前後）。
2. 本番のページを開き、変更が反映されていることを確かめる。古いままなら、ブラウザで再読み込み（Ctrl+F5）。
3. 大きな変更の後は、開発者ツールのコンソールにエラー（特に CSP の違反）が出ていないか確かめる。

### 失敗したとき

- `verify` が失敗：PR の CI と同じ検証が `main` で落ちた。ログを見て修正の PR を出す。本番は前の状態のまま。
- `deploy` が失敗：AWS 側の問題（権限、Variables の誤り等）。ログを見る。途中で失敗しても、もう一度 **Run workflow** で再実行すればよい。

### 戻し方（ロールバック）

1. 問題のある PR を GitHub の画面で **Revert** し、できた PR をマージする（または `git revert` の PR を作る）。
2. Deploy が自動で動き、元の内容に戻る。

`main` に直接 push して戻すことはしない。インフラの戻し方は [infra/README.md](../infra/README.md#戻し方ロールバック)。

---

## 4. DNS・メール

- DNS は Route 53。レコードは CDK（`infra/`）で管理し、**Route 53 のコンソールで手作業で作らない**（CDK のデプロイが失敗するため）。
- ネームサーバーの切り替え、証明書、メール用レコードの初回の設定は [infra/README.md](../infra/README.md) の手順2・3。

### メール（Zoho Mail）の初回設定（D-004・D-025）

1. Route 53 の構築（ネームサーバーの切り替え）が終わってから、Zoho Mail Lite に登録する（データセンターは日本）。
2. ドメイン `higuma-lab.jp` を追加し、管理画面に表示される値を `infra/config/mail.ts` に転記して DnsStack をデプロイする（[infra/README.md の手順](../infra/README.md#メール用のレコードzoho-mail-の登録後)）。
   - 所有確認の TXT → MX → SPF → DKIM → DMARC の順に、Zoho の画面の指示に合わせる。
3. `info@higuma-lab.jp` を作り、別名 `support@higuma-lab.jp` を追加する（受信箱は共通）。
4. 外部のアドレスとの送受信を試す。迷惑メールに入らないか、Gmail の「メッセージのソースを表示」で SPF・DKIM・DMARC が `PASS` になっていることを確かめる。
5. DMARC は `p=none` で始め、数週間レポートに問題がないことを確かめてから `p=quarantine` に強める。

---

## 5. Google Search Console

サイトの公開後に登録する（無料）。

1. https://search.google.com/search-console を開き、プロパティの種類で **ドメイン**（`higuma-lab.jp`）を選ぶ。www・http を含めて1つで管理できる。
2. 表示された TXT レコード（`google-site-verification=...`）を、`infra/config/mail.ts` の `verification` に追加し、DnsStack をデプロイする（apex の TXT はメールの所有確認・SPF と同じレコードにまとめるため）。
   ```bash
   cd infra
   npx cdk diff HigumaLabDns --profile higuma-lab
   npx cdk deploy HigumaLabDns --profile higuma-lab
   ```
3. 数分〜数時間待って、Search Console で「確認」を押す。
4. 「サイトマップ」に `https://higuma-lab.jp/sitemap-index.xml` を送信する。
5. 数日後から、「ページ」（インデックスの状況）と「検索パフォーマンス」を見られる。新しい記事を公開したら、「URL 検査」でインデックス登録をリクエストすると早く載る。

---

## 6. アクセス解析（Cloudflare Web Analytics）

Cookie を使わない無料の解析（D-006）。DNS を Cloudflare に移す必要はない。

1. Cloudflare のアカウントを作り（無料）、Web Analytics でサイト `higuma-lab.jp` を追加する。「JS Snippet」の方式を選ぶ。
2. 表示されたスニペットの `"token": "..."` の値を控える。
3. GitHub の Settings → Secrets and variables → Actions → Variables に `PUBLIC_CF_ANALYTICS_TOKEN` として登録する。
4. Actions → Deploy → **Run workflow** で再デプロイする。ページの HTML に `static.cloudflareinsights.com` のスクリプトが入れば完了。
5. 翌日以降、Cloudflare の画面で閲覧数を見られる。

- プライバシーポリシーには利用を記載済み（`src/content/pages/privacy.md`）。解析をやめるときは、Variable を消して再デプロイし、ポリシーの記載も直す。
- CSP で許可しているのは `static.cloudflareinsights.com`（スクリプト）と `cloudflareinsights.com`（送信先）だけ。他の解析・広告・埋め込み（YouTube 等）を追加するときは、`infra/lib/site-stack.ts` の CSP の変更が必要。

---

## 7. 費用の確認

想定は AWS で月 100 円前後（design.md 9章）。

- AWS Budgets で月額のアラート（例：$5）を設定しておく（[infra/README.md の手順0](../infra/README.md#0-準備)）。
- 月に1回、AWS の「請求とコスト管理」で前月の請求額を見る。急に増えていたら、CloudFront のリクエスト数（攻撃やクローラーの可能性）を確認する。
- その他の固定費：ドメイン（お名前.com、年1回の更新）、Zoho Mail Lite（月額）。**ドメインの更新を忘れるとサイトとメールが止まる**ので、お名前.com の自動更新を有効にし、登録しているカードの期限に注意する。

---

## 8. 定期的な保守

目安は3か月に1回。作業は `chore/...` のブランチで行い、PR の CI で問題がないことを確かめてからマージする。

| 作業 | 方法 |
|---|---|
| サイトの依存の更新 | `npm outdated` → `npm update`（メジャー更新は変更点を読んでから個別に） |
| インフラの依存の更新 | `cd infra` で同じ。更新後に `npm test` と `npx cdk diff` で意図しない差分がないか確かめる |
| Node.js | 24 LTS の最新に。CI（`.github/workflows/*.yml`）は `node-version: 24` で自動的に最新の 24 系を使う |
| GitHub Actions | 使っている Action（checkout、setup-node、configure-aws-credentials、upload-artifact）の新しいリリースを確認し、コミット SHA とコメントのバージョンを書き換える |
| Playwright のブラウザ | Playwright を更新したら `npx playwright install chromium` |
| 脆弱性 | `npm audit`（サイトと `infra/` の両方） |
| 外部リンク | Works・記事・プライバシーポリシーの外部リンクが切れていないか、目で確かめる（自動のリンク確認は内部リンクだけ） |
| 表示速度 | Chrome の開発者ツールの Lighthouse で、トップ・記事・制作物のページを測る |

依存の更新は Claude Code に「依存を更新して、テストが通るか確かめて」と頼んでもよい。

---

## 9. 公開前のチェックリスト

サイトの公開（DNS の切り替えとリポジトリの公開）の前に確かめる。

### 内容

- [ ] 画面に「TODO:」が残っていない（[2.6](#26-未確定の箇所todo)）
- [ ] 仮の文面（サービス・特徴・相談の流れ・FAQ・About）をオーナーが確認した
- [ ] プロフィールの記載が、勤務先の規程・守秘義務の範囲で問題ない
- [ ] NoteFlip のページの数値・記載を ADR と突き合わせた
- [ ] `content-reviewer` で点検した

### 表示・品質

- [ ] `site-auditor` で点検した
- [ ] 外部リンクを手で開いて確かめた
- [ ] Lighthouse（トップ・制作物・About）
- [ ] iPhone の Safari で表示を確かめた（E2E は Chromium のみ）

### 本番環境

- [ ] [infra/README.md](../infra/README.md) の手順0〜7 を終え、手順7の確認（ステータス・リダイレクト・ヘッダー・404）が通った
- [ ] GitHub の environment `production` が `main` だけに限られている（D-036）
- [ ] `info@`・`support@` でメールを送受信できる
- [ ] Search Console に登録し、サイトマップを送信した
- [ ] Cloudflare Web Analytics のトークンを登録した（使う場合）

### リポジトリの公開（D-007）

- [ ] 履歴に個人情報・秘密情報が含まれていない（`infra-reviewer` の秘密情報の確認、`git log --all -p` で個人のメールアドレス・本名を検索）
- [ ] ライセンスを決めて README に書いた
- [ ] リポジトリを Public にする（Settings → General → Danger Zone）
- [ ] Settings → Actions → General で、外部からの PR のワークフローの実行に承認を必要とする設定にした
- [ ] `src/config/social.ts` と Works（このサイト）に GitHub のリンクを入れた

---

## 10. 困ったとき

| 症状 | 確認すること |
|---|---|
| ビルドが「schema」「invalid」で失敗する | front matter の項目名・必須項目・日付の形式（`2026-11-01`）、`kind`・`status` の値 |
| 記事が表示されない | `draft: true` のままになっていないか |
| ブログがナビに出ない | 公開している記事（`draft: false`）が1本以上あるか |
| 本番に反映されない | Actions の Deploy が緑か。ブラウザのキャッシュ（Ctrl+F5） |
| 画像・スタイルが読み込まれない（本番だけ） | 開発者ツールのコンソールで CSP の違反が出ていないか。外部のドメインから読み込んでいないか |
| `www.` や `/about`（末尾スラッシュなし）でアクセスすると転送される | 正常（www は apex へ、末尾スラッシュなしは付けた URL へ 301） |
| E2E がローカルで起動しない | 4322 番のポートが使われていないか。ブラウザが入っているか（`npx playwright install chromium`） |
| メールが届かない | `nslookup -type=MX higuma-lab.jp` で Zoho の MX が返るか。Zoho の管理画面のドメインの状態 |
| CI の `npm ci` が lock ファイルの不一致で失敗する | `package-lock.json` を作り直す（`node_modules` と lock を消して `npm install` を1回で）。依存を `npm i` で何回かに分けて入れると、他の OS 用の依存が lock から落ちることがある |
