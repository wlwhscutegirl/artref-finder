import { test, expect } from '@playwright/test';

/**
 * 인증 페이지 (로그인 / 회원가입) E2E 테스트
 *
 * 테스트 항목:
 * 1. 로그인 페이지 로드 + 폼 필드 존재 확인
 * 2. 회원가입 페이지 로드 + 폼 필드 존재 확인
 * 3. 유효성 검증 에러 표시 확인
 * 4. 페이지 간 네비게이션 확인
 */

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    /* 페이지 URL 확인 */
    await expect(page).toHaveURL(/\/login/);

    /* 로고 및 헤더 텍스트 확인 */
    await expect(page.getByText('ArtRef')).toBeVisible();
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByText('레퍼런스 검색을 시작하세요')).toBeVisible();
  });

  test('이메일과 비밀번호 입력 필드가 존재한다', async ({ page }) => {
    /* 이메일 입력 필드 확인 */
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible();

    /* 비밀번호 입력 필드 확인 */
    const passwordInput = page.getByPlaceholder('비밀번호 입력');
    await expect(passwordInput).toBeVisible();
  });

  test('빈 폼 제출 시 브라우저 기본 유효성 검증이 동작한다', async ({ page }) => {
    /* 폼 제출 버튼 클릭 (빈 상태로) */
    const submitButton = page.getByRole('button', { name: /로그인/ });
    await expect(submitButton).toBeVisible();

    /* 이메일 필드가 required 속성을 가지고 있는지 확인 */
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('회원가입 페이지로의 링크가 존재한다', async ({ page }) => {
    /* 회원가입 링크 확인 */
    const registerLink = page.getByRole('link', { name: /회원가입|가입/ });
    await expect(registerLink).toBeVisible();
  });
});

test.describe('회원가입 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('회원가입 페이지가 정상적으로 로드된다', async ({ page }) => {
    /* 페이지 URL 확인 */
    await expect(page).toHaveURL(/\/register/);

    /* 로고 및 헤더 텍스트 확인 */
    await expect(page.getByText('ArtRef')).toBeVisible();
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
    await expect(page.getByText('무료로 ArtRef를 시작하세요')).toBeVisible();
  });

  test('이름, 이메일, 비밀번호, 비밀번호 확인 필드가 존재한다', async ({ page }) => {
    /* 이름 입력 필드 확인 */
    const nameInput = page.getByPlaceholder('아티스트 이름');
    await expect(nameInput).toBeVisible();

    /* 이메일 입력 필드 확인 */
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible();

    /* 비밀번호 입력 필드 확인 (type=password 필드가 2개 존재해야 함) */
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
  });

  test('비밀번호 불일치 시 에러 메시지가 표시된다', async ({ page }) => {
    /* 폼 필드 채우기 */
    await page.getByPlaceholder('아티스트 이름').fill('테스트 유저');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');

    /* 비밀번호 필드를 서로 다르게 입력 */
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('password123');
    await passwordInputs.nth(1).fill('different456');

    /* 폼 제출 */
    const submitButton = page.getByRole('button', { name: /가입|회원가입/ });
    await submitButton.click();

    /* 비밀번호 불일치 에러 메시지 확인 */
    await expect(page.getByText('비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  test('짧은 비밀번호 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    /* 폼 필드 채우기 (8자 미만 비밀번호) */
    await page.getByPlaceholder('아티스트 이름').fill('테스트 유저');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');

    /* 동일하지만 짧은 비밀번호 입력 */
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('short');
    await passwordInputs.nth(1).fill('short');

    /* 폼 제출 */
    const submitButton = page.getByRole('button', { name: /가입|회원가입/ });
    await submitButton.click();

    /* 비밀번호 길이 에러 메시지 확인 */
    await expect(page.getByText('비밀번호는 8자 이상이어야 합니다')).toBeVisible();
  });

  test('로그인 페이지로의 링크가 존재한다', async ({ page }) => {
    /* 로그인 링크 확인 */
    const loginLink = page.getByRole('link', { name: /로그인/ });
    await expect(loginLink).toBeVisible();
  });
});
