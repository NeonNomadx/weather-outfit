const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));

function pngSize(rel) {
  const b = fs.readFileSync(path.join(root, rel));
  assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', rel);
  return [b.readUInt32BE(16), b.readUInt32BE(20), b.length];
}

assert.match(html, /<meta name="apple-mobile-web-app-title" content="Weather Outfit">/);
assert.match(html, /<meta name="application-name" content="Weather Outfit">/);
assert.match(html, /href="icons\/apple-touch-icon-v2\.png"/);
assert.match(html, /href="icons\/favicon-32-v2\.png"/);
assert.match(html, /href="icons\/favicon-v2\.ico"/);
assert.match(html, /href="site\.webmanifest"/);
assert.equal(html.includes('icons/apple-touch-icon-v1.png'), false);
assert.equal(html.includes('id="motion-toggle"'), false);

assert.equal(manifest.name, 'Weather Outfit');
assert.equal(manifest.short_name, 'Weather Outfit');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
const icons = Object.fromEntries(manifest.icons.map(icon => [icon.sizes, icon]));
for (const icon of manifest.icons) {
  assert.equal(icon.src.startsWith('icons/'), true, icon.src);
  assert.equal(icon.src.includes('-v2.'), true, icon.src);
}
assert.deepEqual(pngSize(icons['180x180'].src), [180, 180, fs.statSync(path.join(root, icons['180x180'].src)).size]);
assert.deepEqual(pngSize('icons/apple-touch-icon-v2.png').slice(0, 2), [180, 180]);
assert.deepEqual(pngSize('icons/app-icon-192-v2.png').slice(0, 2), [192, 192]);
assert.deepEqual(pngSize('icons/app-icon-512-v2.png').slice(0, 2), [512, 512]);
assert.deepEqual(pngSize('icons/favicon-32-v2.png').slice(0, 2), [32, 32]);

const ico = fs.readFileSync(path.join(root, 'icons/favicon-v2.ico'));
assert.equal(ico.readUInt16LE(0), 0);
assert.equal(ico.readUInt16LE(2), 1);
const count = ico.readUInt16LE(4);
assert.equal(count, 3);
const sizes = [];
for (let i = 0; i < count; i++) {
  const width = ico.readUInt8(6 + i * 16) || 256;
  const height = ico.readUInt8(7 + i * 16) || 256;
  const offset = ico.readUInt32LE(18 + i * 16);
  sizes.push(width + 'x' + height);
  assert.equal(ico.subarray(offset, offset + 8).toString('hex'), '89504e470d0a1a0a');
}
assert.deepEqual(sizes, ['16x16', '32x32', '48x48']);
console.log('icon metadata ok', pngSize('icons/apple-touch-icon-v2.png')[2], 'apple bytes');
