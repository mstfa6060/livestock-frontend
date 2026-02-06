import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.livestock-trading.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.livestock-trading.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
