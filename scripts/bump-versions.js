#!/usr/bin/env node
// Atualiza o campo `version` do package.json da raiz a partir dos Conventional Commits
// (commitlint.config.js), sempre em relação à main: a versão-alvo é a versão do pacote no
// merge-base com a main mais o maior bump entre os commits da branch:
//   BREAKING CHANGE / `tipo!:`  → major
//   feat                        → minor
//   fix, perf, revert           → patch
//   demais tipos                → sem bump
// O cálculo é idempotente: vários commits na mesma branch geram um único bump sobre a main.
//
// Uso: pnpm version:bump [--dry-run | --check | --check-title | --hook]
//   --dry-run      só mostra o que mudaria
//   --check        falha se a versão difere do alvo (CI)
//   --check-title  falha se o tipo do título do PR (env PR_TITLE) não corresponde ao maior bump
//   --hook         grava e inclui o package.json no último commit (Husky: post-commit e post-rewrite)
// A referência da main é `origin/main` (ou `main`, se não houver remoto), atualizada com fetch
// antes de gravar; sobrescreva com BUMP_BASE. Sem main (repositório recém-criado), não há base
// de comparação e o script apenas avisa.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PACKAGE_PATH = 'package.json';
const LEVELS = ['none', 'patch', 'minor', 'major'];
const PATCH_TYPES = new Set(['fix', 'perf', 'revert']);
const HEADER = /^(?<type>\w+)(?:\([^)]*\))?(?<breaking>!)?: .+/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE: /m;
const VERSION_FIELD = /("version":\s*")[^"]+(")/;

const mode = ['--dry-run', '--check-title', '--check', '--hook'].find((flag) =>
  process.argv.includes(flag),
);

function git(...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tryGit(...args) {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

/** Nível de bump de um commit (índice em LEVELS). */
export function commitLevel(subject, body) {
  const match = HEADER.exec(subject);
  if (!match?.groups) return 0;
  if (match.groups.breaking || BREAKING_FOOTER.test(body)) return 3;
  if (match.groups.type === 'feat') return 2;
  return PATCH_TYPES.has(match.groups.type) ? 1 : 0;
}

export function bump(version, level) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (level === 3) return `${major + 1}.0.0`;
  if (level === 2) return `${major}.${minor + 1}.0`;
  if (level === 1) return `${major}.${minor}.${patch + 1}`;
  return version;
}

/** Versão-alvo: um único bump, o maior entre os commits da branch. */
export function targetVersion(baseVersion, commits) {
  const level = Math.max(0, ...commits.map((c) => c.level));
  return { level, version: bump(baseVersion, level) };
}

/** Diff (git show) que só alterou o `version` do package.json da raiz (bump emendado). */
export function isVersionOnlyDiff(diff) {
  const lines = diff.split('\n');
  const files = lines.filter((line) => line.startsWith('diff --git'));
  const changes = lines.filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line));
  return (
    files.length === 1 &&
    files[0] === `diff --git a/${PACKAGE_PATH} b/${PACKAGE_PATH}` &&
    changes.every((line) => VERSION_FIELD.test(line))
  );
}

/**
 * Atualiza `origin/main` antes de calcular: com a ref local defasada, o alvo sairia de uma main
 * antiga e o CI rejeitaria a branch. Sem rede ou credencial, segue com a ref local e avisa
 * (o `--check` do CI cobre esse caso). Nunca pede senha nem trava o commit.
 */
function refreshMain() {
  try {
    execFileSync('git', ['fetch', '--quiet', '--no-tags', 'origin', 'main'], {
      stdio: 'ignore',
      timeout: 15_000,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? 'ssh -o BatchMode=yes -o ConnectTimeout=10',
      },
    });
  } catch {
    process.stderr.write(
      'Aviso: não foi possível atualizar origin/main; usando a ref local (pode estar defasada).\n',
    );
  }
}

/** Ref da main, ou null quando ela ainda não existe. */
function mainRef() {
  // No CI (--check*), o checkout com histórico completo já traz a origin/main atual
  const writes = mode !== '--check' && mode !== '--check-title';
  if (writes && !process.env.BUMP_BASE && tryGit('remote', 'get-url', 'origin')) refreshMain();
  const candidates = process.env.BUMP_BASE ? [process.env.BUMP_BASE] : ['origin/main', 'main'];
  return (
    candidates.find((candidate) => tryGit('rev-parse', '--verify', '--quiet', candidate)) ?? null
  );
}

/** Commits da branch (fora de `since`), sem os que só emendaram o bump de versão. */
function branchCommits(since) {
  const log = git('log', `${since}..HEAD`, '--no-merges', '--format=%h%x1f%s%x1f%b%x1e');
  return log
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash = '', subject = '', body = ''] = entry.split('\x1f');
      return { hash, subject, level: commitLevel(subject, body) };
    })
    .filter((commit) => !isVersionOnlyDiff(git('show', '--format=', '--unified=0', commit.hash)));
}

/** Tipos de título aceitos para cada nível de bump. */
const TITLE_HINTS = [
  'chore, docs, refactor, test, ci, build ou style',
  'fix, perf ou revert',
  'feat',
  'qualquer tipo com `!` (ex.: feat!:)',
];

/**
 * No squash merge, o título do PR vira o commit da main: o nível dele precisa ser o maior bump
 * entre os commits da branch, para o histórico refletir a versão gerada.
 */
