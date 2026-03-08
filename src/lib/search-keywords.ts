// ============================================
// 포즈별 최적화된 Pexels 검색 키워드 매핑
// 단순 키워드 대신 레퍼런스에 적합한 복합 쿼리 생성
// 아티스트용 실사 레퍼런스 검색 품질 향상을 위한 핵심 모듈
// ============================================

/** Pexels 검색 쿼리 + 자동 태그 메타데이터 */
export interface SearchQuery {
  /** Pexels API 검색어 (영문 복합 쿼리) */
  query: string;
  /** 예상 샷 타입 태그 (풀샷/미디엄샷/클로즈업/바스트샷) */
  shotType: string;
  /** 자동 부여할 한글 포즈/특성 태그 */
  poseTags: string[];
}

// ============================================
// 포즈 카테고리별 검색 쿼리 목록
// 총 56개 쿼리 — 스튜디오/클린 배경/선명한 포즈 중심
// ============================================
export const POSE_SEARCH_QUERIES: Record<string, SearchQuery[]> = {
  // --- 서있기 (10개) ---
  standing: [
    { query: 'person standing full body studio', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'model standing pose white background', shotType: '풀샷', poseTags: ['서있기', '1인', '스튜디오'] },
    { query: 'portrait standing casual outdoor', shotType: '미디엄샷', poseTags: ['서있기', '1인', '캐주얼'] },
    { query: 'man standing full body studio lighting', shotType: '풀샷', poseTags: ['서있기', '1인', '남성'] },
    { query: 'woman standing elegant dress studio', shotType: '풀샷', poseTags: ['서있기', '1인', '여성', '드레스'] },
    { query: 'person standing side view profile', shotType: '풀샷', poseTags: ['서있기', '1인', '3/4뷰'] },
    { query: 'model standing arms crossed studio', shotType: '미디엄샷', poseTags: ['서있기', '1인'] },
    { query: 'person standing back view studio', shotType: '풀샷', poseTags: ['서있기', '1인', '뒤돌아보기'] },
    { query: 'business person standing suit portrait', shotType: '미디엄샷', poseTags: ['서있기', '1인', '수트'] },
    { query: 'athlete standing confident pose', shotType: '풀샷', poseTags: ['서있기', '1인', '스포츠웨어'] },
  ],

  // --- 앉기 (8개) ---
  sitting: [
    { query: 'person sitting chair studio photography', shotType: '미디엄샷', poseTags: ['앉기', '1인'] },
    { query: 'seated portrait professional studio', shotType: '바스트샷', poseTags: ['앉기', '1인'] },
    { query: 'woman sitting floor studio white', shotType: '풀샷', poseTags: ['앉기', '1인', '여성'] },
    { query: 'man sitting bench outdoor natural', shotType: '미디엄샷', poseTags: ['앉기', '1인', '남성', '자연광'] },
    { query: 'person sitting cross legged meditation', shotType: '풀샷', poseTags: ['앉기', '1인'] },
    { query: 'model seated elegant pose', shotType: '미디엄샷', poseTags: ['앉기', '1인'] },
    { query: 'person sitting stairs urban', shotType: '풀샷', poseTags: ['앉기', '1인', '도시'] },
    { query: 'seated portrait side lighting dramatic', shotType: '바스트샷', poseTags: ['앉기', '1인', '측광', '드라마틱'] },
  ],

  // --- 액션/동작 (10개) ---
  action: [
    { query: 'dancer jumping full body studio', shotType: '풀샷', poseTags: ['점프', '1인'] },
    { query: 'athlete running side view outdoor', shotType: '풀샷', poseTags: ['달리기', '1인'] },
    { query: 'martial arts kick studio lighting', shotType: '풀샷', poseTags: ['격투', '1인'] },
    { query: 'ballet dancer pose studio', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'person jumping midair white background', shotType: '풀샷', poseTags: ['점프', '1인', '스튜디오'] },
    { query: 'boxer fighting stance studio', shotType: '풀샷', poseTags: ['격투', '1인', '남성'] },
    { query: 'sprinter running track action', shotType: '풀샷', poseTags: ['달리기', '1인', '스포츠웨어'] },
    { query: 'yoga warrior pose studio', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'gymnast acrobatic pose', shotType: '풀샷', poseTags: ['점프', '1인'] },
    { query: 'person walking street fashion', shotType: '풀샷', poseTags: ['걷기', '1인', '캐주얼'] },
  ],

  // --- 포트레이트/얼굴 (8개) ---
  portrait: [
    { query: 'face portrait close up studio lighting', shotType: '클로즈업', poseTags: ['1인', '얼굴'] },
    { query: 'upper body portrait natural light', shotType: '바스트샷', poseTags: ['1인', '자연광'] },
    { query: 'dramatic portrait side lighting', shotType: '클로즈업', poseTags: ['1인', '측광', '드라마틱'] },
    { query: 'portrait headshot professional studio', shotType: '클로즈업', poseTags: ['1인', '스튜디오'] },
    { query: 'profile portrait silhouette', shotType: '클로즈업', poseTags: ['1인', '3/4뷰'] },
    { query: 'emotional portrait close up tears', shotType: '클로즈업', poseTags: ['1인', '슬픔'] },
    { query: 'laughing portrait natural candid', shotType: '바스트샷', poseTags: ['1인', '웃음'] },
    { query: 'portrait golden hour warm light', shotType: '바스트샷', poseTags: ['1인', '골든아워'] },
  ],

  // --- 그룹/2인 이상 (6개) ---
  group: [
    { query: 'two people standing conversation studio', shotType: '풀샷', poseTags: ['서있기', '2인'] },
    { query: 'couple walking together outdoor', shotType: '풀샷', poseTags: ['걷기', '2인'] },
    { query: 'two dancers pose studio', shotType: '풀샷', poseTags: ['2인'] },
    { query: 'friends group photo casual', shotType: '풀샷', poseTags: ['군중', '캐주얼'] },
    { query: 'couple hugging embrace portrait', shotType: '미디엄샷', poseTags: ['포옹', '2인'] },
    { query: 'two people fighting martial arts', shotType: '풀샷', poseTags: ['격투', '2인'] },
  ],

  // --- 감정 표현 (6개) ---
  emotional: [
    { query: 'person laughing genuine emotion portrait', shotType: '미디엄샷', poseTags: ['웃음', '1인'] },
    { query: 'sad person sitting alone moody', shotType: '미디엄샷', poseTags: ['앉기', '슬픔', '1인'] },
    { query: 'angry expression close up portrait', shotType: '클로즈업', poseTags: ['분노', '1인'] },
    { query: 'surprised face expression studio', shotType: '클로즈업', poseTags: ['놀람', '1인'] },
    { query: 'person crying emotional portrait', shotType: '클로즈업', poseTags: ['슬픔', '1인'] },
    { query: 'confident smile portrait studio', shotType: '바스트샷', poseTags: ['웃음', '1인'] },
  ],

  // --- 누워있기/바닥 (4개) ---
  lying: [
    { query: 'person lying down floor studio', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'model reclining pose studio', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'person lying grass outdoor natural', shotType: '풀샷', poseTags: ['누워있기', '1인', '야외'] },
    { query: 'reclining portrait dramatic lighting', shotType: '미디엄샷', poseTags: ['누워있기', '1인', '드라마틱'] },
  ],

  // --- 손/부위 클로즈업 (4개) ---
  hands: [
    { query: 'hand close up studio detail', shotType: '클로즈업', poseTags: ['손'] },
    { query: 'hands holding object close up', shotType: '클로즈업', poseTags: ['손', '물건쥐기'] },
    { query: 'fist close up dramatic lighting', shotType: '클로즈업', poseTags: ['주먹', '하드라이트'] },
    { query: 'open hand palm studio light', shotType: '클로즈업', poseTags: ['손', '소프트라이트'] },
  ],
};

