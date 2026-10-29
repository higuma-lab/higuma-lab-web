/**
 * 環境依存の値。コードには書かず、環境変数（infra/.env）から読む（docs/design.md 7.2）。
 * 例は infra/.env.example。
 */
export interface InfraConfig {
  /** AWS アカウント ID。未設定なら CDK がプロファイルから求める */
  readonly account: string | undefined;
  /** サイトのドメイン（apex） */
  readonly domainName: string;
  /** デプロイを許可する GitHub リポジトリ（owner/repo、または owner@<ID>/repo@<ID>） */
  readonly githubRepository: string;
  /** デプロイを許可する GitHub の environment 名 */
  readonly githubEnvironment: string;
  /** 既存の GitHub OIDC プロバイダーの ARN。未設定なら作る */
  readonly githubOidcProviderArn: string | undefined;
}

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;
// owner/repo か、GitHub の不変の ID 付きの形式（owner@<数字>/repo@<数字>）。
// リポジトリが不変の ID の sub を使う設定（use_immutable_subject）のときは後者にする
const REPOSITORY_PATTERN =
  /^(?:[A-Za-z0-9-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9-]+@[0-9]+\/[A-Za-z0-9._-]+@[0-9]+)$/;
const ENVIRONMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`環境変数 ${name} が未設定です（infra/.env.example を参照）`);
  }
  return value;
}

function optional(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv): InfraConfig {
  const domainName = required(env, 'DOMAIN_NAME').toLowerCase();
  if (!DOMAIN_PATTERN.test(domainName)) {
    throw new Error(`DOMAIN_NAME の形式が正しくありません：${domainName}`);
  }

  const githubRepository = required(env, 'DEPLOY_GITHUB_REPOSITORY');
  if (!REPOSITORY_PATTERN.test(githubRepository)) {
    throw new Error(
      `DEPLOY_GITHUB_REPOSITORY は owner/repo か owner@<ID>/repo@<ID> の形式で指定してください：${githubRepository}`,
    );
  }

  // OIDC の信頼条件に入るため、ワイルドカード等を含む値は受け付けない
  const githubEnvironment = optional(env, 'DEPLOY_GITHUB_ENVIRONMENT') ?? 'production';
  if (!ENVIRONMENT_PATTERN.test(githubEnvironment)) {
    throw new Error(`DEPLOY_GITHUB_ENVIRONMENT の形式が正しくありません：${githubEnvironment}`);
  }

  return {
    account: optional(env, 'CDK_DEFAULT_ACCOUNT'),
    domainName,
    githubRepository,
    githubEnvironment,
    githubOidcProviderArn: optional(env, 'GITHUB_OIDC_PROVIDER_ARN'),
  };
}
