# infra（AWS CDK）

ひぐま開発室 Webサイトの AWS 構成。設計は [docs/design.md](../docs/design.md) 7章、方針は [docs/decisions.md](../docs/decisions.md)（D-003、D-036）。

> この手順の AWS・DNS・GitHub の設定作業は、オーナーが行う。Claude Code は実環境の作業をしない（CLAUDE.md）。
> 日々の運用（記事の追加、デプロイの確認など）は Phase 9 で `docs/operations.md` にまとめる。

## 構成

| スタック               | リージョン     | 内容                                                                                  | スタックを削除したとき               |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `HigumaLabDns`         | ap-northeast-1 | Route 53 ホストゾーン、CAA、メール用レコード                                          | ゾーンとレコードは残る。削除保護あり |
| `HigumaLabCertificate` | us-east-1      | ACM 証明書（apex・www、DNS 検証）                                                     | 削除される                           |
| `HigumaLabSite`        | ap-northeast-1 | S3（非公開）、CloudFront、CloudFront Function、セキュリティヘッダー、A・AAAA レコード | バケットは残る                       |
| `HigumaLabGithubOidc`  | ap-northeast-1 | GitHub の OIDC プロバイダー、デプロイ用ロール                                         | 削除される                           |

- リージョンをまたぐ参照（ホストゾーン → 証明書 → CloudFront）は CDK の `crossRegionReferences` を使う。CDK が SSM パラメーターと小さな Lambda（カスタムリソース）を作る。費用はほぼ0。
- ディレクトリ：`bin/app.ts`（入口）、`lib/`（スタック）、`functions/viewer-request.js`（CloudFront Function）、`config/`（設定）、`test/`（Vitest）。

## コマンド

`infra/` で実行する。サイト（リポジトリのルート）とは別の `package.json`。

| コマンド                    | 内容                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| `npm ci`                    | 依存のインストール                                                  |
| `npm run check`             | 型チェック                                                          |
| `npm test`                  | テスト（テンプレートの検証、CloudFront Function の動作）            |
| `npm run synth`             | CloudFormation テンプレートを `cdk.out/` に出力（AWS に接続しない） |
| `npx cdk diff <スタック>`   | 実環境との差分（AWS に接続する）                                    |
| `npx cdk deploy <スタック>` | デプロイ（AWS に接続する）                                          |

## 設定

環境によって変わる値は `infra/.env` に書く（コミットしない）。`.env.example` をコピーして使う。

| 変数                        | 内容                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `DOMAIN_NAME`               | サイトのドメイン（apex）。`www.` は apex へ 301                |
| `DEPLOY_GITHUB_REPOSITORY`  | デプロイを許可するリポジトリ（`owner/repo`）                   |
| `DEPLOY_GITHUB_ENVIRONMENT` | デプロイを許可する GitHub の environment（既定 `production`）  |
| `GITHUB_OIDC_PROVIDER_ARN`  | アカウントに GitHub の OIDC プロバイダーが既にあるときだけ指定 |

- AWS アカウントは、実行時のプロファイル（`AWS_PROFILE`）から決まる。アカウント ID はファイルに書かない。
- メール用のレコードは `config/mail.ts` に書く（DNS で公開される値のため、コミットしてよい）。空の間はレコードを作らない。

## 初回の構築手順

### 0. 準備

1. AWS アカウントを作り、ルートユーザーに MFA を設定する。日常の作業にはルートユーザーを使わない。
2. IAM Identity Center で作業用のユーザー（管理者権限、MFA 必須）を作る。
3. AWS CLI v2 を入れ、`aws configure sso` でプロファイルを作る（例：`higuma-lab`）。
   ```bash
   aws sso login --profile higuma-lab
   ```
4. **AWS Budgets で月額の予算アラートを作る**（例：月 $5 を超えそうなときにメール）。Budgets は2件まで無料。
5. Node.js 24 LTS を入れ、`infra/` で `npm ci` を実行する。`infra/.env` を作る。

### 1. CDK の初期設定（bootstrap）

ap-northeast-1 と us-east-1 の両方に必要（証明書を us-east-1 に置くため）。

```bash
npx cdk bootstrap aws://<アカウントID>/ap-northeast-1 aws://<アカウントID>/us-east-1 --profile higuma-lab
```

- bootstrap は、CDK が使う S3 バケット・ECR・IAM ロールを作る。CloudFormation の実行ロールには既定で AdministratorAccess が付く（CDK の標準。デプロイするのは手元の管理者だけで、GitHub Actions のロールはこれを使わない）。
- 費用は月数円（バケットの保存料）。

