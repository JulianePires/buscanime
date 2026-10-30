#!/usr/bin/env node
// Audita o preview (http://localhost:4173) com o Lighthouse e grava reports/lighthouse.html.
// Usa o Chrome de CHROME_PATH quando definido; senão, o Chromium já instalado pelo Playwright,
// para não depender de um Chrome do sistema (ausente em várias máquinas e no CI).
//
// Uso: pnpm lighthouse      (com o preview já rodando)
//      pnpm lighthouse:ci   (sobe o preview, audita e encerra)
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const url = process.env.LIGHTHOUSE_URL ?? 'http://localhost:4173';
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();

const { status } = spawnSync(
  'lighthouse',
  [
    url,
    '--output=html',
    '--output-path=./reports/lighthouse.html',
    '--chrome-flags=--headless=new',
    '--quiet',
  ],
  { stdio: 'inherit', shell: true, env: { ...process.env, CHROME_PATH: chromePath } },
);

process.exit(status ?? 1);
