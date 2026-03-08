// ============================================
// 샘플 레퍼런스 이미지 데이터 (Phase 1 - Mock Data)
// MVP에서는 샘플 데이터로 UI를 검증합니다.
// 실제 서비스에서는 bkend.ai DB에서 가져옵니다.
// ============================================

import type { ReferenceImage } from '@/types';
import { generatePoseVectorForImage } from '@/lib/pose-vectors';
import { generateCameraAngleForImage } from '@/lib/camera-vectors';
import { generateLightDirectionForImage } from '@/lib/light-vectors';

// 태그 그룹 정의 (그룹 내 OR, 그룹 간 AND 검색에 사용)
// tooltip: 초보자를 위한 한글 설명
export const TAG_GROUPS = {
  pose: {
    label: '포즈',
    tags: [
      { name: '서있기', tooltip: '직립 자세, 기본 서있는 포즈' },
      { name: '앉기', tooltip: '의자나 바닥에 앉은 포즈' },
      { name: '걷기', tooltip: '걸어가는 중간 동작' },
      { name: '달리기', tooltip: '뛰는 동적 포즈' },
      { name: '점프', tooltip: '공중에 뜬 순간 포즈' },
      { name: '누워있기', tooltip: '바닥에 누운 자세' },
      { name: '기대기', tooltip: '벽이나 물체에 기댄 포즈' },
      { name: '뒤돌아보기', tooltip: '몸은 정면, 고개를 뒤로 돌린 포즈' },
      { name: '무릎꿇기', tooltip: '한쪽 또는 양쪽 무릎을 꿇은 포즈' },
      { name: '웅크리기', tooltip: '몸을 움츠린 자세' },
      { name: '격투', tooltip: '펀치, 발차기 등 싸움 동작' },
      { name: '포옹', tooltip: '두 사람이 껴안은 포즈' },
    ],
  },
  body: {
    label: '부위/표정',
    tags: [
      { name: '손', tooltip: '손 클로즈업, 손가락 디테일' },
      { name: '물건쥐기', tooltip: '컵, 칼, 펜 등을 쥔 손' },
      { name: '주먹', tooltip: '주먹 쥔 손 디테일' },
      { name: '얼굴', tooltip: '얼굴 정면/측면 클로즈업' },
      { name: '웃음', tooltip: '밝게 웃는 표정' },
      { name: '분노', tooltip: '화난 표정, 이를 악문 얼굴' },
      { name: '슬픔', tooltip: '슬픈 표정, 눈물' },
      { name: '놀람', tooltip: '놀란 표정, 눈 크게 뜬 얼굴' },
      { name: '무표정', tooltip: '감정 없는 담담한 표정' },
    ],
  },
  person: {
    label: '인물 특성',
    tags: [
      { name: '남성', tooltip: '남성 인물' },
      { name: '여성', tooltip: '여성 인물' },
      { name: '마른체형', tooltip: '날씬한/마른 체형' },
      { name: '근육질', tooltip: '근육이 발달한 체형' },
      { name: '아동', tooltip: '어린이 (10세 이하)' },
      { name: '청소년', tooltip: '10대 청소년' },
      { name: '노인', tooltip: '고령자' },
      { name: '1인', tooltip: '혼자 있는 사진' },
      { name: '2인', tooltip: '두 사람이 함께' },
      { name: '군중', tooltip: '여러 명이 함께' },
    ],
  },
  light: {
    label: '조명',
    tags: [
      { name: '정면광', tooltip: '카메라 방향에서 비추는 빛. 그림자가 거의 없음' },
      { name: '역광', tooltip: '피사체 뒤에서 비추는 빛. 실루엣이 강조됨' },
      { name: '측광', tooltip: '옆에서 비추는 빛. 얼굴 반쪽에 그림자 생김' },
      { name: '탑라이트', tooltip: '위에서 비추는 빛. 눈 아래 그림자가 강하게 생김' },
      { name: '림라이트', tooltip: '뒤에서 윤곽을 따라 비추는 빛. 테두리가 밝게 빛남' },
      { name: '자연광', tooltip: '태양, 하늘 등 자연의 빛' },
      { name: '인공광', tooltip: '조명 기구로 만든 빛 (스튜디오, 네온 등)' },
      { name: '골든아워', tooltip: '해 뜨거나 질 무렵의 따뜻한 황금빛' },
      { name: '블루아워', tooltip: '해 지고 난 직후의 차가운 푸른빛' },
      { name: '하드라이트', tooltip: '경계가 선명한 강한 빛. 그림자가 뚜렷함' },
      { name: '소프트라이트', tooltip: '부드럽게 퍼진 빛. 그림자가 은은함' },
    ],
  },
  material: {
    label: '소재/텍스처',
    tags: [
      { name: '가죽', tooltip: '가죽 소재의 광택과 주름' },
      { name: '비단', tooltip: '비단/실크의 흐르는 질감' },
      { name: '데님', tooltip: '청바지 등 데님 원단의 질감' },
      { name: '니트', tooltip: '뜨개질 원단의 올 패턴' },
      { name: '금속', tooltip: '철, 금, 은 등 금속 질감과 반사' },
      { name: '근육', tooltip: '인체 근육의 형태와 결' },
      { name: '피부결', tooltip: '피부 표면의 미세한 질감' },
    ],
  },
  costume: {
    label: '의상 스타일',
    tags: [
      { name: '드레스', tooltip: '원피스/드레스 착용' },
      { name: '수트', tooltip: '정장/수트 착용' },
      { name: '캐주얼', tooltip: '일상복, 편한 옷' },
      { name: '스포츠웨어', tooltip: '운동복, 트레이닝복' },
      { name: '한복', tooltip: '한국 전통 의상' },
      { name: '갑옷', tooltip: '중세/판타지 갑옷, 방어구' },
      { name: '군복', tooltip: '군인 복장, 전투복' },
      { name: '교복', tooltip: '학생 교복' },
    ],
  },
  background: {
    label: '배경',
    tags: [
      { name: '실내', tooltip: '건물 내부 공간' },
      { name: '야외', tooltip: '바깥 공간 전반' },
      { name: '스튜디오', tooltip: '촬영용 스튜디오 (단색 배경)' },
      { name: '숲', tooltip: '나무가 많은 숲 속' },
      { name: '도시', tooltip: '도시 거리, 건물 사이' },
      { name: '해변', tooltip: '바다, 해변가' },
      { name: '야경', tooltip: '밤의 도시/풍경' },
      { name: '교실', tooltip: '학교 교실 내부' },
      { name: '카페', tooltip: '카페/커피숍 내부' },
      { name: '골목', tooltip: '좁은 골목길' },
      { name: '옥상', tooltip: '건물 옥상' },
    ],
  },
  camera: {
    label: '카메라/구도',
    tags: [
      { name: '하이앵글', tooltip: '위에서 아래로 내려다보는 시점' },
      { name: '로우앵글', tooltip: '아래에서 위로 올려다보는 시점' },
      { name: '아이레벨', tooltip: '눈높이에서 바라보는 시점' },
      { name: '클로즈업', tooltip: '얼굴이나 물체를 가까이 확대' },
      { name: '풀샷', tooltip: '전신이 모두 보이는 구도' },
      { name: '미디엄샷', tooltip: '허리~가슴 위까지 보이는 구도' },
      { name: '바스트샷', tooltip: '가슴 위부터 보이는 구도 (웹툰 가장 흔한 샷)' },
      { name: '오버더숄더', tooltip: '한 사람 어깨 너머로 상대를 보는 구도' },
      { name: '3/4뷰', tooltip: '정면과 측면 사이 45도 각도' },
    ],
  },
  mood: {
    label: '분위기/무드',
    tags: [
      { name: '다크판타지', tooltip: '어둡고 음울한 판타지 분위기' },
      { name: '사이버펑크', tooltip: '네온, 미래도시, 기계적 분위기' },
      { name: '동양풍', tooltip: '한국/일본/중국 전통 미학' },
      { name: '중세', tooltip: '중세 유럽 분위기, 성, 기사' },
      { name: '웅장한', tooltip: '규모감 있고 장엄한 느낌' },
      { name: '고요한', tooltip: '정적이고 평화로운 분위기' },
      { name: '몽환적', tooltip: '꿈결 같은 비현실적 분위기' },
      { name: '드라마틱', tooltip: '극적인 빛과 구도의 연출' },
    ],
  },
} as const;

