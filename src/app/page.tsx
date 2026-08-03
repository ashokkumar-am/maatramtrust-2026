import { getActiveBanners } from "@/lib/banners";
import { getPublicDonations } from "@/lib/donations";
import { HomeHero } from "@/components/home/home-hero";
import { HeroBanner } from "@/components/home/hero-banner";
import { ImpactStats } from "@/components/home/impact-stats";
import { MissionSection } from "@/components/home/mission-section";
import { ProgramsShowcase } from "@/components/home/programs-showcase";
import { WaysToGive } from "@/components/home/ways-to-give";
import { Advantage } from "@/components/home/advantage";
import { RecentDonations } from "@/components/home/recent-donations";
import { FinalCta } from "@/components/home/final-cta";

export default async function Home() {
  const [banners, donations] = await Promise.all([
    getActiveBanners(),
    // Enough history for the donor wall's month filter.
    getPublicDonations(50),
  ]);

  // First image banner becomes the hero backdrop; the rest keep the carousel.
  const heroBanner = banners.find((banner) => banner.mediaType === "image");
  const carouselBanners = banners.filter((banner) => banner !== heroBanner);

  return (
    <div className="-mt-[4.25rem] flex flex-1 flex-col">
      <HomeHero backgroundUrl={heroBanner?.url} />
      <ImpactStats />
      <WaysToGive />
      <MissionSection />
      <HeroBanner banners={carouselBanners} />
      <ProgramsShowcase />
      <Advantage />
      <RecentDonations donations={donations} />
      <FinalCta />
    </div>
  );
}
