/**
 * メール用の DNS レコード（D-004）。Zoho Mail の管理画面に表示される値を、ここに転記する。
 * どれも DNS で公開される値のため、秘密情報ではない。名前はドメインからの相対で書く（ドメイン自体は .env）。
 *
 * TODO: Zoho Mail の登録後に値を入れる（Route 53 の構築後、D-004・D-025）。
 *       空のままなら、メール用のレコードは作らない。
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
  verification: ['zoho-verification=zb97858742.zmverify.zoho.jp'],
  mx: [],
  dkim: [],
};
