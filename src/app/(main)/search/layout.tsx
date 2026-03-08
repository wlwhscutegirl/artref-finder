import type { Metadata } from "next";

/**
 * /search 페이지 메타데이터
 * /mannequin으로 리다이렉트되지만, SEO를 위해 메타데이터 유지
 */
export const metadata: Metadata = {
  title: "레퍼런스 검색",
  description:
    "자동 매칭 실사 레퍼런스 검색. 포즈, 조명, 카메라 앵글 조건으로 원하는 사진을 정밀하게 찾아보세요.",
  openGraph: {
    title: "레퍼런스 검색 | ArtRef",
    description:
      "자동 매칭 실사 레퍼런스 검색. 포즈, 조명, 카메라 앵글 조건으로 원하는 사진을 찾아보세요.",
  },
  // 리다이렉트 페이지 — canonical을 mannequin으로 지정
  alternates: {
    canonical: "/mannequin",
  },
};

/**
 * 검색 페이지 레이아웃 — 메타데이터 전용
 */
export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
