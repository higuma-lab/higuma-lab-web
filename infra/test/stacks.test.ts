import { readFileSync } from 'node:fs';
import { App, FeatureFlags } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config/env.js';
import type { MailConfig } from '../config/mail.js';
import { sampleSitesConfig, type SampleSitesConfig } from '../config/samples.js';
import { CertificateStack } from '../lib/certificate-stack.js';
import { DnsStack } from '../lib/dns-stack.js';
import { GithubOidcStack } from '../lib/github-oidc-stack.js';
import { CONTENT_SECURITY_POLICY, SiteStack } from '../lib/site-stack.js';

const ACCOUNT = '123456789012';
const DOMAIN = 'example.jp';
const REPOSITORY = 'owner/repo';

const NO_MAIL: MailConfig = { verification: [], mx: [], dkim: [] };
const NO_SAMPLES: SampleSitesConfig = { parent: 'sample', caaIssuers: ['ca.example'], sites: [] };

/** cdk.json の feature flags。本番の synth と同じ設定でテストする */
const CDK_CONTEXT = (
  JSON.parse(readFileSync(new URL('../cdk.json', import.meta.url), 'utf8')) as {
    context: Record<string, unknown>;
  }
).context;

function synth(mail: MailConfig = NO_MAIL, samples: SampleSitesConfig = NO_SAMPLES) {
  const app = new App({ context: CDK_CONTEXT });
  const env = { account: ACCOUNT, region: 'ap-northeast-1' };
  const dns = new DnsStack(app, 'Dns', {
    env,
    domainName: DOMAIN,
    mail,
    samples,
    crossRegionReferences: true,
  });
  const certificate = new CertificateStack(app, 'Certificate', {
    env: { account: ACCOUNT, region: 'us-east-1' },
    domainName: DOMAIN,
    hostedZone: dns.hostedZone,
    crossRegionReferences: true,
  });
  const site = new SiteStack(app, 'Site', {
    env,
    domainName: DOMAIN,
    hostedZone: dns.hostedZone,
    certificate: certificate.certificate,
    crossRegionReferences: true,
  });
  const oidc = new GithubOidcStack(app, 'Oidc', {
    env,
    githubRepository: REPOSITORY,
    githubEnvironment: 'production',
    bucket: site.bucket,
    distribution: site.distribution,
  });
  return {
    dns: Template.fromStack(dns),
    certificate: Template.fromStack(certificate),
    site: Template.fromStack(site),
    oidc: Template.fromStack(oidc),
  };
}

const templates = synth();

describe('設定の読み込み', () => {
  const base = { DOMAIN_NAME: DOMAIN, DEPLOY_GITHUB_REPOSITORY: REPOSITORY };

  it('必須の値がなければエラーにする', () => {
    expect(() => loadConfig({})).toThrow('DOMAIN_NAME');
    expect(() => loadConfig({ DOMAIN_NAME: DOMAIN })).toThrow('DEPLOY_GITHUB_REPOSITORY');
  });

  it('OIDC の信頼条件を広げる値（ワイルドカード）を受け付けない', () => {
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: 'owner/*' })).toThrow();
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_ENVIRONMENT: '*' })).toThrow();
  });

  it('不変の ID 付きの形式を受け付ける', () => {
    const repository = 'owner@123/repo@456';
    expect(loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: repository }).githubRepository).toBe(
      repository,
    );
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: 'owner@*/repo@456' })).toThrow();
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: 'owner@/repo' })).toThrow();
    // ID は両方に付くか、どちらにも付かない（片方だけの sub はないので、書き間違いとして止める）
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: 'owner@123/repo' })).toThrow();
    expect(() => loadConfig({ ...base, DEPLOY_GITHUB_REPOSITORY: 'owner/repo@456' })).toThrow();
  });

  it('environment の既定は production', () => {
    expect(loadConfig(base).githubEnvironment).toBe('production');
  });
});

