import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { INGREDIENT_BY_ID, MAX_SELECTED } from '../data/ingredients';
import { evaluate } from './evaluate';
import { missingForStage, seasoningIds } from './rules';
import type { Evaluation, PrepResult, Stage } from './types';
import { STAGE_ORDER } from './types';

export interface GameState {
  stage: Stage;
  introDone: boolean;
  selected: string[];
  prep: Record<string, PrepResult>;
  seasoning: Record<string, number>;
  mixCoverage: number;
  result: Evaluation | null;

  finishIntro(): void;
  toggleIngredient(id: string): void;
  setPrep(id: string, result: PrepResult): void;
  setSeasoning(id: string, amount: number): void;
  mixStep(amount?: number): void;
  missing(): string[];
  next(): boolean;
  /** 결과 화면에서 재도전: 인트로는 건너뛰고 재료 선택부터 */
  retry(): void;
}

const freshRun = {
  selected: [] as string[],
  prep: {} as Record<string, PrepResult>,
  seasoning: {} as Record<string, number>,
  mixCoverage: 0,
  result: null as Evaluation | null,
};

export const createGameStore = () =>
  createStore<GameState>()((set, get) => ({
    stage: 'intro',
    introDone: false,
    ...freshRun,

    finishIntro: () => set({ introDone: true }),

    toggleIngredient: (id) => {
      if (get().stage !== 'select' || !INGREDIENT_BY_ID[id]) return;
      const { selected } = get();
      if (selected.includes(id)) set({ selected: selected.filter((x) => x !== id) });
      else if (selected.length < MAX_SELECTED) set({ selected: [...selected, id] });
    },

    setPrep: (id, result) => {
      if (get().stage !== 'prep') return;
      set({ prep: { ...get().prep, [id]: result } });
    },

    setSeasoning: (id, amount) => {
      const ing = INGREDIENT_BY_ID[id];
      if (get().stage !== 'season' || !ing || ing.category !== 'seasoning') return;
      const v = Math.max(0, Math.min(ing.maxAmount ?? 5, Math.round(amount)));
      set({ seasoning: { ...get().seasoning, [id]: v } });
    },

    mixStep: (amount = 8) => {
      if (get().stage !== 'mix') return;
      set({ mixCoverage: Math.min(100, get().mixCoverage + amount) });
    },

    missing: () => missingForStage(get()),

    next: () => {
      const s = get();
      if (missingForStage(s).length > 0) return false;
      const idx = STAGE_ORDER.indexOf(s.stage);
      const to = STAGE_ORDER[idx + 1];
      if (!to) return false;

      if (to === 'prep') {
        // 선택에서 빠진 재료의 이전 기록은 지운다 (재도전 대비)
        const keep = (rec: Record<string, unknown>) =>
          Object.fromEntries(Object.entries(rec).filter(([id]) => s.selected.includes(id)));
        set({ prep: keep(s.prep) as GameState['prep'], seasoning: keep(s.seasoning) as GameState['seasoning'] });
      }
      if (to === 'season') {
        const seasoning = { ...get().seasoning };
        for (const id of seasoningIds(s.selected)) seasoning[id] ??= 0;
        set({ seasoning });
      }
      if (to === 'result') {
        const { selected, prep, seasoning, mixCoverage } = get();
        set({ result: evaluate({ selected, prep, seasoning, mixCoverage }) });
      }
      set({ stage: to });
      return true;
    },

    retry: () => set({ stage: 'select', ...freshRun }),
  }));

export const gameStore = createGameStore();

export function useGame<T>(selector: (s: GameState) => T): T {
  return useStore(gameStore, selector);
}
