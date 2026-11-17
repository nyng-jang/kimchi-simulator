import { describe, expect, it } from 'vitest';
import { INGREDIENTS } from '../data/ingredients';
import { DEFAULT_FEEDBACK } from '../data/feedback';
import { computeTaste, evaluate, gradeOf } from './evaluate';
import type { KimchiInput } from './types';

/** 기준 레시피: 모든 맛이 목표 범위 안 */
const classic = (): KimchiInput => ({
  selected: ['cabbage', 'gochugaru', 'salt', 'garlic', 'ginger', 'fish-sauce', 'sugar', 'green-onion'],
  prep: {
    cabbage: { score: 100, brine: 50 },
    garlic: { score: 100 },
    ginger: { score: 100 },
    'green-onion': { score: 100 },
  },
  seasoning: { gochugaru: 3, salt: 2, garlic: 2, ginger: 1, 'fish-sauce': 2, sugar: 1 },
  mixCoverage: 100,
});

const withExtra = (base: KimchiInput, id: string): KimchiInput => ({
  ...base,
  selected: [...base.selected, id],
  prep: { ...base.prep, [id]: { score: 100 } },
});

describe('맛 계산', () => {
  it('기준 레시피는 모든 맛이 목표 범위 안에 들어온다', () => {
    const t = computeTaste(classic());
    expect(t.salty).toBeGreaterThanOrEqual(4);
    expect(t.salty).toBeLessThanOrEqual(6);
    expect(t.spicy).toBeGreaterThanOrEqual(3);
    expect(t.spicy).toBeLessThanOrEqual(7);
    expect(t.sweet).toBeGreaterThanOrEqual(1);
    expect(t.sweet).toBeLessThanOrEqual(3);
    expect(t.umami).toBeGreaterThanOrEqual(3);
    expect(t.umami).toBeLessThanOrEqual(7);
    expect(t.weird).toBe(0);
  });

  it('절임 정도가 짠맛에 더해진다', () => {
    const light = classic();
    light.prep.cabbage = { score: 100, brine: 0 };
    const heavy = classic();
    heavy.prep.cabbage = { score: 100, brine: 100 };
    expect(computeTaste(heavy).salty - computeTaste(light).salty).toBeCloseTo(4, 1);
  });

  it('맛 수치는 0~10으로 잘린다', () => {
    const input = classic();
    input.seasoning.salt = 5;
    input.seasoning['fish-sauce'] = 5;
    input.prep.cabbage = { score: 100, brine: 100 };
    expect(computeTaste(input).salty).toBe(10);
  });
});

describe('점수와 등급', () => {
  it('완벽한 기준 레시피는 100점 S등급, 성공적인 김치', () => {
    const r = evaluate(classic());
    expect(r.total).toBe(100);
    expect(r.grade).toBe('S');
    expect(r.resultType).toBe('성공적인 김치');
    expect(r.headline.reaction).toBe('happy');
  });

  it('등급 경계', () => {
    expect(gradeOf(90)).toBe('S');
    expect(gradeOf(89)).toBe('A');
    expect(gradeOf(75)).toBe('A');
    expect(gradeOf(60)).toBe('B');
    expect(gradeOf(40)).toBe('C');
    expect(gradeOf(39)).toBe('F');
  });

  it('핵심 재료가 빠지면 조합 점수가 깎인다', () => {
    const input = classic();
    input.selected = input.selected.filter((id) => id !== 'garlic');
    delete input.seasoning.garlic;
    expect(evaluate(input).breakdown.combo).toBeCloseTo(11.3, 1);
  });

  it('손질과 버무리기 품질이 점수에 반영된다', () => {
    const input = classic();
    input.mixCoverage = 60;
    Object.keys(input.prep).forEach((id) => (input.prep[id] = { ...input.prep[id], score: 50 }));
    const r = evaluate(input);
    expect(r.breakdown.mix).toBe(12);
    expect(r.breakdown.prep).toBe(12.5);
  });
});

describe('피드백 (명세 5)', () => {
  it('소금이 과하면 "켁켁, 너무 짜!"', () => {
    const input = classic();
    input.seasoning.salt = 5;
    input.prep.cabbage = { score: 100, brine: 90 };
    const r = evaluate(input);
    expect(r.headline.text).toContain('켁켁, 너무 짜!');
    expect(r.headline.reaction).toBe('cough');
    expect(r.resultType).toBe('너무 짠 김치');
  });

  it('수박이 들어가면 "재료가 이상해!"', () => {
    const r = evaluate(withExtra(classic(), 'watermelon'));
    expect(r.headline.text).toContain('재료가 이상해!');
  });

  it('두쫀쿠가 들어가면 전용 문구', () => {
    const r = evaluate(withExtra(classic(), 'dubai-cookie'));
    expect(r.headline.text).toContain('쫀득한 김치');
  });

  it('창의 재료 + 낮은 점수는 "창의적이지만 실패한 김치"', () => {
    const input = withExtra(classic(), 'mint-choco');
    input.seasoning.gochugaru = 0;
    input.mixCoverage = 60;
    Object.keys(input.prep).forEach((id) => (input.prep[id] = { ...input.prep[id], score: 50 }));
    const r = evaluate(input);
    expect(r.total).toBeLessThan(60);
    expect(r.resultType).toBe('창의적이지만 실패한 김치');
  });

  it('고춧가루가 없으면 백김치(?)', () => {
    const input = classic();
    input.selected = input.selected.filter((id) => !['gochugaru', 'garlic', 'ginger', 'green-onion'].includes(id));
    const r = evaluate(input);
    expect(r.resultType).toBe('백김치(?)');
  });

  it('창의 재료 1개를 잘 다루면 "의외의 명작 김치"', () => {
    const r = evaluate(withExtra(classic(), 'pineapple'));
    expect(r.total).toBeGreaterThanOrEqual(75);
    expect(r.resultType).toBe('의외의 명작 김치');
  });

  it('보조 문구는 최대 2개', () => {
    const input = withExtra(withExtra(classic(), 'watermelon'), 'dubai-cookie');
    input.mixCoverage = 60;
    expect(evaluate(input).extras.length).toBeLessThanOrEqual(2);
  });

  it('맞는 규칙이 없으면 기본 문구를 보여 준다 (명세 5-5)', () => {
    const r = evaluate(classic(), []);
    expect(r.headline).toEqual(DEFAULT_FEEDBACK);
    expect(r.resultType).toBe('성공적인 김치');
  });

  it('어떤 재료 조합이든 평가가 멈추지 않는다', () => {
    // 재료 하나만 / 모든 창의 재료 / 양념 최대치 조합을 훑는다
    const all = INGREDIENTS.map((i) => i.id);
    const cases: KimchiInput[] = [
      { selected: ['radish', 'salt'], prep: { radish: { score: 0 } }, seasoning: { salt: 1 }, mixCoverage: 60 },
      { selected: all, prep: {}, seasoning: Object.fromEntries(all.map((id) => [id, 5])), mixCoverage: 100 },
      { selected: [], prep: {}, seasoning: {}, mixCoverage: 0 },
    ];
    for (const c of cases) {
      const r = evaluate(c);
      expect(r.headline.text.length).toBeGreaterThan(0);
      expect(Number.isFinite(r.total)).toBe(true);
    }
  });
});
