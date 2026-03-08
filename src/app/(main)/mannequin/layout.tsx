import type { Metadata } from "next";

/**
 * /mannequin 페이지 메타데이터
 * 3D 마네킹 포즈 검색 — 핵심 기능 페이지
 */
export const metadata: Metadata = {
  title: "3D 포즈 검색",
  description:
    "3D 마네킹으로 포즈를 설정하고, AI가 유사한 실사 레퍼런스를 즉시 찾아줍니다. 관절 조작, 조명 설정, 카메라 앵글까지.",
  openGraph: {
    title: "3D 포즈 검색 | ArtRef",
    description:
      "3D 마네킹으로 포즈를 설정하고, AI가 유사한 실사 레퍼런스를 즉시 찾아줍니다.",
  },
};

/**
 * 마네킹 페이지 레이아웃 — 메타데이터 전용
 * 자식 컴포넌트를 그대로 렌더링
 */
export default function MannequinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
