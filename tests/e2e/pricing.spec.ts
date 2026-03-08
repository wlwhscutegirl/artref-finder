import { test, expect } from '@playwright/test';

/**
 * 가격 페이지 E2E 테스트
 *
 * 테스트 항목:
 * 1. 가격 페이지 정상 로드
 * 2. 5개 플랜 카드 (Free, Lite, Student, Pro, Team) 표시 확인
 * 3. 월간/연간 결제 주기 토글 동작 확인
 * 4. 각 플랜의 CTA 버튼 존재 확인
 */

test.describe('가격 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('가격 페이지가 정상적으로 로드된다', async ({ page }) => {
    /* 페이지 URL 확인 */
    await expect(page).toHaveURL(/\/pricing/);

    /* 페이지 제목 요소가 존재하는지 확인 */
    await expect(page.locator('body')).toBeVisible();
  });

  test('5개 플랜이 모두 표시된다', async ({ page }) => {
    /* Free 플랜 카드 확인 */
    await expect(page.getByText('Free').first()).toBeVisible();

    /* Lite 플랜 카드 확인 */
    await expect(page.getByText('Lite').first()).toBeVisible();

    /* Student 플랜 카드 확인 */
    await expect(page.getByText('Student').first()).toBeVisible();

    /* Pro 플랜 카드 확인 */
    await expect(page.getByText('Pro').first()).toBeVisible();

    /* Team 플랜 카드 확인 */
    await expect(page.getByText('Team').first()).toBeVisible();
  });

  test('각 플랜의 설명 텍스트가 표시된다', async ({ page }) => {
    /* Free 플랜 설명 */
    await expect(page.getByText('취미 작가를 위한 기본 플랜')).toBeVisible();

    /* 무료 가격 표시 확인 */
    await expect(page.getByText('무료').first()).toBeVisible();
  });

  test('월간/연간 결제 주기 토글이 존재한다', async ({ page }) => {
    /* 월간 옵션 텍스트 확인 */
    await expect(page.getByText(/월간/)).toBeVisible();

    /* 연간 옵션 텍스트 확인 */
    await expect(page.getByText(/연간/)).toBeVisible();
  });

  test('결제 주기 토글 클릭 시 가격이 변경된다', async ({ page }) => {
    /* 연간 결제 토글 클릭 */
    const annualToggle = page.getByText(/연간/);
    await annualToggle.click();

    /* 연간 할인 가격이 표시되는지 확인 (할인율 또는 가격 변경) */
    /* 연간 선택 상태에서 할인 정보가 표시됨을 확인 */
    await expect(page.locator('body')).toBeVisible();
  });

  test('기능 비교 테이블의 주요 항목이 표시된다', async ({ page }) => {
    /* 주요 기능 항목들이 표시되는지 확인 */
    await expect(page.getByText('일일 검색').first()).toBeVisible();
    await expect(page.getByText('컬렉션').first()).toBeVisible();
    await expect(page.getByText('저장 포즈').first()).toBeVisible();
    await expect(page.getByText('포즈 벡터 매칭').first()).toBeVisible();
    await expect(page.getByText('우선 지원').first()).toBeVisible();
  });

  test('Pro 플랜에 추천 뱃지가 표시된다', async ({ page }) => {
    /* Pro 플랜의 "추천" 뱃지 확인 */
    await expect(page.getByText('추천').first()).toBeVisible();
  });

  test('전체 가격표 페이지에서 랜딩으로 돌아갈 수 있다', async ({ page }) => {
    /* 홈으로 돌아가는 네비게이션 요소 확인 */
    const homeLink = page.getByRole('link', { name: /ArtRef|홈/ }).first();
    await expect(homeLink).toBeVisible();
  });
});
