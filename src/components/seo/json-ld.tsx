/**
 * JSON-LD 구조화된 데이터 컴포넌트
 * 검색 엔진이 서비스 정보를 정확히 파싱할 수 있도록 구조화된 데이터를 삽입
 *
 * Schema.org SoftwareApplication 타입 사용
 * - 이름, 설명, 카테고리, 가격 등 서비스 핵심 정보 포함
 * - Google Rich Results 대응
 */

/** 사이트 기본 URL */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artref.app";

/**
 * SoftwareApplication JSON-LD 스키마
 * 루트 레이아웃의 <body> 내부에 삽입
 */
export function JsonLd() {
  // SoftwareApplication 스키마 데이터
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ArtRef",
    // 앱 설명
    description:
      "3D 포즈, 조명, 카메라 조건으로 실사 레퍼런스를 검색하는 AI 기반 검색 엔진. 웹툰 작가, 일러스트레이터를 위한 도구.",
    // 앱 URL
    url: SITE_URL,
    // 앱 카테고리 (디자인/크리에이티브 도구)
    applicationCategory: "DesignApplication",
    // 운영 체제 (웹 앱)
    operatingSystem: "Web",
    // 가격 정보 — Free 플랜 기준
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
        name: "Free",
        description: "취미 작가를 위한 기본 플랜 — 일일 검색 100회",
      },
      {
        "@type": "Offer",
        price: "9900",
        priceCurrency: "KRW",
        name: "Pro",
        description: "프로 작가를 위한 무제한 플랜",
      },
    ],
    // 대표 이미지
    image: `${SITE_URL}/og-image.png`,
    // 대표 스크린샷 (추후 추가 가능)
    screenshot: `${SITE_URL}/og-image.png`,
    // 개발사 정보
    author: {
      "@type": "Organization",
      name: "ArtRef",
      url: SITE_URL,
    },
    // 대상 사용자
    audience: {
      "@type": "Audience",
      audienceType: "아티스트, 웹툰 작가, 일러스트레이터, 컨셉 아티스트",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * 커스텀 JSON-LD 삽입 컴포넌트
 * 특정 페이지에서 추가 스키마가 필요할 때 사용
 *
 * @param data - Schema.org 호환 JSON 객체
 */
export function CustomJsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
