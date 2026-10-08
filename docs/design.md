# 設計書：ひぐま開発室 Webサイト

- 対象フェーズ：Phase 1（現状調査）・Phase 2（サイト構成・技術設計）
- 作成日：2026-10-08
- 前提：[requirements.md](requirements.md)、[decisions.md](decisions.md)
- UI/UX の詳細（配色・タイポグラフィ・キャッチコピー）は Phase 3 で本書に追記する。

---

## 1. 現状（Phase 1）

### 1.1 リポジトリ

| 項目 | 状態 |
|---|---|
| ソースコード | なし（新規） |
| ドキュメント | `CLAUDE.md`、`docs/requirements.md`、`docs/decisions.md`、`docs/content/README.md` |
| サブエージェント | `.claude/agents/`（content-reviewer、site-auditor、infra-reviewer） |
| Git | Phase 1 で初期化（ブランチ `main`、未コミット）。`.gitignore`、`.gitattributes`（LF 統一）を作成 |
| 素材 | 未配置（ロゴ・原稿・SNS URL 等） |

### 1.2 開発環境

| ツール | バージョン | 備考 |
|---|---|---|
| Node.js | 24.7.0 | Astro 7 の要件（>=22.12.0）を満たす |
| npm | 11.5.1 | |
| git | 2.51.0 | `core.autocrlf=true`。`.gitattributes` で LF に統一済み |
| GitHub CLI | 2.98.0 | アカウント `higuma-lab` でログイン済み |
| AWS CLI | 未導入 | Phase 8 の手順書で導入方法を記載（作業はオーナーが実施） |

### 1.3 Phase 1 で見つかった問題

- **コミットに個人のメールアドレスが入る**：git の `user.email` が個人の Gmail になっている。リポジトリは公開予定（D-007）のため、このままコミットするとアドレスが履歴に残り、公開後に消すのは難しい。
  - 対策案：このリポジトリだけ GitHub の noreply アドレスを使う（`229035686+higuma-lab@users.noreply.github.com`）。GitHub 側の「Keep my email addresses private」も有効にする。
  - → 承認済み。リポジトリ単位の git 設定で noreply に変更した（D-013）。

---

## 2. 技術スタック

### 2.1 フレームワーク比較（D-002 の確認）

| 観点 | Astro | Next.js（static export） | Eleventy / Hugo |
|---|---|---|---|
| 静的出力 | 標準 | 可能だが一部機能が使えない | 標準 |
| 出力される JS | 既定でゼロ | React ランタイムが必ず入る | ゼロ |
| Markdown 管理 | Content Collections（型付きスキーマ） | 自前で実装 | 標準（型なし） |
| TypeScript | 標準 | 標準 | 弱い（Hugo は Go テンプレート） |
| 画像最適化 | 標準（ビルド時） | static export では制限あり | プラグイン |
| 将来の拡張 | 必要な箇所だけ React 等を追加可能 | フル機能の Web アプリに強い | 限定的 |

**結論：Astro（最新安定版 7.3.x）**。コンテンツ中心・JS 最小・型付きコンテンツ管理の3点で要件に最も合う。

### 2.2 採用する技術

| 用途 | 採用 | 理由 |
|---|---|---|
| フレームワーク | Astro 7 + TypeScript（`strictest`） | 静的生成、JS ゼロが既定 |
| スタイル | 素の CSS（CSS カスタムプロパティでデザイントークン化）+ Astro のスコープ付きスタイル | 依存を増やさず、出力 CSS が小さい。規模的に Tailwind は不要 |
| コンテンツ | Content Collections（Markdown + YAML、Zod でスキーマ定義） | Works・ブログ・サービスを型安全にデータ管理 |
| サイトマップ | `@astrojs/sitemap` | 公式。sitemap.xml を自動生成 |
| RSS | `@astrojs/rss`（**提案**） | ブログ購読用。小さい公式パッケージ |
| MDX | 初期は導入しない | 必要になった時点で `@astrojs/mdx` を追加 |
| フォント | Phase 3 で決定 | 日本語 Web フォントは重いため、本文はシステムフォントを基本に検討 |
| Lint | ESLint（flat config）+ typescript-eslint + eslint-plugin-astro + eslint-plugin-jsx-a11y | 型・Astro 構文・アクセシビリティの静的チェック |
| Formatter | Prettier + prettier-plugin-astro | |
| 型チェック | `astro check`（@astrojs/check） | `.astro` ファイルを含めて型検査 |
| IaC | AWS CDK v2（TypeScript） | D-003 |

