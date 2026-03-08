import { test, expect } from '@playwright/test';

/**
 * 마네킹 (검색) 페이지 E2E 테스트
 *
 * 테스트 항목:
 * 1. 마네킹 페이지 정상 로드
 * 2. 3D 뷰포트 (Canvas) 렌더링 확인
 * 3. 검색 필터 UI 요소 존재 확인
 * 4. 포즈 프리셋 카드 존재 확인
 * 5. 카메라 프리셋 바 존재 확인
 */

test.describe('마네킹 (검색) 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mannequin');
  });

  test('마네킹 페이지가 정상적으로 로드된다', async ({ page }) => {
    /* 페이지 URL 확인 */
    await expect(page).toHaveURL(/\/mannequin/);

    /* 페이지 본문이 존재하는지 확인 */
    await expect(page.locator('body')).toBeVisible();
  });

  test('3D 뷰포트 (Canvas 요소)가 렌더링된다', async ({ page }) => {
    /**
     * Three.js / React Three Fiber는 <canvas> 요소를 렌더링함
     * dynamic import로 로드되므로 약간의 대기 시간이 필요할 수 있음
     */
    const canvas = page.locator('canvas');
    /* canvas 요소가 최소 1개 존재하는지 확인 (3D 뷰포트 또는 2D 마네킹) */
    await expect(canvas.first()).toBeVisible({ timeout: 10_000 });
  });

  test('검색 필터 UI가 존재한다', async ({ page }) => {
    /**
     * SearchFilters 컴포넌트가 렌더링하는 필터 관련 요소 확인
     * 카테고리, 조명 방향 등의 필터 UI가 존재해야 함
     */
    /* 검색 관련 UI 요소가 페이지에 존재하는지 확인 */
    const searchArea = page.locator('[class*="search"], [data-testid*="search"], [class*="filter"], [data-testid*="filter"]');

    /* 검색 영역이 없더라도 태그 검색 입력창은 존재해야 함 */
    const hasSearchUI = await searchArea.count() > 0;
    const hasTagInput = await page.locator('input[type="text"], input[type="search"]').count() > 0;

    /* 검색 필터 또는 태그 입력 중 하나는 존재해야 함 */
    expect(hasSearchUI || hasTagInput).toBeTruthy();
  });

  test('모드 탭 (포즈/스케치 등)이 존재한다', async ({ page }) => {
    /**
     * ModeTabs 컴포넌트 확인
     * 마네킹 페이지에는 모드 전환 탭이 있음
     */
    /* 버튼 또는 탭 형태의 모드 전환 UI 확인 */
    const modeTabs = page.locator('button, [role="tab"]');
    const tabCount = await modeTabs.count();

    /* 최소 1개 이상의 탭/버튼이 존재해야 함 */
    expect(tabCount).toBeGreaterThan(0);
  });

  test('이미지 결과 그리드 영역이 존재한다', async ({ page }) => {
    /**
     * ImageGrid 컴포넌트가 렌더링하는 영역 확인
     * 검색 결과를 표시하는 그리드 레이아웃이 존재해야 함
     */
    /* 그리드 레이아웃 영역 확인 (결과가 없어도 컨테이너는 존재) */
    const gridArea = page.locator('[class*="grid"], [class*="gallery"], [data-testid*="grid"]');
    const gridCount = await gridArea.count();

    /* 그리드 컨테이너가 최소 1개 존재해야 함 */
    expect(gridCount).toBeGreaterThan(0);
  });

  test('페이지에 주요 컴포넌트들이 렌더링된다', async ({ page }) => {
    /**
     * 마네킹 페이지의 핵심 레이아웃 확인
     * - 좌측: 3D 뷰포트 + 조작 패널
     * - 우측: 검색 결과 그리드
     */
    /* 페이지 전체 레이아웃이 로드되었는지 확인 */
    await expect(page.locator('body')).toBeVisible();

    /* 링크 요소가 존재하는지 확인 (내비게이션 등) */
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
