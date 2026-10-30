// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bump, commitLevel, isVersionOnlyDiff, targetVersion } from './bump-versions.js';

describe('commitLevel', () => {
  it.each([
    ['feat: add anime filters', '', 2],
    ['fix(list): keep scroll position', '', 1],
    ['perf: memoize cards', '', 1],
    ['revert: drop filters', '', 1],
    ['docs: update readme', '', 0],
    ['chore: configure tools', '', 0],
    ['feat!: replace data source', '', 3],
    ['refactor: rename api', 'BREAKING CHANGE: novo contrato', 3],
    ['mensagem fora do padrão', '', 0],
  ])('"%s" → nível %i', (subject, body, level) => {
    expect(commitLevel(subject, body)).toBe(level);
  });
});

describe('bump', () => {
  it.each([
    ['1.2.3', 0, '1.2.3'],
    ['1.2.3', 1, '1.2.4'],
    ['1.2.3', 2, '1.3.0'],
    ['1.2.3', 3, '2.0.0'],
  ])('%s com nível %i → %s', (version, level, expected) => {
    expect(bump(version, level)).toBe(expected);
  });
});

describe('targetVersion', () => {
  it('aplica um único bump, o maior entre os commits da branch', () => {
    const commits = [{ level: 1 }, { level: 2 }, { level: 0 }];
    expect(targetVersion('0.1.0', commits)).toEqual({ level: 2, version: '0.2.0' });
  });

  it('mantém a versão quando nenhum commit gera bump', () => {
    expect(targetVersion('0.1.0', [{ level: 0 }])).toEqual({ level: 0, version: '0.1.0' });
    expect(targetVersion('0.1.0', [])).toEqual({ level: 0, version: '0.1.0' });
  });
});

describe('isVersionOnlyDiff', () => {
  const header = 'diff --git a/package.json b/package.json\n--- a/package.json\n+++ b/package.json';

  it('reconhece um commit que só alterou o version do package.json da raiz', () => {
    const diff = `${header}\n@@ -3 +3 @@\n-  "version": "0.1.0",\n+  "version": "0.2.0",`;
    expect(isVersionOnlyDiff(diff)).toBe(true);
  });

  it('não ignora commits com outras mudanças no package.json', () => {
    const diff = `${header}\n@@ -3 +3 @@\n-  "version": "0.1.0",\n+  "version": "0.2.0",\n+  "private": true,`;
    expect(isVersionOnlyDiff(diff)).toBe(false);
  });

  it('não ignora commits que tocam outros arquivos', () => {
    const diff = `${header}\n-  "version": "0.1.0",\n+  "version": "0.2.0",\ndiff --git a/src/App.tsx b/src/App.tsx\n+x`;
    expect(isVersionOnlyDiff(diff)).toBe(false);
  });
});
