// Sync the original UI assets into dist/ so rosezm dev/preview/serve all
// serve them. (Workaround for the framework gap recorded in BUG.md.)
import fs from 'node:fs';
import path from 'node:path';
const src = path.resolve('public');
const dst = path.resolve('dist');
if (!fs.existsSync(src)) process.exit(0);
function walk(dir, rel = '') {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const s = path.join(dir, ent.name);
    const r = path.join(rel, ent.name);
    if (ent.isDirectory()) { walk(s, r); continue; }
    const d = path.join(dst, r);
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
  }
}
walk(src);
console.log('assets: public/ -> dist/ synced');
