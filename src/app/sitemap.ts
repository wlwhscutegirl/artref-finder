import type { MetadataRoute } from "next";

/**
 * sitemap.xml 생성 함수
 * 검색 엔진에 사이트의 주요 페이지 URL과 업데이트 빈도를 알림
 *
 * Next.js App Router의 sitemap convention 사용
 * 빌드 시 /sitemap.xml로 자동 생성됨
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /** 사이트 기본 URL */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artref.app";

  /** 현재 날짜 (마지막 수정일 기준) */
  const now = new Date();

  return [
    {
      // 랜딩 페이지 — 최우선 크롤링
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      // 3D 마네킹 포즈 검색 — 핵심 기능 페이지
      url: `${siteUrl}/mannequin`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      // 드로잉 모드 검색
      url: `${siteUrl}/sketch`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      // 가격 플랜 페이지
      url: `${siteUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // 컬렉션 페이지
      url: `${siteUrl}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      // 검색 리다이렉트 (하위 호환)
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
