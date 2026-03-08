// ============================================
// 포즈 프리셋 데이터 (v3 설계서 기반)
// 프리셋 선택 → 매핑 태그 → 자동 검색
// ============================================

/** 전신 포즈 프리셋 정의 */
export interface PosePreset {
  id: string;
  label: string;
  /** 검색에 사용할 매핑 태그 */
  tags: string[];
  /** 카드에 표시할 실루엣 SVG 경로 (d 속성) */
  silhouette: string;
}

/** 카메라 앵글 프리셋 정의 */
export interface CameraPreset {
  id: string;
  label: string;
  /** 검색에 사용할 매핑 태그 */
  tags: string[];
  /** Three.js 카메라 위치 [x, y, z] */
  position: [number, number, number];
  /** 카메라가 바라보는 대상 좌표 */
  target: [number, number, number];
}

/** 조명 패턴 프리셋 정의 */
export interface LightingPreset {
  id: string;
  label: string;
  tags: string[];
  /** 광원 방향 (azimuth: 0-360, 수평 회전각) */
  azimuth: number;
  /** 광원 방향 (elevation: -90~90, 수직 각도) */
  elevation: number;
  /** 광원 세기 (0~1) */
  intensity: number;
  /** 색온도 (Kelvin, 기본 5500) — 신규, 하위 호환 */
  colorTemp?: number;
  /** 멀티 라이트 확장 프리셋 ID 참조 (lighting-presets.ts) — 신규, 하위 호환 */
  extendedPresetId?: string;
}

/** 손 포즈 프리셋 정의 */
export interface HandPreset {
  id: string;
  label: string;
  tags: string[];
  silhouette: string;
}

