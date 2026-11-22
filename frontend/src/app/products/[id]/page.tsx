
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const products = [
  { id: 1, name: "Banana", category: "Fresh Produce", price: "$1.49", icon: "🍌", description: "Fresh and naturally sweet bananas, perfect for everyday snacks and smoothies." },
  { id: 2, name: "Strawberries", category: "Fresh Produce", price: "$3.99", icon: "🍓", description: "Sweet and juicy strawberries, great for desserts and healthy snacks." },
  { id: 3, name: "Whole Milk", category: "Dairy & Eggs", price: "$2.79", icon: "🥛", description: "A classic dairy essential for breakfast, tea and everyday cooking." },
  { id: 4, name: "Cheddar Cheese", category: "Dairy & Eggs", price: "$4.49", icon: "🧀", description: "Rich and creamy cheddar cheese for sandwiches and meals." },
  { id: 5, name: "Potato Chips", category: "Snacks", price: "$2.99", icon: "🍟", description: "Crunchy potato chips for a quick and tasty snack." },
  { id: 6, name: "Orange Juice", category: "Beverages", price: "$3.49", icon: "🧃", description: "Refreshing orange juice for your breakfast and daily routine." },
  { id: 7, name: "White Bread", category: "Bakery", price: "$2.49", icon: "🍞", description: "Soft white bread, suitable for toast and sandwiches." },
  { id: 8, name: "Chicken", category: "Meat & Seafood", price: "$6.99", icon: "🍗", description: "A versatile kitchen staple for a variety of meals." },
  { id: 9, name: "Eggs", category: "Dairy & Eggs", price: "$3.29", icon: "🥚", description: "Everyday eggs for breakfast, baking and cooking." },
  { id: 10, name: "Apples", category: "Fresh Produce", price: "$2.99", icon: "🍎", description: "Crisp apples, perfect for a fresh and simple snack." },
  { id: 11, name: "Ice Cream", category: "Frozen Foods", price: "$4.99", icon: "🍨", description: "A sweet frozen treat for dessert lovers." },
  { id: 12, name: "Cereal", category: "Pantry", price: "$3.79", icon: "🥣", description: "A convenient breakfast option for busy mornings." },
];

export default function ProductDetailsPage() {
  const params = useParams();
  const [added, setAdded] = useState(false);

  const product = products.find(
    (item) => item.id === Number(params.id)
  );

  if (!product) {
    return (
      <main style={{ padding: "60px", textAlign: "center" }}>
        <h1>Product Not Found</h1>
        <Link href="/products">Back to Products</Link>
      </main>
    );
  }

  return (
    <main style={{
      background: "#f8faf5",
      minHeight: "100vh",
      padding: "40px 7%"
    }}>
      <Link href="/products" style={{
        color: "#28784b",
        textDecoration: "none"
      }}>
        ← Back to Products
      </Link>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "50px",
        alignItems: "center",
        maxWidth: "1000px",
        margin: "55px auto"
      }}>
        <div style={{
          background: "#edf5e9",
          borderRadius: "25px",
          minHeight: "350px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "130px"
        }}>
          {product.icon}
        </div>

        <div>
          <p style={{
            color: "#28784b",
            fontWeight: "600"
          }}>
            {product.category}
          </p>

          <h1 style={{
            color: "#183d2b",
            fontSize: "38px",
            margin: "12px 0"
          }}>
            {product.name}
          </h1>

          <h2 style={{
            color: "#28784b",
            fontSize: "28px"
          }}>
            {product.price}
          </h2>

          <p style={{
            color: "#68766d",
            lineHeight: "1.8",
            margin: "22px 0"
          }}>
            {product.description}
          </p>

          <button
            onClick={() => setAdded(true)}
            style={{
              background: "#28784b",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "15px 28px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {added ? "Added to Basket ✓" : "Add to Basket"}
          </button>
        </div>
      </div>
    </main>
  );
}