### 2.3 テストツール（提案。承認後に導入）

| 用途 | ツール | 備考 |
|---|---|---|
| ユニットテスト | Vitest | メタ情報生成、日付整形、並び替え等の関数を対象 |
| E2E・表示確認 | Playwright | ビルド成果物を配信し、モバイル・デスクトップで全ページを巡回。**ブラウザのダウンロード（数百MB）が必要** |
| アクセシビリティ | `@axe-core/playwright` | Playwright の巡回時に全ページを自動チェック |
| リンク切れ | 自作スクリプト（`dist/` の HTML を解析）または linkinator | 内部リンクのみ。外部リンクは手動確認 |
| SEO メタ情報 | Playwright のテスト内でページごとに検証 | title・description の重複、canonical、OGP |
| パフォーマンス | Lighthouse（Chrome DevTools で手動）| 初期は CI に入れない。必要なら Lighthouse CI を後から追加 |

すべて無料のオープンソース。

---

## 3. ディレクトリ構成

```
higuma-lab-web/
├── .claude/agents/            # レビュー用サブエージェント
├── .github/workflows/
│   ├── ci.yml                 # PR・push 時：lint / typecheck / test / build
│   └── deploy.yml             # main への push 時：build → S3 → CloudFront 無効化
├── docs/
│   ├── requirements.md
│   ├── decisions.md
│   ├── design.md              # 本書
│   ├── operations.md          # Phase 9：運用手順（記事追加、デプロイ、DNS、メール）
│   └── content/               # 原稿・素材の置き場（サイトのビルドには使わない）
├── infra/                     # AWS CDK（独立した package.json を持つ）
│   ├── bin/app.ts
│   ├── lib/
│   │   ├── dns-stack.ts       # Route 53 ホストゾーン・メール用レコード
│   │   ├── certificate-stack.ts  # ACM（us-east-1）
│   │   ├── site-stack.ts      # S3・CloudFront・Alias レコード
│   │   └── github-oidc-stack.ts  # GitHub Actions 用 OIDC プロバイダーとデプロイロール
│   ├── functions/             # CloudFront Functions
│   └── test/
├── public/                    # そのまま配信するファイル（favicon、robots.txt は生成も可）
├── src/
│   ├── assets/                # 最適化対象の画像（ロゴ、Works の画像）
│   ├── components/
│   │   ├── layout/            # Header、Footer、SkipLink など
│   │   ├── ui/                # Button、Card、Tag など汎用部品
│   │   ├── seo/               # SeoHead、JsonLd
│   │   └── sections/          # Hero、ServiceList、WorkList、Profile、Cta など
│   ├── config/
│   │   ├── site.ts            # 屋号、URL、メールアドレス、ナビゲーション
│   │   └── social.ts          # SNS リンク（D-012）
│   ├── content/
│   │   ├── services/          # サービス（YAML）
│   │   ├── works/             # 制作物（Markdown）
│   │   └── blog/              # ブログ記事（Markdown）
│   ├── content.config.ts      # コレクションのスキーマ定義
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ArticleLayout.astro
│   ├── lib/                   # 純粋関数（メタ情報生成、日付整形、並び替え）
│   ├── pages/
│   ├── styles/
│   │   ├── tokens.css         # 色・余白・文字サイズのデザイントークン
│   │   └── global.css
│   └── env.d.ts
├── tests/
│   ├── unit/                  # Vitest
│   └── e2e/                   # Playwright
├── .env.example
├── astro.config.ts
├── eslint.config.js
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── README.md
```

