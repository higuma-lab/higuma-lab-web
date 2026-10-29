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
| `npx cdk diff <スタック>`   | 実環境との差分（AWS に接続する。`--profile higuma-lab` を付ける）   |
| `npx cdk deploy <スタック>` | デプロイ（AWS に接続する。`--profile higuma-lab` を付ける）         |

## 設定

環境によって変わる値は `infra/.env` に書く（コミットしない）。`.env.example` をコピーして使う。

| 変数                        | 内容                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `DOMAIN_NAME`               | サイトのドメイン（apex）。`www.` は apex へ 301                                             |
| `DEPLOY_GITHUB_REPOSITORY`  | デプロイを許可するリポジトリ（`owner/repo`、または不変の ID 付きの `owner@<ID>/repo@<ID>`） |
| `DEPLOY_GITHUB_ENVIRONMENT` | デプロイを許可する GitHub の environment（既定 `production`）                               |
| `GITHUB_OIDC_PROVIDER_ARN`  | アカウントに GitHub の OIDC プロバイダーが既にあるときだけ指定                              |

- AWS アカウントは、実行時のプロファイル（`AWS_PROFILE`）から決まる。アカウント ID はファイルに書かない。
- メール用のレコードは `config/mail.ts` に書く（DNS で公開される値のため、コミットしてよい）。空の間はレコードを作らない。

## 初回の構築手順

### 0. 準備

コマンドはすべて自分の PC のターミナル（`infra/` フォルダー）で実行する。AWS に接続するコマンドは、手順 4 で作るプロファイルのログイン情報を使う。

1. AWS アカウントを作り、ルートユーザーに MFA を設定する。
   - ルートユーザーのアクセスキーは作らない（ある場合は消す）。ルートのメールアドレスのパスワードと MFA の復旧手段は、パスワードマネージャー等で別に保管する。
2. **AWS Budgets で月額の予算アラートを作る**（例：月 $5）。次の手順で有料プランに切り替わるので、その前にルートユーザーで作る。予算アラートの作成に費用はかからない（予算アクションを付ける場合の料金は AWS Budgets の料金ページで確かめる）。
   1. コンソールの上の検索に「請求」と入れ、「請求とコスト管理」を開く（右上のアカウント名のメニューからも開ける）。英語の名前は Billing and Cost Management。似た名前の **AWS Billing Conductor は別の有料サービスなので使わない**。
   2. 左のメニューの「予算とプランニング」→「予算」→「予算を作成」。
   3. 「テンプレートを使用（シンプル）」→「月次コスト予算」を選び、次のように入れて「予算を作成」。
      - 予算名：例 `monthly-5usd`
      - 予算額：`5`（USD）。想定は月 100 円前後なので余裕がある。早く気づきたいなら小さくする
      - メールの受信者：自分のメールアドレス（リポジトリには書かない）
   4. テンプレートで、実績が 85%・100% に達したときと、予測が 100% を超えそうなときの 3 つの通知が付く。一覧で状態が「OK」になっていれば完了。
   5. 右上のアカウント名 →「アカウント」→「IAM ユーザーおよびロールによる請求情報へのアクセス」を有効にする（ルートユーザーでしかできない）。有効にしないと、手順 3 の作業用のユーザーでも請求と予算の画面が見られない。
   - 任意：「請求設定」の「アラート設定」で無料利用枠のアラートを受け取る。Cost Anomaly Detection（無料）で、いつもと違う費用の増え方を知らせる。
   - 作ったばかりのアカウントでは、請求の画面が使えるようになるまで最大で 24 時間ほどかかることがある。
