import { existsSync } from 'node:fs';
import { App, Tags } from 'aws-cdk-lib';
import { loadConfig } from '../config/env.js';
import { mailConfig } from '../config/mail.js';
import { CertificateStack } from '../lib/certificate-stack.js';
import { DnsStack } from '../lib/dns-stack.js';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';
import { SiteStack } from '../lib/site-stack.js';

// 環境依存の値は infra/.env から読む（コミットしない。例は infra/.env.example）
const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const config = loadConfig(process.env);
const app = new App();

/** S3・Route 53 等を置くリージョン */
const MAIN_REGION = 'ap-northeast-1';
const mainEnv = { account: config.account, region: MAIN_REGION };

/** スタックのタグ。feature flag の explicitStackTags により、Tags.of(app) はスタックには付かないため明示する（D-045） */
const tags = { Project: 'higuma-lab-web' };

// デプロイ順：Dns → （お名前.com でネームサーバーを変更し、反映を待つ）→ Certificate → Site → GithubOidc（docs/design.md 7.2）
const dns = new DnsStack(app, 'HigumaLabDns', {
  env: mainEnv,
  tags,
  domainName: config.domainName,
  mail: mailConfig,
  crossRegionReferences: true,
});

const certificate = new CertificateStack(app, 'HigumaLabCertificate', {
  env: { account: config.account, region: 'us-east-1' },
  tags,
  domainName: config.domainName,
  hostedZone: dns.hostedZone,
  crossRegionReferences: true,
});

const site = new SiteStack(app, 'HigumaLabSite', {
  env: mainEnv,
  tags,
  domainName: config.domainName,
  hostedZone: dns.hostedZone,
  certificate: certificate.certificate,
  crossRegionReferences: true,
});

new GithubOidcStack(app, 'HigumaLabGithubOidc', {
  env: mainEnv,
  tags,
  githubRepository: config.githubRepository,
  githubEnvironment: config.githubEnvironment,
  existingProviderArn: config.githubOidcProviderArn,
  bucket: site.bucket,
  distribution: site.distribution,
});

// リソースのタグ
Tags.of(app).add('Project', tags.Project);
