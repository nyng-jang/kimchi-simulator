import type { FeedbackRule, Grade } from '../game/types';

/**
 * 평가 문구 규칙. 조건이 맞는 규칙 중 priority가 높은 순으로
 * 대표 문구 1개 + 보조 문구 최대 2개를 고른다.
 * MVP 목표는 40개 이상이며, M2에서 계속 늘린다.
 */
export const FEEDBACK_RULES: FeedbackRule[] = [
  // 맛이 크게 어긋난 경우 (가장 먼저 보여 줄 원인)
  { id: 'too-salty', priority: 100, when: { kind: 'taste', taste: 'salty', gt: 8 }, text: '켁켁, 너무 짜! 바닷물을 통째로 마신 것 같아.', reaction: 'cough', resultType: '너무 짠 김치' },
  { id: 'too-spicy', priority: 95, when: { kind: 'taste', taste: 'spicy', gt: 9 }, text: '혀가 불타고 있어! 물, 물 좀 줘!', reaction: 'shock', resultType: '불닭 김치' },
  { id: 'too-sweet', priority: 92, when: { kind: 'all', of: [{ kind: 'taste', taste: 'sweet', gt: 7 }, { kind: 'taste', taste: 'weird', lt: 3 }] }, text: '이건 김치야, 디저트야?', reaction: 'confused', resultType: '디저트 김치' },

  // 창의 재료
  { id: 'watermelon', priority: 90, when: { kind: 'has', id: 'watermelon' }, text: '재료가 이상해! 김치에서 여름 맛이 나.', reaction: 'confused' },
  { id: 'dubai-cookie', priority: 90, when: { kind: 'has', id: 'dubai-cookie' }, text: '쫀득한 김치는 처음이야... 피스타치오 향이 나.', reaction: 'confused' },
  { id: 'mint-choco', priority: 90, when: { kind: 'has', id: 'mint-choco' }, text: '치약... 아니 김치 맞지? 민초단은 좋아할지도.', reaction: 'shock' },
  { id: 'pineapple', priority: 88, when: { kind: 'has', id: 'pineapple' }, text: '파인애플 김치라니, 하와이안 김장이네.', reaction: 'confused' },
  { id: 'creative-fail', priority: 85, when: { kind: 'all', of: [{ kind: 'taste', taste: 'weird', gt: 2.9 }, { kind: 'score', lt: 60 }] }, text: '도전 정신은 S등급, 맛은 F등급.', reaction: 'shock', resultType: '창의적이지만 실패한 김치' },
  { id: 'creative-win', priority: 85, when: { kind: 'all', of: [{ kind: 'taste', taste: 'weird', gt: 2.9 }, { kind: 'score', gte: 75 }] }, text: '어라? 이거 의외로 맛있는데?', reaction: 'happy', resultType: '의외의 명작 김치' },
  { id: 'creative-chaos', priority: 84, when: { kind: 'taste', taste: 'weird', gt: 9 }, text: '이건 김치가 아니라 실험이야.', reaction: 'shock', resultType: '실험 김치' },

  // 빠졌거나 모자란 것
  { id: 'no-spicy', priority: 70, when: { kind: 'taste', taste: 'spicy', lt: 0.5 }, text: '고춧가루는 어디 갔어? 이건 그냥 절인 배추야.', reaction: 'confused', resultType: '백김치(?)' },
  { id: 'bland', priority: 68, when: { kind: 'taste', taste: 'salty', lt: 2 }, text: '싱거워... 간을 하나도 안 했네?', reaction: 'confused' },
  { id: 'no-umami', priority: 62, when: { kind: 'taste', taste: 'umami', lt: 1.5 }, text: '뭔가 2% 부족해. 액젓이나 마늘을 넣어 볼까?', reaction: 'confused' },
  { id: 'patchy-mix', priority: 60, when: { kind: 'mix', lt: 75 }, text: '어떤 잎은 빨갛고 어떤 잎은 하얗고...', reaction: 'confused', resultType: '얼룩덜룩 김치' },
  { id: 'bad-prep', priority: 58, when: { kind: 'prep', lt: 50 }, text: '재료 손질이 좀... 큼직하네.', reaction: 'confused' },

  // 조금 어긋난 맛 (보조 문구용)
  { id: 'bit-salty', priority: 40, when: { kind: 'all', of: [{ kind: 'taste', taste: 'salty', gt: 6 }, { kind: 'taste', taste: 'salty', lt: 8.01 }] }, text: '살짝 짜긴 한데 밥이랑 먹으면 괜찮아.', reaction: 'happy' },
  { id: 'bit-spicy', priority: 38, when: { kind: 'all', of: [{ kind: 'taste', taste: 'spicy', gt: 7 }, { kind: 'taste', taste: 'spicy', lt: 9.01 }] }, text: '맵다! 그래도 손이 계속 가.', reaction: 'happy' },
  { id: 'bit-sweet', priority: 36, when: { kind: 'all', of: [{ kind: 'taste', taste: 'sweet', gt: 3 }, { kind: 'taste', taste: 'sweet', lt: 7.01 }] }, text: '달큰한 게 요즘 스타일이네.', reaction: 'happy' },
  { id: 'umami-bomb', priority: 34, when: { kind: 'taste', taste: 'umami', gt: 7 }, text: '감칠맛 폭탄! 액젓 냄새가 집 안에 가득해.', reaction: 'happy' },

  // 등급별 기본 문구
  { id: 'grade-s', priority: 10, when: { kind: 'grade', grade: 'S' }, text: '할머니 김치 맛이 나! 해외에서 이 맛을 내다니.', reaction: 'happy', resultType: '성공적인 김치' },
  { id: 'grade-a', priority: 10, when: { kind: 'grade', grade: 'A' }, text: '맛있다! 이웃집에도 나눠 줘야겠어.', reaction: 'happy', resultType: '맛있는 김치' },
  { id: 'grade-b', priority: 10, when: { kind: 'grade', grade: 'B' }, text: '나쁘지 않아. 익으면 더 맛있어질 거야.', reaction: 'happy', resultType: '무난한 김치' },
  { id: 'grade-c', priority: 10, when: { kind: 'grade', grade: 'C' }, text: '음... 김치찌개로 끓이면 괜찮을지도.', reaction: 'confused', resultType: '어색한 김치' },
  { id: 'grade-f', priority: 10, when: { kind: 'grade', grade: 'F' }, text: '이걸... 먹으라고?', reaction: 'shock', resultType: '실패한 김치' },
];

/** 어떤 규칙도 맞지 않을 때의 마지막 안전망 (명세 5-5) */
export const DEFAULT_FEEDBACK = { text: '음... 뭔가 김치 같긴 해!', reaction: 'confused' as const };

export const GRADE_RESULT_TYPE: Record<Grade, string> = {
  S: '성공적인 김치',
  A: '맛있는 김치',
  B: '무난한 김치',
  C: '어색한 김치',
  F: '실패한 김치',
};
