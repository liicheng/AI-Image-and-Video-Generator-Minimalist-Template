import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "zh"],           // ← 按你的实际语言填
  defaultLocale: "en",
  localePrefix: "as-needed"        // 路径可不带前缀时自动重写
});

// 让所有"页面请求"都走中间件；排除 api/_next/静态文件
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};