// ============================================
// 전신 프리셋 8개 (v3 설계서 §4-1)
// ============================================
export const POSE_PRESETS: PosePreset[] = [
  {
    id: 'standing',
    label: '서기',
    tags: ['서있기', '아이레벨'],
    // 기본 A-pose 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 4h2l-1-4h1v-1H8v1h1l-1 4h2l1-4zm-3 5l-1 7h2l1-5 1 5h2l-1-7H8z',
  },
  {
    id: 'sitting',
    label: '앉기',
    tags: ['앉기', '아이레벨'],
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h4v5h-1l2 4h-2l-2-4h-1v4H8v-4l-2 4H4l2-4H5V8z',
  },
  {
    id: 'walking',
    label: '걷기',
    tags: ['걷기', '아이레벨'],
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l.5 4h1.5l1 5h-2l-.5-3-1.5 3h-2l1-5h1.5l.5-4z',
  },
  {
    id: 'running',
    label: '달리기',
    tags: ['달리기', '풀샷'],
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 5l-3 2 1 1 2-1v3l-3 5h2l2-4 2 4h2l-3-5V9l2 1 1-1-3-2z',
  },
  {
    id: 'looking-back',
    label: '뒤돌아보기',
    tags: ['뒤돌아보기', '3/4뷰'],
    silhouette: 'M13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h3l1 4h1l-1-4h1v-1H9v1h1l1 4zm-2 5l-1 7h2l1-5 1 5h2l-1-7H9z',
  },
  {
    id: 'reaching',
    label: '팔 뻗기',
    tags: ['서있기', '미디엄샷'],
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2v1h4v2h-4v2l1 5h-2l-1-4-1 4H8l1-5V11H5V9h4V8z',
  },
  {
    id: 'crouching',
    label: '웅크리기',
    tags: ['웅크리기', '로우앵글'],
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 7h6v3h-1l1 3h-2l-1-2-1 2H9l1-3H9V9zm0 7l-1 3h2l1-2 1 2h2l-1-3H9z',
  },
  {
    id: 'leaning',
    label: '기대기',
    tags: ['기대기', '3/4뷰'],
    silhouette: 'M13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h3l1 5h2v2h-3l-1 5h-2l1-5H9l-1 5H6l1-5V8z',
  },
  // ---- 액션/격투 포즈 프리셋 ----
  {
    id: 'kick',
    label: '발차기',
    tags: ['격투', '풀샷'],
    // 한쪽 다리를 높이 차올린 발차기 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 3h3v2h-4l-1 2-2 5h-2l2-5-1-2H7l-1 5H4l2-5 1-2V8z',
  },
  {
    id: 'punch',
    label: '펀치',
    tags: ['격투', '미디엄샷'],
    // 팔을 앞으로 뻗은 펀치 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2v1h5v2h-5v2l1 5h-2l-1-4-1 4H8l1-5V9h-3V7h4z',
  },
  {
    id: 'guard',
    label: '방어',
    tags: ['격투', '아이레벨'],
    // 두 팔을 올려 방어 자세 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 5l2 1v1h2V8l2-1v3h-1v2l1 5h-2l-1-4-1 4H9l1-5v-2H9V7z',
  },
  {
    id: 'sword-swing',
    label: '칼휘두르기',
    tags: ['격투', '풀샷'],
    // 양손으로 칼을 휘두르는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 2 3-2 1 1-4 3v2l1 5h-2l-1-4-1 4H9l1-5v-3L6 8l1-1 3 2 1-1z',
  },
  {
    id: 'kneeling',
    label: '무릎꿇기',
    tags: ['무릎꿇기', '아이레벨'],
    // 무릎을 꿇고 앉은 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h4v4h-1l2 3v2h-2v-1l-1-2-1 2v1H9v-2l2-3h-1v-4zm-1 10h6v2H9z',
  },
  // ---- 일상 포즈 프리셋 ----
  {
    id: 'lying-down',
    label: '누워있기',
    tags: ['누워있기', '로우앵글', '일상'],
    // 바닥에 누운 실루엣
    silhouette: 'M2 12h4l1-2h2l1 2h4l1-1h2l1 1h2v2H2z',
  },
  {
    id: 'arms-crossed',
    label: '팔짱끼기',
    tags: ['팔짱끼기', '아이레벨', '일상'],
    // 팔짱을 낀 서있는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h4v2h-1l1 1h-4l1-1h-1V8zm-1 4h6v1l-1 5h-2l-1-4-1 4H8l1-5z',
  },
  {
    id: 'stretching',
    label: '기지개',
    tags: ['기지개', '풀샷', '일상'],
    // 양팔을 위로 뻗은 기지개 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 4l2-2h2l2 2v3h-1v3l1 5h-2l-1-4-1 4H9l1-5v-3H9V6z',
  },
  {
    id: 'phone-call',
    label: '전화통화',
    tags: ['전화통화', '미디엄샷', '일상'],
    // 한손으로 전화기를 든 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2v1h2l1-3h1v4h-2l-1 1v3l1 5h-2l-1-4-1 4H9l1-5V9H9V8z',
  },
  {
    id: 'chin-rest',
    label: '턱괴기',
    tags: ['턱괴기', '미디엄샷', '일상'],
    // 한손으로 턱을 괸 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h4v1l2-1v2h-2v2h-1l1 5h-2l-1-4-1 4H8l1-5V9H8V8z',
  },
  {
    id: 'climbing-stairs',
    label: '계단오르기',
    tags: ['계단오르기', '풀샷', '일상'],
    // 계단을 오르는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 3 1-1v2h-2v2l1 4h-2l-1-3-1 3H8l1-4v-3l-2 1V9l2-1z',
  },
  // ---- 액션 포즈 프리셋 (추가) ----
  {
    id: 'jumping',
    label: '점프',
    tags: ['점프', '풀샷', '액션'],
    // 공중에 뛴 점프 실루엣
    silhouette: 'M12 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3 6l2-1h2l2 1-1 2h-1v3l2 4h-2l-1-3-1 3H9l2-4V8h-1L9 7z',
  },
  {
    id: 'dodging',
    label: '회피',
    tags: ['회피', '풀샷', '액션'],
    // 몸을 숙여 회피하는 실루엣
    silhouette: 'M14 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4 6l3-1 1 3-2 1v2l2 4h-2l-1-3-2 3H7l2-5v-2L6 9V7l4 1z',
  },
  {
    id: 'archery',
    label: '활쏘기',
    tags: ['활쏘기', '풀샷', '액션'],
    // 활을 당기는 사수 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 2 3 0v2h-3l-1 2v2l1 4h-2l-1-3-1 3H8l1-4v-3l-3-1V9l3 1 1-2z',
  },
  {
    id: 'shooting',
    label: '총쏘기',
    tags: ['총쏘기', '미디엄샷', '액션'],
    // 양손으로 총을 겨누는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2v1h5v1h-5v3l1 5h-2l-1-4-1 4H8l1-5V9H6V8h5z',
  },
  {
    id: 'throwing',
    label: '던지기',
    tags: ['던지기', '풀샷', '액션'],
    // 공을 던지는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2l1 1 2-3 1 1-2 3-1 1v2l1 5h-2l-1-4-1 4H9l1-5v-3L8 8h3z',
  },
  // ---- 감정 표현 포즈 프리셋 ----
  {
    id: 'sadness',
    label: '슬픔(고개숙이기)',
    tags: ['슬픔', '고개숙이기', '감정', '미디엄샷'],
    // 고개를 숙인 슬픈 실루엣
    silhouette: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 7h4v1h-1v3l1 5h-2l-1-4-1 4H8l1-5v-3H9v-1zm1-1l1-1v1h-1z',
  },
  {
    id: 'joy',
    label: '기쁨(만세)',
    tags: ['기쁨', '만세', '감정', '풀샷'],
    // 양팔을 높이 든 만세 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4 3l2-2h1v2H9zm7-2l2 2h-2V3zm-4 5h2v4l1 5h-2l-1-4-1 4H8l1-5V8z',
  },
  {
    id: 'surprise',
    label: '놀람(뒤로물러남)',
    tags: ['놀람', '뒤로물러남', '감정', '풀샷'],
    // 놀라서 뒤로 물러나는 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 5l-2-1 1-1 2 1h2l2-1 1 1-2 1v3l1 5h-2l-1-4-1 4H9l1-5V7z',
  },
  // ---- 모델 포즈 프리셋 ----
  {
    id: 'model-pose-1',
    label: '모델포즈1(한손허리)',
    tags: ['모델포즈', '한손허리', '아이레벨', '포즈'],
    // 한손을 허리에 올린 모델 포즈 실루엣
    silhouette: 'M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-1 6h2v2h2l-1-2h1l1 2-1 1h-2v3l1 5h-2l-1-4-1 4H8l1-5v-3H8l1-1-1-2h1l1 2V8z',
  },
  {
    id: 'model-pose-2',
    label: '모델포즈2(기대선)',
    tags: ['모델포즈', '기대선', '3/4뷰', '포즈'],
    // 벽에 기대어 서있는 모델 포즈 실루엣
    silhouette: 'M13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 6h3l1 4h1v2h-2l-1 4h-2l1-4H10l-1 4H7l1-4v-2l1-4zm6 0v12h1V8z',
  },
];

