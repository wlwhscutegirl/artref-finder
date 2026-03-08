import type { Metadata } from "next";

/**
 * /sketch 페이지 메타데이터
 * 드로잉 모드 — 스케치/업로드로 포즈 추출 후 유사 레퍼런스 검색
 */
export const metadata: Metadata = {
  title: "드로잉 모드 검색",
  description:
    "원하는 포즈를 스케치하거나 이미지를 업로드하면 AI가 유사한 실사 레퍼런스를 찾아줍니다.",
  openGraph: {
    title: "드로잉 모드 검색 | ArtRef",
    description:
      "스케치로 포즈를 그리면 AI가 유사한 실사 레퍼런스를 찾아줍니다.",
  },
};

/**
 * 드로잉 모드 페이지 레이아웃 — 메타데이터 전용
 */
export default function SketchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
