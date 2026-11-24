
import Link from "next/link";

import { categories, products, categoryUrl } from "@/lib/catalog";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; q?: string | string[] }> }) {
  const query = await searchParams;
  const category = typeof query.category === "string" ? query.category : "";
  const q = typeof query.q === "string" ? query.q : "";
  const filtered = products.filter(p => (!category || p.category === category) && p.name.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <main style={{ background: "#f8faf5", minHeight: "100vh", padding: "40px 7%" }}>
      <Link href="/" style={{ color: "#28784b", textDecoration: "none" }}>
        ← Back to Home
      </Link>

      <h1 style={{ fontSize: "36px", color: "#183d2b", marginTop: "30px" }}>
        {category || "All Products"}
      </h1>

      <p style={{ color: "#68766d", marginBottom: "30px" }}>
        Explore our products and discover your everyday favourites.
      </p>

      <form action="/products" className="mb-6 flex flex-wrap gap-3 text-gray-800">
        {category && <input type="hidden" name="category" value={category} />}
        <input name="q" defaultValue={q} aria-label="Search products" placeholder="Search products" className="rounded-lg border bg-white p-3" />
        <button className="rounded-lg bg-green-700 px-5 text-white">Search</button>
      </form>
      <nav aria-label="Filter products" className="mb-8 flex flex-wrap gap-3">
        <Link href="/products" className={`rounded-full border px-4 py-2 ${!category ? "bg-green-700 text-white" : "bg-white text-green-800"}`}>All</Link>
        {categories.map(c => <Link key={c.name} href={categoryUrl(c.name)} className={`rounded-full border px-4 py-2 ${category === c.name ? "bg-green-700 text-white" : "bg-white text-green-800"}`}>{c.name}</Link>)}
      </nav>
      <p className="mb-4 text-gray-600">{filtered.length} products found</p>
      {!filtered.length && <p className="mb-8 text-gray-700">No matching products. <Link href="/products" className="underline">Clear filters</Link></p>}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "22px"
      }}>
        {filtered.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: "white",
              border: "1px solid #e5eee5",
              borderRadius: "18px",
              padding: "22px",
              textAlign: "center",
              cursor: "pointer"
            }}>
              <div style={{
                background: "#f0f6ed",
                borderRadius: "14px",
                padding: "22px",
                fontSize: "55px"
              }}>
                {product.icon}
              </div>

              <h2 style={{ color: "#183d2b", fontSize: "19px" }}>
                {product.name}
              </h2>

              <p style={{ color: "#78857c", fontSize: "13px" }}>
                {product.category}
              </p>

              <p style={{ color: "#28784b", fontWeight: "bold" }}>
                ${product.price}
              </p>

              <span style={{ color: "#28784b", fontWeight: "600" }}>
                View Details →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
