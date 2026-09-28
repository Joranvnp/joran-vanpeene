const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzePage } = require('../lib/audit/analyze.ts');
const { normalizeUrl, isPublicAddress, resolvePublicTarget, fetchPublicPage } = require('../lib/audit/fetch-page.ts');
const valid = `<!doctype html><html lang="fr"><head><title>Atelier des fleurs — Aigre</title>
<meta name="description" content="Bouquets de saison préparés à Aigre."><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://atelier.fr/"></head><body><h1>Des fleurs pour vos moments heureux</h1>
<img src="bouquet.jpg" alt="Bouquet de roses"><img src="decoration.jpg" alt=""><a href="/contact">Nous contacter</a></body></html>`;
const analyze = (html, extra = {}) => analyzePage({ html: Buffer.from(html), url: 'https://atelier.fr/', requestedUrl: 'https://atelier.fr/', contentType: 'text/html; charset=utf-8', robotsHeader: '', status: 200, redirects: 0, fetchedAt: new Date().toISOString(), ...extra });
const check = (result, id) => result.checks.find(c => c.id === id);

test('valid HTML produces evidence and no invented score or recommendations', () => {
  const r = analyze(valid);
  assert.equal(r.passed, 10); assert.equal(r.checked, 10); assert.equal(r.score, undefined);
  assert.equal(r.improvements.length, 0); assert.match(check(r, 'title').evidence, /Atelier des fleurs/);
});
test('missing metadata, image alt and link label lead to grounded recommendations', () => {
  const r = analyze('<html><body><h1>Atelier</h1><img src="photo.jpg"><a href="/contact"><span></span></a></body></html>');
  assert.equal(check(r, 'title').status, 'warning'); assert.equal(check(r, 'images').status, 'warning');
  assert.equal(check(r, 'links').status, 'warning'); assert.equal(r.improvements.length, 3);
  assert.ok(r.improvements.every(i => i.evidence && i.action));
});
test('noindex is visible and not misrepresented as an SEO failure when intentional', () => {
  const r = analyze(valid.replace('</head>', '<meta name="ROBOTS" content="noindex,follow"></head>'));
  assert.equal(check(r, 'indexing').status, 'info'); assert.equal(r.checked, 9);
  assert.equal(check(analyze(valid, { robotsHeader: 'googlebot: noindex' }), 'indexing').status, 'info');
});
test('client-rendered shell reports partial coverage instead of inventing missing content', () => {
  const r = analyze('<html><head><title>Application</title><script src="/app.js"></script></head><body><div id="root"></div></body></html>');
  assert.equal(r.partial, true); assert.equal(check(r, 'h1').status, 'info');
  assert.equal(check(r, 'images').status, 'info'); assert.equal(check(r, 'links').status, 'info');
});
test('decorative images, aria labels and hidden template content are treated correctly', () => {
  const r = analyze(valid.replace('</body>', '<a aria-label="Menu" href="/menu"><svg></svg></a><div hidden><img src="hidden.jpg"><a href="/x"></a></div><template><h1>Template</h1><img src="t.jpg"></template></body>'));
  assert.equal(check(r, 'images').status, 'pass'); assert.equal(check(r, 'links').status, 'pass');
  assert.match(check(r, 'h1').evidence, /^1 titre/);
});
test('escaped HTML evidence stays text and malformed canonical is flagged', () => {
  const r = analyze(valid.replace('Atelier des fleurs — Aigre', '&lt;script&gt;alert(1)&lt;/script&gt;').replace('href="https://atelier.fr/"', 'href="javascript:alert(1)"'));
  assert.match(check(r, 'title').evidence, /<script>/); assert.equal(check(r, 'canonical').status, 'warning');
});
test('anti-bot interstitial does not produce a result', () => {
  assert.throws(() => analyze('<html><head><title>Just a moment...</title></head><body>Checking</body></html>'), /anti-robot/);
});
test('URLs normalize and private networks, credentials and non-web protocols are blocked', () => {
  assert.equal(normalizeUrl(' atelier.fr/bonjour#titre ').href, 'https://atelier.fr/bonjour');
  for (const u of ['http://127.0.0.1', 'http://2130706433', 'http://0x7f000001', 'http://169.254.169.254', 'http://10.0.0.1', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'file:///etc/passwd', 'ftp://atelier.fr', 'https://user:pass@atelier.fr', 'http://atelier.fr:8080', 'http://localhost', 'http://foo.local']) assert.throws(() => normalizeUrl(u), u);
});
test('address validation rejects reserved and transition ranges', () => {
  for (const ip of ['0.0.0.0', '127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '100.64.0.1', '169.254.169.254', '192.0.2.1', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:8.8.8.8', '2001:db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress('8.8.8.8'), true); assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
test('mixed DNS answers cannot smuggle a private destination', async t => {
  t.mock.method(require('node:dns/promises'), 'lookup', async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }]);
  await assert.rejects(resolvePublicTarget('atelier.fr', new AbortController().signal), /public autorisé/);
});
test('redirect to metadata IP is rejected and request uses the pinned DNS address', async t => {
  const { PassThrough } = require('node:stream'); const { EventEmitter } = require('node:events');
  let calls = 0;
  t.mock.method(require('node:dns/promises'), 'lookup', async () => [{ address: '8.8.8.8', family: 4 }]);
  t.mock.method(require('node:https'), 'request', (url, options, callback) => {
    calls++;
    options.lookup(url.hostname, { all: true }, (err, addresses) => assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }]));
    const req = new EventEmitter(); req.destroy = () => {}; req.end = () => {
      const res = new PassThrough(); res.statusCode = 302; res.headers = { location: 'http://169.254.169.254/latest/meta-data/' }; callback(res);
    }; return req;
  });
  await assert.rejects(fetchPublicPage('https://atelier.fr'), /Internet/); assert.equal(calls, 1);
});