### 2. DNS（Route 53）

```bash
npx cdk deploy HigumaLabDns --profile higuma-lab
```

1. 出力の `NameServers`（4つ）を控える。
2. お名前.com の管理画面で、`higuma-lab.jp` のネームサーバーを「その他」にして、4つを登録する。
3. 反映を待つ（.jp は数時間〜1日程度）。確認：
   ```bash
   nslookup -type=NS higuma-lab.jp 8.8.8.8
   ```
   Route 53 の4つ（`ns-xxx.awsdns-xx...`）が返れば完了。

注意：

- 切り替えると、お名前.com の DNS に設定していたレコードは使われなくなる。メールなど既存のレコードがある場合は、先に `config/mail.ts` に移して DnsStack をデプロイしてから切り替える（今はメール未設定のため影響なし）。
- 切り替えの途中は、古い DNS と新しい DNS のどちらかが返る。.jp の NS は最大で1日ほど古い値がキャッシュに残る。メールを運用し始めた後に DNS を切り替える場合は、両方に同じ MX を置いてから切り替える（不達を防ぐ）。
- 切り替える前に、Route 53 で名前解決できることを確かめる：`nslookup -type=CAA higuma-lab.jp <NameServers の1つ>`
- お名前.com で DNSSEC を有効にしている場合は、先に解除する（Route 53 側に鍵がないと名前解決できなくなる）。

### メール用のレコード（Zoho Mail の登録後）

1. Zoho Mail の管理画面（ドメインの設定）に表示される、所有確認の TXT・MX・SPF・DKIM の値を `config/mail.ts` に転記する。DMARC は `p=none`（監視のみ）で始め、レポートで問題がないことを確かめてから `quarantine` → `reject` と強める。
2. `npx cdk diff HigumaLabDns` で差分を確かめ、`npx cdk deploy HigumaLabDns` でデプロイする。
3. 反映を確かめる：`nslookup -type=MX higuma-lab.jp`、`nslookup -type=TXT zmail._domainkey.higuma-lab.jp`（セレクター名は Zoho の表示に合わせる）。Zoho の管理画面で「確認」を押す。

- **Route 53 のコンソールで、レコードを手作業で作らない**。同じ名前・種類のレコードがあると、CDK のデプロイが失敗する。
- メール用のレコードは、スタックの外で消えないよう「保持（RETAIN）」にしている。そのため `config/mail.ts` からレコードを消したり、DKIM のセレクター名を変えたりしても、古いレコードは Route 53 に残る。デプロイの後、コンソールで古いレコードを手で消す。
- 詳しい運用は Phase 9 の `docs/operations.md` にまとめる。

### 3. 証明書（ACM）

```bash
npx cdk deploy HigumaLabCertificate --profile higuma-lab
```

- 検証用の CNAME を Route 53 に自動で作り、発行されるまで待つ（通常数分〜30分。ネームサーバーの切り替えが反映されていないと終わらない）。

### 4. サイト（S3・CloudFront）

```bash
npx cdk deploy HigumaLabSite --profile higuma-lab
```

- CloudFront の作成に 5〜15 分ほどかかる。
- 出力の `BucketName`・`DistributionId` を控える。
- この時点ではバケットが空のため、サイトを開くと 404 になる（中身は手順 6 のデプロイで入る）。

### 5. GitHub Actions 用のロール

```bash
npx cdk deploy HigumaLabGithubOidc --profile higuma-lab
```

- 出力の `DeployRoleArn` を控える。

### 6. GitHub の設定

1. **Environment**：Settings → Environments → `production` を作る。
   - Deployment branches and tags：**Selected branches** にして `main` だけを許可する（OIDC の信頼条件は environment で絞っているため、ここで main 以外を締め出す。**必須**、D-036）。
   - ワークフローの側でも main 以外ではデプロイのジョブを飛ばすが、ワークフローのファイルはブランチごとに書き換えられる。AWS 側の守りはこの設定が前提になるため、設定画面で `main` だけになっていることを必ず確かめる。
   - リポジトリを公開した後は、Settings → Actions → General で、外部からの PR のワークフローの実行に承認を必要とする設定にする。
