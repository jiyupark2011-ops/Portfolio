import type { Metadata } from "next";

// Everything under /admin is never indexed.
export const metadata: Metadata = {
  title: "편집 모드 | 박지유 Portfolio",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
