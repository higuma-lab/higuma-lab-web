import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  CaaAmazonRecord,
  CaaRecord,
  CaaTag,
  CnameRecord,
  MxRecord,
  PublicHostedZone,
  TxtRecord,
  type IPublicHostedZone,
} from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';
import type { MailConfig } from '../config/mail.js';
import type { SampleSitesConfig } from '../config/samples.js';

export interface DnsStackProps extends StackProps {
  readonly domainName: string;
  readonly mail: MailConfig;
  readonly samples: SampleSitesConfig;
}

/**
 * Route 53 のホストゾーンとメール用レコード（docs/design.md 7.2）。
 * サイトとは別のスタックにし、削除してもゾーンとメールのレコードが残るようにする（メールが止まる事故を防ぐ）。
 */
export class DnsStack extends Stack {
  readonly hostedZone: IPublicHostedZone;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, { ...props, terminationProtection: true });

    const { domainName, mail, samples } = props;

    const zone = new PublicHostedZone(this, 'HostedZone', {
      zoneName: domainName,
      comment: 'HIGUMA LAB website and mail',
    });
    zone.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.hostedZone = zone;

    const retain = <T extends { applyRemovalPolicy(policy: RemovalPolicy): void }>(
      record: T,
    ): T => {
      record.applyRemovalPolicy(RemovalPolicy.RETAIN);
      return record;
    };

    // 証明書を発行できる認証局を Amazon に限る
    retain(new CaaAmazonRecord(this, 'Caa', { zone }));

    const apexTxt = [...mail.verification, ...(mail.spf ? [mail.spf] : [])];
    if (apexTxt.length > 0) {
      retain(new TxtRecord(this, 'ApexTxt', { zone, values: apexTxt, ttl: Duration.hours(1) }));
    }

    if (mail.mx.length > 0) {
      retain(
        new MxRecord(this, 'Mx', {
          zone,
          values: mail.mx.map(({ priority, hostName }) => ({ priority, hostName })),
          ttl: Duration.hours(1),
        }),
      );
    }

    for (const { selector, value } of mail.dkim) {
      retain(
        new TxtRecord(this, `Dkim-${selector}`, {
          zone,
          recordName: `${selector}._domainkey`,
          values: [value],
          ttl: Duration.hours(1),
        }),
      );
    }

    if (mail.dmarc) {
      retain(
        new TxtRecord(this, 'Dmarc', {
          zone,
          recordName: '_dmarc',
          values: [mail.dmarc],
          ttl: Duration.hours(1),
        }),
      );
    }

    // サンプルサイト（Cloudflare Pages）のサブドメイン。親の CAA で Cloudflare の認証局だけを許す
    if (samples.sites.length > 0) {
      new CaaRecord(this, 'SampleCaa', {
        zone,
        recordName: samples.parent,
        values: samples.caaIssuers.map((value) => ({ flag: 0, tag: CaaTag.ISSUE, value })),
        ttl: Duration.hours(1),
      });
    }
    for (const { name, target } of samples.sites) {
      new CnameRecord(this, `Sample-${name}`, {
        zone,
        recordName: `${name}.${samples.parent}`,
        domainName: target,
        ttl: Duration.hours(1),
      });
    }

    // お名前.com に登録するネームサーバー
    new CfnOutput(this, 'NameServers', {
      value: Fn.join(', ', zone.hostedZoneNameServers ?? []),
      description: 'お名前.com のネームサーバーに登録する値',
    });
  }
}
