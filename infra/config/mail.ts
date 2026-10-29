/**
 * メール用の DNS レコード（D-004）。Zoho Mail の管理画面に表示される値を、ここに転記する。
 * どれも DNS で公開される値のため、秘密情報ではない。名前はドメインからの相対で書く（ドメイン自体は .env）。
 *
 * 空の項目は、メール用のレコードを作らない。
 * DMARC は `p=none`（監視のみ）で始め、レポートで問題がなければ強める（infra/README.md「メール用のレコード」）。
 *
 * 記入例（値は必ず Zoho の管理画面で確認する。データセンターが日本の場合の例）：
 *   verification: ['zoho-verification=zb00000000.zmverify.zoho.jp'],
 *   mx: [
 *     { priority: 10, hostName: 'mx.zoho.jp' },
 *     { priority: 20, hostName: 'mx2.zoho.jp' },
 *     { priority: 50, hostName: 'mx3.zoho.jp' },
 *   ],
 *   spf: 'v=spf1 include:zohomail.jp ~all',
 *   dkim: [{ selector: 'zmail', value: 'v=DKIM1; k=rsa; p=MIGfMA0...' }],
 *   dmarc: 'v=DMARC1; p=none; rua=mailto:info@<ドメイン>',
 */
export interface MailConfig {
  /** apex の TXT に置く所有確認の値（Zoho Mail、Google Search Console の `google-site-verification=...` など） */
  readonly verification: readonly string[];
  readonly mx: readonly { readonly priority: number; readonly hostName: string }[];
  /** apex の TXT に置く SPF。所有確認の値と同じ TXT レコードにまとめる */
  readonly spf?: string;
  /** `<selector>._domainkey` の TXT */
  readonly dkim: readonly { readonly selector: string; readonly value: string }[];
  /** `_dmarc` の TXT */
  readonly dmarc?: string;
}

export const mailConfig: MailConfig = {
  verification: [
    'zoho-verification=zb97858742.zmverify.zoho.jp',
    // Google Search Console のドメインの所有確認（docs/operations.md 5 章）
    'google-site-verification=ENhx0z37DJ0muI6fkS_8xCXGXQ5Uj6cEmGTXkSS9-18',
  ],
  mx: [
    { priority: 10, hostName: 'mx.zoho.jp' },
    { priority: 20, hostName: 'mx2.zoho.jp' },
    { priority: 50, hostName: 'mx3.zoho.jp' },
  ],
  spf: 'v=spf1 include:zohomail.jp ~all',
  dkim: [
    {
      selector: 'zmail',
      value:
        'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCjcdnq5ADBIKafydCubMnlK2yZ9Q4OXW+hgvxwp9V0L8m+bnX3lpLFfvZAHGm3mxi3a1DuDkz2HUXVHiR3japJiGv5MFzsSkDTT+Mh730eDbYJzqaWzU9lbPDoRaPPZ0bI99sEO7/BeYl0W1GWim5Omu3T8ym04EvcOkuuUWlE+QIDAQAB',
    },
  ],
  dmarc: 'v=DMARC1; p=none; rua=mailto:info@higuma-lab.jp',
};
