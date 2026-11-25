
import Link from "next/link";
import FeaturedProducts from "@/components/featured-products";
import CategoryGrid from "@/components/category-grid";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
      {/* Header */}
<section className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#eaf3e8] px-8 py-12 md:px-14 md:py-16">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-wide text-[#246b45]">
              YOUR EVERYDAY GROCERY STORE
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-[#1d4932] md:text-5xl">
              Fresh groceries,
              <br />
              delivered with care.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#587361] md:text-base">
              Discover everyday essentials, fresh produce, and your favourite products — all in one place.
            </p>
            <Link href="/products"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#246b45] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#194f32]">
              Explore Products <span>→</span>
            </Link>
          </div>

          <div className="pointer-events-none absolute -right-8 -top-10 hidden h-80 w-80 items-center justify-center rounded-full bg-[#d6e9d1] text-[150px] md:flex">
            🥬
          </div>
          <div className="pointer-events-none absolute bottom-[-55px] right-52 hidden text-8xl md:block">
            🍊
          </div>
          <div className="pointer-events-none absolute bottom-[-35px] right-8 hidden text-8xl md:block">
            🥑
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
              Browse by category
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Shop your favourites
            </h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[#246b45]">
            View all categories →
          </Link>
        </div>

        <CategoryGrid limit={8} />
      </section>

      <FeaturedProducts />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-[#244c38] p-8 text-white md:flex-row md:items-center md:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#b9d8bd]">
              Behind the basket
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Curious about what goes together?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#d4e3d7]">
              Explore shopping patterns, frequently purchased combinations, and insights discovered through market basket analysis.
            </p>
          </div>
          <Link href="/analytics"
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#244c38] transition hover:bg-[#edf5ed]">
            Explore Insights <span>→</span>
          </Link>
        </div>
      </section>

      <footer className="mt-10 border-t border-[#e9ede7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-center">
          <div>
            <p className="font-bold text-[#246b45]">Basketly</p>
            <p className="mt-1 text-xs">A smarter way to shop for groceries.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
