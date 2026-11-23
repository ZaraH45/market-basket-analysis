
import Link from "next/link";

const categories = [
  { name: "Fresh Fruits", symbol: "🍎", color: "bg-rose-50" },
  { name: "Vegetables", symbol: "🥦", color: "bg-green-50" },
  { name: "Dairy & Eggs", symbol: "🥛", color: "bg-blue-50" },
  { name: "Bakery", symbol: "🥖", color: "bg-amber-50" },
  { name: "Meat & Seafood", symbol: "🍗", color: "bg-orange-50" },
  { name: "Snacks", symbol: "🍿", color: "bg-purple-50" },
];

const products = [
  {
    name: "Fresh Bananas",
    category: "Fresh Fruits",
    price: "Rs. 180",
    unit: "per dozen",
    symbol: "🍌",
    color: "bg-yellow-50",
    tag: "Popular",
  },
  {
    name: "Red Apples",
    category: "Fresh Fruits",
    price: "Rs. 320",
    unit: "per kg",
    symbol: "🍎",
    color: "bg-rose-50",
    tag: "Fresh pick",
  },
  {
    name: "Fresh Milk",
    category: "Dairy & Eggs",
    price: "Rs. 250",
    unit: "per litre",
    symbol: "🥛",
    color: "bg-sky-50",
    tag: "",
  },
  {
    name: "Whole Wheat Bread",
    category: "Bakery",
    price: "Rs. 160",
    unit: "per pack",
    symbol: "🍞",
    color: "bg-amber-50",
    tag: "",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#e9ede7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246b45] text-xl text-white">
              🛒
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#246b45]">
                Basketly
              </h1>
              <p className="text-[10px] tracking-wide text-gray-500">
                FRESHNESS AT YOUR DOOR
              </p>
            </div>
          </Link>

          <div className="hidden max-w-xl flex-1 md:block">
            <div className="flex items-center rounded-xl border border-[#e5e9e3] bg-[#f8faf7] px-4 py-3">
              <span className="mr-3 text-gray-400">⌕</span>
              <input type="text" placeholder="Search for fruits, vegetables, groceries..." className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"/>
              <span className="text-xs text-gray-400">Search</span>
            </div>
          </div>

          <Link href="/cart" className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e9e3] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f3f7f1]">
            <span>🛍️</span>
            <span>Cart</span>
          </Link>
        </div>

        <nav className="border-t border-[#f0f1ed]">
          <div className="mx-auto flex max-w-7xl items-center gap-8 overflow-x-auto px-6 py-3 text-sm">
            <Link href="/" className="whitespace-nowrap font-semibold text-[#246b45]">
              Home
            </Link>
            <Link href="/products" className="whitespace-nowrap text-gray-600 hover:text-[#246b45]">
              All Products
            </Link>
            <a href="#categories" className="whitespace-nowrap text-gray-600 hover:text-[#246b45]">
              Categories
            </a>
            <Link href="/analytics" className="whitespace-nowrap text-gray-600 hover:text-[#246b45]">
              Insights & Analytics
            </Link>
          </div>
        </nav>
      </header>

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
          <Link href="/products" className="text-sm font-semibold text-[#246b45]">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link href="/products" key={category.name}
              className="group rounded-2xl border border-[#edf0e9] bg-white p-5 text-center transition hover:-translate-y-1 hover:border-[#b9d2bd] hover:shadow-md">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${category.color}`}>
                {category.symbol}
              </div>
              <h3 className="mt-4 text-sm font-semibold group-hover:text-[#246b45]">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
              Handpicked for you
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Featured products
            </h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-[#246b45]">
            Browse all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.name}
              className="overflow-hidden rounded-2xl border border-[#edf0e9] bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`relative flex h-48 items-center justify-center text-7xl ${product.color}`}>
                {product.symbol}
                {product.tag && (
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#246b45] shadow-sm">
                    {product.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-400">{product.category}</p>
                <h3 className="mt-2 font-semibold">{product.name}</h3>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#246b45]">
                      {product.price}
                    </p>
                    <p className="text-xs text-gray-400">{product.unit}</p>
                  </div>
                  <span className="rounded-lg bg-[#edf5ed] px-3 py-2 text-xs font-semibold text-[#246b45]">
                    Featured
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

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