describe('feature flags', () => {
  it('cdk.json の推奨設定で synth している', () => {
    const app = new App({ context: CDK_CONTEXT });
    expect(FeatureFlags.of(app).isEnabled('@aws-cdk/core:enablePartitionLiterals')).toBe(true);
    expect(FeatureFlags.of(app).isEnabled('@aws-cdk/aws-iam:minimizePolicies')).toBe(true);
  });
});

describe('DnsStack', () => {
  it('ホストゾーンを削除しない', () => {
    templates.dns.hasResource('AWS::Route53::HostedZone', {
      DeletionPolicy: 'Retain',
      Properties: { Name: `${DOMAIN}.` },
    });
  });

  it('メールの設定が空なら、メール用のレコードを作らない', () => {
    templates.dns.resourcePropertiesCountIs('AWS::Route53::RecordSet', { Type: 'MX' }, 0);
    templates.dns.resourcePropertiesCountIs('AWS::Route53::RecordSet', { Type: 'TXT' }, 0);
  });

  it('メールの設定からレコードを作り、削除しない', () => {
    const { dns } = synth({
      verification: ['verify=1'],
      mx: [{ priority: 10, hostName: 'mx.example.net' }],
      spf: 'v=spf1 include:example.net ~all',
      dkim: [{ selector: 'mail', value: 'v=DKIM1; k=rsa; p=AAAA' }],
      dmarc: 'v=DMARC1; p=none',
    });
    dns.hasResource('AWS::Route53::RecordSet', {
      DeletionPolicy: 'Retain',
      Properties: { Type: 'MX', ResourceRecords: ['10 mx.example.net'] },
    });
    // 所有確認と SPF は apex の1つの TXT レコードにまとめる
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `${DOMAIN}.`,
      Type: 'TXT',
      ResourceRecords: ['"verify=1"', '"v=spf1 include:example.net ~all"'],
    });
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `mail._domainkey.${DOMAIN}.`,
      Type: 'TXT',
    });
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `_dmarc.${DOMAIN}.`,
      Type: 'TXT',
    });
  });

  it('サンプルがなければ、サンプル用のレコードを作らない', () => {
    templates.dns.resourcePropertiesCountIs('AWS::Route53::RecordSet', { Type: 'CNAME' }, 0);
    // apex の CAA（Amazon だけ）の 1 件だけ
    templates.dns.resourcePropertiesCountIs('AWS::Route53::RecordSet', { Type: 'CAA' }, 1);
  });

  it('サンプルのサブドメインを CNAME で向け、親にだけ別の認証局を許す', () => {
    const { dns } = synth(NO_MAIL, {
      parent: 'sample',
      caaIssuers: ['ca.example', 'ca2.example'],
      sites: [{ name: 'shop', target: 'shop.pages.example' }],
    });
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `shop.sample.${DOMAIN}.`,
      Type: 'CNAME',
      ResourceRecords: ['shop.pages.example'],
    });
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `sample.${DOMAIN}.`,
      Type: 'CAA',
      ResourceRecords: ['0 issue "ca.example"', '0 issue "ca2.example"', '0 issuewild ";"'],
    });
    // サイト本体（apex）の CAA は Amazon のまま
    dns.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: `${DOMAIN}.`,
      Type: 'CAA',
      ResourceRecords: Match.arrayWith([Match.stringLikeRegexp('amazon')]),
    });
  });

  it('サンプルの設定の値が正しい（打ち間違いで他人の pages.dev を指さない）', () => {
    const label = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    expect(sampleSitesConfig.parent).toMatch(label);
    expect(sampleSitesConfig.caaIssuers.length).toBeGreaterThan(0);
    const names = sampleSitesConfig.sites.map((site) => site.name);
    expect(new Set(names).size).toBe(names.length);
    for (const { name, target } of sampleSitesConfig.sites) {
      expect(name).toMatch(label);
      // Pages のプロジェクト名とサブドメインの名前を同じにする（D-051）
      expect(target).toBe(`${name}.pages.dev`);
    }
  });
});

describe('CertificateStack', () => {
  it('apex と www を DNS で検証する', () => {
    templates.certificate.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: DOMAIN,
      SubjectAlternativeNames: [`www.${DOMAIN}`],
      ValidationMethod: 'DNS',
    });
  });
});

