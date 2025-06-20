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
  
  // 성능 최적화 설정
  swcMinify: true, // SWC 기반 압축 사용
  poweredByHeader: false, // X-Powered-By 헤더 제거
  
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
          // 캐시 최적화
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      // 개발 모드에서 빌드 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    } else {
      console.log('🚀 프로덕션 모드로 빌드 중...');
      // 프로덕션 모드에서 더 적극적인 최적화
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 