3. IAM Identity Center を有効にし、作業用のユーザーを作る。
   - **有効にすると AWS Organizations が作られ、このアカウントが Organizations の管理アカウントになる。** AWS の FAQ では、Organizations に参加すると無料プランのクレジットはすぐに失効し、有料プランに自動で切り替わるとしている。このサイトの費用は月 100 円前後で、無料プランには期限（6 か月）があるため、受け入れる。一人で運用するため、アカウントは分けない。
   - リージョン：アジアパシフィック（東京）。最初に作るリージョン（プライマリリージョン）は後から変えられないので、有効にする前に、コンソール右上のリージョンが東京になっていることを確かめる。
   - インスタンス設定：**単一リージョンインスタンス**。マルチリージョンインスタンスはカスタマーマネージドキー（KMS）が必須で、鍵の料金がサイトの費用より大きくなる。東京のリージョンが止まると CDK のデプロイはできなくなるが、公開中のサイトとメールへの影響は小さい（S3 は東京にあるので、CloudFront のキャッシュにないページは配信できない場合がある）。
   - 設定の表で、「アクセス許可セット」が有効で、保存時の暗号化に追加の料金がかからないことを確かめる。
   - 設定 → 認証 → 多要素認証で、MFA を「サインインするたび」に求め、MFA デバイスがないユーザーには「サインイン時に登録を求める」にする（MFA はユーザーごとではなく、インスタンス全体の設定）。
   - ユーザーを作ると招待メールが届く（期限は 7 日）。招待からパスワードを決め、MFA を登録し、アクセスポータルに入れることを確かめる。
   - 許可セットを作る：「マルチアカウントのアクセス許可」→「許可セット」で、`AdministratorAccess`（定義済みの許可セット）を作る。セッション時間は既定（1 時間）のままにする。アカウントが 1 つでも、このメニューを使う。
   - 許可セットは作っただけでは使えないので、ユーザーに割り当てる：
     1. 「マルチアカウントのアクセス許可」→「AWS アカウント」を開く。
     2. 一覧のこのアカウント（管理アカウント）にチェックを入れ、「ユーザーまたはグループを割り当て」を押す。
     3. 「ユーザー」タブで作業用のユーザーを選び、「次へ」。
     4. 許可セット `AdministratorAccess` を選び、「次へ」→「送信」。
     5. アカウントの中にロールが作られる（数十秒〜数分）。状態が完了になったら、アクセスポータルに作業用のユーザーでサインインし、アカウントの下に `AdministratorAccess` が出ることを確かめる。
     - 割り当ての前に手順 4 の `aws configure sso` を実行すると、アカウントが見つからない。割り当ての後に実行する。
   - 「AWS アクセスポータルの URL」（`https://d-xxxxxxxxxx.awsapps.com/start` の形）を控える。Identity Center の左のメニューの「ダッシュボード」→「設定の概要」にある。「設定」→「アイデンティティソース」タブや、ユーザーの招待メールにも書かれている。見つからないときは、右上のリージョンが東京になっているか確かめる。
   - 以後はルートユーザーからサインアウトし、アクセスポータルから作業用のユーザーで入る。ルートユーザーは、請求とアカウントの設定のときだけ使う。
4. AWS CLI v2 を入れ、`aws configure sso` でプロファイルを作る。Windows では AWS の公式の文書（「AWS CLI の最新バージョンのインストール」）にあるインストーラー（MSI）を使い、入れた後に新しいターミナルで `aws --version` が `aws-cli/2.` で始まることを確かめる。

   ```bash
   aws configure sso
   ```

   | 聞かれること                | 入れるもの                                                                           |
   | --------------------------- | ------------------------------------------------------------------------------------ |
   | `SSO session name`          | 好きな名前（例：`higuma-lab`）                                                       |
   | `SSO start URL`             | 手順 3 で控えたアクセスポータルの URL                                                |
   | `SSO region`                | `ap-northeast-1`                                                                     |
   | `SSO registration scopes`   | 何も入れずに Enter                                                                   |
   | （ブラウザが開く）          | 手順 3 の作業用のユーザーでサインインし、アクセスを許可する                          |
   | アカウントとロール          | このアカウントと `AdministratorAccess`                                               |
   | `Default client Region`     | `ap-northeast-1`                                                                     |
   | `CLI default output format` | `json`                                                                               |
   | `Profile name`              | **`higuma-lab`**（この手順書のコマンドの `--profile` と同じ名前。PC の中だけの名前） |
   - 作れたか確かめる。`Arn` に `AWSReservedSSO_AdministratorAccess_` が含まれていれば成功。`Account` が「1. CDK の初期設定」の bootstrap で使うアカウント ID。

     ```bash
     aws sts get-caller-identity --profile higuma-lab
     ```

   - アクセスポータルのサインインには期限がある（既定で 8 時間）。その間、ロールの認証情報（1 時間）は CLI が自動で更新する。期限が切れたら、次のコマンドで作業用のユーザーとしてサインインし直す。

     ```bash
     aws sso login --profile higuma-lab
     ```

   - 途中や最後に「Configure AWS skills and the AWS MCP server for your AI coding agent(s)?」と聞かれたら、**`n`（いいえ）**にする。AI のエージェントが、このプロファイル（管理者の権限）で AWS を直接操作できるようになるため。AWS の操作はこの手順書でオーナーが行う（CLAUDE.md）。
   - アクセスポータルの URL とアカウント ID は、このリポジトリに書かない（公開する予定のため）。

