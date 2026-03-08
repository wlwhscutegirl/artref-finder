import type { Metadata } from "next";

/**
 * /pricing 페이지 메타데이터
 * 가격 플랜 비교 페이지 — Free / Lite / Student / Pro / Team
 */
export const metadata: Metadata = {
  title: "가격 플랜",
  description:
    "ArtRef의 무료 및 유료 플랜을 비교하세요. Free, Lite, Student, Pro, Team — 나에게 맞는 플랜을 선택하세요.",
  openGraph: {
    title: "가격 플랜 | ArtRef",
    description:
      "ArtRef의 무료 및 유료 플랜을 비교하세요. 무료로 시작하고 필요할 때 업그레이드.",
  },
};

/**
 * 가격 페이지 레이아웃 — 메타데이터 전용
 */
export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
