# 김장 시뮬레이터

해외에서 김치가 그리운 주인공이 배추부터 수박, 두쫀쿠까지 골라 김장을 해 보는 웹 캐주얼 시뮬레이션 게임.

- 화면: 고정 시점 로우폴리 3D (React Three Fiber)
- 대상: PC 데스크톱 브라우저, 한국어

## 개발

```bash
npm install
npm run dev     # 개발 서버
npm test        # 평가 엔진·단계 진행 테스트
npm run build   # 타입 검사 + 빌드
```

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/data/ingredients.ts` | 재료 14종과 맛 수치 |
| `src/data/feedback.ts` | 평가 문구 규칙 (우선순위 순으로 선택) |
| `src/game/evaluate.ts` | 맛 계산, 점수, 등급, 피드백 선택 (화면과 무관한 순수 함수) |
| `src/game/rules.ts` | 단계별 진행 조건, 양념 경고, 손질 점수 |
| `src/game/store.ts` | 한 판의 상태와 단계 전환 (Zustand) |
| `src/ui/` | 화면. 지금은 M0 텍스트 화면이며 M1에서 3D 장면으로 바뀐다 |

재료나 문구를 추가할 때는 `src/data/`의 배열에 한 줄을 더하면 된다.
