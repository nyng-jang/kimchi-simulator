export type Stage = 'intro' | 'select' | 'prep' | 'season' | 'mix' | 'result';

export const STAGE_ORDER: Stage[] = ['intro', 'select', 'prep', 'season', 'mix', 'result'];

export type Category = 'main' | 'seasoning' | 'sub' | 'creative';

/** 손질 미니게임 템플릿. 'none'이면 손질 단계에서 건너뛴다. */
export type PrepAction = 'halve' | 'slice' | 'mince' | 'salt' | 'none';

export type TasteKey = 'salty' | 'spicy' | 'sweet' | 'umami' | 'weird';
export type Taste = Record<TasteKey, number>;

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  prep: PrepAction;
  /** 1단위(양념은 숟가락 1개, 나머지는 재료 1개)당 맛 기여치 */
  taste: Partial<Taste>;
  /** 양념만 사용. 숟가락 최대 개수 */
  maxAmount?: number;
  /** 카드에 보이는 한 줄 설명 */
  blurb: string;
}

export interface PrepResult {
  /** 손질 품질 0~100 */
  score: number;
  /** 절이기('salt') 재료만: 소금 뿌린 정도 0~100, 적정 40~60 */
  brine?: number;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'F';

export type Reaction = 'happy' | 'cough' | 'confused' | 'shock';

export type Condition =
  | { kind: 'taste'; taste: TasteKey; gt?: number; lt?: number }
  | { kind: 'has'; id: string }
  | { kind: 'grade'; grade: Grade }
  | { kind: 'score'; gte?: number; lt?: number }
  | { kind: 'mix'; lt: number }
  | { kind: 'prep'; lt: number }
  | { kind: 'all'; of: Condition[] };

export interface FeedbackRule {
  id: string;
  /** 높을수록 먼저 고른다 */
  priority: number;
  when: Condition;
  text: string;
  reaction: Reaction;
  /** 이 규칙이 대표 문구가 되면 결과 유형 이름도 이걸로 바뀐다 */
  resultType?: string;
}

/** 평가 엔진의 입력: 한 판에서 플레이어가 만든 것 */
export interface KimchiInput {
  selected: string[];
  prep: Record<string, PrepResult>;
  seasoning: Record<string, number>;
  mixCoverage: number;
}

export interface ScoreBreakdown {
  balance: number;
  prep: number;
  mix: number;
  combo: number;
}

export interface Evaluation {
  taste: Taste;
  breakdown: ScoreBreakdown;
  total: number;
  grade: Grade;
  resultType: string;
  headline: { text: string; reaction: Reaction };
  extras: string[];
}
