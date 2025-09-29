import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh'],        // ← 你的语言列表
  defaultLocale: 'en',          // ← 默认语言
  localePrefix: 'as-needed'
});

// 只让"页面请求"走中间件；排除 api、_next、静态文件、_vercel
export const config = {
  matcher: ['/', '/(en|zh)/:path*']
  // 若你的目录是 zh-CN/en-US，写成 '/(zh-CN|en-US)/:path*'
};