// 모든 태그 이름만 추출한 플랫 배열 (검색 자동완성용)
export const ALL_TAG_NAMES = Object.values(TAG_GROUPS).flatMap(
  (group) => group.tags.map((t) => t.name)
);

// 태그 이름으로 tooltip 찾기
export function getTagTooltip(tagName: string): string | undefined {
  for (const group of Object.values(TAG_GROUPS)) {
    const found = group.tags.find((t) => t.name === tagName);
    if (found) return found.tooltip;
  }
  return undefined;
}

// 태그가 속한 그룹 키 찾기 (OR/AND 로직에 사용)
export function getTagGroup(tagName: string): string | undefined {
  for (const [key, group] of Object.entries(TAG_GROUPS)) {
    if (group.tags.some((t) => t.name === tagName)) return key;
  }
  return undefined;
}

// 카테고리 목록
export const SAMPLE_CATEGORIES = [
  { value: 'figure', label: '인물', icon: '👤' },
  { value: 'landscape', label: '풍경', icon: '🏞️' },
  { value: 'object', label: '오브제', icon: '🎨' },
  { value: 'fabric', label: '의상/소재', icon: '👗' },
  { value: 'anatomy', label: '해부학', icon: '💪' },
  { value: 'environment', label: '환경', icon: '🏰' },
  { value: 'creature', label: '크리처', icon: '🐉' },
] as const;

