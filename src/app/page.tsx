import { getActiveBanners } from "@/lib/banners";
import { getPublicDonations } from "@/lib/donations";
import { HeroBanner } from "@/components/home/hero-banner";
import { RecentDonations } from "@/components/home/recent-donations";

export default async function Home() {
  const [banners, donations] = await Promise.all([
    getActiveBanners(),
    getPublicDonations(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-white font-sans dark:bg-black">
      <HeroBanner banners={banners} />
      <RecentDonations donations={donations} />
    </div>
  );
}
