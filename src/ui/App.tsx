import { useGame, gameStore } from '../game/store';
import type { Stage } from '../game/types';
import { STAGE_ORDER } from '../game/types';
import { missingForStage } from '../game/rules';
import { IntroScreen, MixScreen, PrepScreen, ResultScreen, SeasonScreen, SelectScreen } from './screens';

const STAGE_LABEL: Record<Stage, string> = {
  intro: '인트로',
  select: '재료 선택',
  prep: '손질',
  season: '양념',
  mix: '버무리기',
  result: '평가',
};

const NEXT_LABEL: Partial<Record<Stage, string>> = {
  intro: '김장 시작!',
  select: '손질하러 가기',
  prep: '양념 만들기',
  season: '버무리러 가기',
  mix: '완성! 맛보기',
};

const SCREENS: Record<Stage, () => React.JSX.Element | null> = {
  intro: IntroScreen,
  select: SelectScreen,
  prep: PrepScreen,
  season: SeasonScreen,
  mix: MixScreen,
  result: ResultScreen,
};

export default function App() {
  const stage = useGame((s) => s.stage);
  // 남은 할 일은 상태 전체에서 계산되므로 스토어 전체를 구독한다
  const missing = useGame((s) => missingForStage(s).join('\n'));
  const Screen = SCREENS[stage];
  const nextLabel = NEXT_LABEL[stage];

  return (
    <main>
      <header>
        <h1>김장 시뮬레이터</h1>
        <ol className="stages">
          {STAGE_ORDER.map((s) => (
            <li key={s} className={s === stage ? 'now' : ''}>
              {STAGE_LABEL[s]}
            </li>
          ))}
        </ol>
      </header>
      <Screen />
      {nextLabel && (
        <footer>
          {missing && (
            <ul className="missing">
              {missing.split('\n').map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <button className="primary" disabled={!!missing} onClick={() => gameStore.getState().next()}>
            {nextLabel} ▸
          </button>
        </footer>
      )}
    </main>
  );
}
