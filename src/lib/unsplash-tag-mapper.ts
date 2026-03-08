// ============================================
// Unsplash 영문 태그 → 한글 태그 매핑 엔진
// 120+ 항목: 포즈/조명/카메라/소재/배경
// Unsplash 태그를 ArtRef 태그 체계로 변환
// ============================================

/** 영문→한글 태그 매핑 테이블 */
const TAG_MAP: Record<string, string> = {
  // === 포즈 ===
  'standing': '서있기',
  'stand': '서있기',
  'sitting': '앉기',
  'sit': '앉기',
  'seated': '앉기',
  'walking': '걷기',
  'walk': '걷기',
  'running': '달리기',
  'run': '달리기',
  'sprint': '달리기',
  'jumping': '점프',
  'jump': '점프',
  'leap': '점프',
  'lying': '누워있기',
  'lying down': '누워있기',
  'reclining': '누워있기',
  'leaning': '기대기',
  'lean': '기대기',
  'looking back': '뒤돌아보기',
  'kneeling': '무릎꿇기',
  'kneel': '무릎꿇기',
  'crouching': '웅크리기',
  'crouch': '웅크리기',
  'squat': '웅크리기',
  'fighting': '격투',
  'martial arts': '격투',
  'boxing': '격투',
  'karate': '격투',
  'hugging': '포옹',
  'hug': '포옹',
  'embrace': '포옹',

  // === 부위/표정 ===
  'hand': '손',
  'hands': '손',
  'holding': '물건쥐기',
  'grip': '물건쥐기',
  'fist': '주먹',
  'face': '얼굴',
  'portrait': '얼굴',
  'close up': '얼굴',
  'smiling': '웃음',
  'smile': '웃음',
  'laughing': '웃음',
  'happy': '웃음',
  'angry': '분노',
  'anger': '분노',
  'furious': '분노',
  'sad': '슬픔',
  'sadness': '슬픔',
  'crying': '슬픔',
  'tears': '슬픔',
  'surprised': '놀람',
  'surprise': '놀람',
  'shocked': '놀람',
  'neutral': '무표정',
  'stoic': '무표정',
  'expressionless': '무표정',

  // === 인물 특성 ===
  'man': '남성',
  'male': '남성',
  'boy': '남성',
  'woman': '여성',
  'female': '여성',
  'girl': '여성',
  'slim': '마른체형',
  'thin': '마른체형',
  'slender': '마른체형',
  'muscular': '근육질',
  'muscle': '근육질',
  'athletic': '근육질',
  'bodybuilder': '근육질',
  'child': '아동',
  'kid': '아동',
  'children': '아동',
  'teenager': '청소년',
  'teen': '청소년',
  'adolescent': '청소년',
  'elderly': '노인',
  'old': '노인',
  'senior': '노인',
  'alone': '1인',
  'solo': '1인',
  'couple': '2인',
  'pair': '2인',
  'crowd': '군중',
  'group': '군중',
  'people': '군중',

  // === 조명 ===
  'front light': '정면광',
  'flat light': '정면광',
  'backlight': '역광',
  'backlighting': '역광',
  'silhouette': '역광',
  'side light': '측광',
  'side lighting': '측광',
  'rembrandt': '측광',
  'top light': '탑라이트',
  'overhead': '탑라이트',
  'rim light': '림라이트',
  'edge light': '림라이트',
  'natural light': '자연광',
  'daylight': '자연광',
  'sunlight': '자연광',
  'outdoor': '자연광',
  'artificial light': '인공광',
  'studio': '인공광',
  'studio light': '인공광',
  'neon': '인공광',
  'golden hour': '골든아워',
  'sunset': '골든아워',
  'sunrise': '골든아워',
  'warm light': '골든아워',
  'blue hour': '블루아워',
  'twilight': '블루아워',
  'hard light': '하드라이트',
  'harsh light': '하드라이트',
  'strong shadow': '하드라이트',
  'soft light': '소프트라이트',
  'diffused': '소프트라이트',
  'soft shadow': '소프트라이트',
  'overcast': '소프트라이트',

  // === 카메라 ===
  'high angle': '하이앵글',
  'bird eye': '버드아이',
  'birds eye': '버드아이',
  'overhead shot': '버드아이',
  'eye level': '아이레벨',
  'low angle': '로우앵글',
  'worms eye': '웜즈아이',
  'wide angle': '광각',
  'wide shot': '광각',
  'full body': '풀샷',
  'full length': '풀샷',
  'medium shot': '미디엄샷',
  'waist up': '미디엄샷',
  'bust shot': '바스트샷',
  'headshot': '클로즈업',
  'close-up': '클로즈업',
  'closeup': '클로즈업',
  'macro': '클로즈업',
  'telephoto': '망원',
  'zoom': '망원',
  'shallow depth': '얕은피사계심도',
  'bokeh': '얕은피사계심도',

  // === 소재/텍스처 ===
  'leather': '가죽',
  'denim': '데님',
  'jeans': '데님',
  'silk': '실크',
  'satin': '실크',
  'wool': '울',
  'knit': '니트',
  'cotton': '면',
  'linen': '린넨',
  'fur': '모피',
  'metal': '금속',
  'metallic': '금속',
  'glass': '유리',
  'transparent': '유리',
  'wood': '나무',
  'wooden': '나무',
  'stone': '돌',
  'marble': '돌',
  'concrete': '콘크리트',
  'water': '물',
  'wet': '물',

  // === 배경 ===
  'urban': '도시',
  'city': '도시',
  'street': '도시',
  'nature': '자연',
  'forest': '자연',
  'mountain': '자연',
  'beach': '해변',
  'ocean': '해변',
  'sea': '해변',
  'studio background': '스튜디오',
  'white background': '스튜디오',
  'black background': '스튜디오',
  'cafe': '카페',
  'coffee shop': '카페',
  'classroom': '교실',
  'office': '사무실',
  'gym': '체육관',
  'park': '공원',
  'garden': '정원',

  // === 활동/동작 ===
  'yoga': '요가',
  'dance': '댄스',
  'dancing': '댄스',
  'ballet': '발레',
  'stretching': '스트레칭',
  'exercise': '운동',
  'workout': '운동',
  'fitness': '운동',
  'sport': '스포츠',
  'sports': '스포츠',
  'fashion': '패션',
  'model': '모델',
  'modeling': '모델',
};

