// ============================================
// 디바이스 성능 감지 모듈
// GPU/WebGL 벤치마크 + 등급 판정 (high/medium/low)
// 모바일 감지 + WebGL 정보 수집
// ============================================

/** 디바이스 성능 등급 */
export type DeviceGrade = 'high' | 'medium' | 'low';

/** WebGL 정보 */
export interface WebGLInfo {
  /** 렌더러 이름 (예: "ANGLE (NVIDIA GeForce RTX 3080)") */
  renderer: string;
  /** GPU 벤더 */
  vendor: string;
  /** WebGL 버전 (1 또는 2) */
  version: number;
  /** 최대 텍스처 크기 */
  maxTextureSize: number;
  /** 최대 렌더버퍼 크기 */
  maxRenderbufferSize: number;
}

/** 벤치마크 결과 */
export interface BenchmarkResult {
  /** 등급 */
  grade: DeviceGrade;
  /** WebGL 정보 */
  webgl: WebGLInfo | null;
  /** 모바일 여부 */
  isMobile: boolean;
  /** 태블릿 여부 */
  isTablet: boolean;
  /** 벤치마크 소요 시간 (ms) */
  benchmarkMs: number;
  /** 권장 DPR */
  recommendedDpr: number;
}

/**
 * 터치 디바이스 감지 (모바일 + 태블릿 모두 포함)
 * 터치 이벤트 지원 여부만 판별
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 모바일 기기 감지
 * 터치 + 화면 크기 기반
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  // 터치 지원 여부
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // 화면 너비 768px 미만
  const isSmallScreen = window.innerWidth < 768;
  // UA 문자열 기반 보조 판별
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return (hasTouch && isSmallScreen) || mobileUA;
}

/**
 * 태블릿 기기 감지
 * 터치 지원 + 768px~1366px 화면 (iPad Pro 포함)
 * 모바일(768px 미만)은 제외
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;

  const hasTouch = isTouchDevice();
  const width = window.innerWidth;
  // 터치 지원 + 태블릿 해상도 범위 (768px~1366px)
  const isTabletSize = width >= 768 && width <= 1366;
  // iPad UA 보조 판별 (iPadOS 13+는 데스크탑 UA를 보냄)
  const tabletUA = /iPad/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return (hasTouch && isTabletSize) || tabletUA;
}

/**
 * WebGL 렌더러 정보 수집
 * 오프스크린 캔버스로 GPU 정보 추출
 */
export function getWebGLInfo(): WebGLInfo | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  // WebGL2 우선 시도
  const gl =
    (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
    (canvas.getContext('webgl') as WebGLRenderingContext | null);

  if (!gl) return null;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : gl.getParameter(gl.VENDOR);

  const version = gl instanceof WebGL2RenderingContext ? 2 : 1;
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;

  // 컨텍스트 해제
  const loseCtx = gl.getExtension('WEBGL_lose_context');
  loseCtx?.loseContext();

  return { renderer, vendor, version, maxTextureSize, maxRenderbufferSize };
}

/**
 * 간이 GPU 벤치마크
 * 오프스크린 캔버스에서 삼각형 1000개 렌더 시간 측정
 * 반환: 렌더링 소요 시간 (ms)
 */
function runGpuBenchmark(): number {
  if (typeof document === 'undefined') return 999;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) return 999;

  // 간단한 정점 셰이더
  const vsSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
  const fsSource = `
    precision mediump float;
    void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
  `;

  // 셰이더 컴파일
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vsSource);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, fsSource);
  gl.compileShader(fs);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  // 정점 버퍼: 1000개 삼각형 (3000개 정점)
  const vertices = new Float32Array(6000);
  for (let i = 0; i < 3000; i++) {
    vertices[i * 2] = Math.random() * 2 - 1;
    vertices[i * 2 + 1] = Math.random() * 2 - 1;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // 벤치마크: 5회 렌더 평균
  const start = performance.now();
  for (let i = 0; i < 5; i++) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3000);
  }
  gl.finish(); // GPU 동기화
  const elapsed = performance.now() - start;

  // 정리
  gl.deleteBuffer(buffer);
  gl.deleteProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  const loseCtx = gl.getExtension('WEBGL_lose_context');
  loseCtx?.loseContext();

  return elapsed;
}

/**
 * 저사양 GPU 키워드 감지
 * 렌더러 이름에서 저사양 GPU 패턴 매칭
 */
function isLowEndGpu(renderer: string): boolean {
  const lowEndPatterns = [
    /Intel.*HD Graphics [1-5]\d{2}/i,   // Intel HD 100~599
    /Intel.*UHD Graphics [1-5]\d{2}/i,   // Intel UHD 100~599
    /Mali-[GT]4/i,                        // ARM Mali 구형
    /Adreno [1-4]\d{2}/i,                // Qualcomm Adreno 구형
    /PowerVR/i,                           // PowerVR (저사양 모바일)
    /SwiftShader/i,                       // 소프트웨어 렌더러
    /llvmpipe/i,                          // 소프트웨어 렌더러
  ];

  return lowEndPatterns.some((p) => p.test(renderer));
}

/**
 * 디바이스 성능 등급 감지
 * GPU 벤치마크 + WebGL 정보 + 모바일 여부 종합 판정
 */
export function detectDeviceGrade(): BenchmarkResult {
  const mobile = isMobile();
  const tablet = isTablet();
  const webgl = getWebGLInfo();
  const benchmarkMs = runGpuBenchmark();

  let grade: DeviceGrade;

  if (!webgl) {
    // WebGL 지원 안 됨 → 무조건 Low
    grade = 'low';
  } else if (webgl.version === 1) {
    // WebGL1만 지원 → Low
    grade = 'low';
  } else if (mobile) {
    // 모바일: 벤치마크 기반
    if (benchmarkMs < 10) {
      grade = 'medium'; // 고사양 모바일
    } else {
      grade = 'low';
    }
  } else if (isLowEndGpu(webgl.renderer)) {
    // 데스크탑 저사양 GPU
    grade = benchmarkMs < 10 ? 'medium' : 'low';
  } else {
    // 데스크탑 판정
    if (benchmarkMs < 5) {
      grade = 'high';
    } else if (benchmarkMs < 20) {
      grade = 'medium';
    } else {
      grade = 'low';
    }
  }

  // 권장 DPR 계산 (모바일은 성능 우선으로 1.0 고정, 데스크탑만 등급별 차등)
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  let recommendedDpr: number;
  if (mobile) {
    // 모바일: 성능 우선, DPR 1.0 고정
    recommendedDpr = 1;
  } else {
    switch (grade) {
      case 'high':
        recommendedDpr = Math.min(deviceDpr, 2);
        break;
      case 'medium':
        recommendedDpr = Math.min(deviceDpr, 1.5);
        break;
      case 'low':
        recommendedDpr = 1;
        break;
    }
  }

  return { grade, webgl, isMobile: mobile, isTablet: tablet, benchmarkMs, recommendedDpr };
}
