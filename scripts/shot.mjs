// Screenshots the static pages at mobile / tablet / desktop widths into .shots/
// Usage: npm run shot [-- index.html cgu.html ...]   (defaults to index.html)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html'];
const viewports = [['mobile', 390, 844], ['tablet', 768, 1024], ['desktop', 1440, 900]];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = join(root, path.endsWith('/') ? path + 'index.html' : path);
    if (!file.startsWith(root)) throw new Error('outside root');
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end('not found'); }
}).listen(0);
const port = server.address().port;

await mkdir('.shots', { recursive: true });
const browser = await chromium.launch();
for (const page of pages) {
  for (const [name, width, height] of viewports) {
    const p = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await p.goto(`http://localhost:${port}/${page}`, { waitUntil: 'networkidle' });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const out = `.shots/${page.replace(/\.html$/, '')}-${name}.png`;
    await p.screenshot({ path: out, fullPage: true });
    console.log(`${out}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}${errors.length ? `  ⚠ console errors: ${errors.join(' | ')}` : ''}`);
    await p.close();
  }
}
await browser.close();
server.close();
