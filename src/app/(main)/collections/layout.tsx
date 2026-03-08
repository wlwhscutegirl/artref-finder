import type { Metadata } from "next";

/**
 * /collections 페이지 메타데이터
 * 저장한 레퍼런스 컬렉션 관리 페이지
 */
export const metadata: Metadata = {
  title: "내 컬렉션",
  description:
    "저장한 레퍼런스를 컬렉션으로 관리하세요. 포즈, 조명, 카메라 앵글별로 정리하고 어디서든 불러올 수 있습니다.",
  openGraph: {
    title: "내 컬렉션 | ArtRef",
    description:
      "저장한 레퍼런스를 컬렉션으로 관리하세요.",
  },
  // 개인 데이터 페이지 — 검색 엔진 인덱싱 제외
  robots: {
    index: false,
    follow: true,
  },
};

/**
 * 컬렉션 페이지 레이아웃 — 메타데이터 전용
 */
export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
