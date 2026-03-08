import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

// 구글 폰트: Geist Sans + Mono
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 사이트 기본 URL (배포 환경에 맞게 변경) */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artref.app";

/**
 * 루트 메타데이터 — Next.js 14 metadata API
 * title.template으로 하위 페이지 제목 자동 포맷팅
 */
export const metadata: Metadata = {
  // 제목: 기본값 + 하위 페이지 템플릿
  title: {
    default: "ArtRef - 스마트 실사 레퍼런스 검색",
    template: "%s | ArtRef",
  },
  // 설명: 검색 엔진 스니펫용
  description:
    "3D 포즈, 조명, 카메라 조건으로 실사 레퍼런스를 검색하세요. 웹툰 작가, 일러스트레이터를 위한 자동 매칭 검색 엔진.",
  // SEO 키워드
  keywords: [
    "레퍼런스",
    "포즈 레퍼런스",
    "실사 레퍼런스",
    "웹툰",
    "일러스트",
    "3D 포즈",
    "art reference",
    "pose reference",
    "drawing reference",
    "artist tools",
  ],
  // 작성자 정보
  authors: [{ name: "ArtRef Team" }],
  creator: "ArtRef",
  publisher: "ArtRef",
  // 검색 엔진 설정
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // OpenGraph 메타태그 — SNS 공유 시 표시
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "ArtRef",
    title: "ArtRef - 스마트 실사 레퍼런스 검색",
    description:
      "3D 포즈, 조명, 카메라 조건으로 실사 레퍼런스를 검색하세요. 웹툰 작가, 일러스트레이터를 위한 자동 매칭 검색 엔진.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ArtRef - 스마트 실사 레퍼런스 검색 엔진",
      },
    ],
  },
  // Twitter Card 메타태그 — 트위터/X 공유 시 표시
  twitter: {
    card: "summary_large_image",
    title: "ArtRef - 스마트 실사 레퍼런스 검색",
    description:
      "3D 포즈, 조명, 카메라 조건으로 실사 레퍼런스를 검색하세요.",
    images: [`${SITE_URL}/og-image.png`],
  },
  // 기타 메타태그
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  // 매니페스트 (PWA 대비)
  // manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        {/* 구조화된 데이터 (JSON-LD): SoftwareApplication 스키마 */}
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