2. **Variables**：Settings → Secrets and variables → Actions → **Variables**（Repository variables）に登録する。秘密情報ではないため Secrets でなくてよい。
   | 名前                             | 値                                                                  |
   | -------------------------------- | ------------------------------------------------------------------- |
   | `AWS_DEPLOY_ROLE_ARN`            | 手順 5 の `DeployRoleArn`                                           |
   | `AWS_S3_BUCKET`                  | 手順 4 の `BucketName`                                              |
   | `AWS_CLOUDFRONT_DISTRIBUTION_ID` | 手順 4 の `DistributionId`                                          |
   | `PUBLIC_SITE_URL`                | `https://higuma-lab.jp`（任意）                                     |
   | `PUBLIC_CF_ANALYTICS_TOKEN`      | Cloudflare Web Analytics のトークン（任意。登録すると計測を始める） |
3. **ブランチ保護**：Settings → Branches（または Rules）で `main` に設定する（D-033）。
   - Require a pull request before merging
   - Require status checks to pass：`Site (lint, check, test, build, links, e2e)`、`Infra (type check, test, synth)`
   - 直接の push と force push を禁止
4. **Dependabot**：Settings → Code security で **Dependabot alerts** と **Dependabot security updates** を有効にする。`.github/dependabot.yml` は月1回の版の更新だけを扱い、脆弱性の修正の PR は、この設定がないと作られない（D-044）。
5. Actions → **Deploy** → Run workflow（`main`）で初回のデプロイを実行する。以後は `main` へのマージで自動的にデプロイされる。

### 7. 確認

```bash
curl -sI https://higuma-lab.jp/
curl -sI https://www.higuma-lab.jp/about/
curl -sI https://higuma-lab.jp/about
curl -sI https://higuma-lab.jp/not-found/
```

- 1つ目：200、`strict-transport-security`・`content-security-policy` 等のヘッダーがある
- 2つ目：301 で `https://higuma-lab.jp/about/` へ
- 3つ目：301 で `/about/` へ
- 4つ目：404 で、404 ページの HTML が返る
- ブラウザの開発者ツールのコンソールに CSP の違反が出ていないこと

## デプロイの仕組み（.github/workflows/deploy.yml）

1. CI と同じ検証（lint・型・テスト・ビルド・リンク切れ・E2E）
2. ビルド（本番の Variables を使う）。AWS の権限を持たない別のジョブで行い、結果（`dist/`）だけを次のジョブに渡す（依存パッケージのコードが OIDC トークンを取れないように。D-044）
3. 配信のジョブ（チェックアウトも npm も使わない）で、OIDC でデプロイ用ロールを引き受ける（アクセスキーは使わない）
4. `_astro/`（ハッシュ付き）を `max-age=1年, immutable` で、それ以外を `max-age=0, s-maxage=1日` でアップロード
5. CloudFront のキャッシュを `/*` で無効化し、完了を待つ（月 1,000 パスまで無料。`/*` は1パスとして数える）
6. 古いハッシュ付きアセットを削除（無効化の完了後。エッジに残った古い HTML が、消えたアセットを参照しないように）

`AWS_DEPLOY_ROLE_ARN` が未設定の間は、デプロイのジョブを飛ばす（AWS の構築前に main へマージしても失敗しない）。

## 戻し方（ロールバック）

- 問題のある変更を `git revert` する PR を作り、`main` にマージする。デプロイが自動で走り、元の内容に戻る。
- 急ぐ場合でも、`main` への直接の push はしない（D-033）。
- インフラの変更を戻すときは、変更前のコミットで `npx cdk deploy <スタック>` を実行する。先に `npx cdk diff` で差分を確かめる。

### 証明書を作り直すとき

リージョンをまたぐ参照（`crossRegionReferences`）では、使われている間は参照の値（証明書の ARN）を変えられない。ドメインの追加などで証明書が作り直しになると、`HigumaLabCertificate` のデプロイが失敗する。その場合は2段階で行う：新しい証明書を別の ID で並べて作る → `HigumaLabSite` を新しい証明書に切り替えてデプロイ → 古い証明書をコードから消してデプロイ。

## 費用

想定は月 100 円前後（docs/design.md 9章）。Route 53 のホストゾーン $0.50/月が固定費で、CloudFront・S3 は無料枠内の見込み。

- 使っていない有料のもの：WAF、CloudFront のアクセスログ、Shield Advanced、S3 のバージョニング。必要になったら費用を確認してから有効にする。

## 削除するとき

- `HigumaLabSite` を削除しても、S3 バケットは残る（中身を確認してから手動で削除する）。
- `HigumaLabDns` は削除保護が有効。削除してもホストゾーンとメールのレコードは残る（メールが止まる事故を防ぐため）。不要になったら、ネームサーバーを戻してから手動で削除する。