// ============================================
// 카메라 앵글 프리셋 6개 (v3 설계서 §5-1)
// ============================================
export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'front',
    label: '정면',
    tags: ['아이레벨'],
    position: [0, 1.2, 3],
    target: [0, 1, 0],
  },
  {
    id: 'three-quarter',
    label: '3/4뷰',
    tags: ['3/4뷰'],
    position: [2, 1.2, 2.5],
    target: [0, 1, 0],
  },
  {
    id: 'side',
    label: '측면',
    // 버그 수정: '3/4뷰' → '측면' (실제 측면 카메라이므로 측면 태그가 맞음)
    tags: ['아이레벨'],
    position: [3, 1.2, 0],
    target: [0, 1, 0],
  },
  {
    id: 'low-angle',
    label: '로우앵글',
    tags: ['로우앵글'],
    position: [0, 0.3, 3],
    target: [0, 1, 0],
  },
  {
    id: 'eye-level',
    label: '아이레벨',
    tags: ['아이레벨'],
    position: [0, 1.5, 3],
    target: [0, 1, 0],
  },
  {
    id: 'high-angle',
    label: '하이앵글',
    tags: ['하이앵글'],
    position: [0, 3, 2],
    target: [0, 1, 0],
  },
  {
    id: 'birds-eye',
    label: '버드아이',
    tags: ['하이앵글'],
    // 거의 수직 위에서 내려다보는 조감도 시점
    position: [0, 5, 0.5],
    target: [0, 0, 0],
  },
  {
    id: 'dutch-angle',
    label: '더치앵글',
    tags: ['아이레벨'],
    // 기울어진 구도의 더치앵글 (대각선 위치)
    position: [1.5, 1.5, 2.5],
    target: [0, 1, 0],
  },
  {
    id: 'over-the-shoulder',
    label: '오버더숄더',
    tags: ['오버더숄더', '미디엄샷'],
    // 어깨 너머로 촬영하는 시점 (뒤쪽 측면에서)
    position: [-0.5, 1.5, -1],
    target: [0, 1.2, 2],
  },
  {
    id: 'close-up',
    label: '클로즈업',
    tags: ['클로즈업', '아이레벨'],
    // 얼굴에 가까이 다가간 클로즈업 시점
    position: [0, 1.5, 1],
    target: [0, 1.5, 0],
  },
  {
    id: 'full-shot-wide',
    label: '풀샷와이드',
    tags: ['풀샷', '와이드'],
    // 전신을 넓게 담는 풀샷 와이드 시점
    position: [0, 1.2, 6],
    target: [0, 1, 0],
  },
  {
    id: 'extreme-low-angle',
    label: '극단로우앵글',
    tags: ['로우앵글', '극단앵글'],
    // 거의 바닥에서 올려다보는 극단 로우앵글
    position: [0, 0.05, 2.5],
    target: [0, 1.5, 0],
  },
];

