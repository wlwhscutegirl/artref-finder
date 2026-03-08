import { test, expect } from '@playwright/test';

/**
 * 랜딩 페이지 E2E 테스트
 *
 * 테스트 항목:
 * 1. 페이지 정상 로드 확인
 * 2. 7개 섹션 존재 확인 (내비게이션, 히어로, 베타배너, 핵심기능, 가격비교, 최종CTA, 푸터)
 * 3. CTA 버튼 클릭 시 올바른 페이지로 네비게이션
 */

test.describe('랜딩 페이지', () => {
  /* 각 테스트 전에 랜딩 페이지로 이동 */
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    /* 페이지 타이틀이 존재하는지 확인 */
    await expect(page).toHaveURL('/');

    /* 메인 헤드라인 텍스트 확인 */
    await expect(page.getByText('머릿속 장면을')).toBeVisible();
    await expect(page.getByText('현실로 꺼내세요')).toBeVisible();
  });

  test('7개 섹션이 모두 존재한다', async ({ page }) => {
    /* 1. 내비게이션 바 — 로고 텍스트 확인 */
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByText('ArtRef')).toBeVisible();

    /* 2. 히어로 섹션 — 메인 카피 확인 */
    await expect(page.getByText('머릿속 장면을')).toBeVisible();
    await expect(page.getByText('현실로 꺼내세요')).toBeVisible();

    /* 3. 베타 배너 — 베타 테스터 모집 텍스트 확인 */
    await expect(page.getByText('베타 테스터 모집 중')).toBeVisible();

    /* 4. 핵심 기능 섹션 — 섹션 헤더 + 4개 기능 카드 확인 */
    await expect(page.getByText('핵심 기능')).toBeVisible();
    await expect(page.getByText('3D 마네킹 포즈 설정')).toBeVisible();
    await expect(page.getByText('AI 기반 실사 매칭')).toBeVisible();
    await expect(page.getByText('조명 · 카메라 시뮬레이션')).toBeVisible();
    await expect(page.getByText('컬렉션 & 클라우드 저장')).toBeVisible();

    /* 5. 가격 비교 섹션 — Free / Pro 플랜 카드 확인 */
    await expect(page.getByText('심플한 가격 플랜')).toBeVisible();
    await expect(page.locator('#pricing')).toBeVisible();

    /* 6. 최종 CTA 섹션 — 가입 유도 텍스트 확인 */
    await expect(page.getByText('지금 무료로 시작하세요')).toBeVisible();

    /* 7. 푸터 — 브랜드 텍스트 확인 */
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText('ArtRef Finder')).toBeVisible();
  });

  test('히어로 "무료로 시작하기" CTA 클릭 시 회원가입 페이지로 이동한다', async ({ page }) => {
    /* 히어로 섹션의 Primary CTA 버튼 클릭 */
    const ctaButton = page.getByRole('link', { name: '무료로 시작하기' }).first();
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    /* /register 페이지로 이동 확인 */
    await expect(page).toHaveURL(/\/register/);
  });

  test('히어로 "데모 보기" CTA 클릭 시 마네킹 페이지로 이동한다', async ({ page }) => {
    /* Ghost CTA 버튼 클릭 */
    const demoButton = page.getByRole('link', { name: '데모 보기' });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    /* /mannequin 페이지로 이동 확인 */
    await expect(page).toHaveURL(/\/mannequin/);
  });

  test('내비게이션 바 "로그인" 버튼 클릭 시 로그인 페이지로 이동한다', async ({ page }) => {
    /* 내비게이션의 로그인 링크 클릭 */
    const loginLink = page.locator('nav').getByRole('link', { name: '로그인' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    /* /login 페이지로 이동 확인 */
    await expect(page).toHaveURL(/\/login/);
  });

  test('푸터 "가격" 링크 클릭 시 가격 페이지로 이동한다', async ({ page }) => {
    /* 푸터의 가격 링크 클릭 */
    const pricingLink = page.locator('footer').getByRole('link', { name: '가격' });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();

    /* /pricing 페이지로 이동 확인 */
    await expect(page).toHaveURL(/\/pricing/);
  });
});
