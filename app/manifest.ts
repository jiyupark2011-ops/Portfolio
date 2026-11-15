import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "박지유 포트폴리오",
    short_name: "Jiyu",
    description: "도전과 끈기의 학생, 박지유의 포트폴리오",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFBF2",
    theme_color: "#1B2440",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