- `infra/` は独自の `package.json` を持つ別パッケージにする。サイトのビルドに CDK の依存を持ち込まないため。npm workspaces は使わない（構成を単純に保つ）。

---

## 4. ページ構成

### 4.1 初期案のレビュー

| ページ | 判断 | 理由 |
|---|---|---|
| トップ | 採用 | |
| サービス | **1ページにまとめる**（各サービスはページ内のセクション） | 6サービスを個別ページにすると、初期は1ページあたりの内容が薄くなり、検索評価にも不利。内容が増えたサービスから個別ページに分ける |
| 制作物・取り組み | 採用（一覧＋詳細） | 詳細ページは事例として書ける項目だけ作る。一覧のみの項目も許容 |
| ひぐま開発室について | 採用 | プロフィール、経歴、スキル、活動地域、大切にしていること |
| ブログ | 採用（一覧＋記事） | **公開時に最低1本の記事を用意する**か、記事が0本の間はナビゲーションに出さない。空のブログ一覧は逆効果 |
| お問い合わせ | 採用、**「ご相談の流れ」と「よくある質問」を同じページに入れる** | 別ページにするほどの分量がない。問い合わせ直前の不安を減らす内容なので同じ場所に置くのが効果的 |
| プライバシーポリシー | 採用 | 解析ツール（D-006）、問い合わせメールの扱い、事業者情報の開示方法（D-009） |
| 特定商取引法に基づく表記 | 初期は作らない | D-008 |
| 404 | 採用 | トップ・サービス・お問い合わせへの導線を置く |
| RSS（`/rss.xml`） | **追加を提案** | ページではなくフィード。ブログ読者向け |

### 4.2 サービスの見せ方（提案）

6つのサービスは、ITに詳しくない人には違いが分かりにくい。サービス自体は変えずに、**3つのグループで見せる**ことを提案する。

| グループ | 含むサービス |
|---|---|
| Webサイト | Webサイト制作／Webサイト制作の指導・サポート |
| アプリ開発 | PC・タブレット・スマートフォン向けアプリ開発／アプリ開発支援 |
| IT・AIの相談 | IT相談／AI活用支援 |

トップページでは3グループを紹介し、サービスページで6サービスを詳しく説明する。

### 4.3 URL・ナビゲーション

| ページ | URL | グローバルナビ |
|---|---|---|
| トップ | `/` | ロゴ |
| サービス | `/services/` | ○ |
| 制作物・取り組み | `/works/`、`/works/{slug}/` | ○（表示名「制作物」） |
| ブログ | `/blog/`、`/blog/{slug}/` | ○（記事がある場合） |
| ひぐま開発室について | `/about/` | ○ |
| お問い合わせ | `/contact/` | ○（ボタンとして強調） |
| プライバシーポリシー | `/privacy/` | フッターのみ |
| 404 | `/404.html` | — |

- URL は英語のスラッグ、末尾スラッシュあり（`trailingSlash: 'always'`、`build.format: 'directory'`）で統一する。
- スマートフォンではハンバーガーメニュー。開閉は JS を最小限（数十行）で実装し、JS が無効でもリンクにたどり着けるようにする。

### 4.4 トップページの構成

1. Hero（屋号、キャッチコピー、問い合わせボタン）
2. こんなご相談に対応します（3グループ → サービスページへ）
3. ひぐま開発室の特徴（4項目）
4. 制作物・取り組み（最新・注目の2〜3件 → 一覧へ）
5. プロフィール（要約 → About へ）
6. ブログ（最新記事2〜3件。記事がなければ非表示）
7. CTA（相談の入口。「まずは気軽にご相談ください」系）

---

## 5. コンテンツモデル

`src/content.config.ts` で Zod スキーマを定義し、ビルド時に型と必須項目を検証する。

### 5.1 サービス（`src/content/services/*.yaml`）

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | string | サービス名 |
| `group` | `'web' \| 'app' \| 'consulting'` | 4.2 のグループ |
| `summary` | string | 一覧用の短い説明 |
| `description` | string | 詳細説明 |
| `examples` | string[] | 対応例（「こんなときに」） |
| `priceNote` | string（任意） | 料金の目安。未確定の間は未設定（D-010） |
| `order` | number | 表示順 |

