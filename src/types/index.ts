// ============================================
// ArtRef Finder - Core Type Definitions
// ============================================

// --- User (bkend.ai /auth/me 응답 기반) ---
export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string | null;
  role: string;
  image?: string | null;
  emailVerified?: string | null;
  /** 구독 플랜 (free/lite/student/pro/team) - 별도 테이블에서 관리 예정 */
  plan?: 'free' | 'lite' | 'student' | 'pro' | 'team';
  /** 학생 인증 완료 여부 (student 플랜 전용) */
  studentVerified?: boolean;
  /** 결제 주기 (월간/연간) */
  billingCycle?: 'monthly' | 'annual';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// --- Image / Reference Photo ---
export interface ReferenceImage {
  _id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  tags: string[];
  category: ImageCategory;
  // Phase 2: AI-extracted data
  poseVector?: number[];
  lightDirection?: LightDirection;
  // Phase 3
  cameraAngle?: CameraAngle;
  createdAt: string;
  // --- 이미지 파이프라인 확장 필드 ---
  /** Unsplash 이미지 ID (중복 수집 방지) */
  unsplashId?: string;
  /** 이미지 출처 구분 */
  source?: 'sample' | 'unsplash' | 'upload';
  /** NSFW 안전 점수 (0=안전, 1=위험) */
  safetyScore?: number;
  /** 포즈 벡터 추출 완료 여부 */
  poseExtracted?: boolean;
  /** Unsplash 원본 메타데이터 */
  unsplashMeta?: {
    description?: string;
    altDescription?: string;
    exif?: Record<string, string | number>;
    unsplashTags?: string[];
  };
}

export type ImageCategory =
  | 'figure'      // 인물
  | 'landscape'   // 풍경
  | 'object'      // 오브제
  | 'fabric'      // 의상/소재
  | 'anatomy'     // 해부학/근육
  | 'environment' // 환경 (카페, 교실 등 구체적 장소)
  | 'creature';   // 크리처/몬스터

// --- Light Direction ---
export interface LightDirection {
  azimuth: number;   // 수평 각도 (0-360)
  elevation: number; // 수직 각도 (-90 ~ 90)
  intensity: number; // 강도 (0-1)
}

// --- Camera Angle ---
export interface CameraAngle {
  pitch: number;     // 상하 (-90 ~ 90)
  yaw: number;       // 좌우 (-180 ~ 180)
  fov: number;       // 화각
  type: 'high' | 'eye' | 'low' | 'bird' | 'worm';
}

// --- Collection (즐겨찾기 폴더 + 무드보드) ---
/** 이미지 어노테이션 (Phase 6) */
export interface ImageAnnotation {
  /** 메모 텍스트 (최대 200자) */
  memo: string;
  /** 개인 태그 (최대 5개) */
  customTags: string[];
}

/** 프리폼 레이아웃 위치/크기 (Phase 6) */
export interface FreeformPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 컬렉션 레이아웃 타입 */
export type CollectionLayout = 'grid' | 'masonry' | 'freeform';

export interface Collection {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  imageIds: string[];
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Phase 6: 무드보드 확장 (하위 호환: 모두 optional)
  /** 레이아웃 모드 (기본: grid) */
  layout?: CollectionLayout;
  /** 그리드 열 수 (기본: 3) */
  gridColumns?: 2 | 3 | 4;
  /** 이미지별 어노테이션 */
  annotations?: Record<string, ImageAnnotation>;
  /** 프리폼 모드 위치/크기 */
  freeformPositions?: Record<string, FreeformPosition>;
}

// --- Search ---
export interface SearchFilters {
  query?: string;
  tags?: string[];
  category?: ImageCategory;
  lightDirection?: Partial<LightDirection>;
  cameraAngle?: Partial<CameraAngle>;
  page?: number;
  limit?: number;
}

/** 유사도 점수가 포함된 레퍼런스 이미지 */
export interface ScoredReferenceImage extends ReferenceImage {
  similarityScore?: number;
}

export interface SearchResult {
  images: ScoredReferenceImage[];
  total: number;
  page: number;
  totalPages: number;
}

// --- Auth ---
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// --- Subscription (구독 플랜) ---

/** 구독 플랜 종류 */
export type SubscriptionPlan = 'free' | 'lite' | 'student' | 'pro' | 'team';

/** 구독 상태 */
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

/** 결제 주기 */
export type BillingCycle = 'monthly' | 'annual';

/** 구독 정보 */
export interface Subscription {
  /** bkend 레코드 ID */
  id: string;
  /** 구독 중인 유저 ID */
  userId: string;
  /** 구독 플랜 */
  plan: SubscriptionPlan;
  /** 구독 상태 */
  status: SubscriptionStatus;
  /** 결제 주기 */
  billingCycle: BillingCycle;
  /** 구독 시작일 (ISO 8601) */
  startedAt: string;
  /** 구독 만료일 (ISO 8601, free 플랜은 null) */
  expiresAt: string | null;
  /** 취소 요청일 (canceled 상태일 때 설정) */
  canceledAt?: string | null;
  /** 트라이얼 종료일 (trial 상태일 때 설정) */
  trialEndsAt?: string | null;
  /** 자동 갱신 여부 */
  autoRenew: boolean;
  /** bkend 자동 생성 필드 */
  createdAt: string;
  updatedAt: string;
}

/** 플랜별 기능 제한 */
export interface PlanLimits {
  /** 일일 검색 횟수 (-1은 무제한) */
  dailySearches: number;
  /** 최대 컬렉션 개수 (-1은 무제한) */
  maxCollections: number;
  /** 최대 저장 포즈 개수 (-1은 무제한) */
  maxSavedPoses: number;
  /** AI 검색 사용 가능 여부 */
  aiSearch: boolean;
  /** 팀 공유 기능 사용 가능 여부 */
  teamSharing: boolean;
  /** 고화질 다운로드 가능 여부 */
  hdDownload: boolean;
  /** 월 요금 (원, free=0) */
  priceMonthly: number;
}

/** 결제 상태 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/** 결제 내역 레코드 */
export interface PaymentRecord {
  /** bkend 레코드 ID */
  id: string;
  /** 유저 ID */
  userId: string;
  /** 연결된 구독 ID */
  subscriptionId: string;
  /** 토스페이먼츠 orderId */
  orderId: string;
  /** 토스페이먼츠 paymentKey */
  paymentKey: string;
  /** 결제 금액 (원) */
  amount: number;
  /** 결제 상태 */
  status: PaymentStatus;
  /** 결제한 플랜 */
  plan: SubscriptionPlan;
  /** 결제 주기 */
  billingCycle: BillingCycle;
  /** 토스 승인 시각 */
  approvedAt: string | null;
  /** bkend 자동 생성 */
  createdAt: string;
  updatedAt: string;
}

/** checkLimit에서 사용하는 기능 키 */
export type FeatureKey =
  | 'dailySearch'
  | 'createCollection'
  | 'savePose'
  | 'aiSearch'
  | 'teamSharing'
  | 'hdDownload';

// --- 3D Mannequin ---
export interface JointRotation {
  name: string;
  rotation: [number, number, number]; // [x, y, z] in radians
}

export interface MannequinPose {
  joints: JointRotation[];
  name?: string;
}
