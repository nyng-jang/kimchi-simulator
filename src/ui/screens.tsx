import { useState } from 'react';
import { CATEGORY_LABEL, INGREDIENTS, INGREDIENT_BY_ID, MAX_SELECTED } from '../data/ingredients';
import { computeTaste } from '../game/evaluate';
import {
  MIX_MIN_COVERAGE,
  PREP_TARGET_HITS,
  prepScoreFromBrine,
  prepScoreFromHits,
  prepTargets,
  seasoningIds,
  seasoningWarnings,
} from '../game/rules';
import { gameStore, useGame } from '../game/store';
import type { Category, PrepAction } from '../game/types';

const INTRO_LINES = [
  '해외에 온 지 벌써 3년째.',
  '마트에서 파는 김치는 너무 비싸고, 맛도 뭔가 다르다.',
  '엄마가 담가 주던 그 김치가 너무 먹고 싶어...',
  '좋아, 올해는 내가 직접 김장을 해 보자!',
];

export function IntroScreen() {
  const [line, setLine] = useState(0);
  const done = useGame((s) => s.introDone);
  const advance = () => {
    if (line < INTRO_LINES.length - 1) setLine(line + 1);
    else gameStore.getState().finishIntro();
  };
  return (
    <section className="screen">
      <div className="dialogue">
        {INTRO_LINES.slice(0, line + 1).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
      {!done && (
        <div className="row">
          <button onClick={advance}>계속 ▸</button>
          <button className="ghost" onClick={() => gameStore.getState().finishIntro()}>
            건너뛰기
          </button>
        </div>
      )}
    </section>
  );
}

const CATEGORIES: Category[] = ['main', 'seasoning', 'sub', 'creative'];

export function SelectScreen() {
  const selected = useGame((s) => s.selected);
  return (
    <section className="screen">
      <p className="hint">
        재료를 골라 장바구니에 담으세요. ({selected.length}/{MAX_SELECTED})
      </p>
      {CATEGORIES.map((cat) => (
        <div key={cat} className={`group ${cat === 'creative' ? 'creative' : ''}`}>
          <h3>{CATEGORY_LABEL[cat]}</h3>
          <div className="cards">
            {INGREDIENTS.filter((i) => i.category === cat).map((i) => {
              const on = selected.includes(i.id);
              return (
                <button
                  key={i.id}
                  className={`card ${on ? 'on' : ''}`}
                  onClick={() => gameStore.getState().toggleIngredient(i.id)}
                >
                  <strong>{i.name}</strong>
                  <small>{i.blurb}</small>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

const ACTION_LABEL: Record<PrepAction, string> = {
  halve: '반으로 가르기',
  slice: '썰기',
  mince: '다지기',
  salt: '소금 뿌리기',
  none: '',
};

function PrepItem({ id }: { id: string }) {
  const ing = INGREDIENT_BY_ID[id];
  const result = useGame((s) => s.prep[id]);
  const [hits, setHits] = useState(0);
  const [brine, setBrine] = useState(0);

  if (result) {
    return (
      <li className="prep done">
        <strong>{ing.name}</strong> 손질 완료 · {result.score}점
        {result.brine !== undefined && ` (절임 ${result.brine})`}
      </li>
    );
  }

  if (ing.prep === 'salt') {
    return (
      <li className="prep">
        <strong>{ing.name}</strong> 소금 뿌리기: {brine}
        <div className="meter">
          <span style={{ width: `${brine}%` }} />
          <i style={{ left: '40%', width: '20%' }} />
        </div>
        <div className="row">
          <button onClick={() => setBrine(Math.min(100, brine + 10))}>소금 뿌리기 (+10)</button>
          <button
            className="ghost"
            onClick={() => gameStore.getState().setPrep(id, { score: prepScoreFromBrine(brine), brine })}
          >
            절이기 끝
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="prep">
      <strong>{ing.name}</strong> {ACTION_LABEL[ing.prep]}: {hits}번 (목표 {PREP_TARGET_HITS}번)
      <div className="row">
        <button onClick={() => setHits(hits + 1)}>{ACTION_LABEL[ing.prep]}</button>
        <button
          className="ghost"
          disabled={hits === 0}
          onClick={() => gameStore.getState().setPrep(id, { score: prepScoreFromHits(hits) })}
        >
          손질 끝
        </button>
      </div>
    </li>
  );
}

export function PrepScreen() {
  const selected = useGame((s) => s.selected);
  const targets = prepTargets(selected);
  return (
    <section className="screen">
      <p className="hint">고른 재료를 손질하세요. 배추는 소금을 적당히(초록 구간) 뿌려야 해요.</p>
      <ul className="list">
        {targets.map((id) => (
          <PrepItem key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}

function TasteBar({ label, value, lo, hi }: { label: string; value: number; lo?: number; hi?: number }) {
  return (
    <div className="taste">
      <span>{label}</span>
      <div className="meter">
        <span style={{ width: `${value * 10}%` }} />
        {lo !== undefined && hi !== undefined && <i style={{ left: `${lo * 10}%`, width: `${(hi - lo) * 10}%` }} />}
      </div>
    </div>
  );
}

export function SeasonScreen() {
  const selected = useGame((s) => s.selected);
  const prep = useGame((s) => s.prep);
  const seasoning = useGame((s) => s.seasoning);
  const mixCoverage = useGame((s) => s.mixCoverage);
  const input = { selected, prep, seasoning, mixCoverage };
  const taste = computeTaste(input);
  const warnings = seasoningWarnings(input);
  return (
    <section className="screen">
      <p className="hint">볼에 양념을 숟가락으로 넣으세요.</p>
      <ul className="list">
        {seasoningIds(selected).map((id) => {
          const ing = INGREDIENT_BY_ID[id];
          const v = seasoning[id] ?? 0;
          return (
            <li key={id} className="season">
              <strong>{ing.name}</strong>
              <button onClick={() => gameStore.getState().setSeasoning(id, v - 1)}>−</button>
              <span className="spoons">{'🥄'.repeat(v) || '0'}</span>
              <button onClick={() => gameStore.getState().setSeasoning(id, v + 1)}>+</button>
            </li>
          );
        })}
      </ul>
      <div className="tastes">
        <TasteBar label="짠맛" value={taste.salty} />
        <TasteBar label="매운맛" value={taste.spicy} />
        <TasteBar label="단맛" value={taste.sweet} />
        <TasteBar label="감칠맛" value={taste.umami} />
      </div>
      {warnings.map((w) => (
        <p key={w} className="warn">
          ⚠ {w}
        </p>
      ))}
    </section>
  );
}

export function MixScreen() {
  const coverage = useGame((s) => s.mixCoverage);
  return (
    <section className="screen">
      <p className="hint">대야에서 양념이 배추에 골고루 묻도록 버무리세요. ({MIX_MIN_COVERAGE}% 이상이면 완성 가능)</p>
      <div className="meter big">
        <span style={{ width: `${coverage}%` }} />
      </div>
      <p>{Math.floor(coverage)}% 묻음</p>
      <button onClick={() => gameStore.getState().mixStep()}>조물조물 버무리기</button>
    </section>
  );
}

const REACTION_FACE = { happy: '😋', cough: '🤢', confused: '🤔', shock: '😱' } as const;

export function ResultScreen() {
  const r = useGame((s) => s.result);
  const selected = useGame((s) => s.selected);
  if (!r) return null;
  return (
    <section className="screen result">
      <div className="face">{REACTION_FACE[r.headline.reaction]}</div>
      <h2>
        {r.grade}등급 · {r.resultType}
      </h2>
      <p className="headline">“{r.headline.text}”</p>
      {r.extras.map((t) => (
        <p key={t} className="extra">
          {t}
        </p>
      ))}
      <p className="score">
        총점 {r.total} = 맛 {r.breakdown.balance} + 손질 {r.breakdown.prep} + 버무리기 {r.breakdown.mix} + 조합{' '}
        {r.breakdown.combo}
      </p>
      <p className="small">
        재료: {selected.map((id) => INGREDIENT_BY_ID[id].name).join(', ')} · 맛(짠/매/단/감칠/괴식) {r.taste.salty}/
        {r.taste.spicy}/{r.taste.sweet}/{r.taste.umami}/{r.taste.weird}
      </p>
      <button onClick={() => gameStore.getState().retry()}>다시 담그기</button>
    </section>
  );
}