### 5.2 制作物（`src/content/works/*.md`）

| フィールド | 型 | 説明 |
|---|---|---|
| `title` | string | |
| `kind` | `'own-product' \| 'sample' \| 'experiment' \| 'client'` | 種別ラベル（D-001）。表示名は自社プロダクト／サンプル制作／技術検証／お客様案件 |
| `summary` | string | |
| `status` | `'released' \| 'upcoming' \| 'in-progress'` | 「公開予定」等の表示に使う |
| `tech` | string[] | 使用技術 |
| `links` | `{ label, url }[]`（任意） | ストア、GitHub 等 |
| `cover` | image（任意） | |
| `featured` | boolean | トップに表示するか |
| `publishedAt` | date | |
| 本文 | Markdown | 課題 → 設計 → 技術 → 工夫点。本文が空なら詳細ページを作らない |

### 5.3 ブログ（`src/content/blog/*.md`）

| フィールド | 型 | 説明 |
|---|---|---|
| `title`、`description` | string | description は meta description に使う |
| `publishedAt`、`updatedAt` | date | |
| `tags` | string[] | 初期はタグ別ページを作らない |
| `cover` | image（任意） | OGP 画像にも使う |
| `draft` | boolean | true ならビルドに含めない |

### 5.4 設定（`src/config/`）

- `site.ts`：屋号、英語表記、正規URL、メールアドレス、ナビゲーション
- `social.ts`：SNS リンクの配列（表示名、URL、アイコン）。空なら表示しない
- 環境によって変わる値は環境変数から読む（下記）

### 5.5 環境変数（`.env.example` に記載）

| 変数 | 用途 | 未設定時 |
|---|---|---|
| `PUBLIC_SITE_URL` | 正規URL（canonical、OGP、sitemap） | `https://higuma-lab.jp` |
| `PUBLIC_CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics（D-006） | 計測スクリプトを出力しない |

---

## 6. SEO・アクセシビリティ・パフォーマンスの実装方針

### 6.1 SEO

- `SeoHead` コンポーネントで、title・description・canonical・OGP・Twitter Card を一元生成する。
  - title の形式：`ページ名 | ひぐま開発室`（トップは `ひぐま開発室（HIGUMA LAB）| キャッチコピー`）
- OGP 画像：共通画像を1枚用意（1200×630）。ブログ・Works は `cover` があれば上書き。自動生成は将来の検討事項。
- 構造化データ（JSON-LD）：
  - 全ページ：`Organization`（名前、URL、ロゴ、メール、sameAs に SNS）、`WebSite`
  - ブログ記事：`BlogPosting`
  - 下層ページ：`BreadcrumbList`
  - `Person` と `LocalBusiness` は使わない（本名・住所を公開しないため。D-009）
- robots.txt：全クローラーを許可し、sitemap の場所を記載。AI クローラーも許可（decisions.md の TODO で最終確認）。
- `<html lang="ja">`、`og:locale` は `ja_JP`。

### 6.2 アクセシビリティ

- ランドマーク（header / nav / main / footer）とスキップリンク
- 見出しは各ページ h1 が1つで、階層を飛ばさない
- フォーカス表示を常に見えるようにする（`:focus-visible`）
- 色のコントラストは WCAG 2.2 AA（本文 4.5:1 以上）を Phase 3 の配色で検証
- アニメーションは最小限にし、`prefers-reduced-motion` で無効化
- メニュー開閉ボタンに `aria-expanded`・`aria-controls`

### 6.3 パフォーマンス

- クライアント JS はメニュー開閉と解析スクリプトのみ
- 画像は Astro の `<Image>` で WebP/AVIF に変換し、サイズを指定（CLS 対策）
- CSS はビルド時に結合・最小化。重要な CSS はインライン化される（Astro の既定動作）
- ハッシュ付きのアセットは CloudFront で長期キャッシュ（7.3）

---

## 7. AWS 構成

### 7.1 全体像

```
                       ┌─────────────── お名前.com ───────────────┐
                       │  ドメイン登録（ネームサーバーを Route 53 に変更）│
                       └───────────────────────────────────────┘
                                        │
