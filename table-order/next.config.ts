import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 보안: 서버 컴포넌트에서 외부 이미지 URL 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 보안 헤더는 middleware.ts에서 처리
};

export default nextConfig;