// ============================================
// 한글 태그 → 영문 카테고리 키 매핑 (역방향 룩업)
// generateSearchQuery에서 입력 태그를 카테고리에 매핑
// ============================================
const TAG_TO_CATEGORY: Record<string, string> = {
  // 포즈 태그 → 카테고리
  '서있기': 'standing',
  '앉기': 'sitting',
  '걷기': 'action',
  '달리기': 'action',
  '점프': 'action',
  '누워있기': 'lying',
  '기대기': 'standing',
  '뒤돌아보기': 'standing',
  '무릎꿇기': 'action',
  '웅크리기': 'action',
  '격투': 'action',
  '포옹': 'group',

  // 부위/표정 → 카테고리
  '손': 'hands',
  '물건쥐기': 'hands',
  '주먹': 'hands',
  '얼굴': 'portrait',
  '웃음': 'emotional',
  '분노': 'emotional',
  '슬픔': 'emotional',
  '놀람': 'emotional',
  '무표정': 'portrait',

  // 인물 특성 → 카테고리
  '2인': 'group',
  '군중': 'group',
};

/**
 * 주어진 한글 태그 조합에서 최적의 Pexels 검색 쿼리 생성
 * 태그를 분석해 관련 카테고리의 쿼리를 우선 반환하고,
 * 매칭되는 카테고리가 없으면 기본 포트레이트+스탠딩 쿼리 반환
 *
 * @param tags - 한글 태그 배열 (예: ['서있기', '1인', '측광'])
 * @returns 관련성 높은 SearchQuery 배열 (최대 8개)
 */
