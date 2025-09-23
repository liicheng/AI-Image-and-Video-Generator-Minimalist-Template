/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.imgtoexcel.online',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://www.imgtoexcel.online/server-sitemap.xml',
    ],
  },
  alternateRefs: [
    {
      href: 'https://www.imgtoexcel.online',
      hreflang: 'en',
    },
  ],
}