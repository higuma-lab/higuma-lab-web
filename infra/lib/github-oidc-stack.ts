import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import type { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import {
  Effect,
  OidcProviderNative,
  OpenIdConnectPrincipal,
  PolicyStatement,
  Role,
  type IOidcProvider,
} from 'aws-cdk-lib/aws-iam';
import type { IBucket } from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export interface GithubOidcStackProps extends StackProps {
  /** owner/repo、または不変の ID 付きの owner@<ID>/repo@<ID>（OIDC の sub の repo: の後ろと同じ形） */
  readonly githubRepository: string;
  /** デプロイのジョブが使う environment 名 */
  readonly githubEnvironment: string;
  /** 既存の OIDC プロバイダーの ARN。未指定なら作る */
  readonly existingProviderArn?: string | undefined;
  readonly bucket: IBucket;
  readonly distribution: IDistribution;
}

const GITHUB_OIDC_URL = 'https://token.actions.githubusercontent.com';

/**
 * GitHub Actions 用の OIDC プロバイダーとデプロイ用ロール（docs/design.md 7.4）。
 * ロールを引き受けられるのは、指定したリポジトリの、指定した environment のジョブだけ。
 * 権限は、サイトのバケットへの同期と、ディストリビューションのキャッシュ無効化だけ。
 */
export class GithubOidcStack extends Stack {
  readonly role: Role;

  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props);

    const { githubRepository, githubEnvironment, existingProviderArn, bucket, distribution } =
      props;

    // CloudFormation のネイティブのリソースで作る（カスタムリソースの Lambda を使わない）
    const provider: IOidcProvider = existingProviderArn
      ? OidcProviderNative.fromOidcProviderArn(this, 'GithubProvider', existingProviderArn)
      : new OidcProviderNative(this, 'GithubProvider', {
          url: GITHUB_OIDC_URL,
          clientIds: ['sts.amazonaws.com'],
        });

    this.role = new Role(this, 'DeployRole', {
      description: `Deploy ${githubRepository} (environment: ${githubEnvironment}) to S3 and CloudFront`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new OpenIdConnectPrincipal(provider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${githubRepository}:environment:${githubEnvironment}`,
        },
      }),
    });

    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'ListSiteBucket',
        effect: Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [bucket.bucketArn],
      }),
    );
    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'SyncSiteObjects',
        effect: Effect.ALLOW,
        actions: ['s3:PutObject', 's3:DeleteObject'],
        resources: [bucket.arnForObjects('*')],
      }),
    );
    this.role.addToPolicy(
      new PolicyStatement({
        sid: 'InvalidateDistribution',
        effect: Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
        resources: [
          Stack.of(this).formatArn({
            service: 'cloudfront',
            region: '',
            resource: 'distribution',
            resourceName: distribution.distributionId,
          }),
        ],
      }),
    );

    new CfnOutput(this, 'DeployRoleArn', {
      value: this.role.roleArn,
      description: 'AWS_DEPLOY_ROLE_ARN',
    });
  }
}
