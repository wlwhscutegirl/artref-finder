import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // === 번들 최적화 ===
  // 자주 사용되는 대형 패키지의 배럴 import를 트리셰이킹하여 번들 크기 절감
  experimental: {
    optimizePackageImports: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'zustand',
      '@tanstack/react-query',
    ],
  },

  // === 이미지 최적화 ===
  images: {
    // 외부 이미지 도메인 허용 (Unsplash, Pexels 등)
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

export default nextConfig;
