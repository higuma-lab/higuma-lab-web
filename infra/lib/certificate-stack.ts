import { Stack, type StackProps } from 'aws-cdk-lib';
import {
  Certificate,
  CertificateValidation,
  type ICertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import type { IHostedZone } from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';

export interface CertificateStackProps extends StackProps {
  readonly domainName: string;
  readonly hostedZone: IHostedZone;
}

/**
 * CloudFront 用の ACM 証明書（apex と www、DNS 検証）。CloudFront の制約で us-east-1 に置く（docs/design.md 7.2）。
 */
export class CertificateStack extends Stack {
  readonly certificate: ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    if (this.region !== 'us-east-1') {
      throw new Error('CloudFront 用の証明書は us-east-1 に作成する必要があります');
    }

    this.certificate = new Certificate(this, 'Certificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: CertificateValidation.fromDns(props.hostedZone),
    });
  }
}
