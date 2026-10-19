/**
 * サンプルサイトのサブドメイン（D-048〜D-050）。サンプルは Cloudflare Pages に置き、
 * `<名前>.sample.<ドメイン>` を CNAME で Pages の `<プロジェクト名>.pages.dev` に向ける。
 * どれも DNS で公開される値のため、秘密情報ではない。名前はドメインからの相対で書く（ドメイン自体は .env）。
 *
 * apex の CAA は Amazon だけに証明書の発行を許しているため、そのままでは Cloudflare が証明書を取れない。
 * 親の `sample` にだけ Cloudflare の認証局を許す CAA を置き、サイト本体（apex・www）は Amazon のままにする。
 */
export interface SampleSitesConfig {
  /** サンプルをまとめる親の名前（`sample` → `sample.<ドメイン>`） */
  readonly parent: string;
  /** 親の CAA で証明書の発行を許す認証局（Cloudflare Pages のカスタムドメインの文書にあるもの） */
  readonly caaIssuers: readonly string[];
  /** `<name>.<parent>` を `target` に向ける CNAME */
  readonly sites: readonly { readonly name: string; readonly target: string }[];
}

export const sampleSitesConfig: SampleSitesConfig = {
  parent: 'sample',
  caaIssuers: ['letsencrypt.org', 'pki.goog; cansignhttpexchanges=yes', 'ssl.com'],
  sites: [
    { name: 'komugi-to-yuge', target: 'komugi-to-yuge.pages.dev' },
    { name: 'karada-kyufu', target: 'karada-kyufu.pages.dev' },
  ],
};
