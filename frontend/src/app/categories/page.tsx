import CategoryGrid from "@/components/category-grid";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
            Explore our catalogue
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Shop by Category
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Explore our grocery departments and discover products from your
            favourite categories.
          </p>
        </div>

        <CategoryGrid />
      </section>
    </main>
  );
}
