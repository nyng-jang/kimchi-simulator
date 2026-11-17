import { INGREDIENT_BY_ID, MAX_SELECTED } from '../data/ingredients';
import { computeTaste } from './evaluate';
import type { KimchiInput, Stage } from './types';

/** 버무리기 완성 버튼이 켜지는 커버리지 */
export const MIX_MIN_COVERAGE = 60;

export interface RunSnapshot extends KimchiInput {
  stage: Stage;
  introDone: boolean;
}

/** 손질이 필요한 재료 목록 (prep !== 'none') */
export function prepTargets(selected: string[]): string[] {
  return selected.filter((id) => INGREDIENT_BY_ID[id] && INGREDIENT_BY_ID[id].prep !== 'none');
}

export function seasoningIds(selected: string[]): string[] {
  return selected.filter((id) => INGREDIENT_BY_ID[id]?.category === 'seasoning');
}

/**
 * 현재 단계에서 다음으로 넘어가기 전에 남은 할 일.
 * 빈 배열이면 진행 가능 (명세 1-3, 2-3, 3-2, 4-3).
 */
export function missingForStage(s: RunSnapshot): string[] {
  switch (s.stage) {
    case 'intro':
      return s.introDone ? [] : ['이야기를 끝까지 보세요.'];
    case 'select': {
      const out: string[] = [];
      const cats = s.selected.map((id) => INGREDIENT_BY_ID[id]?.category);
      if (!cats.includes('main')) out.push('주재료(배추 또는 무)를 하나 이상 고르세요.');
      if (!cats.includes('seasoning')) out.push('양념을 하나 이상 고르세요.');
      if (s.selected.length > MAX_SELECTED) out.push(`재료는 ${MAX_SELECTED}개까지만 담을 수 있어요.`);
      return out;
    }
    case 'prep':
      return prepTargets(s.selected)
        .filter((id) => !s.prep[id])
        .map((id) => `${INGREDIENT_BY_ID[id].name} 손질을 끝내세요.`);
    case 'season': {
      const total = seasoningIds(s.selected).reduce((sum, id) => sum + (s.seasoning[id] ?? 0), 0);
      return total > 0 ? [] : ['양념을 한 숟가락 이상 넣으세요.'];
    }
    case 'mix':
      return s.mixCoverage >= MIX_MIN_COVERAGE
        ? []
        : [`양념이 ${MIX_MIN_COVERAGE}% 이상 묻도록 더 버무리세요. (지금 ${Math.floor(s.mixCoverage)}%)`];
    case 'result':
      return [];
  }
}

/**
 * 양념 단계 경고. 진행을 막지는 않고 고칠 기회를 준다 (명세 3-4).
 * 너무 짠 김치도 하나의 결과라서 막지 않는다.
 */
export function seasoningWarnings(s: KimchiInput): string[] {
  const t = computeTaste(s);
  const out: string[] = [];
  if (t.salty > 8) out.push('소금이 너무 많은 것 같아요...');
  if (t.salty < 2) out.push('간이 너무 싱거울 것 같아요.');
  if (t.spicy < 0.5) out.push('고춧가루 없이 괜찮을까요?');
  if (t.sweet > 7) out.push('너무 달아질 것 같아요.');
  return out;
}

/**
 * 손질 결과 계산. M0 텍스트 화면용 단순 규칙이며, M1에서 미니게임으로 바뀐다.
 * - 절이기: 소금 뿌린 정도 40~60이 만점, 멀어질수록 감점
 * - 그 외: 목표 횟수(8번)에 가까울수록 만점
 */
export const PREP_TARGET_HITS = 8;

export function prepScoreFromHits(hits: number): number {
  return Math.max(0, Math.round(100 - Math.abs(hits - PREP_TARGET_HITS) * 15));
}

export function prepScoreFromBrine(brine: number): number {
  const off = brine < 40 ? 40 - brine : brine > 60 ? brine - 60 : 0;
  return Math.max(0, Math.round(100 - off * 2));
}