訪問者 ──HTTPS──▶ Route 53（higuma-lab.jp / www）
                         │ Alias（A/AAAA）
                         ▼
                   CloudFront ── ACM 証明書（us-east-1）
                   │  ├ CloudFront Function（www→apex、/path/ → /path/index.html）
                   │  └ Response Headers Policy（HSTS・CSP 等）
                   │ OAC
                   ▼
                   S3（非公開、ap-northeast-1）

GitHub Actions ──OIDC──▶ IAM ロール（S3 への同期と CloudFront 無効化のみ）

メール：Route 53 の MX / SPF / DKIM / DMARC ──▶ Zoho Mail（サイトとは独立）
```

### 7.2 CDK スタック

| スタック | リージョン | 内容 | 削除時 |
|---|---|---|---|
| `DnsStack` | ap-northeast-1 | Route 53 ホストゾーン、メール用レコード（値は設定ファイルから） | **保持**（RETAIN）。メールが止まる事故を防ぐ |
| `CertificateStack` | us-east-1 | ACM 証明書（apex + www、DNS 検証） | 削除 |
| `SiteStack` | ap-northeast-1 | S3、CloudFront、CloudFront Function、ヘッダーポリシー、Alias レコード | S3 は保持 |
| `GithubOidcStack` | ap-northeast-1 | GitHub の OIDC プロバイダー、デプロイ用ロール | 削除 |

- アカウント ID、ドメイン、GitHub リポジトリ名などは CDK の context（`cdk.json` ではなく実行時の引数または環境変数）で渡し、コードに直接書かない。
- デプロイ順：`DnsStack` → お名前.com でネームサーバー変更 → 反映を待つ → `CertificateStack` → `SiteStack` → `GithubOidcStack`。手順は Phase 8・9 で手順書にする。

### 7.3 CloudFront の設定

| 項目 | 設定 |
|---|---|
| 代替ドメイン | `higuma-lab.jp`、`www.higuma-lab.jp` |
| 正規URL | `https://higuma-lab.jp`（www は 301 で apex へ）※decisions.md の TODO で最終確認 |
| HTTP | HTTPS へリダイレクト。TLS 1.2 以上、HTTP/2・HTTP/3 |
| ディレクトリ URL | CloudFront Function で `/about/` → `/about/index.html` に書き換え、`/about` → `/about/` へ 301 |
| 404 | S3 に `ListBucket` を許可し、存在しないパスを 404 として受け取り、`/404.html` を 404 ステータスで返す |
| キャッシュ | `/_astro/*`（ハッシュ付き）：1年・immutable。HTML 等：短時間（ブラウザ側は毎回確認）。デプロイ時に無効化 |
| セキュリティヘッダー | HSTS、X-Content-Type-Options、Referrer-Policy、X-Frame-Options（DENY）、CSP（自サイト＋Cloudflare Web Analytics のみ許可） |
| ログ | 初期は無効（費用削減）。必要になったら有効化 |
| WAF | 使わない（静的サイトで攻撃対象が少なく、月 $5 以上かかるため） |

### 7.4 GitHub Actions

| ワークフロー | トリガー | 内容 |
|---|---|---|
| `ci.yml` | PR、main 以外への push | install → lint → typecheck → unit test → build →（E2E は承認後に追加） |
| `deploy.yml` | main への push、手動実行 | CI と同じ検証 → OIDC でロールを引き受け → S3 に同期（キャッシュ設定をファイル種別で分ける）→ CloudFront 無効化 |

- OIDC の信頼条件は `repo:higuma-lab/higuma-lab-web` の `main` ブランチ（または `production` environment）に限定する。
- バケット名・ディストリビューション ID・ロール ARN は GitHub の Variables に登録する（秘密情報ではないが、コードには書かない）。
- サードパーティ Action はコミット SHA で固定する。

