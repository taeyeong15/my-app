/** @type {import('next').NextConfig} */

// 환경 감지 및 dotenv 설정
const path = require('path');
const fs = require('fs');

// 환경별 .env 파일 로딩
const loadEnvConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${nodeEnv}.local`,
    `.env.local`,
    `.env.${nodeEnv}`,
    '.env'
  ];

  envFiles.forEach(envFile => {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📄 로딩: ${envFile}`);
      require('dotenv').config({ path: envPath });
    }
  });
};

// 환경 설정 로드
loadEnvConfig();

const nextConfig = {
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
  
  // 웹팩 설정 (환경별 최적화)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // 환경별 설정
    if (dev) {
      console.log('🔧 개발 모드로 실행 중...');
    } else {
      console.log('🚀 프로덕션 모드로 빌드 중...');
    }
    
    return config;
  },
};

module.exports = nextConfig; 