/**
 * 영문 태그를 한글 태그로 변환
 * 매핑 테이블에 없는 태그는 건너뜀
 */
export function mapEnglishToKorean(englishTag: string): string | null {
  const normalized = englishTag.toLowerCase().trim();
  return TAG_MAP[normalized] ?? null;
}

/**
 * Unsplash 태그 배열을 한글 태그 배열로 변환
 * 중복 제거 포함
 */
export function mapUnsplashTags(unsplashTags: string[]): string[] {
  const mapped = new Set<string>();

  for (const tag of unsplashTags) {
    // 직접 매핑 시도
    const korean = mapEnglishToKorean(tag);
    if (korean) {
      mapped.add(korean);
      continue;
    }

    // 복합 태그 분할 시도 (예: "woman standing" → "여성" + "서있기")
    const words = tag.toLowerCase().split(/\s+/);
    for (const word of words) {
      const wordKorean = mapEnglishToKorean(word);
      if (wordKorean) mapped.add(wordKorean);
    }
  }

  return Array.from(mapped);
}

/**
 * Unsplash 설명에서 태그 추출
 * description + alt_description에서 키워드 매칭
 */
export function extractTagsFromDescription(
  description?: string | null,
  altDescription?: string | null
): string[] {
  const text = [description, altDescription].filter(Boolean).join(' ').toLowerCase();
  if (!text) return [];

  const extracted = new Set<string>();

  // 매핑 테이블의 모든 키를 텍스트에서 검색
  for (const [english, korean] of Object.entries(TAG_MAP)) {
    if (text.includes(english)) {
      extracted.add(korean);
    }
  }

  return Array.from(extracted);
}

/**
 * Unsplash 사진의 모든 소스에서 한글 태그 종합 추출
 * 태그 + 설명 + alt_description 조합
 */
export function extractAllTags(photo: {
  tags?: { title: string }[];
  description?: string | null;
  alt_description?: string | null;
}): string[] {
  const allTags = new Set<string>();

  // 1. Unsplash 태그 매핑
  if (photo.tags) {
    const mapped = mapUnsplashTags(photo.tags.map((t) => t.title));
    mapped.forEach((t) => allTags.add(t));
  }

  // 2. 설명에서 태그 추출
  const descTags = extractTagsFromDescription(photo.description, photo.alt_description);
  descTags.forEach((t) => allTags.add(t));

  return Array.from(allTags);
}

/** 태그 매핑 테이블 항목 수 */
export const TAG_MAP_SIZE = Object.keys(TAG_MAP).length;