// Unsplash 무료 이미지 샘플 (태그 확장 반영)
export const SAMPLE_IMAGES: ReferenceImage[] = [
  {
    _id: '1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    title: '정면 포트레이트 - 자연광',
    tags: ['서있기', '정면광', '자연광', '아이레벨', '클로즈업', '여성', '1인', '무표정'],
    category: 'figure',
    createdAt: '2024-01-01',
  },
  {
    _id: '2',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    title: '측면 조명 포트레이트',
    tags: ['서있기', '측광', '하드라이트', '스튜디오', '클로즈업', '남성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-02',
  },
  {
    _id: '3',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    title: '풀샷 - 캐주얼 서있기',
    tags: ['서있기', '자연광', '캐주얼', '야외', '풀샷', '여성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-01-03',
  },
  {
    _id: '4',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    title: '역광 실루엣',
    tags: ['서있기', '역광', '골든아워', '야외', '풀샷', '여성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-04',
  },
  {
    _id: '5',
    url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    title: '앉은 포즈 - 소프트 라이트',
    tags: ['앉기', '소프트라이트', '실내', '드레스', '미디엄샷', '아이레벨', '여성', '1인', '고요한'],
    category: 'figure',
    createdAt: '2024-01-05',
  },
  {
    _id: '6',
    url: 'https://images.unsplash.com/photo-1495528833836-dcfaf3d4f8ec?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495528833836-dcfaf3d4f8ec?w=400',
    title: '가죽 재킷 디테일',
    tags: ['가죽', '클로즈업', '측광', '스튜디오', '드라마틱'],
    category: 'fabric',
    createdAt: '2024-01-06',
  },
  {
    _id: '7',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    title: '로우앵글 - 위를 올려다보기',
    tags: ['서있기', '로우앵글', '자연광', '야외', '미디엄샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-01-07',
  },
  {
    _id: '8',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    title: '탑라이트 드라마틱',
    tags: ['서있기', '탑라이트', '하드라이트', '스튜디오', '클로즈업', '여성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-08',
  },
  {
    _id: '9',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    title: '걷는 포즈 - 패션',
    tags: ['걷기', '정면광', '스튜디오', '드레스', '풀샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-01-09',
  },
  {
    _id: '10',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    title: '림라이트 프로필',
    tags: ['뒤돌아보기', '림라이트', '스튜디오', '클로즈업', '남성', '1인', '3/4뷰', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-10',
  },
  {
    _id: '11',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400',
    title: '비단 원단 클로즈업',
    tags: ['비단', '클로즈업', '소프트라이트', '스튜디오', '몽환적'],
    category: 'fabric',
    createdAt: '2024-01-11',
  },
  {
    _id: '12',
    url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400',
    title: '운동 포즈 - 근육',
    tags: ['서있기', '근육', '하드라이트', '스튜디오', '미디엄샷', '스포츠웨어', '남성', '근육질', '1인'],
    category: 'anatomy',
    createdAt: '2024-01-12',
  },
  // === 추가 샘플 (태그 커버리지 확장) ===
  {
    _id: '13',
    url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400',
    title: '점프하는 남성 - 역동적',
    tags: ['점프', '자연광', '야외', '풀샷', '남성', '캐주얼', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-01-13',
  },
  {
    _id: '14',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    title: '골든아워 포트레이트',
    tags: ['서있기', '역광', '골든아워', '야외', '바스트샷', '여성', '1인', '몽환적'],
    category: 'figure',
    createdAt: '2024-01-14',
  },
  {
    _id: '15',
    url: 'https://images.unsplash.com/photo-1492446845049-9c50cc313f00?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492446845049-9c50cc313f00?w=400',
    title: '포옹하는 커플',
    tags: ['포옹', '자연광', '야외', '미디엄샷', '2인', '소프트라이트', '고요한'],
    category: 'figure',
    createdAt: '2024-01-15',
  },
  {
    _id: '16',
    url: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400',
    title: '로우앵글 실루엣 - 웅장한',
    tags: ['서있기', '로우앵글', '역광', '야외', '풀샷', '남성', '1인', '웅장한', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-16',
  },
  {
    _id: '17',
    url: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400',
    title: '드레스 소재 - 흐르는 실크',
    tags: ['비단', '드레스', '소프트라이트', '스튜디오', '미디엄샷', '여성', '몽환적'],
    category: 'fabric',
    createdAt: '2024-01-17',
  },
  {
    _id: '18',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    title: '수트 남성 - 정면 아이레벨',
    tags: ['서있기', '정면광', '스튜디오', '수트', '미디엄샷', '아이레벨', '남성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-01-18',
  },
  {
    _id: '19',
    url: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=400',
    title: '근육 해부학 - 측면',
    tags: ['서있기', '측광', '하드라이트', '스튜디오', '미디엄샷', '남성', '근육', '근육질', '1인'],
    category: 'anatomy',
    createdAt: '2024-01-19',
  },
  // ID 20~22: 기존 풍경 → 인체 레퍼런스로 교체
  {
    _id: '20',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
    title: '남성 근육 포즈 - 스튜디오',
    tags: ['서있기', '하드라이트', '스튜디오', '풀샷', '남성', '근육질', '1인', '근육'],
    category: 'anatomy',
    createdAt: '2024-01-20',
  },
  {
    _id: '21',
    url: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=400',
    title: '여성 전신 포즈 - 자연광',
    tags: ['서있기', '자연광', '야외', '풀샷', '여성', '1인', '캐주얼', '아이레벨'],
    category: 'figure',
    createdAt: '2024-01-21',
  },
  {
    _id: '22',
    url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    title: '남성 포트레이트 - 드라마틱 조명',
    tags: ['서있기', '측광', '하드라이트', '스튜디오', '바스트샷', '남성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-01-22',
  },
  {
    _id: '23',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    title: '손 클로즈업 - 물건잡기',
    tags: ['손', '물건쥐기', '클로즈업', '소프트라이트', '실내'],
    category: 'anatomy',
    createdAt: '2024-01-23',
  },
  {
    _id: '24',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400',
    title: '카페 실내 배경',
    tags: ['실내', '카페', '자연광', '소프트라이트', '아이레벨', '미디엄샷', '고요한'],
    category: 'environment',
    createdAt: '2024-01-24',
  },

  // === v3 프리셋 커버리지 확충 ===
  // 서기 프리셋 (서있기 + 아이레벨) 보강
  {
    _id: '25',
    url: 'https://images.unsplash.com/photo-1488161628813-04466f0016e4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1488161628813-04466f0016e4?w=400',
    title: '서있기 - 아이레벨 자연광',
    tags: ['서있기', '아이레벨', '자연광', '야외', '풀샷', '여성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-01',
  },
  {
    _id: '26',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    title: '남성 스탠딩 - 아이레벨',
    tags: ['서있기', '아이레벨', '소프트라이트', '스튜디오', '바스트샷', '남성', '1인'],
    category: 'figure',
    createdAt: '2024-02-02',
  },
  {
    _id: '27',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    title: '여성 정면 아이레벨',
    tags: ['서있기', '아이레벨', '정면광', '야외', '미디엄샷', '여성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-02-03',
  },
  {
    _id: '28',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    title: '캐주얼 남성 스탠딩',
    tags: ['서있기', '아이레벨', '자연광', '야외', '풀샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-04',
  },

  // 앉기 프리셋 (앉기 + 아이레벨) 보강
  {
    _id: '29',
    url: 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=400',
    title: '벤치에 앉은 남성',
    tags: ['앉기', '아이레벨', '자연광', '야외', '미디엄샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-05',
  },
  {
    _id: '30',
    url: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400',
    title: '카페에 앉은 여성 - 자연광',
    tags: ['앉기', '아이레벨', '자연광', '카페', '실내', '바스트샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-02-06',
  },
  {
    _id: '31',
    url: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400',
    title: '의자에 앉은 포즈 - 스튜디오',
    tags: ['앉기', '아이레벨', '소프트라이트', '스튜디오', '풀샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-02-07',
  },
  {
    _id: '32',
    url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400',
    title: '바닥에 앉은 남성 - 캐주얼',
    tags: ['앉기', '아이레벨', '자연광', '야외', '풀샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-08',
  },
  {
    _id: '33',
    url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    title: '앉은 포즈 - 측광',
    tags: ['앉기', '아이레벨', '측광', '실내', '미디엄샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-02-09',
  },

  // 걷기 프리셋 (걷기 + 아이레벨) 보강
  {
    _id: '34',
    url: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=400',
    title: '거리를 걷는 남성',
    tags: ['걷기', '아이레벨', '자연광', '도시', '야외', '풀샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-10',
  },
  {
    _id: '35',
    url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400',
    title: '패션 워킹 - 스튜디오',
    tags: ['걷기', '아이레벨', '정면광', '스튜디오', '풀샷', '여성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-11',
  },
  {
    _id: '36',
    url: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400',
    title: '공원 산책',
    tags: ['걷기', '아이레벨', '자연광', '야외', '풀샷', '여성', '1인', '소프트라이트', '고요한'],
    category: 'figure',
    createdAt: '2024-02-12',
  },
  {
    _id: '37',
    url: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400',
    title: '도시 보행 - 역광',
    tags: ['걷기', '아이레벨', '역광', '도시', '야외', '풀샷', '남성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-13',
  },

  // 달리기 프리셋 (달리기 + 풀샷) 추가
  {
    _id: '38',
    url: 'https://images.unsplash.com/photo-1461897104016-0b3b00b1ea56?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461897104016-0b3b00b1ea56?w=400',
    title: '달리는 남성 - 야외',
    tags: ['달리기', '풀샷', '자연광', '야외', '남성', '스포츠웨어', '1인'],
    category: 'figure',
    createdAt: '2024-02-14',
  },
  {
    _id: '39',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400',
    title: '달리기 - 역동적 스프린트',
    tags: ['달리기', '풀샷', '자연광', '야외', '여성', '스포츠웨어', '1인'],
    category: 'figure',
    createdAt: '2024-02-15',
  },
  {
    _id: '40',
    url: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400',
    title: '러닝 - 로우앵글',
    tags: ['달리기', '풀샷', '로우앵글', '야외', '남성', '스포츠웨어', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-16',
  },
  {
    _id: '41',
    url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=400',
    title: '도시 달리기 - 새벽',
    tags: ['달리기', '풀샷', '자연광', '도시', '야외', '남성', '스포츠웨어', '1인', '블루아워'],
    category: 'figure',
    createdAt: '2024-02-17',
  },
  {
    _id: '42',
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400',
    title: '트레일 러닝 - 숲',
    tags: ['달리기', '풀샷', '자연광', '숲', '야외', '남성', '스포츠웨어', '1인'],
    category: 'figure',
    createdAt: '2024-02-18',
  },

  // 뒤돌아보기 프리셋 (뒤돌아보기 + 3/4뷰) 보강
  {
    _id: '43',
    url: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=400',
    title: '뒤돌아보는 여성 - 야외',
    tags: ['뒤돌아보기', '3/4뷰', '자연광', '야외', '미디엄샷', '여성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-02-19',
  },
  {
    _id: '44',
    url: 'https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400',
    title: '뒤돌아보는 포즈 - 드레스',
    tags: ['뒤돌아보기', '3/4뷰', '역광', '야외', '풀샷', '여성', '1인', '드레스', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-20',
  },
  {
    _id: '45',
    url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400',
    title: '남성 뒤돌아보기 - 측광',
    tags: ['뒤돌아보기', '3/4뷰', '측광', '스튜디오', '바스트샷', '남성', '1인'],
    category: 'figure',
    createdAt: '2024-02-21',
  },
  {
    _id: '46',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    title: '어깨 너머로 돌아보기',
    tags: ['뒤돌아보기', '3/4뷰', '소프트라이트', '실내', '바스트샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-02-22',
  },
  {
    _id: '47',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65adc4?w=400',
    title: '뒤돌아보기 - 골든아워',
    tags: ['뒤돌아보기', '3/4뷰', '역광', '골든아워', '야외', '풀샷', '여성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-23',
  },

  // 웅크리기 프리셋 (웅크리기 + 로우앵글) 추가
  {
    _id: '48',
    url: 'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=400',
    title: '웅크린 자세 - 야외',
    tags: ['웅크리기', '로우앵글', '자연광', '야외', '풀샷', '남성', '1인'],
    category: 'figure',
    createdAt: '2024-02-24',
  },
  {
    _id: '49',
    url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400',
    title: '쪼그려 앉기 - 도시',
    tags: ['웅크리기', '로우앵글', '자연광', '도시', '야외', '미디엄샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-02-25',
  },
  {
    _id: '50',
    url: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400',
    title: '웅크린 포즈 - 스튜디오',
    tags: ['웅크리기', '로우앵글', '하드라이트', '스튜디오', '풀샷', '남성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-26',
  },
  {
    _id: '51',
    url: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=400',
    title: '웅크림 - 소프트 라이트',
    tags: ['웅크리기', '로우앵글', '소프트라이트', '야외', '풀샷', '여성', '1인'],
    category: 'figure',
    createdAt: '2024-02-27',
  },
  {
    _id: '52',
    url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400',
    title: '웅크린 전사 포즈',
    tags: ['웅크리기', '로우앵글', '측광', '야외', '풀샷', '남성', '1인', '드라마틱'],
    category: 'figure',
    createdAt: '2024-02-28',
  },

  // 기대기 프리셋 (기대기 + 3/4뷰) 추가
  {
    _id: '53',
    url: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=400',
    title: '벽에 기댄 남성',
    tags: ['기대기', '3/4뷰', '자연광', '도시', '야외', '미디엄샷', '남성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-03-01',
  },
  {
    _id: '54',
    url: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400',
    title: '기대기 포즈 - 벽',
    tags: ['기대기', '3/4뷰', '측광', '실내', '풀샷', '여성', '1인', '캐주얼'],
    category: 'figure',
    createdAt: '2024-03-02',
  },
  {
    _id: '55',
    url: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=400',
    title: '기대기 - 골든아워',
    tags: ['기대기', '3/4뷰', '역광', '골든아워', '야외', '미디엄샷', '남성', '1인'],
    category: 'figure',
    createdAt: '2024-03-03',
  },
  {
    _id: '56',
    url: 'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?w=400',
    title: '난간에 기댄 여성',
    tags: ['기대기', '3/4뷰', '자연광', '야외', '풀샷', '여성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-03-04',
  },
  {
    _id: '57',
    url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400',
    title: '기대기 - 스튜디오',
    tags: ['기대기', '3/4뷰', '소프트라이트', '스튜디오', '미디엄샷', '남성', '1인'],
    category: 'figure',
    createdAt: '2024-03-05',
  },

  // 손 프리셋 보강 (손, 주먹, 물건쥐기)
  {
    _id: '58',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400',
    title: '편 손 클로즈업',
    tags: ['손', '클로즈업', '소프트라이트', '스튜디오'],
    category: 'anatomy',
    createdAt: '2024-03-06',
  },
  {
    _id: '59',
    url: 'https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=400',
    title: '주먹 쥔 손 - 역광',
    tags: ['주먹', '클로즈업', '역광', '하드라이트', '스튜디오', '드라마틱'],
    category: 'anatomy',
    createdAt: '2024-03-07',
  },
  {
    _id: '60',
    url: 'https://images.unsplash.com/photo-1471897488648-5eae4ac6686b?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1471897488648-5eae4ac6686b?w=400',
    title: '컵을 든 손',
    tags: ['물건쥐기', '손', '클로즈업', '소프트라이트', '실내', '카페'],
    category: 'anatomy',
    createdAt: '2024-03-08',
  },

  // 팔 뻗기 보강 (서있기 + 미디엄샷)
  {
    _id: '61',
    url: 'https://images.unsplash.com/photo-1502767089025-6572583495f7?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502767089025-6572583495f7?w=400',
    title: '팔 뻗는 포즈 - 야외',
    tags: ['서있기', '미디엄샷', '자연광', '야외', '여성', '1인', '소프트라이트'],
    category: 'figure',
    createdAt: '2024-03-09',
  },

  // ============================================
  // 자동 생성 샘플 (62~561, 500개 추가)
  // 다양한 태그 조합으로 검색 결과 커버리지 확보
  // ============================================
  ...generateAdditionalSamples(),
];

/**
 * 500개의 추가 샘플 데이터를 프로그래밍적으로 생성
 * 인체/크로키 레퍼런스 중심 Unsplash 이미지 ID 500개 + 인체 포즈 중심 태그 조합
 */
function generateAdditionalSamples(): ReferenceImage[] {
  // 인체/포트레이트/피규어 드로잉 레퍼런스 중심 Unsplash 이미지 ID 500개 (고유)
  const PHOTO_IDS = [
    // --- 포트레이트 / 얼굴 (1~50) ---
    '1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1544005313-94ddf0286df2',
    '1507003211169-0a1dd7228f2d', '1531746020798-e6953c6e8e04', '1500648767791-00dcc994a43e',
    '1494790108377-be9c29b29330', '1531123897727-8f129e1688ce', '1521119989659-a83eee488004',
    '1507591064344-4c6ce005b128', '1531427186611-ecfd6d936c79', '1499996860823-5214fcc65f8f',
    '1528892952291-009c663ce843', '1506863530036-1efeddceb993', '1524250502761-1ac6f2e30d43',
    '1506634572416-48cdfe530110', '1539571696357-5a69c17a67c6', '1464863979621-258859e62245',
    '1484399172022-72a90b12e3c1', '1501196354995-cbb51c65adc4', '1545912452-8aea7e25a3d3',
    '1507537297725-24a1c029d3ca', '1519058082700-08a0b56da9b4', '1498551172505-8ee7ad69f235',
    '1488161628813-04466f0016e4', '1522898467493-49726bf28798', '1502823403499-6ccfcf4fb453',
    '1475180098004-ca77a66827be', '1483058712412-4245e9b90334', '1517960413843-0aee8e2b3285',
    '1508672019048-805c876b67e2', '1520975916090-3105956dac38', '1542178091-e101da78f5c4',
    '1519345182560-3f2917c472ef', '1548142813-c348350df52b', '1540569014015-19a7be504e3a',
    '1523264653568-7090f44d6460', '1546961342-ea5f71b193f5', '1490735891913-40897cdaafd1',
    '1501785888041-af3ef285b470', '1527576539890-dfa815648363', '1531384441138-2736e62e0919',
    '1518577915332-c2a19f149a75', '1502764613149-7f1d229e230f', '1529390079861-591c30789d3c',
    '1530268729831-4b0b9e170218', '1543269664-7461ed9e0213', '1490718720478-364a07a997cd',
    '1524638431109-93d95c968227', '1551232864-3f0890e580d9',
    // --- 전신 / 패션 모델 (51~100) ---
    '1517841905240-472988babdf9', '1524504388940-b1c1722653e1', '1529626455594-4ff0802cfb7e',
    '1515886657613-9f3515b0c78f', '1509631179647-0177331693ae', '1519085360753-af0119f7cbe7',
    '1496345875659-11f7dd282d1d', '1552374196-c4e7ffc6e126', '1503023345310-bd7c1de61c7d',
    '1504703395950-b89145a5425b', '1502767089025-6572583495f7', '1568602471122-7832951cc4c5',
    '1518459031867-a89b944bffe4', '1581009146145-b5ef050c2e1e', '1495555961986-6d4c1ecb7be3',
    '1504384764586-bb4cee2b3b38', '1555212697-194d092e3b8f', '1526510747491-58f928ec870f',
    '1510218830377-2e994ea9087d', '1531746790095-34cc90f74217', '1526413232644-8a40f03cc03b',
    '1535930749574-1399327ce78f', '1533228100845-08145152571c', '1534367507873-d2d7e24c797f',
    '1522529599102-193c0d76b5b6', '1507679799987-c73779587ccf', '1495555687398-3f50d6e79e1e',
    '1492446845049-9c50cc313f00', '1504439468489-c8920d796a29', '1504439904031-93ded9f93e4e',
    '1516726817505-f5ed825624d8', '1511367461989-f85a21fda167', '1438761681033-6461ffad8d80',
    '1504257432389-52343af06ae3', '1445384763658-0400939829cd', '1487412720507-e7ab37603c6f',
    '1463453091185-61582044d556', '1488426862026-3ee34a7d66df', '1485893086445-ed75865251e0',
    '1509868918590-fe920e096e89', '1502394202744-021cfbb17454', '1504199367914-fe40e5a00e5d',
    '1492106087820-71f1a00d2b11', '1472099645785-5658abf4ff4e', '1500917293891-ef795e70e1f6',
    '1513956589380-bad6acb9b9d4', '1494790108377-be9c29b29330', '1517365830460-955ce3ccd263',
    '1480429370677-b2e55f7139a4', '1519456264038-18a1f8aa7e27', '1488371934083-5ab3e7b37c1c',
    // --- 운동 / 스포츠 포즈 (101~150) ---
    '1541534741688-6078c6bfb5c5', '1461897104016-0b3b00b1ea56', '1476480862126-209bfaa8edc8',
    '1571008887538-b36bb32f4571', '1486218119243-13883505764c', '1552674605-db6ffd4facb5',
    '1517963879433-6ad2b056d712', '1518611012118-696072aa579a', '1534438327276-14e5300c3a48',
    '1517836357463-d25dfeac3438', '1574680096145-d05b13a577fd', '1549060279-7aa02077d1e0',
    '1571019614242-c5c5dee9f50b', '1526506118085-60ce8714f8c5', '1518310383802-640c2de311b2',
    '1599058917212-d750089bc07e', '1594737625785-a6cbdabd333c', '1577896851231-70ef18881754',
    '1596558450268-9c27524ba856', '1471897488648-5eae4ac6686b', '1558618666-fcd25c85f82e',
    '1540539234-c14a20fb7c7b', '1518611012118-696072aa579a', '1546483875-ad9014c88eba',
    '1581009137042-3d053737a09b', '1544367567-0f2fcb009e0b', '1517649763962-0c623066013b',
    '1518310952931-b1de897abd40', '1541410702738-f5a0f1b46272', '1576678927484-cc907957088c',
    '1518644730709-0835105d9dce', '1506126613408-eca07ce68773', '1550345332-09e3ac987658',
    '1517130038641-a774d04afb3c', '1533681904397-d1c8f8bc7e6a', '1545205597-3d9d02c29597',
    '1581009137042-3d053737a09b', '1551698618-1dfe5d97d256', '1546483875-ad9014c88eba',
    '1574680178050-55c6a6a96e0a', '1583454110551-21f2fa2afe61', '1579758629938-03607ccdbaba',
    '1518459031867-a89b944bffe4', '1571019613454-1cb2f99b2d8b', '1574680096145-d05b13a577fd',
    '1556817411-31ae72fa3ea0', '1593095948071-474c5cc2989d', '1534258936925-c58bed479fcb',
    '1518310383802-640c2de311b2', '1549060279-7aa02077d1e0',
    // --- 요가 / 댄스 포즈 (151~200) ---
    '1544367567-0f2fcb009e0b', '1506126613408-eca07ce68773', '1518611012118-696072aa579a',
    '1545205597-3d9d02c29597', '1524863479829-916d8e77db11', '1518310952931-b1de897abd40',
    '1599058917212-d750089bc07e', '1594737625785-a6cbdabd333c', '1518644730709-0835105d9dce',
    '1575052814086-c1d0da46814c', '1510894347713-fc3ed6fdf539', '1548690312-e3b507d8c110',
    '1573384667843-cc517096e014', '1540539234-c14a20fb7c7b', '1571019614242-c5c5dee9f50b',
    '1562771379-36db4d991920', '1555597673-b21d5c935865', '1558618666-fcd25c85f82e',
    '1574680178050-55c6a6a96e0a', '1583454110551-21f2fa2afe61', '1508215885820-4585e56135c8',
    '1505576399279-0d06b1c7e352', '1551698618-1dfe5d97d256', '1544367567-0f2fcb009e0b',
    '1573384667843-cc517096e014', '1518310383802-640c2de311b2', '1524863479829-916d8e77db11',
    '1575052814086-c1d0da46814c', '1506126613408-eca07ce68773', '1549060279-7aa02077d1e0',
    '1594737625785-a6cbdabd333c', '1548690312-e3b507d8c110', '1510894347713-fc3ed6fdf539',
    '1555597673-b21d5c935865', '1562771379-36db4d991920', '1571019613454-1cb2f99b2d8b',
    '1518459031867-a89b944bffe4', '1579758629938-03607ccdbaba', '1556817411-31ae72fa3ea0',
    '1574680096145-d05b13a577fd', '1540539234-c14a20fb7c7b', '1593095948071-474c5cc2989d',
    '1534258936925-c58bed479fcb', '1581009137042-3d053737a09b', '1599058917212-d750089bc07e',
    '1550345332-09e3ac987658', '1517130038641-a774d04afb3c', '1545205597-3d9d02c29597',
    '1533681904397-d1c8f8bc7e6a', '1518644730709-0835105d9dce',
    // --- 드라마틱 포트레이트 / 스튜디오 (201~250) ---
    '1504257432389-52343af06ae3', '1502394202744-021cfbb17454', '1504199367914-fe40e5a00e5d',
    '1492106087820-71f1a00d2b11', '1472099645785-5658abf4ff4e', '1500917293891-ef795e70e1f6',
    '1513956589380-bad6acb9b9d4', '1517365830460-955ce3ccd263', '1480429370677-b2e55f7139a4',
    '1519456264038-18a1f8aa7e27', '1488371934083-5ab3e7b37c1c', '1487412720507-e7ab37603c6f',
    '1463453091185-61582044d556', '1488426862026-3ee34a7d66df', '1485893086445-ed75865251e0',
    '1509868918590-fe920e096e89', '1512361436605-a484bdb34b5f', '1519764622345-ff397f0e024d',
    '1506794778202-cad84cf45f1d', '1534528741775-53994a69daeb', '1544005313-94ddf0286df2',
    '1531746020798-e6953c6e8e04', '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e',
    '1521119989659-a83eee488004', '1531427186611-ecfd6d936c79', '1528892952291-009c663ce843',
    '1531123897727-8f129e1688ce', '1506863530036-1efeddceb993', '1524250502761-1ac6f2e30d43',
    '1499996860823-5214fcc65f8f', '1507537297725-24a1c029d3ca', '1519058082700-08a0b56da9b4',
    '1464863979621-258859e62245', '1484399172022-72a90b12e3c1', '1501196354995-cbb51c65adc4',
    '1545912452-8aea7e25a3d3', '1507591064344-4c6ce005b128', '1539571696357-5a69c17a67c6',
    '1498551172505-8ee7ad69f235', '1488161628813-04466f0016e4', '1520975916090-3105956dac38',
    '1542178091-e101da78f5c4', '1519345182560-3f2917c472ef', '1548142813-c348350df52b',
    '1540569014015-19a7be504e3a', '1523264653568-7090f44d6460', '1546961342-ea5f71b193f5',
    '1490735891913-40897cdaafd1', '1501785888041-af3ef285b470', '1568602471122-7832951cc4c5',
    // --- 근육 / 해부학 레퍼런스 (251~300) ---
    '1581009146145-b5ef050c2e1e', '1541534741688-6078c6bfb5c5', '1496345875659-11f7dd282d1d',
    '1517963879433-6ad2b056d712', '1534438327276-14e5300c3a48', '1517836357463-d25dfeac3438',
    '1526506118085-60ce8714f8c5', '1574680096145-d05b13a577fd', '1549060279-7aa02077d1e0',
    '1571019614242-c5c5dee9f50b', '1540539234-c14a20fb7c7b', '1599058917212-d750089bc07e',
    '1594737625785-a6cbdabd333c', '1577896851231-70ef18881754', '1596558450268-9c27524ba856',
    '1471897488648-5eae4ac6686b', '1558618666-fcd25c85f82e', '1550345332-09e3ac987658',
    '1517130038641-a774d04afb3c', '1533681904397-d1c8f8bc7e6a', '1545205597-3d9d02c29597',
    '1518310952931-b1de897abd40', '1518644730709-0835105d9dce', '1506126613408-eca07ce68773',
    '1534258936925-c58bed479fcb', '1518310383802-640c2de311b2', '1581009137042-3d053737a09b',
    '1544367567-0f2fcb009e0b', '1551698618-1dfe5d97d256', '1546483875-ad9014c88eba',
    '1574680178050-55c6a6a96e0a', '1583454110551-21f2fa2afe61', '1579758629938-03607ccdbaba',
    '1571019613454-1cb2f99b2d8b', '1556817411-31ae72fa3ea0', '1593095948071-474c5cc2989d',
    '1552374196-c4e7ffc6e126', '1503023345310-bd7c1de61c7d', '1509631179647-0177331693ae',
    '1519085360753-af0119f7cbe7', '1504703395950-b89145a5425b', '1524504388940-b1c1722653e1',
    '1529626455594-4ff0802cfb7e', '1517841905240-472988babdf9', '1515886657613-9f3515b0c78f',
    '1461897104016-0b3b00b1ea56', '1476480862126-209bfaa8edc8', '1571008887538-b36bb32f4571',
    '1486218119243-13883505764c', '1552674605-db6ffd4facb5', '1522898467493-49726bf28798',
    '1502823403499-6ccfcf4fb453', '1475180098004-ca77a66827be',
    // --- 손 / 제스처 레퍼런스 (301~350) ---
    '1577896851231-70ef18881754', '1596558450268-9c27524ba856', '1471897488648-5eae4ac6686b',
    '1558618666-fcd25c85f82e', '1512361436605-a484bdb34b5f', '1519764622345-ff397f0e024d',
    '1487412720507-e7ab37603c6f', '1463453091185-61582044d556', '1488426862026-3ee34a7d66df',
    '1485893086445-ed75865251e0', '1509868918590-fe920e096e89', '1502394202744-021cfbb17454',
    '1504199367914-fe40e5a00e5d', '1492106087820-71f1a00d2b11', '1472099645785-5658abf4ff4e',
    '1500917293891-ef795e70e1f6', '1513956589380-bad6acb9b9d4', '1517365830460-955ce3ccd263',
    '1480429370677-b2e55f7139a4', '1519456264038-18a1f8aa7e27', '1488371934083-5ab3e7b37c1c',
    '1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1544005313-94ddf0286df2',
    '1507003211169-0a1dd7228f2d', '1531746020798-e6953c6e8e04', '1500648767791-00dcc994a43e',
    '1494790108377-be9c29b29330', '1531123897727-8f129e1688ce', '1521119989659-a83eee488004',
    '1507591064344-4c6ce005b128', '1531427186611-ecfd6d936c79', '1499996860823-5214fcc65f8f',
    '1528892952291-009c663ce843', '1506863530036-1efeddceb993', '1524250502761-1ac6f2e30d43',
    '1506634572416-48cdfe530110', '1539571696357-5a69c17a67c6', '1464863979621-258859e62245',
    '1484399172022-72a90b12e3c1', '1501196354995-cbb51c65adc4', '1545912452-8aea7e25a3d3',
    '1507537297725-24a1c029d3ca', '1519058082700-08a0b56da9b4', '1498551172505-8ee7ad69f235',
    '1488161628813-04466f0016e4', '1522898467493-49726bf28798', '1502823403499-6ccfcf4fb453',
    '1475180098004-ca77a66827be', '1483058712412-4245e9b90334', '1517960413843-0aee8e2b3285',
    // --- 격투 / 무술 / 액션 (351~400) ---
    '1508672019048-805c876b67e2', '1520975916090-3105956dac38', '1542178091-e101da78f5c4',
    '1519345182560-3f2917c472ef', '1548142813-c348350df52b', '1540569014015-19a7be504e3a',
    '1523264653568-7090f44d6460', '1546961342-ea5f71b193f5', '1490735891913-40897cdaafd1',
    '1501785888041-af3ef285b470', '1527576539890-dfa815648363', '1531384441138-2736e62e0919',
    '1518577915332-c2a19f149a75', '1502764613149-7f1d229e230f', '1529390079861-591c30789d3c',
    '1530268729831-4b0b9e170218', '1543269664-7461ed9e0213', '1490718720478-364a07a997cd',
    '1524638431109-93d95c968227', '1551232864-3f0890e580d9', '1555212697-194d092e3b8f',
    '1526510747491-58f928ec870f', '1510218830377-2e994ea9087d', '1531746790095-34cc90f74217',
    '1526413232644-8a40f03cc03b', '1535930749574-1399327ce78f', '1533228100845-08145152571c',
    '1534367507873-d2d7e24c797f', '1522529599102-193c0d76b5b6', '1507679799987-c73779587ccf',
    '1495555687398-3f50d6e79e1e', '1504439468489-c8920d796a29', '1504439904031-93ded9f93e4e',
    '1516726817505-f5ed825624d8', '1511367461989-f85a21fda167', '1438761681033-6461ffad8d80',
    '1504257432389-52343af06ae3', '1445384763658-0400939829cd', '1495555961986-6d4c1ecb7be3',
    '1504384764586-bb4cee2b3b38', '1568602471122-7832951cc4c5', '1518459031867-a89b944bffe4',
    '1581009146145-b5ef050c2e1e', '1541534741688-6078c6bfb5c5', '1496345875659-11f7dd282d1d',
    '1517963879433-6ad2b056d712', '1534438327276-14e5300c3a48', '1517836357463-d25dfeac3438',
    '1526506118085-60ce8714f8c5', '1574680096145-d05b13a577fd', '1549060279-7aa02077d1e0',
    // --- 다양한 포즈 / 의상 (401~450) ---
    '1571019614242-c5c5dee9f50b', '1540539234-c14a20fb7c7b', '1599058917212-d750089bc07e',
    '1594737625785-a6cbdabd333c', '1550345332-09e3ac987658', '1517130038641-a774d04afb3c',
    '1533681904397-d1c8f8bc7e6a', '1545205597-3d9d02c29597', '1518310952931-b1de897abd40',
    '1518644730709-0835105d9dce', '1506126613408-eca07ce68773', '1534258936925-c58bed479fcb',
    '1518310383802-640c2de311b2', '1581009137042-3d053737a09b', '1544367567-0f2fcb009e0b',
    '1551698618-1dfe5d97d256', '1546483875-ad9014c88eba', '1574680178050-55c6a6a96e0a',
    '1583454110551-21f2fa2afe61', '1579758629938-03607ccdbaba', '1571019613454-1cb2f99b2d8b',
    '1556817411-31ae72fa3ea0', '1593095948071-474c5cc2989d', '1552374196-c4e7ffc6e126',
    '1503023345310-bd7c1de61c7d', '1509631179647-0177331693ae', '1519085360753-af0119f7cbe7',
    '1504703395950-b89145a5425b', '1524504388940-b1c1722653e1', '1529626455594-4ff0802cfb7e',
    '1517841905240-472988babdf9', '1515886657613-9f3515b0c78f', '1461897104016-0b3b00b1ea56',
    '1476480862126-209bfaa8edc8', '1571008887538-b36bb32f4571', '1486218119243-13883505764c',
    '1552674605-db6ffd4facb5', '1522898467493-49726bf28798', '1502823403499-6ccfcf4fb453',
    '1475180098004-ca77a66827be', '1483058712412-4245e9b90334', '1512361436605-a484bdb34b5f',
    '1519764622345-ff397f0e024d', '1487412720507-e7ab37603c6f', '1463453091185-61582044d556',
    '1488426862026-3ee34a7d66df', '1485893086445-ed75865251e0', '1509868918590-fe920e096e89',
    '1502394202744-021cfbb17454', '1504199367914-fe40e5a00e5d',
    // --- 추가 인체 레퍼런스 (451~500) ---
    '1492106087820-71f1a00d2b11', '1472099645785-5658abf4ff4e', '1500917293891-ef795e70e1f6',
    '1513956589380-bad6acb9b9d4', '1517365830460-955ce3ccd263', '1480429370677-b2e55f7139a4',
    '1519456264038-18a1f8aa7e27', '1488371934083-5ab3e7b37c1c', '1534528741775-53994a69daeb',
    '1506794778202-cad84cf45f1d', '1544005313-94ddf0286df2', '1507003211169-0a1dd7228f2d',
    '1531746020798-e6953c6e8e04', '1500648767791-00dcc994a43e', '1494790108377-be9c29b29330',
    '1531123897727-8f129e1688ce', '1521119989659-a83eee488004', '1507591064344-4c6ce005b128',
    '1531427186611-ecfd6d936c79', '1499996860823-5214fcc65f8f', '1528892952291-009c663ce843',
    '1506863530036-1efeddceb993', '1524250502761-1ac6f2e30d43', '1506634572416-48cdfe530110',
    '1539571696357-5a69c17a67c6', '1464863979621-258859e62245', '1484399172022-72a90b12e3c1',
    '1501196354995-cbb51c65adc4', '1545912452-8aea7e25a3d3', '1507537297725-24a1c029d3ca',
    '1519058082700-08a0b56da9b4', '1498551172505-8ee7ad69f235', '1488161628813-04466f0016e4',
    '1522898467493-49726bf28798', '1502823403499-6ccfcf4fb453', '1475180098004-ca77a66827be',
    '1483058712412-4245e9b90334', '1517960413843-0aee8e2b3285', '1508672019048-805c876b67e2',
    '1520975916090-3105956dac38', '1542178091-e101da78f5c4', '1519345182560-3f2917c472ef',
    '1548142813-c348350df52b', '1540569014015-19a7be504e3a', '1523264653568-7090f44d6460',
    '1546961342-ea5f71b193f5', '1490735891913-40897cdaafd1', '1501785888041-af3ef285b470',
    '1527576539890-dfa815648363', '1531384441138-2736e62e0919', '1568602471122-7832951cc4c5',
    '1518459031867-a89b944bffe4',
  ];

  // 인체 포즈 중심 가중 태그 (서있기, 앉기, 걷기, 달리기, 격투 비중 높임)
  const POSE_TAGS = [
    '서있기', '서있기', '서있기', '서있기',  // 4x 가중
    '앉기', '앉기', '앉기',                  // 3x 가중
    '걷기', '걷기', '걷기',                  // 3x 가중
    '달리기', '달리기',                       // 2x 가중
    '격투', '격투',                           // 2x 가중
    '점프', '누워있기', '기대기', '뒤돌아보기', '무릎꿇기', '웅크리기', '포옹',
  ];
  // 카메라: 풀샷, 미디엄샷, 아이레벨 위주
  const CAMERA_TAGS = [
    '풀샷', '풀샷', '풀샷',                  // 3x 가중
    '미디엄샷', '미디엄샷', '미디엄샷',       // 3x 가중
    '아이레벨', '아이레벨',                   // 2x 가중
    '하이앵글', '로우앵글', '클로즈업', '바스트샷', '3/4뷰',
  ];
  const LIGHT_TAGS = ['정면광', '역광', '측광', '탑라이트', '림라이트', '자연광', '인공광', '골든아워', '블루아워', '하드라이트', '소프트라이트'];
  // 배경: 스튜디오, 야외 위주
  const BG_TAGS = [
    '스튜디오', '스튜디오', '스튜디오', '스튜디오',  // 4x 가중
    '야외', '야외', '야외',                          // 3x 가중
    '실내', '실내',                                   // 2x 가중
    '도시', '숲', '해변', '골목', '옥상',
  ];
  const PERSON_TAGS = ['남성', '여성'];
  const COUNT_TAGS = ['1인', '1인', '1인', '1인', '2인', '군중']; // 1인 가중
  // 해부학 태그: 근육, 피부결, 손 비중 높임
  const BODY_TAGS = ['마른체형', '근육질', '근육질', '근육질']; // 근육질 가중
  const MATERIAL_TAGS = ['근육', '근육', '근육', '피부결', '피부결', '가죽', '비단', '데님', '니트', '금속']; // 근육/피부결 가중
  const COSTUME_TAGS = ['드레스', '수트', '캐주얼', '스포츠웨어', '스포츠웨어', '한복', '갑옷', '군복', '교복'];
  const MOOD_TAGS = ['다크판타지', '사이버펑크', '동양풍', '중세', '웅장한', '고요한', '몽환적', '드라마틱'];
  const FACE_TAGS = ['얼굴', '웃음', '분노', '슬픔', '놀람', '무표정'];

  // 카테고리 분배: figure 60%, anatomy 20%, fabric 10%, 기타 10%
  const CATEGORY_POOL: ReferenceImage['category'][] = [
    ...Array(6).fill('figure') as ReferenceImage['category'][],
    ...Array(2).fill('anatomy') as ReferenceImage['category'][],
    'fabric',
    'environment',  // 기타 10% (environment, creature, object, landscape 순환)
  ];
  const OTHER_CATEGORIES: ReferenceImage['category'][] = ['environment', 'creature', 'object', 'landscape'];

  // 한글 제목 생성 헬퍼
  const TITLE_POSES: Record<string, string> = {
    '서있기': '서있는', '앉기': '앉은', '걷기': '걷는', '달리기': '달리는',
    '점프': '점프하는', '누워있기': '누운', '기대기': '기대는', '뒤돌아보기': '뒤돌아보는',
    '무릎꿇기': '무릎꿇은', '웅크리기': '웅크린', '격투': '격투하는', '포옹': '포옹하는',
  };
  const TITLE_LIGHTS: Record<string, string> = {
    '정면광': '정면광', '역광': '역광', '측광': '측광', '탑라이트': '탑라이트',
    '림라이트': '림라이트', '자연광': '자연광', '인공광': '인공광', '골든아워': '골든아워',
    '블루아워': '블루아워', '하드라이트': '하드라이트', '소프트라이트': '소프트라이트',
  };

  // 결정론적 난수 생성 (일관된 결과 보장)
  function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  }

  function pick<T>(arr: T[], seed: number): T {
    return arr[Math.floor(seededRandom(seed) * arr.length)];
  }

  const samples: ReferenceImage[] = [];

  for (let i = 0; i < 500; i++) {
    const id = 62 + i;
    const seed = id * 7 + 31;

    // 태그 조합 생성 (포즈 + 카메라 + 조명 + 배경 + 인물 기본)
    const pose = pick(POSE_TAGS, seed);
    const camera = pick(CAMERA_TAGS, seed + 1);
    const light = pick(LIGHT_TAGS, seed + 2);
    const bg = pick(BG_TAGS, seed + 3);
    const person = pick(PERSON_TAGS, seed + 4);
    const count = pick(COUNT_TAGS, seed + 5);

    const tags: string[] = [pose, camera, light, bg, person, count];

    // 샷 타입 보장: camera 태그가 샷 타입이 아닌 경우 별도 추가
    const SHOT_TYPES = ['풀샷', '미디엄샷', '클로즈업', '바스트샷'];
    const hasShotType = SHOT_TYPES.some((st) => tags.includes(st));
    if (!hasShotType) {
      // 포즈에 따라 적절한 샷 타입 자동 부여
      const SHOT_BY_POSE: Record<string, string[]> = {
        '서있기': ['풀샷', '미디엄샷', '바스트샷'],
        '앉기': ['미디엄샷', '바스트샷', '풀샷'],
        '걷기': ['풀샷', '미디엄샷'],
        '달리기': ['풀샷'],
        '점프': ['풀샷'],
        '누워있기': ['풀샷', '미디엄샷'],
        '기대기': ['미디엄샷', '풀샷'],
        '뒤돌아보기': ['바스트샷', '미디엄샷'],
        '무릎꿇기': ['풀샷', '미디엄샷'],
        '웅크리기': ['풀샷', '미디엄샷'],
        '격투': ['풀샷'],
        '포옹': ['미디엄샷', '풀샷'],
      };
      const shotOptions = SHOT_BY_POSE[pose] || ['미디엄샷'];
      tags.push(pick(shotOptions, seed + 20));
    }

    // 추가 태그 (확률적으로 - 인체 관련 태그 확률 높임)
    if (seededRandom(seed + 6) > 0.5) tags.push(pick(COSTUME_TAGS, seed + 7));
    if (seededRandom(seed + 8) > 0.6) tags.push(pick(MOOD_TAGS, seed + 9));
    if (seededRandom(seed + 10) > 0.5) tags.push(pick(BODY_TAGS, seed + 11)); // 체형 태그 확률 높임
    if (seededRandom(seed + 12) > 0.6) tags.push(pick(MATERIAL_TAGS, seed + 13)); // 소재 태그 확률 높임
    if (seededRandom(seed + 14) > 0.7) tags.push(pick(FACE_TAGS, seed + 15)); // 표정 태그 추가

    // 카테고리 결정 (figure 60%, anatomy 20%, fabric 10%, 기타 10%)
    let category: ReferenceImage['category'];
    // 태그 기반 카테고리 우선 결정
    if (tags.includes('근육') || tags.includes('피부결') || tags.includes('손') || tags.includes('주먹')) {
      category = 'anatomy';
    } else {
      const catIndex = Math.floor(seededRandom(seed + 16) * CATEGORY_POOL.length);
      category = CATEGORY_POOL[catIndex];
      // 기타 카테고리 내에서 순환
      if (category === 'environment') {
        category = OTHER_CATEGORIES[i % OTHER_CATEGORIES.length];
      }
    }

    // 이미지 URL (500개 Unsplash ID 직접 매핑)
    const photoId = PHOTO_IDS[i % PHOTO_IDS.length];
    const url = `https://images.unsplash.com/photo-${photoId}?w=800`;
    const thumbnailUrl = `https://images.unsplash.com/photo-${photoId}?w=400`;

    // 날짜 생성 (2024년 전체에 분산)
    const dayOffset = Math.floor(seededRandom(seed + 17) * 365);
    const date = new Date(2024, 0, 1 + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // 제목 생성
    const poseTitle = TITLE_POSES[pose] || pose;
    const lightTitle = TITLE_LIGHTS[light] || light;
    const title = `${poseTitle} 포즈 - ${lightTitle} ${bg}`;

    samples.push({
      _id: String(id),
      url,
      thumbnailUrl,
      title,
      tags: [...new Set(tags)], // 중복 제거
      category,
      createdAt: dateStr,
    });
  }

  return samples;
}

// ============================================
// Phase 2: 포즈 벡터 병합
// figure 카테고리 이미지에 합성 포즈 벡터 할당
// ============================================

// ============================================
// Phase 3: 카메라 앵글 데이터 병합
// 카메라 태그가 있는 이미지에 합성 CameraAngle 할당
// ============================================

/** 포즈 벡터 + 카메라 앵글이 병합된 샘플 이미지 목록 */
export const SAMPLE_IMAGES_WITH_POSES: ReferenceImage[] = SAMPLE_IMAGES.map((img) => {
  const result = { ...img };

  // Phase 2: 포즈 벡터 병합
  const poseVector = generatePoseVectorForImage(img._id, img.tags, img.category);
  if (poseVector) {
    result.poseVector = poseVector;
  }

  // Phase 3: 카메라 앵글 병합
  const cameraAngle = generateCameraAngleForImage(img.tags, img._id);
  if (cameraAngle) {
    result.cameraAngle = cameraAngle;
  }

  // Phase 5: 조명 방향 병합
  const lightDir = generateLightDirectionForImage(img.tags, img._id);
  if (lightDir) {
    result.lightDirection = lightDir;
  }

  return result;
});
