/* 前端派生通道：任意提货码 -> 格式合法的 qzapp 凭证
   同一串码输出恒定，用于静态站点（无后端）场景 */
(function (g) {
  var SECRET = 'xuxian-txc-static-2026';
  var enc = new TextEncoder();

  async function hmacKey() {
    return crypto.subtle.importKey('raw', enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  }

  async function hex32(key, seed, label) {
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(seed + '|' + label)));
    return Array.from(sig.slice(0, 16), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }

  async function derive(code) {
    const seed = String(code).trim().toUpperCase();
    const key = await hmacKey();
    return {
      access_token: await hex32(key, seed, 'access_token'),
      expires_in: '7776000',
      openid: await hex32(key, seed, 'openid'),
      pay_token: await hex32(key, seed, 'pay_token')
    };
  }

  function toQuery(f) {
    return ['access_token', 'expires_in', 'openid', 'pay_token']
      .filter(function (k) { return f[k] !== undefined; })
      .map(function (k) { return k + '=' + f[k]; })
      .join('&');
  }

  g.TXC_DERIVE = { derive: derive, toQuery: toQuery };
})(window);
