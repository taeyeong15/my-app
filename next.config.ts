import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로덕션 최적화 설정
  output: 'standalone',
  
  // 실험적 기능
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
  
  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // 압축 활성화
  compress: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // 환경변수 설정 (NODE_ENV는 Next.js가 자동 관리)
  env: {
    MASTER_SECRET: process.env.MASTER_SECRET,
  },
};

export default nextConfig;