5. Node.js 24 LTS（24.16 以上。D-031）を入れ、`infra/` で `npm ci` を実行する。
6. `infra/` で、見本を写して `infra/.env` を作り、値を入れて保存する（`.gitignore` に入っているのでコミットされない）。このファイルがないと、`cdk` のコマンドが「環境変数 DOMAIN_NAME が未設定です」で止まる。

   ```bash
   cp .env.example .env
   ```

   PowerShell では `Copy-Item .env.example .env`。

   | 変数                        | 値                                                                     |
   | --------------------------- | ---------------------------------------------------------------------- |
   | `DOMAIN_NAME`               | `higuma-lab.jp`                                                        |
   | `DEPLOY_GITHUB_REPOSITORY`  | 下の注意を参照（`higuma-lab/higuma-lab-web` か、不変の ID 付きの形式） |
   | `DEPLOY_GITHUB_ENVIRONMENT` | 空のまま（既定の `production`）                                        |
   | `GITHUB_OIDC_PROVIDER_ARN`  | 空のまま（アカウントに GitHub の OIDC プロバイダーがないとき）         |

   アカウント ID は書かない（実行するときのプロファイルから決まる）。

   - `DEPLOY_GITHUB_REPOSITORY` は、GitHub が発行する OIDC のトークンの `sub` の `repo:` の後ろと同じ形にする。リポジトリが不変の ID を使う設定になっていると、`sub` は `repo:higuma-lab@<数字>/higuma-lab-web@<数字>:environment:production` の形になり、`higuma-lab/higuma-lab-web` では一致しない（デプロイが「Not authorized to perform sts:AssumeRoleWithWebIdentity」で失敗する）。次のコマンドの `sub_claim_prefix` の `repo:` の後ろをそのまま入れる。`use_immutable_subject` が `false` なら `owner/repo` の形でよい。

     ```bash
     gh api repos/higuma-lab/higuma-lab-web/actions/oidc/customization/sub
     ```

   - ID は名前を変えても変わらないので、名前を変えた後に同じ名前で作られた別のリポジトリやアカウントは、このロールを引き受けられない。ただし `sub` には名前も含まれるため、自分のリポジトリやアカウントの名前を変えたときは、`DEPLOY_GITHUB_REPOSITORY` を新しい `sub_claim_prefix` に合わせて `cdk deploy HigumaLabGithubOidc` をやり直す。
   - `use_default` が `false`（`sub` の形を独自に変えている）ときは、この形にならない。

### 1. CDK の初期設定（bootstrap）

ap-northeast-1 と us-east-1 の両方に必要（証明書を us-east-1 に置くため）。`infra/` で実行する。`<アカウントID>` は **12 桁の数字に置き換える**（プロファイル名の `higuma-lab` ではない）。`aws sts get-caller-identity --profile higuma-lab` の `Account` の値（`--profile` を付けないと「Unable to locate credentials」になる）。取り違えると「Need to perform AWS calls for account higuma-lab」で止まる。サインインの期限が切れていたら、先に `aws sso login --profile higuma-lab` を実行する（以降の手順も同じ）。

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

1. Zoho Mail のドメインの所有確認の方法は **TXT** を選ぶ（CNAME は `config/mail.ts` に欄がなく、HTML のアップロードはサイトの公開前には使えない）。Zoho Mail の管理画面（ドメインの設定）に表示される、所有確認の TXT・MX・SPF・DKIM の値を `config/mail.ts` に転記する。DMARC は `p=none`（監視のみ）で始め、レポートで問題がないことを確かめてから `quarantine` → `reject` と強める。
2. `npx cdk diff HigumaLabDns --profile higuma-lab` で差分を確かめ、`npx cdk deploy HigumaLabDns --profile higuma-lab` でデプロイする。
3. 反映を確かめる：`nslookup -type=MX higuma-lab.jp`、`nslookup -type=TXT zmail._domainkey.higuma-lab.jp`（セレクター名は Zoho の表示に合わせる）。Zoho の管理画面で「確認」を押す。

- **Route 53 のコンソールで、レコードを手作業で作らない**。同じ名前・種類のレコードがあると、CDK のデプロイが失敗する。
- メール用のレコードは、スタックの外で消えないよう「保持（RETAIN）」にしている。そのため `config/mail.ts` からレコードを消したり、DKIM のセレクター名を変えたりしても、古いレコードは Route 53 に残る。デプロイの後、コンソールで古いレコードを手で消す。
- 詳しい運用は Phase 9 の `docs/operations.md` にまとめる。

