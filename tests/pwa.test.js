import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../public/', import.meta.url);
const source = readFileSync(new URL('sw.js', root), 'utf8');
const currentCache = source.match(/const CACHE = '([^']+)'/)[1];

test('manifest and local icons support standalone installation', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', root)));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'Multiply');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const png = readFileSync(new URL(`icons/${file}`, root));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('service worker precaches all public files and leaves unrelated caches and requests alone', async () => {
  const events = {};
  const deleted = [];
  let precache;
  let claimed = false;
  const cache = { addAll: async requests => { precache = requests.map(request => request.url); }, match: async () => 'cached response' };
  vm.runInNewContext(source, {
    URL, Request,
    self: { registration: { scope: 'https://example.test/multiply/' }, addEventListener: (name, handler) => { events[name] = handler; }, clients: { claim: async () => { claimed = true; } } },
    caches: { open: async () => cache, keys: async () => ['multiply-static-old', currentCache, 'unrelated'], delete: async key => deleted.push(key) },
    fetch: () => { throw Error('Unexpected network request'); },
  });
  let waiting;
  events.install({ waitUntil: promise => { waiting = promise; } });
  await waiting;
  const files = readdirSync(root, { recursive: true }).filter(path => statSync(new URL(path, root)).isFile() && path !== 'sw.js');
  for (const file of files) assert.ok(precache.includes(`https://example.test/multiply/${file}`), `${file} must be cached`);
  assert.ok(precache.every(url => url.startsWith('https://example.test/multiply/')));
  events.activate({ waitUntil: promise => { waiting = promise; } });
  await waiting;
  assert.deepEqual(deleted, ['multiply-static-old']);
  assert.equal(claimed, true);
  for (const url of ['https://other.test/app.js', 'https://example.test/AGENTS.md', 'https://example.test/multiply/private.json']) {
    events.fetch({ request: { method: 'GET', url }, respondWith: () => assert.fail('Unrelated request intercepted') });
  }
  events.fetch({ request: { method: 'GET', url: 'https://example.test/multiply/' }, respondWith: promise => { waiting = promise; } });
  assert.equal(await waiting, 'cached response');
});
