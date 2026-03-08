// ============================================
// 크로키/제스처 드로잉용 Pexels 검색 키워드
// 전신 인물 사진 위주, 깔끔한 배경, 선명한 포즈
// 아티스트 실사 레퍼런스 전용
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
// 크로키 레퍼런스용 검색 쿼리
// "human figure" + "full body" + 배경 키워드로 전신 인물 확보
// ============================================
export const POSE_SEARCH_QUERIES: Record<string, SearchQuery[]> = {
  // --- 서있기 (12개) — 크로키 기본 포즈 ---
  // aesthetic 키워드: 인물/포즈/패션 쿼리에 추가하여 고퀄리티 이미지 확보
  standing: [
    { query: 'human figure standing full body plain background', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'model full body standing pose studio photography aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인', '스튜디오'] },
    { query: 'man standing full body white background photography', shotType: '풀샷', poseTags: ['서있기', '1인', '남성'] },
    { query: 'woman standing full body studio fashion photography aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인', '여성'] },
    { query: 'person standing side view full body profile', shotType: '풀샷', poseTags: ['서있기', '1인', '3/4뷰'] },
    { query: 'figure standing back view full body studio', shotType: '풀샷', poseTags: ['서있기', '1인', '뒤돌아보기'] },
    { query: 'model contrapposto pose full body studio aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'person standing arms akimbo full body', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'athletic man standing full body fitness', shotType: '풀샷', poseTags: ['서있기', '1인', '남성', '스포츠웨어'] },
    { query: 'dancer standing elegant pose full body aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'person leaning wall full body casual aesthetic', shotType: '풀샷', poseTags: ['기대기', '1인', '캐주얼'] },
    { query: 'model standing three quarter view studio aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인', '3/4뷰'] },
  ],

  // --- 앉기 (10개) ---
  // aesthetic 키워드: 모델/패션 느낌의 앉기 쿼리에 추가
  sitting: [
    { query: 'person sitting full body studio photography', shotType: '풀샷', poseTags: ['앉기', '1인'] },
    { query: 'woman sitting floor full body white background aesthetic', shotType: '풀샷', poseTags: ['앉기', '1인', '여성'] },
    { query: 'man sitting chair full body studio', shotType: '풀샷', poseTags: ['앉기', '1인', '남성'] },
    { query: 'person sitting cross legged full body studio', shotType: '풀샷', poseTags: ['앉기', '1인'] },
    { query: 'model seated pose full body photography aesthetic', shotType: '풀샷', poseTags: ['앉기', '1인'] },
    { query: 'person sitting stairs full body urban aesthetic', shotType: '풀샷', poseTags: ['앉기', '1인'] },
    { query: 'woman sitting elegantly full body studio aesthetic', shotType: '풀샷', poseTags: ['앉기', '1인', '여성'] },
    { query: 'person crouching squat full body studio', shotType: '풀샷', poseTags: ['웅크리기', '1인'] },
    { query: 'person kneeling full body studio pose', shotType: '풀샷', poseTags: ['무릎꿇기', '1인'] },
    { query: 'seated figure side view full body', shotType: '풀샷', poseTags: ['앉기', '1인', '3/4뷰'] },
  ],

  // --- 액션/동작 (12개) — 크로키 동세 포즈 ---
  // aesthetic 키워드: 댄서/패션워크 등 비주얼 중심 쿼리에 추가, 기술적 스포츠 쿼리는 제외
  action: [
    { query: 'dancer full body jumping studio white background aesthetic', shotType: '풀샷', poseTags: ['점프', '1인'] },
    { query: 'athlete running full body side view photography', shotType: '풀샷', poseTags: ['달리기', '1인'] },
    { query: 'ballet dancer full body pose studio aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'person jumping midair full body white background', shotType: '풀샷', poseTags: ['점프', '1인', '스튜디오'] },
    { query: 'martial arts fighter full body kick studio', shotType: '풀샷', poseTags: ['격투', '1인'] },
    { query: 'gymnast full body pose acrobatic studio', shotType: '풀샷', poseTags: ['점프', '1인'] },
    { query: 'yoga full body pose studio photography aesthetic', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'contemporary dancer movement full body aesthetic', shotType: '풀샷', poseTags: ['1인'] },
    { query: 'person stretching full body fitness studio', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'boxer fighting stance full body studio', shotType: '풀샷', poseTags: ['격투', '1인', '남성'] },
    { query: 'person walking full body fashion photography aesthetic', shotType: '풀샷', poseTags: ['걷기', '1인'] },
    { query: 'sprinter starting position full body', shotType: '풀샷', poseTags: ['달리기', '1인'] },
  ],

  // --- 포트레이트/상반신 (6개) ---
  // aesthetic 키워드: 포트레이트는 비주얼 퀄리티가 핵심이므로 대부분 추가
  portrait: [
    { query: 'upper body portrait studio lighting figure aesthetic', shotType: '바스트샷', poseTags: ['1인'] },
    { query: 'half body portrait natural light person aesthetic', shotType: '바스트샷', poseTags: ['1인', '자연광'] },
    { query: 'dramatic portrait figure side lighting aesthetic', shotType: '바스트샷', poseTags: ['1인', '측광', '드라마틱'] },
    { query: 'portrait figure three quarter view studio aesthetic', shotType: '바스트샷', poseTags: ['1인', '3/4뷰'] },
    { query: 'person upper body back view portrait', shotType: '바스트샷', poseTags: ['1인', '뒤돌아보기'] },
    { query: 'expressive portrait figure gesture aesthetic', shotType: '바스트샷', poseTags: ['1인'] },
  ],

  // --- 누워있기/바닥 (6개) ---
  // aesthetic 키워드: 모델 포즈 쿼리에 추가, 기본 figure 쿼리는 유지
  lying: [
    { query: 'person lying down full body studio floor', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'model reclining full body pose studio aesthetic', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'figure lying on back full body photography', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'person lying side full body studio', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
    { query: 'reclining figure full body dramatic lighting aesthetic', shotType: '풀샷', poseTags: ['누워있기', '1인', '드라마틱'] },
    { query: 'person stretching floor full body studio', shotType: '풀샷', poseTags: ['누워있기', '1인'] },
  ],

  // --- 그룹/2인 이상 (6개) ---
  // aesthetic 키워드: 댄서/커플 포즈에 추가, 격투 등 기술적 쿼리는 제외
  group: [
    { query: 'two people standing full body studio photography', shotType: '풀샷', poseTags: ['서있기', '2인'] },
    { query: 'two dancers pose full body studio aesthetic', shotType: '풀샷', poseTags: ['2인'] },
    { query: 'couple full body pose photography aesthetic', shotType: '풀샷', poseTags: ['2인'] },
    { query: 'two people interaction full body studio', shotType: '풀샷', poseTags: ['2인'] },
    { query: 'two fighters martial arts full body', shotType: '풀샷', poseTags: ['격투', '2인'] },
    { query: 'couple embrace full body studio photography aesthetic', shotType: '풀샷', poseTags: ['포옹', '2인'] },
  ],

  // --- 손/부위 (4개) ---
  // aesthetic 미적용: 해부학적/기술적 레퍼런스 쿼리이므로 제외
  hands: [
    { query: 'hand gesture close up studio photography', shotType: '클로즈업', poseTags: ['손'] },
    { query: 'hands expressive gesture studio detail', shotType: '클로즈업', poseTags: ['손'] },
    { query: 'fist close up dramatic studio light', shotType: '클로즈업', poseTags: ['주먹', '하드라이트'] },
    { query: 'open hand reaching studio photography', shotType: '클로즈업', poseTags: ['손'] },
  ],

  // --- aesthetic 전용 쿼리 (8개) — 고퀄리티 비주얼 레퍼런스 확보용 ---
  // Pexels에서 "aesthetic" 키워드로 시각적 완성도 높은 인물 사진 수집
  aesthetic: [
    { query: 'aesthetic portrait lighting studio photography', shotType: '바스트샷', poseTags: ['1인', '스튜디오'] },
    { query: 'aesthetic fashion editorial full body model', shotType: '풀샷', poseTags: ['서있기', '1인'] },
    { query: 'aesthetic model pose golden hour portrait', shotType: '바스트샷', poseTags: ['1인', '자연광'] },
    { query: 'aesthetic minimalist portrait clean background', shotType: '바스트샷', poseTags: ['1인', '스튜디오'] },
    { query: 'aesthetic dancer silhouette full body studio', shotType: '풀샷', poseTags: ['1인'] },
    { query: 'aesthetic couple pose fashion photography', shotType: '풀샷', poseTags: ['2인'] },
    { query: 'aesthetic moody portrait dramatic shadow', shotType: '바스트샷', poseTags: ['1인', '드라마틱', '하드라이트'] },
    { query: 'aesthetic full body pose cinematic lighting', shotType: '풀샷', poseTags: ['서있기', '1인', '드라마틱'] },
  ],
};

// ============================================
// 한글 태그 → 영문 카테고리 키 매핑 (역방향 룩업)
// ============================================
const TAG_TO_CATEGORY: Record<string, string> = {
  '서있기': 'standing',
  '앉기': 'sitting',
  '걷기': 'action',
  '달리기': 'action',
  '점프': 'action',
  '누워있기': 'lying',
  '기대기': 'standing',
  '뒤돌아보기': 'standing',
  '무릎꿇기': 'sitting',
  '웅크리기': 'sitting',
  '격투': 'action',
  '포옹': 'group',
  '손': 'hands',
  '물건쥐기': 'hands',
  '주먹': 'hands',
  '얼굴': 'portrait',
  '웃음': 'portrait',
  '분노': 'portrait',
  '슬픔': 'portrait',
  '놀람': 'portrait',
  '무표정': 'portrait',
  '2인': 'group',
  '군중': 'group',
};

/**
 * 주어진 한글 태그 조합에서 최적의 Pexels 검색 쿼리 생성
 */
export function generateSearchQuery(tags: string[]): SearchQuery[] {
  if (!tags || tags.length === 0) {
    return [
      ...POSE_SEARCH_QUERIES.standing.slice(0, 4),
      ...POSE_SEARCH_QUERIES.action.slice(0, 3),
      ...POSE_SEARCH_QUERIES.sitting.slice(0, 1),
    ];
  }

  const matchedCategories = new Set<string>();
  for (const tag of tags) {
    const category = TAG_TO_CATEGORY[tag];
    if (category) matchedCategories.add(category);
  }

  if (matchedCategories.size === 0) {
    return [
      ...POSE_SEARCH_QUERIES.standing.slice(0, 4),
      ...POSE_SEARCH_QUERIES.action.slice(0, 4),
    ];
  }

  const result: SearchQuery[] = [];
  for (const cat of matchedCategories) {
    const queries = POSE_SEARCH_QUERIES[cat];
    if (queries) {
      const scored = queries.map((q) => {
        const overlap = q.poseTags.filter((pt) => tags.includes(pt)).length;
        return { query: q, score: overlap };
      });
      scored.sort((a, b) => b.score - a.score);
      const maxPerCategory = Math.min(4, Math.ceil(8 / matchedCategories.size));
      result.push(...scored.slice(0, maxPerCategory).map((s) => s.query));
    }
  }

  return result.slice(0, 8);
}

/**
 * 카테고리별 균형 잡힌 쿼리 샘플링 (초기 로딩용)
 * 크로키 레퍼런스 특성상 standing/action/sitting 비중 높게
 */
export function getBalancedQueries(count = 20): SearchQuery[] {
  // 크로키 우선순위: 서있기 > 액션 > 앉기 > 누워있기 > 포트레이트 > aesthetic > 그룹 > 손
  const priorityOrder = ['standing', 'action', 'sitting', 'lying', 'portrait', 'aesthetic', 'group', 'hands'];
  const result: SearchQuery[] = [];

  let categoryIndex = 0;
  const usedIndices: Record<string, number> = {};

  while (result.length < count) {
    const cat = priorityOrder[categoryIndex % priorityOrder.length];
    const queries = POSE_SEARCH_QUERIES[cat];
    const idx = usedIndices[cat] ?? 0;

    if (idx < queries.length) {
      result.push(queries[idx]);
      usedIndices[cat] = idx + 1;
    }

    categoryIndex++;
    if (categoryIndex >= priorityOrder.length * 10) break;
  }

  return result.slice(0, count);
}
