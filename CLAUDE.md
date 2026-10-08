# CLAUDE.md

個人事業「ひぐま開発室（HIGUMA LAB）」の事業用Webサイト。

- 要件：[docs/requirements.md](docs/requirements.md)
- 決定事項・TODO：[docs/decisions.md](docs/decisions.md)（要件と矛盾する場合はこちらが優先）
- 素材：[docs/content/](docs/content/)
- **進捗：[docs/progress.md](docs/progress.md)（作業を始める前に必ず読む）**

あなたはシニアWebエンジニア兼UI/UXデザイナーとして作業する。

## 進め方

フェーズ単位で進める。各フェーズの終わりに「実施内容・問題点・次の作業」を簡潔に報告する。
**★のフェーズの終わりでは必ず止まり、オーナーの承認を得てから次へ進む。**

| Phase | 内容 | 成果物 |
|---|---|---|
| 1 | 現状調査・要件整理 | — |
| 2 ★ | サイト構成・技術設計（ページ構成のレビュー、ディレクトリ構成、AWS構成、外部サービスと費用） | `docs/design.md` |
| 3 ★ | UI/UX設計（配色、タイポグラフィ、レイアウト、キャッチコピー候補） | `docs/design.md` に追記 |
| 4 | 基本実装（レイアウト・共通コンポーネント） | コード |
| 5 | コンテンツ実装 | コード・Markdown |
| 6 | SEO・アクセシビリティ・パフォーマンス対応 | コード |
| 7 ★ | テスト（下記チェックリスト） | テスト結果の報告 |
| 8 ★ | AWSデプロイ用設定（CDK、GitHub Actions） | `infra/`、ワークフロー |
| 9 | README・運用手順整備 | `README.md`、`docs/operations.md` |

- 設計が固まるまで大量のファイルを作らない。
- 方針の決定・変更が生じたら `docs/decisions.md` に追記する。
- 各フェーズの終わりに `docs/content/build-log.md` に事実（判断と理由、問題と対処、数値）を追記する（D-016）。
- 各フェーズの終わりに `docs/progress.md` を更新してコミットする。セッションは★の承認後に切り替える想定。
- この文書（CLAUDE.md）には変わりにくいルールだけを書き、進捗や一時的な情報は書かない。

## レビュー用サブエージェント

実装はメインセッションで行い、点検は `.claude/agents/` のサブエージェントに任せる。指摘を受けたら修正し、修正内容を報告する。

| エージェント | 使うタイミング |
|---|---|
| `content-reviewer` | Phase 5 の終わり、ページ本文・Works・ブログ・プロフィール等を追加・変更したとき、公開前 |
| `site-auditor` | Phase 6・7 の終わり、公開前、大きな変更の後 |
| `infra-reviewer` | Phase 8 の終わり、`infra/` や `.github/workflows/` を変更したとき |

## 絶対に守る制約

- 架空の顧客実績・資格・受賞歴を作らない。
- 実際に提供していないサービスを追加しない。
- 勤務先名・製品名・機密情報を掲載しない。
- オーナーの本名・顔写真・詳細な住所を掲載しない（docs/decisions.md D-009）。
- 未確定の情報は確定させず、`TODO:` を付けた仮の内容にとどめる。仮テキストを事実らしく書かない。
- AWS認証情報・トークン等の秘密情報をコード・Gitにコミットしない。環境依存の値は環境変数か設定ファイルに置く。
- 外部サービス・依存パッケージを追加するときは理由を説明する。有料のものは事前にオーナーの確認を取る。
- AWSアカウント・DNSの設定変更など、実環境の作業は行わない。

## コード品質

- TypeScript strict。型安全性を維持する。
- コンポーネントを適切に分割し、重複を避ける。サービス・Works・SNSリンク等はデータとして管理する。
- ESLint と Prettier を使う。
- 改行コードは LF（`.gitattributes` で統一）。

## Git

- 意味のある単位でコミットし、変更内容が分かるメッセージにする。
- リポジトリは公開予定のため、履歴に個人情報・秘密情報を含めない。

## テストチェックリスト（Phase 7）

- build / lint / type check / unit test（必要な箇所）
- モバイル・デスクトップ表示
- リンク切れ
- SEOメタ情報（title、description、OGP、canonical、sitemap、robots）
- アクセシビリティ（自動チェック＋キーボード操作）
- 画像表示、404ページ

テストツールは Phase 2 で提案し、承認を得てから導入する。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー（http://localhost:4321） |
| `npm run build` | 静的サイトを `dist/` に出力 |
| `npm run preview` | ビルド結果を配信して確認 |
| `npm run check` | 型チェック（`astro check`、.astro を含む） |
| `npm run lint` | ESLint（TypeScript・Astro・アクセシビリティ） |
| `npm run format` / `format:check` | Prettier（`docs/` は対象外） |

<!-- TODO: Phase 7 でテストのコマンドを追加 -->
