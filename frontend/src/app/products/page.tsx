
import Link from "next/link";

const products = [
  { id: 1, name: "Banana", category: "Fresh Produce", price: "$1.49", icon: "🍌" },
  { id: 2, name: "Strawberries", category: "Fresh Produce", price: "$3.99", icon: "🍓" },
  { id: 3, name: "Whole Milk", category: "Dairy & Eggs", price: "$2.79", icon: "🥛" },
  { id: 4, name: "Cheddar Cheese", category: "Dairy & Eggs", price: "$4.49", icon: "🧀" },
  { id: 5, name: "Potato Chips", category: "Snacks", price: "$2.99", icon: "🍟" },
  { id: 6, name: "Orange Juice", category: "Beverages", price: "$3.49", icon: "🧃" },
  { id: 7, name: "White Bread", category: "Bakery", price: "$2.49", icon: "🍞" },
  { id: 8, name: "Chicken", category: "Meat & Seafood", price: "$6.99", icon: "🍗" },
  { id: 9, name: "Eggs", category: "Dairy & Eggs", price: "$3.29", icon: "🥚" },
  { id: 10, name: "Apples", category: "Fresh Produce", price: "$2.99", icon: "🍎" },
  { id: 11, name: "Ice Cream", category: "Frozen Foods", price: "$4.99", icon: "🍨" },
  { id: 12, name: "Cereal", category: "Pantry", price: "$3.79", icon: "🥣" },
];

export default function ProductsPage() {
  return (
    <main style={{ background: "#f8faf5", minHeight: "100vh", padding: "40px 7%" }}>
      <Link href="/" style={{ color: "#28784b", textDecoration: "none" }}>
        ← Back to Home
      </Link>

      <h1 style={{ fontSize: "36px", color: "#183d2b", marginTop: "30px" }}>
        All Products
      </h1>

      <p style={{ color: "#68766d", marginBottom: "30px" }}>
        Explore our products and discover your everyday favourites.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "22px"
      }}>
        {products.map((product) => (
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
                {product.price}
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