---

## 8. 外部サービス

| サービス | 用途 | 料金 | 導入理由 |
|---|---|---|---|
| お名前.com | ドメイン登録 | 年額の更新料（.jp。**金額は公式で要確認**） | 決定済み |
| AWS | ホスティング・DNS・証明書 | 下記 9 | D-003 |
| GitHub | ソース管理・CI/CD | 無料（非公開リポジトリは Actions 月2,000分まで無料、公開後は無制限） | D-007 |
| Zoho Mail Lite | 事業用メール | 月数百円程度（**公式で要確認**） | D-004 |
| Cloudflare Web Analytics | アクセス解析 | 無料 | D-006 |
| Google Search Console | 検索の状況確認 | 無料 | 要件 10 |

**有料の新規サービスの追加はない。**

---

## 9. 想定費用

アクセスが月数千〜数万 PV 程度の想定。為替は 1ドル=150円で概算。

| 項目 | 月額 | 備考 |
|---|---|---|
| Route 53 ホストゾーン | $0.50（約75円） | 固定費 |
| Route 53 クエリ | ほぼ $0 | 100万クエリあたり $0.40 |
| CloudFront | $0 | 無期限の無料枠（月 1TB 転送・1,000万リクエスト）内の見込み |
| S3 | 数円 | 数十MB の保存とリクエスト |
| ACM | $0 | CloudFront で使う公開証明書は無料 |
| CDK の初期設定（bootstrap）で作られる S3 等 | 数円 | |
| **AWS 合計** | **約100円前後** | 税別 |
| Zoho Mail Lite | 数百円 | 要確認 |
| ドメイン（.jp） | 年額を月割り | 要確認 |

- 想定外の課金に備え、AWS Budgets で月額アラート（例：$5）を設定する手順を手順書に入れる（Budgets 自体は2件まで無料）。

---

## 10. 開発ステップ

| Phase | 内容 | 承認 | コミットの区切り（例） |
|---|---|---|---|
| 3 | UI/UX 設計：配色、タイポグラフィ、レイアウト、コンポーネント一覧、キャッチコピー候補 | ★ | `docs: UI/UX 設計` |
| 4 | 基本実装：Astro の初期化、Lint・Formatter、トークン CSS、BaseLayout、Header・Footer、SeoHead、コンテンツのスキーマ | | プロジェクト初期化／Lint 設定／レイアウト、の単位 |
| 5 | コンテンツ実装：全ページ、サービス・Works・ブログのデータ（未確定部分は `TODO:`）→ content-reviewer | | ページ単位 |
| 6 | SEO・a11y・性能：sitemap、robots、RSS、JSON-LD、OGP 画像、画像最適化、reduced motion → site-auditor | | |
| 7 | テスト：Vitest、Playwright + axe、リンク切れ、全チェックリスト → site-auditor | ★ | |
| 8 | AWS：CDK 4スタック、CloudFront Function、GitHub Actions → infra-reviewer | ★ | スタック単位 |
| 9 | README、`docs/operations.md`（記事の追加方法、デプロイ、DNS 切り替え、メール設定、Search Console 登録、費用アラート） | | |

---

## 11. 不明点・要確認事項

### Phase 2 で承認済み（2026-10-08）

1. コミットのメールアドレス → GitHub の noreply（D-013）
2. サービスを3グループで見せる → 採用（D-014）
3. お問い合わせページに「ご相談の流れ」「よくある質問」→ 採用（D-015）
4. ブログ → 公開時に「このサイトの構築記録」を1本用意（D-016）
5. RSS → 採用（D-017）
6. テストツール → Vitest、Playwright（Chromium のみ）+ axe（D-018）

### 引き続き TODO（実装は仮の内容で進められる）

- 料金の目安、活動地域・経験年数、Windows アプリの情報、SNS の URL（decisions.md の TODO）
- 正規URL を apex にすること、AI クローラーの許可の最終確認
- ロゴの類似チェック結果
- OGP 共通画像の素材（Phase 3 でロゴを使った案を出す）
