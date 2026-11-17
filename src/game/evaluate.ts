import { CORE_REQUIREMENTS, INGREDIENT_BY_ID } from '../data/ingredients';
import { DEFAULT_FEEDBACK, FEEDBACK_RULES, GRADE_RESULT_TYPE } from '../data/feedback';
import type {
  Condition,
  Evaluation,
  FeedbackRule,
  Grade,
  KimchiInput,
  ScoreBreakdown,
  Taste,
  TasteKey,
} from './types';

/** 맛 목표 범위. weird는 점수에 쓰지 않고 피드백에만 쓴다. */
export const TASTE_TARGET: Record<Exclude<TasteKey, 'weird'>, [number, number]> = {
  salty: [4, 6],
  spicy: [3, 7],
  sweet: [1, 3],
  umami: [3, 7],
};

export const WEIGHTS = { balance: 40, prep: 25, mix: 20, combo: 15 } as const;

/** 괴식 정도(weird) 1당 맛 균형에서 빼는 점수. 창의 재료 1개는 잘 만들면 명작, 대충 만들면 실패가 되도록 */
export const WEIRD_PENALTY = 2;

/** 절임 정도(0~100)를 짠맛으로 바꾸는 비율. 50이면 짠맛 +2 */
const BRINE_TO_SALTY = 1 / 25;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/** 양념은 숟가락 수, 나머지 재료는 1개로 센다 */
export function amountOf(input: KimchiInput, id: string): number {
  const ing = INGREDIENT_BY_ID[id];
  if (!ing) return 0;
  return ing.category === 'seasoning' ? (input.seasoning[id] ?? 0) : 1;
}

export function computeTaste(input: KimchiInput): Taste {
  const t: Taste = { salty: 0, spicy: 0, sweet: 0, umami: 0, weird: 0 };
  for (const id of input.selected) {
    const ing = INGREDIENT_BY_ID[id];
    if (!ing) continue;
    const amount = amountOf(input, id);
    for (const [k, v] of Object.entries(ing.taste) as [TasteKey, number][]) {
      t[k] += v * amount;
    }
    const brine = input.prep[id]?.brine;
    if (ing.prep === 'salt' && brine !== undefined) t.salty += brine * BRINE_TO_SALTY;
  }
  (Object.keys(t) as TasteKey[]).forEach((k) => (t[k] = round1(clamp(t[k], 0, 10))));
  return t;
}

export function scoreBreakdown(input: KimchiInput, taste: Taste): ScoreBreakdown {
  let distance = 0;
  for (const [k, [lo, hi]] of Object.entries(TASTE_TARGET) as [keyof typeof TASTE_TARGET, [number, number]][]) {
    const v = taste[k];
    if (v < lo) distance += lo - v;
    else if (v > hi) distance += v - hi;
  }
  const balance = Math.max(0, WEIGHTS.balance - distance * 4 - taste.weird * WEIRD_PENALTY);

  const prepTargets = input.selected.filter((id) => INGREDIENT_BY_ID[id]?.prep !== 'none');
  const prepAvg = prepTargets.length
    ? prepTargets.reduce((s, id) => s + (input.prep[id]?.score ?? 0), 0) / prepTargets.length
    : 100;
  const prep = (prepAvg / 100) * WEIGHTS.prep;

  const mix = (clamp(input.mixCoverage, 0, 100) / 100) * WEIGHTS.mix;

  const has = (id: string) => input.selected.includes(id) && amountOf(input, id) > 0;
  const met = CORE_REQUIREMENTS.filter((req) => (Array.isArray(req) ? req.some(has) : has(req))).length;
  const combo = (met / CORE_REQUIREMENTS.length) * WEIGHTS.combo;

  return { balance: round1(balance), prep: round1(prep), mix: round1(mix), combo: round1(combo) };
}

export function gradeOf(total: number): Grade {
  if (total >= 90) return 'S';
  if (total >= 75) return 'A';
  if (total >= 60) return 'B';
  if (total >= 40) return 'C';
  return 'F';
}

interface Facts {
  input: KimchiInput;
  taste: Taste;
  total: number;
  grade: Grade;
  prepAvg: number;
}

export function matches(cond: Condition, f: Facts): boolean {
  switch (cond.kind) {
    case 'taste': {
      const v = f.taste[cond.taste];
      return (cond.gt === undefined || v > cond.gt) && (cond.lt === undefined || v < cond.lt);
    }
    case 'has':
      return f.input.selected.includes(cond.id);
    case 'grade':
      return f.grade === cond.grade;
    case 'score':
      return (cond.gte === undefined || f.total >= cond.gte) && (cond.lt === undefined || f.total < cond.lt);
    case 'mix':
      return f.input.mixCoverage < cond.lt;
    case 'prep':
      return f.prepAvg < cond.lt;
    case 'all':
      return cond.of.every((c) => matches(c, f));
  }
}

export function evaluate(input: KimchiInput, rules: FeedbackRule[] = FEEDBACK_RULES): Evaluation {
  const taste = computeTaste(input);
  const breakdown = scoreBreakdown(input, taste);
  const total = Math.round(breakdown.balance + breakdown.prep + breakdown.mix + breakdown.combo);
  const grade = gradeOf(total);
  const prepAvg = (breakdown.prep / WEIGHTS.prep) * 100;
  const facts: Facts = { input, taste, total, grade, prepAvg };

  const hits = rules
    .filter((r) => r.text && matches(r.when, facts))
    .sort((a, b) => b.priority - a.priority);

  const head = hits[0];
  const headline = head ? { text: head.text, reaction: head.reaction } : { ...DEFAULT_FEEDBACK };
  const extras = hits.slice(1, 3).map((r) => r.text);
  const resultType = hits.find((r) => r.resultType)?.resultType ?? GRADE_RESULT_TYPE[grade];

  return { taste, breakdown, total, grade, resultType, headline, extras };
}
