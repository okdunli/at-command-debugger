// Reproducible smoke test for the at-command-debugger-rosezm port.
// Runs every gate that matters after a framework (Rosezm) update so a silent
// regression in the build chain is caught in one command:
//   node scripts/smoke.mjs            # typecheck + build + gates
//   node scripts/smoke.mjs --live     # also drives a live backend on :8899
// No third-party deps: Node stdlib + curl (for the live API round-trip).
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--live');
let pass = 0, fail = 0;
const ok = (n, cond, extra = '') => {
  (cond ? pass++ : fail++);
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${n}${extra ? '  — ' + extra : ''}`);
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
const trim = (s) => (s || '').trim();

// 1. typecheck
{
  const r = run('npm', ['run', 'check']);
  const out = trim(r.stdout + r.stderr);
  ok('typecheck (npm run check)', r.status === 0 && /no errors|0 errors/.test(out), out.split('\n').slice(-1)[0]);
}

// 2. build
{
  const r = run('npm', ['run', 'build']);
  const out = trim(r.stdout + r.stderr);
  ok('build (npm run build)', r.status === 0 && /prerendered \/ -> dist\/index\.html/.test(out), out.split('\n').slice(-2).join(' '));
  ok('build artifact dist/index.html', existsSync(resolve(ROOT, 'dist', 'index.html')));
}

// 3. live API round-trip (only with --live, backend must be running on :8899)
if (live) {
  const post = (method, args) => {
    const r = run('curl', ['-s', '-m', '5', '-X', 'POST', 'http://127.0.0.1:8899/api/call',
      '-H', 'Content-Type: application/json', '-d', JSON.stringify({ method, args })], { encoding: 'utf8' });
    try { return JSON.parse(trim(r.stdout)); } catch { return null; }
  };
  const c = post('connect', { port: 'SIM' });
  ok('live connect SIM', !!c && c.ok === true, JSON.stringify(c));
  const s1 = post('send_command', { cmd: 'AT' });
  ok('live send AT -> OK', !!s1 && s1.status === 'OK', s1 && s1.status);
  const s2 = post('send_command', { cmd: 'AT+VER=?' });
  ok('live send AT+VER=? -> version', !!s2 && Array.isArray(s2.lines) && s2.lines.join(' ').includes('APPLICATION_VERSION'), s2 && s2.lines && s2.lines.slice(0, 2).join(' / '));
  post('disconnect', {});
} else {
  console.log('SKIP  live API round-trip (run with --live; backend must be on :8899)');
}

console.log(`\n${fail === 0 ? 'ALL GREEN' : 'HAS FAILURES'}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