// ============================================
// 조명 패턴 프리셋 4개 (클래식 인물 조명)
// ============================================
export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'rembrandt',
    label: '렘브란트',
    tags: ['측광', '하드라이트'],
    // 45도 측면 상단에서 비추는 렘브란트 조명
    azimuth: 45,
    elevation: 35,
    intensity: 0.8,
  },
  {
    id: 'loop',
    label: '루프',
    tags: ['정면광', '소프트라이트'],
    // 30도 측면 낮은 각도의 루프 조명
    azimuth: 30,
    elevation: 25,
    intensity: 0.6,
  },
  {
    id: 'butterfly',
    label: '버터플라이',
    tags: ['정면광', '탑라이트'],
    // 정면 위에서 비추는 버터플라이(파라마운트) 조명
    azimuth: 0,
    elevation: 50,
    intensity: 0.7,
  },
  {
    id: 'split',
    label: '스플릿',
    tags: ['측광', '하드라이트'],
    // 90도 완전 측면에서 비추는 스플릿 조명
    azimuth: 90,
    elevation: 10,
    intensity: 0.8,
  },
  {
    id: 'rim-light',
    label: '림라이트(역광)',
    tags: ['역광', '림라이트', '하드라이트'],
    // 피사체 뒤에서 비추는 역광(림라이트) — 외곽선 강조
    azimuth: 180,
    elevation: 20,
    intensity: 0.9,
  },
  {
    id: 'broad-light',
    label: '브로드라이트',
    tags: ['측광', '소프트라이트', '브로드'],
    // 카메라 쪽으로 돌린 얼굴의 넓은 면을 비추는 조명
    azimuth: 30,
    elevation: 15,
    intensity: 0.65,
  },
  {
    id: 'short-light',
    label: '숏라이트',
    tags: ['측광', '하드라이트', '숏'],
    // 카메라 반대쪽 좁은 면을 비추는 조명 — 깊이감 강조
    azimuth: 120,
    elevation: 20,
    intensity: 0.7,
  },
  {
    id: 'silhouette',
    label: '실루엣',
    tags: ['역광', '실루엣', '하드라이트'],
    // 완전한 역광으로 피사체를 실루엣화하는 조명
    azimuth: 180,
    elevation: 5,
    intensity: 1.0,
  },
];

