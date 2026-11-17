import { describe, expect, it } from 'vitest';
import { createGameStore } from './store';
import { prepScoreFromBrine, prepScoreFromHits, seasoningWarnings } from './rules';

const play = () => createGameStore();

describe('단계 진행 (명세 1)', () => {
  it('인트로를 끝내야 재료 선택으로 넘어간다', () => {
    const g = play();
    expect(g.getState().next()).toBe(false);
    expect(g.getState().missing()).toHaveLength(1);
    g.getState().finishIntro();
    expect(g.getState().next()).toBe(true);
    expect(g.getState().stage).toBe('select');
  });

  it('주재료와 양념 없이는 재료 선택을 끝낼 수 없다 (명세 2-3)', () => {
    const g = play();
    g.getState().finishIntro();
    g.getState().next();
    expect(g.getState().missing()).toHaveLength(2);
    g.getState().toggleIngredient('watermelon');
    expect(g.getState().next()).toBe(false);
    g.getState().toggleIngredient('cabbage');
    g.getState().toggleIngredient('salt');
    expect(g.getState().next()).toBe(true);
  });

  it('재료는 8개까지만 담긴다', () => {
    const g = play();
    g.getState().finishIntro();
    g.getState().next();
    for (const id of ['cabbage', 'radish', 'gochugaru', 'salt', 'garlic', 'ginger', 'fish-sauce', 'sugar', 'watermelon']) {
      g.getState().toggleIngredient(id);
    }
    expect(g.getState().selected).toHaveLength(8);
    expect(g.getState().selected).not.toContain('watermelon');
  });

  it('한 판을 끝까지 진행하고 재도전할 수 있다', () => {
    const g = play();
    const s = () => g.getState();
    s().finishIntro();
    s().next();
    ['cabbage', 'gochugaru', 'salt', 'garlic', 'watermelon'].forEach((id) => s().toggleIngredient(id));
    s().next();

    expect(s().stage).toBe('prep');
    expect(s().missing()).toHaveLength(3); // 배추, 마늘, 수박
    s().setPrep('cabbage', { score: 90, brine: 50 });
    s().setPrep('garlic', { score: 80 });
    expect(s().next()).toBe(false);
    s().setPrep('watermelon', { score: 70 });
    expect(s().next()).toBe(true);

    expect(s().stage).toBe('season');
    expect(s().seasoning).toEqual({ gochugaru: 0, salt: 0, garlic: 0 });
    expect(s().next()).toBe(false);
    s().setSeasoning('gochugaru', 3);
    s().setSeasoning('salt', 99); // 최대치로 잘린다
    expect(s().seasoning.salt).toBe(5);
    expect(s().next()).toBe(true);

    expect(s().stage).toBe('mix');
    for (let i = 0; i < 7; i++) s().mixStep();
    expect(s().next()).toBe(false);
    s().mixStep();
    expect(s().next()).toBe(true);

    expect(s().stage).toBe('result');
    expect(s().result).not.toBeNull();
    expect(s().result!.headline.text.length).toBeGreaterThan(0);

    s().retry();
    expect(s().stage).toBe('select');
    expect(s().selected).toEqual([]);
    expect(s().result).toBeNull();
  });

  it('단계에 맞지 않는 조작은 무시된다', () => {
    const g = play();
    g.getState().toggleIngredient('cabbage');
    g.getState().setSeasoning('salt', 3);
    g.getState().mixStep();
    expect(g.getState().selected).toEqual([]);
    expect(g.getState().seasoning).toEqual({});
    expect(g.getState().mixCoverage).toBe(0);
  });
});

describe('손질·양념 보조 규칙', () => {
  it('손질 점수', () => {
    expect(prepScoreFromHits(8)).toBe(100);
    expect(prepScoreFromHits(6)).toBe(70);
    expect(prepScoreFromHits(0)).toBe(0);
    expect(prepScoreFromBrine(50)).toBe(100);
    expect(prepScoreFromBrine(80)).toBe(60);
  });

  it('양념 경고 (명세 3-4)', () => {
    const w = seasoningWarnings({
      selected: ['cabbage', 'salt'],
      prep: { cabbage: { score: 100, brine: 80 } },
      seasoning: { salt: 5 },
      mixCoverage: 0,
    });
    expect(w).toContain('소금이 너무 많은 것 같아요...');
    expect(w).toContain('고춧가루 없이 괜찮을까요?');
  });
});