function checkTitle(title, commits) {
  const expected = Math.max(0, ...commits.map((c) => c.level));
  const actual = commitLevel(title, '');
  if (actual === expected) {
    process.stdout.write(`Título compatível com o bump da branch (${LEVELS[expected]}).\n`);
    return;
  }
  const drivers = commits
    .filter((c) => c.level === expected && expected > 0)
    .map((c) => `  ${c.hash} [${LEVELS[c.level]}] ${c.subject}`);
  process.stderr.write(
    [
      `Título "${title}" indica bump ${LEVELS[actual]}, mas os commits da branch indicam ${LEVELS[expected]}.`,
      ...drivers,
      `Use no título: ${TITLE_HINTS[expected]}.`,
      '',
    ].join('\n'),
  );
  process.exitCode = 1;
}

/** Rebase, cherry-pick e revert reaplicam commits: o hook não deve emendá-los. */
function sequencerInProgress() {
  const gitDir = git('rev-parse', '--git-dir');
  return ['rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD', 'REVERT_HEAD'].some((entry) =>
    existsSync(join(gitDir, entry)),
  );
}

/**
 * Versão de referência e commits a considerar. Se o package.json não existe na main, ele foi
 * criado na branch: a versão de criação é a inicial e o commit de criação não gera bump
 * (contá-lo faria a versão avançar a cada execução, já que o bump o emenda), mas define o
 * tipo esperado do título do PR.
 */
function resolveBase(base) {
  const baseRaw = tryGit('show', `${base}:${PACKAGE_PATH}`);
  if (baseRaw) {
    const commits = branchCommits(base);
    return { baseVersion: JSON.parse(baseRaw).version, commits, titleCommits: commits };
  }
  const [created] = git(
    'log',
    '--reverse',
    '--diff-filter=A',
    '--format=%H',
    `${base}..HEAD`,
    '--',
    PACKAGE_PATH,
  ).split('\n');
  // package.json ainda não commitado na branch: não há versão a calcular
  if (!created) return null;
  const [subject = '', body = ''] = git('log', '-1', '--format=%s%x1f%b', created).split('\x1f');
  const creation = { hash: created.slice(0, 7), subject, level: commitLevel(subject, body) };
  const commits = branchCommits(created);
  return {
    baseVersion: JSON.parse(git('show', `${created}:${PACKAGE_PATH}`)).version,
    commits,
    titleCommits: [creation, ...commits],
  };
}

function writeVersion(raw, version) {
  if (mode === '--hook') {
    // Não leva para o commit edições que o usuário ainda não commitou
    const dirty = tryGit('status', '--porcelain', '--', PACKAGE_PATH);
    if (dirty) {
      process.stderr.write(
        `\nVersão não atualizada: há mudanças pendentes em ${PACKAGE_PATH}. Commit-as e rode \`pnpm version:bump\`.\n`,
      );
      return;
    }
  }

  // Troca só o valor da versão, preservando a formatação do arquivo
  writeFileSync(PACKAGE_PATH, raw.replace(VERSION_FIELD, `$1${version}$2`));

  if (mode === '--hook') {
    execFileSync('git', ['commit', '--amend', '--no-edit', '--no-verify', '--only', '--', PACKAGE_PATH], {
      stdio: 'ignore',
      env: { ...process.env, BUMP_VERSIONS_RUNNING: '1' },
    });
    process.stdout.write('Versão incluída no último commit.\n');
  }
}

function main() {
  if (mode === '--hook' && process.env.BUMP_VERSIONS_RUNNING) return;
  // post-rewrite roda com o rebase já concluído, mas antes de o git limpar o estado dele
  if (mode === '--hook' && !process.env.BUMP_AFTER_REWRITE && sequencerInProgress()) return;

  const ref = mainRef();
  if (!ref) {
    process.stderr.write('Aviso: main não encontrada (origin/main, main); versão não calculada.\n');
    return;
  }

  const resolved = resolveBase(git('merge-base', 'HEAD', ref));
  if (!resolved) return;
  const { baseVersion, commits, titleCommits } = resolved;

  if (mode === '--check-title') {
    checkTitle(process.env.PR_TITLE ?? '', titleCommits);
    return;
  }

  const raw = readFileSync(PACKAGE_PATH, 'utf8');
  const { name, version: current } = JSON.parse(raw);
  const target = targetVersion(baseVersion, commits);

  if (target.version === current) {
    if (mode !== '--hook') process.stdout.write('Versão em dia com a main.\n');
    return;
  }

  const out = [`${name}: ${current} → ${target.version} (main: ${baseVersion}, ${LEVELS[target.level]})`];
  for (const c of commits.filter((c) => c.level > 0)) {
    out.push(`  ${c.hash} [${LEVELS[c.level]}] ${c.subject}`);
  }
  process.stdout.write(`${out.join('\n')}\n`);

  if (mode === '--dry-run') {
    process.stdout.write('\n(--dry-run: nada foi gravado)\n');
    return;
  }
  if (mode === '--check') {
    process.stderr.write('\nVersão fora do esperado: rode `pnpm version:bump` e faça commit.\n');
    process.exitCode = 1;
    return;
  }

  writeVersion(raw, target.version);
}

// Executa só como CLI; importado (testes), expõe apenas as funções puras
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
