import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "박지유 | Portfolio",
  description: "도전과 끈기의 학생, 박지유의 포트폴리오입니다.",
  applicationName: "박지유 포트폴리오",
  // Safe default; the public page overrides this from profile.allow_indexing.
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Jiyu",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B2440",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Pretendard is loaded by a script-inserted <link> so it doesn't block the first paint
            (system font shows first, then swaps). <noscript> keeps it working without JS. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement("link");l.rel="stylesheet";l.crossOrigin="anonymous";l.href=${JSON.stringify(PRETENDARD_CSS)};document.head.appendChild(l)})()`,
          }}
        />
        <noscript>
          <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-svh bg-bg text-ink">
        <a
          href="#main"
          className="sr-only z-[80] rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