export function generateSearchQuery(tags: string[]): SearchQuery[] {
  if (!tags || tags.length === 0) {
    // 태그가 없으면 기본 쿼리 반환 (서있기 + 포트레이트 혼합)
    return [
      ...POSE_SEARCH_QUERIES.standing.slice(0, 3),
      ...POSE_SEARCH_QUERIES.portrait.slice(0, 3),
      ...POSE_SEARCH_QUERIES.action.slice(0, 2),
    ];
  }

  // 태그에서 관련 카테고리 추출 (중복 제거)
  const matchedCategories = new Set<string>();
  for (const tag of tags) {
    const category = TAG_TO_CATEGORY[tag];
    if (category) {
      matchedCategories.add(category);
    }
  }

  // 매칭된 카테고리가 없으면 기본 standing + portrait 반환
  if (matchedCategories.size === 0) {
    return [
      ...POSE_SEARCH_QUERIES.standing.slice(0, 4),
      ...POSE_SEARCH_QUERIES.portrait.slice(0, 4),
    ];
  }

  // 매칭된 카테고리의 쿼리들을 수집 (카테고리당 최대 4개)
  const result: SearchQuery[] = [];
  for (const cat of matchedCategories) {
    const queries = POSE_SEARCH_QUERIES[cat];
    if (queries) {
      // 태그와 가장 많이 겹치는 쿼리를 우선 정렬
      const scored = queries.map((q) => {
        const overlap = q.poseTags.filter((pt) => tags.includes(pt)).length;
        return { query: q, score: overlap };
      });
      scored.sort((a, b) => b.score - a.score);

      // 카테고리당 최대 4개
      const maxPerCategory = Math.min(4, Math.ceil(8 / matchedCategories.size));
      result.push(...scored.slice(0, maxPerCategory).map((s) => s.query));
    }
  }

  // 최대 8개로 제한
  return result.slice(0, 8);
}

/**
 * 모든 카테고리에서 랜덤하게 쿼리를 샘플링 (초기 로딩용)
 * loadPexelsImages에서 QUICK_QUERIES 대신 사용
 *
 * @param count - 반환할 쿼리 수 (기본 8)
 * @returns 카테고리별 고르게 분포된 SearchQuery 배열
 */
export function getBalancedQueries(count = 8): SearchQuery[] {
  const allCategories = Object.keys(POSE_SEARCH_QUERIES);
  const result: SearchQuery[] = [];

  // 라운드 로빈으로 각 카테고리에서 하나씩 뽑기
  let categoryIndex = 0;
  const usedIndices: Record<string, number> = {};

  while (result.length < count) {
    const cat = allCategories[categoryIndex % allCategories.length];
    const queries = POSE_SEARCH_QUERIES[cat];
    const idx = usedIndices[cat] ?? 0;

    if (idx < queries.length) {
      result.push(queries[idx]);
      usedIndices[cat] = idx + 1;
    }

    categoryIndex++;

    // 모든 카테고리를 다 돌았으면 종료
    if (categoryIndex >= allCategories.length * 10) break;
  }

  return result.slice(0, count);
}