describe('SiteStack', () => {
  const { site } = templates;

  it('S3 は非公開・暗号化・TLS 必須で、削除しない', () => {
    site.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      Properties: {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: Match.objectLike({}),
      },
    });
    site.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          }),
        ]),
      },
    });
  });

  it('バケットを読めるのは、このディストリビューション（OAC）だけ', () => {
    site.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Condition: { StringEquals: { 'AWS:SourceArn': Match.anyValue() } },
          }),
        ]),
      },
    });
    site.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });

  it('CloudFront は HTTPS・TLS 1.2 以上・HTTP/2 と 3 で、apex と www を受ける', () => {
    site.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Aliases: [DOMAIN, `www.${DOMAIN}`],
        HttpVersion: 'http2and3',
        DefaultRootObject: 'index.html',
        ViewerCertificate: Match.objectLike({ MinimumProtocolVersion: 'TLSv1.2_2021' }),
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: 'redirect-to-https' }),
        CustomErrorResponses: [
          Match.objectLike({ ErrorCode: 404, ResponseCode: 404, ResponsePagePath: '/404.html' }),
        ],
      }),
    });
  });

  it('セキュリティヘッダーを付ける', () => {
    site.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: Match.objectLike({
        SecurityHeadersConfig: Match.objectLike({
          StrictTransportSecurity: Match.objectLike({ AccessControlMaxAgeSec: 63072000 }),
          ContentTypeOptions: Match.objectLike({ Override: true }),
          FrameOptions: Match.objectLike({ FrameOption: 'DENY' }),
          ReferrerPolicy: Match.objectLike({ ReferrerPolicy: 'strict-origin-when-cross-origin' }),
          ContentSecurityPolicy: Match.objectLike({
            ContentSecurityPolicy: CONTENT_SECURITY_POLICY,
          }),
        }),
      }),
    });
  });

  it('CSP はインラインのスクリプト・スタイルを許可しない', () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-inline');
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-eval');
  });

  it('apex と www の A・AAAA レコードを作る', () => {
    for (const type of ['A', 'AAAA']) {
      site.hasResourceProperties('AWS::Route53::RecordSet', { Name: `${DOMAIN}.`, Type: type });
      site.hasResourceProperties('AWS::Route53::RecordSet', { Name: `www.${DOMAIN}.`, Type: type });
    }
  });

  it('有料のオプション（WAF・ログ）を使わない', () => {
    site.resourceCountIs('AWS::WAFv2::WebACL', 0);
    site.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ Logging: Match.absent(), WebACLId: Match.absent() }),
    });
  });
});

describe('GithubOidcStack', () => {
  const { oidc } = templates;

  it('ロールを引き受けられるのは、指定したリポジトリの production environment だけ', () => {
    oidc.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub': `repo:${REPOSITORY}:environment:production`,
              },
            },
          }),
        ],
      },
    });
  });

  it('権限は、バケットの同期とキャッシュの無効化だけ（* のリソースがない）', () => {
    const policies = oidc.findResources('AWS::IAM::Policy');
    const statements = Object.values(policies).flatMap(
      (policy) =>
        (
          policy as {
            Properties: {
              PolicyDocument: { Statement: { Action: string | string[]; Resource: unknown }[] };
            };
          }
        ).Properties.PolicyDocument.Statement,
    );
    const actions = statements.flatMap((statement) => [statement.Action].flat()).sort();
    expect(actions).toEqual([
      'cloudfront:CreateInvalidation',
      'cloudfront:GetInvalidation',
      's3:DeleteObject',
      's3:ListBucket',
      's3:PutObject',
    ]);
    for (const statement of statements) {
      expect(JSON.stringify(statement.Resource)).not.toBe('"*"');
    }
  });

  it('OIDC プロバイダーはネイティブのリソースで作る（Lambda を使わない）', () => {
    oidc.resourceCountIs('AWS::IAM::OIDCProvider', 1);
    oidc.resourceCountIs('AWS::Lambda::Function', 0);
  });
});
