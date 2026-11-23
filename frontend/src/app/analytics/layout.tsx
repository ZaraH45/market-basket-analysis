
import AnalyticsHeader from "@/components/analytics/analytics-header";
import AnalyticsSidebar from "@/components/analytics/analytics-sidebar";

export default function AnalyticsLayout({children,}: Readonly<{children: React.ReactNode;}>)
{
  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#26352c]">
      <AnalyticsHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:gap-8">
        <AnalyticsSidebar />

        <section className="min-w-0 flex-1">{children}</section>
      </main>

    </div>
  );
}