### サンプルサイトのサブドメイン（D-051）

サンプルサイト（Cloudflare Pages）を `<名前>.sample.<ドメイン>` で公開する。値は `config/samples.ts` に書く。

1. Cloudflare の Pages のプロジェクトの **Custom domains** で、サブドメイン（例：`komugi-to-yuge.sample.higuma-lab.jp`）を足す。Cloudflare が「CNAME を作る」よう案内するが、DNS は Route 53 なので、次の 2 で作る。
2. `npx cdk diff HigumaLabDns --profile higuma-lab` で差分を確かめる。`[+]` が `SampleCaa` と `Sample-*` だけで、`[-]`・`[~]` がないこと。`npx cdk deploy HigumaLabDns --profile higuma-lab` でデプロイすると、CNAME と、`sample.<ドメイン>` の CAA（Cloudflare が使う認証局を許す）ができる。**Route 53 のコンソールで CNAME を作らない**（同じ名前があると CDK のデプロイが失敗する）。
3. Pages の Custom domains の状態が **Active** になるのを待つ（証明書の発行に数分〜数十分。DNS より先に 1 を行ったときは、存在しないという結果が最大 15 分ほど覚えられていて、Pending が続くことがある）。`https://<サブドメイン>/` が開けることを確かめる。Works のリンクの差し替えは、ここまで確かめてから行う。
4. 管理画面のログインのため、認証の中継の `ALLOWED_DOMAINS` に新しいホスト名を入れる。サンプルのリポジトリ側の作業（サイトの URL の差し替え）は、`site-template` の `docs/publish-sample.md` の 6 章。

- apex の CAA は Amazon だけを許している。`sample.<ドメイン>` に CAA を置かずにサブドメインを付けると、Cloudflare が証明書を取れず、Custom domains が有効にならない。
- **サンプルを消すときは、この順で行う**（逆にすると、空いた `<名前>.pages.dev` を第三者が作り、このサブドメインを乗っ取られるおそれがある）。Pages のプロジェクトの名前を変えるときも同じ。
  1. Works のリンクを外し、サイトをデプロイする
  2. `config/samples.ts` から消し、`cdk diff` で CNAME（最後の 1 件なら CAA も）の削除だけであることを確かめてデプロイする（レコードは保持にしていないので消える）
  3. `nslookup -type=CNAME <サブドメイン> 8.8.8.8` で返らないことを確かめる（TTL の 1 時間を待つ）
  4. Pages の Custom domains からサブドメインを外す
  5. 最後に Pages のプロジェクトを消す（消さずに残す方が安全）

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

> **注意**：2 の `AWS_DEPLOY_ROLE_ARN` を登録すると、それ以降の `main` へのマージで自動的にデプロイされ、その時点の `main` の内容が公開される。画面に「TODO:」が残っている間に登録しない。公開前の点検（`docs/operations.md` 9章）を済ませてから 2 以降に進む（1・3・4 は先に行ってよい）。

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

Windows PowerShell 5.1 では `curl` が別のコマンド（`Invoke-WebRequest`）の別名なので、`curl.exe` と書くか Git Bash で実行する。

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
- インフラの変更を戻すときは、変更前のコミットで `npx cdk deploy <スタック> --profile higuma-lab` を実行する。先に `npx cdk diff <スタック> --profile higuma-lab` で差分を確かめる。

### 証明書を作り直すとき

リージョンをまたぐ参照（`crossRegionReferences`）では、使われている間は参照の値（証明書の ARN）を変えられない。ドメインの追加などで証明書が作り直しになると、`HigumaLabCertificate` のデプロイが失敗する。その場合は2段階で行う：新しい証明書を別の ID で並べて作る → `HigumaLabSite` を新しい証明書に切り替えてデプロイ → 古い証明書をコードから消してデプロイ。

## 費用

想定は月 100 円前後（docs/design.md 9章）。Route 53 のホストゾーン $0.50/月が固定費で、CloudFront・S3 は無料枠内の見込み。

- 使っていない有料のもの：WAF、CloudFront のアクセスログ、Shield Advanced、S3 のバージョニング。必要になったら費用を確認してから有効にする。

## 削除するとき

- `HigumaLabSite` を削除しても、S3 バケットは残る（中身を確認してから手動で削除する）。
- `HigumaLabDns` は削除保護が有効。削除してもホストゾーンとメールのレコードは残る（メールが止まる事故を防ぐため）。不要になったら、ネームサーバーを戻してから手動で削除する。
