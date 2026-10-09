// CloudFront Function（cloudfront-js-2.0、viewer-request）。docs/design.md 7.3
// - apex 以外のホスト（www、*.cloudfront.net）へのアクセスは、apex へ 301 でリダイレクトする
// - `/about/` は S3 の `/about/index.html` を読む
// - 拡張子のない `/about` は `/about/` へ 301 でリダイレクトする（trailingSlash: 'always' に合わせる）
// __APEX_DOMAIN__ は CDK の合成時にドメインに置き換える（ドメインをコードに書かないため）

var APEX_DOMAIN = '__APEX_DOMAIN__';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- CloudFront が名前で呼び出す
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';

  if (host !== APEX_DOMAIN) {
    return redirect('https://' + APEX_DOMAIN + uri + serializeQuery(request.querystring));
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    return redirect(uri + '/' + serializeQuery(request.querystring));
  }

  return request;
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: location },
      'cache-control': { value: 'public, max-age=3600' },
    },
  };
}

// クエリ文字列は受け取ったまま（エンコード済みの値として）つなぎ直す
function serializeQuery(querystring) {
  var parts = [];
  for (var key in querystring) {
    var param = querystring[key];
    var values = param.multiValue ? param.multiValue : [param];
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i].value === '' ? key : key + '=' + values[i].value);
    }
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
}
