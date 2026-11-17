import type { Ingredient } from '../game/types';

/**
 * MVP 재료 14종. 맛 수치는 플레이 테스트 전 초깃값이다.
 * 기준 레시피(배추, 고춧가루 3, 소금 2, 마늘 2, 생강 1, 액젓 2, 설탕 1, 쪽파, 절임 50)가
 * 모든 맛 목표 범위 안에 들어오도록 맞춰 두었다.
 */
export const INGREDIENTS: Ingredient[] = [
  // 주재료
  { id: 'cabbage', name: '배추', category: 'main', prep: 'salt', taste: { sweet: 0.6, umami: 0.2 }, blurb: '김장의 주인공. 소금에 절여야 한다.' },
  { id: 'radish', name: '무', category: 'main', prep: 'slice', taste: { sweet: 0.6 }, blurb: '채 썰어 소에 넣으면 시원한 맛.' },

  // 양념
  { id: 'gochugaru', name: '고춧가루', category: 'seasoning', prep: 'none', maxAmount: 5, taste: { spicy: 1.5, sweet: 0.1 }, blurb: '빨간 맛의 핵심.' },
  { id: 'salt', name: '소금', category: 'seasoning', prep: 'none', maxAmount: 5, taste: { salty: 1.2 }, blurb: '많이 넣으면... 알지?' },
  { id: 'garlic', name: '마늘', category: 'seasoning', prep: 'mince', maxAmount: 5, taste: { umami: 0.6, spicy: 0.4 }, blurb: '한국인의 소울. 곱게 다져야 한다.' },
  { id: 'ginger', name: '생강', category: 'seasoning', prep: 'mince', maxAmount: 5, taste: { spicy: 0.3, umami: 0.2 }, blurb: '조금만 넣어도 향이 확.' },
  { id: 'fish-sauce', name: '멸치액젓', category: 'seasoning', prep: 'none', maxAmount: 5, taste: { salty: 0.6, umami: 1.2 }, blurb: '감칠맛 담당. 냄새는 참자.' },
  { id: 'sugar', name: '설탕', category: 'seasoning', prep: 'none', maxAmount: 5, taste: { sweet: 1.0 }, blurb: '한 숟갈이면 충분하다.' },

  // 부재료
  { id: 'green-onion', name: '쪽파', category: 'sub', prep: 'slice', taste: { umami: 0.4, spicy: 0.2 }, blurb: '송송 썰어 넣는다.' },
  { id: 'mustard-greens', name: '갓', category: 'sub', prep: 'slice', taste: { spicy: 0.5, umami: 0.3 }, blurb: '알싸한 향이 나는 잎채소.' },

  // 창의 재료
  { id: 'watermelon', name: '수박', category: 'creative', prep: 'halve', taste: { sweet: 2.5, weird: 4 }, blurb: '여름의 맛을 김치에?' },
  { id: 'dubai-cookie', name: '두쫀쿠', category: 'creative', prep: 'mince', taste: { sweet: 3, weird: 5 }, blurb: '두바이 쫀득 쿠키. 피스타치오 향이 난다.' },
  { id: 'mint-choco', name: '민트초코', category: 'creative', prep: 'mince', taste: { sweet: 2, weird: 5 }, blurb: '호불호의 끝판왕.' },
  { id: 'pineapple', name: '파인애플', category: 'creative', prep: 'slice', taste: { sweet: 2, weird: 3 }, blurb: '피자에도 넣는데 김치라고 못 넣을까.' },
];

export const INGREDIENT_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

export const MAX_SELECTED = 8;

/** 기본 조합 점수에 쓰는 핵심 4요소. 배열 안의 배열은 "그중 하나"라는 뜻. */
export const CORE_REQUIREMENTS: (string | string[])[] = [['cabbage', 'radish'], 'gochugaru', 'salt', 'garlic'];

export const CATEGORY_LABEL: Record<Ingredient['category'], string> = {
  main: '주재료',
  seasoning: '양념',
  sub: '부재료',
  creative: '창의 재료',
};
