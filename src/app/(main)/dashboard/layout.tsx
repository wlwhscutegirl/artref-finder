import type { Metadata } from "next";

/**
 * /dashboard 페이지 메타데이터
 * 사용자 대시보드 — 검색 통계, 활동 내역 등
 */
export const metadata: Metadata = {
  title: "대시보드",
  description: "내 검색 통계와 활동 내역을 확인하세요.",
  // 개인 데이터 페이지 — 검색 엔진 인덱싱 제외
  robots: {
    index: false,
    follow: true,
  },
};

/**
 * 대시보드 페이지 레이아웃 — 메타데이터 전용
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
