#!/usr/bin/env node
// Audita o preview (http://localhost:4173) com o Lighthouse, grava reports/lighthouse.report.html
// e reports/lighthouse.report.json e falha se alguma categoria ficar abaixo de MIN_SCORES.
// Usa o Chrome de CHROME_PATH quando definido; senão, o Chromium já instalado pelo Playwright,
// para não depender de um Chrome do sistema (ausente em várias máquinas e no CI).
//
// Uso: pnpm lighthouse      (com o preview já rodando)
//      pnpm lighthouse:ci   (sobe o preview, audita e encerra)
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const OUTPUT_PATH = './reports/lighthouse';
const JSON_REPORT = `${OUTPUT_PATH}.report.json`;

/** Notas mínimas (0 a 1) por categoria; acessibilidade mais alta por causa do RNF01. */
export const MIN_SCORES = {
  performance: 0.9,
  accessibility: 0.95,
  'best-practices': 0.9,
  seo: 0.9,
};

const percent = (score) => Math.round(score * 100);

/** Categorias abaixo do mínimo, já formatadas para o log. */
export function scoreFailures(categories, minScores = MIN_SCORES) {
  return Object.entries(minScores)
    .map(([id, min]) => {
      const score = categories[id]?.score;
      const label = typeof score === 'number' ? percent(score) : 'sem nota';
      return typeof score === 'number' && score >= min
        ? null
        : `${id}: ${label} (mínimo ${percent(min)})`;
    })
    .filter(Boolean);
}

async function main() {
  const { chromium } = await import('@playwright/test');
  const url = process.env.LIGHTHOUSE_URL ?? 'http://localhost:4173';
  const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();

  // CLI chamado direto pelo Node: sem shell, os argumentos não passam por interpretação
  const lighthouseDir = dirname(createRequire(import.meta.url).resolve('lighthouse/package.json'));
  const { status } = spawnSync(
    process.execPath,
    [
      join(lighthouseDir, 'cli', 'index.js'),
      url,
      '--output=html',
      '--output=json',
      `--output-path=${OUTPUT_PATH}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ],
    { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromePath } },
  );
  if (status !== 0) process.exit(status ?? 1);

  const { categories } = JSON.parse(readFileSync(JSON_REPORT, 'utf8'));
  for (const { id, score } of Object.values(categories)) {
    process.stdout.write(`${id}: ${percent(score ?? 0)}\n`);
  }

  const failures = scoreFailures(categories);
  if (failures.length > 0) {
    process.stderr.write(`\nLighthouse abaixo do mínimo:\n  ${failures.join('\n  ')}\n`);
    process.exit(1);
  }
}

// Executa só como CLI; importado (testes), expõe apenas as regras de nota
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
