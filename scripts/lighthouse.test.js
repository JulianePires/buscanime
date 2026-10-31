// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MIN_SCORES, scoreFailures } from './lighthouse.js';

const categories = (scores) =>
  Object.fromEntries(
    Object.entries(scores).map(([id, score]) => [id, { id, title: id, score }]),
  );

describe('MIN_SCORES', () => {
  it('define nota mínima para as quatro categorias auditadas', () => {
    expect(Object.keys(MIN_SCORES).sort()).toEqual([
      'accessibility',
      'best-practices',
      'performance',
      'seo',
    ]);
  });
});

describe('scoreFailures', () => {
  const min = { performance: 0.9, accessibility: 0.95 };

  it('não aponta falhas quando todas as notas atingem o mínimo', () => {
    expect(scoreFailures(categories({ performance: 0.9, accessibility: 1 }), min)).toEqual([]);
  });

  it('aponta cada categoria abaixo do mínimo, com nota e mínimo em percentual', () => {
    expect(scoreFailures(categories({ performance: 0.72, accessibility: 0.94 }), min)).toEqual([
      'performance: 72 (mínimo 90)',
      'accessibility: 94 (mínimo 95)',
    ]);
  });

  it('trata categoria ausente ou sem nota como falha', () => {
    expect(scoreFailures(categories({ performance: null }), min)).toEqual([
      'performance: sem nota (mínimo 90)',
      'accessibility: sem nota (mínimo 95)',
    ]);
  });
});
