import { describe, expect, it } from 'vitest';
import { viewerRequestFunctionCode } from '../lib/site-stack.js';

interface Value {
  value: string;
  multiValue?: { value: string }[];
}
interface Request {
  uri: string;
  headers: Record<string, Value>;
  querystring: Record<string, Value>;
}
interface Response {
  statusCode: number;
  headers: Record<string, Value>;
}

const DOMAIN = 'example.jp';

// cloudfront-js-2.0 の関数は export を持たないため、コードを評価して handler を取り出す
const handler = new Function(`${viewerRequestFunctionCode(DOMAIN)}\nreturn handler;`)() as (event: {
  request: Request;
}) => Request | Response;

function run(uri: string, host = DOMAIN, querystring: Record<string, Value> = {}) {
  return handler({ request: { uri, headers: { host: { value: host } }, querystring } });
}

function location(result: Request | Response): string | undefined {
  return 'statusCode' in result ? result.headers['location']?.value : undefined;
}

describe('viewer-request の CloudFront Function', () => {
  it('ドメインのプレースホルダーを置き換える', () => {
    expect(viewerRequestFunctionCode(DOMAIN)).not.toContain('__APEX_DOMAIN__');
  });

  it('ディレクトリの URL は index.html を読む', () => {
    expect(run('/')).toMatchObject({ uri: '/index.html' });
    expect(run('/works/noteflip/')).toMatchObject({ uri: '/works/noteflip/index.html' });
  });

  it('拡張子のあるファイルはそのまま読む', () => {
    expect(run('/_astro/index.abc123.css')).toMatchObject({ uri: '/_astro/index.abc123.css' });
    expect(run('/404.html')).toMatchObject({ uri: '/404.html' });
    expect(run('/robots.txt')).toMatchObject({ uri: '/robots.txt' });
  });

  it('末尾にスラッシュのない URL は 301 で付け足す', () => {
    const result = run('/about');
    expect(result).toMatchObject({ statusCode: 301 });
    expect(location(result)).toBe('/about/');
  });

  it('www は apex へ 301 でリダイレクトする（パスとクエリを保つ）', () => {
    const result = run('/about/', `www.${DOMAIN}`, {
      utm_source: { value: 'x' },
      tag: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b%20c' }] },
      flag: { value: '' },
    });
    expect(result).toMatchObject({ statusCode: 301 });
    expect(location(result)).toBe(`https://${DOMAIN}/about/?utm_source=x&tag=a&tag=b%20c&flag`);
  });

  it('CloudFront の既定のドメインも apex へリダイレクトする', () => {
    expect(location(run('/', 'd111111abcdef8.cloudfront.net'))).toBe(`https://${DOMAIN}/`);
  });

  it('Host の大文字・小文字を区別しない', () => {
    expect(run('/', DOMAIN.toUpperCase())).toMatchObject({ uri: '/index.html' });
  });
});
