import { redirect } from 'next/navigation';

/**
 * /search → /mannequin 리다이렉트 (Phase 7: 듀얼 모드 전환)
 * 기존 URL 하위 호환을 위해 유지
 */
export default function SearchRedirect() {
  redirect('/mannequin');
}
