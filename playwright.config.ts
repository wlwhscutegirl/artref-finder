import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정 파일
 *
 * - baseURL: 로컬 개발 서버 (http://localhost:3000)
 * - 테스트 디렉토리: tests/e2e/
 * - 브라우저: Chromium, Firefox, WebKit (주요 3개)
 * - CI 환경에서는 webServer 옵션으로 자동 서버 실행 가능
 */
export default defineConfig({
  /* 테스트 파일 위치 */
  testDir: './tests/e2e',

  /* 테스트 실행 완료 후 결과 디렉토리 */
  outputDir: './test-results',

  /* 각 테스트의 최대 실행 시간 (30초) */
  timeout: 30_000,

  /* expect 단언의 최대 대기 시간 (5초) */
  expect: {
    timeout: 5_000,
  },

  /* 테스트 전체 재시도 횟수 (CI에서 flaky 테스트 대응) */
  retries: process.env.CI ? 2 : 0,

  /* 병렬 실행 워커 수 */
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 설정 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  /* 모든 프로젝트에 공통 적용되는 설정 */
  use: {
    /* 기본 URL — 모든 page.goto('/')가 이 URL 기준으로 동작 */
    baseURL: 'http://localhost:3000',

    /* 실패 시 스크린샷 캡처 */
    screenshot: 'only-on-failure',

    /* 실패 시 트레이스 기록 */
    trace: 'on-first-retry',

    /* 뷰포트 크기 */
    viewport: { width: 1280, height: 720 },
  },

  /* 브라우저별 프로젝트 정의 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* 로컬 개발 서버 자동 실행 (CI에서 활용) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    /* 서버가 이미 실행 중이면 재사용 */
    reuseExistingServer: !process.env.CI,
    /* 서버 시작 대기 시간 (60초) */
    timeout: 60_000,
  },
});
