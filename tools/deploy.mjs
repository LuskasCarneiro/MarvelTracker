/* Publica a app 3D no GitHub Pages: build → branch gh-pages com o dist →
   push -f. Uso: node tools/deploy.mjs [--dry-run]  (gh autenticado, origin
   = LuskasCarneiro/MarvelTracker). Não mexe na branch atual nem no worktree. */
import { spawnSync } from 'node:child_process';
import { existsSync, cpSync, rmSync, writeFileSync, readdirSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const REPO = '/home/luskas_carneiro/Desktop/marvel-vault';
const WORK = '/tmp/opencode/ghpages';
const URL = 'https://luskascarneiro.github.io/MarvelTracker/app.html';

const run = (cmd, args, opts = {}) => {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  if (DRY) return { status: 0 };
  return spawnSync(cmd, args, { stdio: 'inherit', cwd: opts.cwd ?? REPO, ...opts });
};

const fail = (msg) => { console.error(`FALHA: ${msg}`); process.exit(1); };

console.log(`deploy${DRY ? ' (dry-run)' : ''}`);

const build = run('npm', ['run', 'build']);
if (build.status !== 0) fail('npm run build');
if (!existsSync(`${REPO}/dist/app.html`) || !existsSync(`${REPO}/dist/sw.js`)) fail('dist incompleto (app.html/sw.js)');

const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).stdout.trim();
console.log(`  HEAD: ${head}`);

run('git', ['worktree', 'remove', '--force', WORK]);
run('git', ['branch', '-D', 'gh-pages']);
run('git', ['worktree', 'add', WORK, '-b', 'gh-pages']);
if (!DRY) {
  for (const entry of readdirSync(WORK)) {
    if (entry !== '.git') rmSync(`${WORK}/${entry}`, { recursive: true, force: true });
  }
  cpSync(`${REPO}/dist`, WORK, { recursive: true });
  writeFileSync(`${WORK}/.nojekyll`, '');
}
run('git', ['add', '-A'], { cwd: WORK });
run('git', ['commit', '-m', `Deploy 3D vault (feature/3d-shelf @ ${head})`], { cwd: WORK });
run('git', ['push', '-f', 'origin', 'gh-pages'], { cwd: WORK });
run('git', ['worktree', 'remove', '--force', WORK]);
run('git', ['worktree', 'prune']);

console.log(DRY ? `  dry-run: nada executado — próximo deploy real: ${URL}` : `  publicado: ${URL}`);