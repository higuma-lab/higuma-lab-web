import { readFileSync } from 'node:fs';
import {
  Annotations,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from 'aws-cdk-lib';
import type { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AccessLevel,
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  FunctionRuntime,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  HttpVersion,
  PriceClass,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
  type IDistribution,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AaaaRecord, ARecord, RecordTarget, type IHostedZone } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
  type IBucket,
} from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export interface SiteStackProps extends StackProps {
  readonly domainName: string;
  readonly hostedZone: IHostedZone;
  readonly certificate: ICertificate;
}

/**
 * Content-Security-Policy（docs/design.md 7.3）。自サイトと Cloudflare Web Analytics（D-006）だけを許可する。
 * インラインのスクリプト・スタイルは出力しない設計のため（D-032）、'unsafe-inline' は使わない。
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://static.cloudflareinsights.com",
  "connect-src 'self' https://cloudflareinsights.com",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** 使わないブラウザ機能を止める */
export const PERMISSIONS_POLICY = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=()',
  'usb=()',
].join(', ');

const VIEWER_REQUEST_FUNCTION = new URL('../functions/viewer-request.js', import.meta.url);

/** CloudFront Function のコード。ドメインを合成時に埋め込む */
export function viewerRequestFunctionCode(domainName: string): string {
  return readFileSync(VIEWER_REQUEST_FUNCTION, 'utf8').replaceAll('__APEX_DOMAIN__', domainName);
}

/**
 * S3（非公開）＋ CloudFront（OAC）＋ Route 53 の Alias（docs/design.md 7.1・7.3）。
 */
export class SiteStack extends Stack {
  readonly bucket: IBucket;
  readonly distribution: IDistribution;

  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);

    const { domainName, hostedZone, certificate } = props;
    const wwwDomainName = `www.${domainName}`;

    const bucket = new Bucket(this, 'SiteBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      // スタックを消しても、バケットは残す（中身は GitHub Actions から作り直せるが、事故で消さないため）
      removalPolicy: RemovalPolicy.RETAIN,
    });
    this.bucket = bucket;

    const viewerRequest = new CloudFrontFunction(this, 'ViewerRequestFunction', {
      runtime: FunctionRuntime.JS_2_0,
      comment: 'www to apex redirect, directory index',
      code: FunctionCode.fromInline(viewerRequestFunctionCode(domainName)),
    });

    // キャッシュの長さはオブジェクトの Cache-Control に従う（デプロイ時にファイル種別ごとに付ける。.github/workflows/deploy.yml）
    const cachePolicy = new CachePolicy(this, 'CachePolicy', {
      comment: 'Honor origin Cache-Control',
      minTtl: Duration.seconds(0),
      defaultTtl: Duration.days(1),
      maxTtl: Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'SecurityHeaders', {
      comment: 'Security headers for HIGUMA LAB website',
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365 * 2),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        contentSecurityPolicy: { contentSecurityPolicy: CONTENT_SECURITY_POLICY, override: true },
      },
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Permissions-Policy', value: PERMISSIONS_POLICY, override: true },
        ],
      },
    });

    const distribution = new Distribution(this, 'Distribution', {
      comment: 'HIGUMA LAB website',
      // `/` は CloudFront Function でも index.html に書き換えるが、一覧（ListBucket）を返さないよう念のため指定する
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwDomainName],
      certificate,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
      // 日本のエッジを含む価格クラス（PRICE_CLASS_100 は北米・欧州のみ）
      priceClass: PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        // 存在しないパスを 403 ではなく 404 として受け取るため、一覧（ListBucket）も許可する
        origin: S3BucketOrigin.withOriginAccessControl(bucket, {
          originAccessLevels: [AccessLevel.READ, AccessLevel.LIST],
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
        cachePolicy,
        responseHeadersPolicy,
        functionAssociations: [
          { eventType: FunctionEventType.VIEWER_REQUEST, function: viewerRequest },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: Duration.minutes(5),
        },
      ],
      // ログは初期は無効（費用削減。docs/design.md 7.3）
      enableLogging: false,
    });
    this.distribution = distribution;
    Annotations.of(this).acknowledgeWarning(
      '@aws-cdk/aws-cloudfront-origins:listBucketSecurityRisk',
      'defaultRootObject を指定し、ディレクトリの URL は CloudFront Function で index.html に書き換えるため、一覧は返らない',
    );

    const target = RecordTarget.fromAlias(new CloudFrontTarget(distribution));
    for (const [id, recordName] of [
      ['Apex', domainName],
      ['Www', wwwDomainName],
    ] as const) {
      new ARecord(this, `${id}A`, { zone: hostedZone, recordName, target });
      new AaaaRecord(this, `${id}Aaaa`, { zone: hostedZone, recordName, target });
    }

    // GitHub の Variables に登録する値（秘密情報ではない。docs/design.md 7.4）
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName, description: 'AWS_S3_BUCKET' });
    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'AWS_CLOUDFRONT_DISTRIBUTION_ID',
    });
    new CfnOutput(this, 'DistributionDomainName', { value: distribution.distributionDomainName });
  }
}