// ============================================
// 손 프리셋 5개 (v3 설계서 §4-2)
// ============================================
export const HAND_PRESETS: HandPreset[] = [
  {
    id: 'open-hand',
    label: '편 손',
    tags: ['손'],
    silhouette: 'M8 12l1-4 1 4v4H8zm2-6l1-4 1 4v6h-2zm2-1l1-5 1 5v7h-2zm2 1l1-4 1 4v6h-2zm2 2l1-3 .5 3v4H16z',
  },
  {
    id: 'fist',
    label: '주먹',
    tags: ['주먹'],
    silhouette: 'M8 10h8v6H8zm1-2h2v2H9zm2 0h2v2h-2zm2 0h2v2h-2z',
  },
  {
    id: 'gripping',
    label: '쥐기',
    tags: ['물건쥐기'],
    silhouette: 'M10 6v4h4V6h-4zM8 11h8v5H8zm1-3h2v3H9zm4 0h2v3h-2z',
  },
  {
    id: 'pointing',
    label: '가리키기',
    tags: ['손'],
    silhouette: 'M12 2l1 6h-2l1-6zm-3 8h6v6H9zm0-2h2v2H9zm4 0h2v2h-2z',
  },
  {
    id: 'peace',
    label: '브이',
    tags: ['손'],
    silhouette: 'M10 3l1 5h-2zm4 0l1 5h-2zm-5 7h6v6H9zm0-2h2v2H9zm4 0h2v2h-2z',
  },
  {
    id: 'ok-sign',
    label: 'OK사인',
    tags: ['손', 'OK'],
    // 엄지와 검지로 원을 만든 OK 사인 실루엣
    silhouette: 'M10 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm5 2l1-4 1 4v6h-2zm-7 0l1-4v6H7zm2 4h6v4H10zm2-4l1-3v3h-2z',
  },
  {
    id: 'thumbs-up',
    label: '엄지척',
    tags: ['손', '엄지척', '좋아요'],
    // 엄지를 위로 치켜든 실루엣
    silhouette: 'M11 3l1-1 1 4v3h3v2h-3v5h-2V9H9V7h2V3zm-2 8h6v5H9z',
  },
  {
    id: 'open-palm',
    label: '손바닥펴기',
    tags: ['손', '손바닥'],
    // 손바닥을 활짝 편 실루엣
    silhouette: 'M8 11l1-5 1 5v5H8zm2-6l1-5 1 5v6h-2zm2-1l1-6 1 6v7h-2zm2 1l1-5 1 5v6h-2zm2 2l1-4 1 4v4h-2zM8 17h10v2H8z',
  },
  {
    id: 'finger-heart',
    label: '손가락하트',
    tags: ['손', '하트', '손가락하트'],
    // 엄지와 검지를 교차해 하트를 만든 실루엣
    silhouette: 'M10 5l2-3 2 3-2 3-2-3zm-1 7h6v4h-1l1 3h-2l-1-2-1 2H10l1-3H10v-4z',
  },
  {
    id: 'writing',
    label: '글씨쓰기',
    tags: ['손', '글씨쓰기', '펜잡기'],
    // 펜을 잡고 글씨 쓰는 손 실루엣
    silhouette: 'M14 3l-4 8h2l3-7 1 1-3 7h-2l4-8-1-1zm-5 9h6v4H9zm0-2h2v2H9zm4 0h2v2h-2z',
  },
];
