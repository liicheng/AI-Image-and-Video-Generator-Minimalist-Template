import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'nextuipro.nyc3.cdn.digitaloceanspaces.com',
            port: '',
            pathname: '/**',
          },
          {
            protocol: "https",
            hostname: "replicate.com",
          },
          {
            protocol: "https",
            hostname: "replicate.delivery",
          },
        ],
      },
};
 
export default withNextIntl(nextConfig);