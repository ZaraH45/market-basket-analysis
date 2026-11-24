
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";


import { products } from "@/lib/catalog";
import { useBasket } from "@/components/basket";

export default function ProductDetailsPage() {
  const params = useParams();
  const { items, add } = useBasket();

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
            ${product.price}
          </h2>

          <p style={{
            color: "#68766d",
            lineHeight: "1.8",
            margin: "22px 0"
          }}>
            {product.description}
          </p>

          <button
            onClick={() => add(product.id)}
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
            {items[product.id] ? `Add another (${items[product.id]} in basket)` : "Add to Basket"}
          </button>
          <p className="mt-3 text-green-800" role="status">{items[product.id] ? `${items[product.id]} in your basket` : ""}</p>
        </div>
      </div>
    </main>
  );
}
