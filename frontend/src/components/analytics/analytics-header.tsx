
import Link from "next/link";

export default function AnalyticsHeader() {
  return (
    <header className="border-b border-[#e9ede7] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246b45] text-lg font-bold text-white">
            B
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#246b45]">
              Basketly
            </h1>
            <p className="text-[10px] tracking-widest text-gray-500">
              INSIGHTS & ANALYTICS
            </p>
          </div>
        </Link>

        <Link href="/" className="rounded-xl border border-[#e5e9e3] px-4 py-2.5 text-sm font-semibold text-[#425348] transition hover:bg-[#f3f7f1]">
          Back to Store
        </Link>
      </div>
    </header>
  );
}
