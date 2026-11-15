import type { Metadata } from "next";
import { Footer } from "@/components/public/Footer";
import { Hero } from "@/components/public/Hero";
import { ItemCard } from "@/components/public/ItemCard";
import { Reveal } from "@/components/public/Reveal";
import { Section, sectionAnchorId } from "@/components/public/Section";
import { SectionNav } from "@/components/public/SectionNav";
import { getPortfolio, getProfile } from "@/lib/data";
import { toPublicUrl } from "@/lib/image";
import { createPublicClient } from "@/lib/supabase/server";

// Safety net; edits call revalidatePath('/') for instant updates.
export const revalidate = 60;

const DEFAULT_DESCRIPTION = "도전과 끈기의 학생, 박지유의 포트폴리오입니다.";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile(createPublicClient());
  const title = `${profile?.name || "박지유"} | Portfolio`;
  const description = profile?.tagline?.trim() || DEFAULT_DESCRIPTION;
  const photo = toPublicUrl(profile?.photo_path);
  const image = photo
    ? { url: photo, width: 1200, height: 1200, alt: `${profile?.name ?? ""} 프로필 사진` }
    : { url: "/icons/og-default.png", width: 1200, height: 630, alt: title };
  const allowIndexing = profile?.allow_indexing === true;

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "ko_KR", url: "/", title, description, images: [image] },
    twitter: { card: photo ? "summary" : "summary_large_image", title, description, images: [image.url] },
    robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function Home() {
  const { profile, sections, items } = await getPortfolio(createPublicClient());

  // Public page: only visible sections that have at least one visible item (PLAN §7-4).
  const shown = sections
    .filter((s) => s.is_visible)
    .map((s) => ({ section: s, items: (items[s.key] ?? []).filter((i) => i.is_visible) }))
    .filter((s) => s.items.length > 0);

  const name = profile?.name || "";

  return (
    <>
      <Hero profile={profile} scrollTargetId={shown[0] ? sectionAnchorId(shown[0].section.key) : undefined} />
      <SectionNav name={name} items={shown.map((s) => ({ id: sectionAnchorId(s.section.key), label: s.section.title }))} />
      <main id="main" className="mx-auto max-w-[1080px] px-5 md:px-8">
        {shown.map(({ section, items: sectionItems }) => (
          <Reveal key={section.key}>
            <Section section={section}>
              {sectionItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </Section>
          </Reveal>
        ))}
      </main>
      <Footer name={name} links={profile?.links ?? []} year={new Date().getFullYear()} />
    </>
  );
}
