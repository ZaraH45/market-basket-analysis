
import Link from "next/link";

const categories = [
  { name: "Fresh Produce", icon: "🥑", count: "Fruits & vegetables" },
  { name: "Dairy & Eggs", icon: "🥛", count: "Milk, cheese & eggs" },
  { name: "Snacks", icon: "🍿", count: "Chips & snacks" },
  { name: "Beverages", icon: "🥤", count: "Drinks & juices" },
  { name: "Bakery", icon: "🍞", count: "Bread & bakery items" },
  { name: "Meat & Seafood", icon: "🍗", count: "Fresh meat & seafood" },
  { name: "Frozen Foods", icon: "🧊", count: "Frozen products" },
  { name: "Pantry", icon: "🥫", count: "Daily essentials" },
];

export default function CategoriesPage() {
  return (
    <main style={{ background: "#f8faf5", minHeight: "100vh", padding: "40px 7%" }}>
      <Link href="/" style={{ color: "#28784b", textDecoration: "none" }}>
        ← Back to Home
      </Link>

      <h1 style={{ fontSize: "36px", color: "#183d2b", marginTop: "30px" }}>
        Shop by Category
      </h1>

      <p style={{ color: "#68766d", marginBottom: "35px" }}>
        Explore products from your favourite categories.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "22px"
      }}>
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: "white",
              borderRadius: "18px",
              padding: "30px 20px",
              textAlign: "center",
              border: "1px solid #e5eee5",
              cursor: "pointer"
            }}>
              <div style={{ fontSize: "48px" }}>{category.icon}</div>
              <h2 style={{ color: "#183d2b", fontSize: "19px" }}>
                {category.name}
              </h2>
              <p style={{ color: "#78857c", fontSize: "14px" }}>
                {category.count}
              </p>
              <span style={{ color: "#28784b", fontWeight: "600" }}>
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
