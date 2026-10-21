# ひぐま開発室（HIGUMA LAB）Webサイト

個人事業「ひぐま開発室（HIGUMA LAB）」の事業用 Web サイトのソースコードです。

- サイト：https://higuma-lab.jp （TODO: 公開後にリンクが有効になる）
- 内容：サービス紹介、制作物・取り組み、ブログ、お問い合わせ、アプリ（NoteFlip）のプライバシーポリシー・サポート

## 技術構成

| 用途       | 使っているもの                                                                             |
| ---------- | ------------------------------------------------------------------------------------------ |
| サイト     | [Astro](https://astro.build/) 7（静的サイト生成）、TypeScript（strict）                    |
| スタイル   | 素の CSS（デザイントークンを CSS 変数で定義）。Web フォントは使わない                      |
| コンテンツ | Markdown・YAML（Astro の Content Collections でスキーマを検証）                            |
| 品質       | ESLint（TypeScript・Astro・アクセシビリティ）、Prettier、`astro check`                     |
| テスト     | Vitest（ユニット）、Playwright＋axe（E2E・アクセシビリティ）、内部リンクの確認スクリプト   |
| 配信       | Amazon S3（非公開）＋ CloudFront、Route 53、ACM                                            |
| インフラ   | AWS CDK（TypeScript、`infra/`）                                                            |
| CI/CD      | GitHub Actions（PR で検証、`main` へのマージで自動デプロイする構成。AWS には OIDC で接続） |
| 解析       | Cloudflare Web Analytics（Cookie 不使用。トークンを設定したときだけ有効）                  |

クライアント側の JavaScript は、スマートフォンのメニューの開閉と解析のスクリプトだけです。

## 必要なもの

- Node.js 24 LTS（24.16 以上）
- npm

## 使い方

```bash
npm ci
npm run dev
```

http://localhost:4321 で開発サーバーが動きます。

| コマンド                                  | 内容                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`                             | 開発サーバー（http://localhost:4321）                                              |
| `npm run build`                           | 静的サイトを `dist/` に出力                                                        |
| `npm run preview`                         | ビルド結果を配信して確認                                                           |
| `npm run check`                           | 型チェック（`.astro` を含む）                                                      |
| `npm run lint`                            | ESLint                                                                             |
| `npm run format` / `npm run format:check` | Prettier（`docs/` は対象外）                                                       |
| `npm test`                                | ユニットテスト（Vitest）                                                           |
| `npm run test:e2e`                        | ビルドして E2E（Playwright＋axe）。初回は `npx playwright install chromium` が必要 |
| `npm run test:links`                      | ビルドして内部リンクのリンク切れを確認                                             |

インフラ（`infra/`）は別の `package.json` です。[infra/README.md](infra/README.md) を参照してください。

### 環境変数

`.env.example` を `.env` にコピーして使います（`.env` はコミットしない）。どちらも未設定で動きます。

| 変数                        | 内容                                | 未設定のとき                 |
| --------------------------- | ----------------------------------- | ---------------------------- |
| `PUBLIC_SITE_URL`           | 正規 URL（canonical・OGP・sitemap） | `https://higuma-lab.jp`      |
| `PUBLIC_CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics のトークン | 解析のスクリプトを出力しない |

## ディレクトリ構成

```
├── .github/workflows/   CI（ci.yml）とデプロイ（deploy.yml）
├── docs/                要件・設計・決定事項・運用手順・素材
├── infra/               AWS CDK（S3・CloudFront・Route 53・ACM・GitHub OIDC）
├── public/              そのまま配信するファイル
├── scripts/             ロゴ・OGP 画像の生成、リンク切れの確認
├── src/
│   ├── components/      レイアウト・UI 部品・SEO・セクション
│   ├── config/          サイトの設定（屋号・メール・ナビ）、SNS リンク
│   ├── content/         サービス・制作物・ブログ・アプリ用ページ（Markdown・YAML）
│   ├── data/            トップページ・プロフィール等のデータ
│   ├── layouts/
│   ├── lib/             メタ情報・構造化データ・日付などの関数
│   ├── pages/
│   └── styles/          デザイントークンと全体のスタイル
└── tests/               unit（Vitest）、e2e（Playwright）
```

## ドキュメント

| 文書                                         | 内容                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| [docs/operations.md](docs/operations.md)     | 運用手順（記事・制作物の追加、デプロイ、DNS・メール、Search Console、公開前の確認） |
| [infra/README.md](infra/README.md)           | AWS の構成と初回の構築手順                                                          |
| [docs/design.md](docs/design.md)             | 設計（技術・ページ構成・AWS・UI/UX）                                                |
| [docs/decisions.md](docs/decisions.md)       | 決定事項とその理由                                                                  |
| [docs/requirements.md](docs/requirements.md) | 要件                                                                                |
| [CLAUDE.md](CLAUDE.md)                       | Claude Code（AI コーディングエージェント）向けの作業ルール                          |

## 開発の進め方

- `main` に直接コミットせず、ブランチを切って PR で取り込みます。CI（lint・型・テスト・ビルド・リンク切れ・E2E・インフラの合成）の通過がマージの条件です。
- `main` へのマージで本番に自動デプロイする構成です（AWS の環境を構築した後に有効になります。手順は [infra/README.md](infra/README.md)）。
- このサイトは、設計から実装・テスト・インフラまで、Claude Code（Anthropic の AI コーディングエージェント）と一緒に作っています。作業ルールは [CLAUDE.md](CLAUDE.md)、レビュー用のサブエージェントは `.claude/agents/` にあります。

## ライセンス

All rights reserved。このリポジトリは閲覧のために公開しています。ソースコード・文章・ロゴ・イラスト・画像の利用を許諾していません。詳しくは [LICENSE](LICENSE) をご覧ください。
