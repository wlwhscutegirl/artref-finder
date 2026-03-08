import type { MetadataRoute } from "next";

/**
 * robots.txt 생성 함수
 * 검색 엔진 크롤러에게 허용/차단할 경로를 지정
 *
 * - 모든 크롤러에게 기본적으로 허용
 * - /api/ 경로는 크롤링 차단 (API 엔드포인트 보호)
 * - /admin/ 경로는 크롤링 차단 (관리자 페이지 보호)
 * - sitemap 위치 명시
 */
export default function robots(): MetadataRoute.Robots {
  /** 사이트 기본 URL */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artref.app";

  return {
    rules: [
      {
        // 모든 크롤러 대상
        userAgent: "*",
        // 허용 경로
        allow: "/",
        // 차단 경로: API, 관리자 페이지, 인증 페이지
        disallow: ["/api/", "/admin/", "/login", "/register"],
      },
    ],
    // sitemap 위치 (검색 엔진이 자동으로 참조)
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
