"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useBasket } from "@/components/basket";
import ProductImage from "@/components/product-image";
import type { Product } from "@/lib/types";

function formatLabel(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { items, add } = useBasket();

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        setError("Product not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await apiGet<Product>(`/products/${productId}`);

        if (active) {
          setProduct(response);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Could not load product.";

          if (message.includes("404")) {
            setError("This product could not be found in the catalogue.");
          } else {
            setError(
              "Could not load this product. Please check that the backend is running."
            );
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const quantity = product ? items[product.product_id] || 0 : 0;

  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
<section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#246b45] hover:underline"
        >
          Back to Products
        </Link>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-[#edf0e9] bg-white py-24 text-center text-sm text-gray-500">
            Loading product details...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-[#edf0e9] bg-white px-6 py-20 text-center">
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <p className="mt-3 text-sm text-gray-500">{error}</p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-xl bg-[#246b45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#194f32]"
            >
              Browse Products
            </Link>
          </div>
        ) : product ? (
          <div className="mt-8 grid gap-10 rounded-3xl border border-[#edf0e9] bg-white p-6 shadow-sm md:grid-cols-2 md:gap-14 md:p-10">
            <div className="flex min-h-72 items-center justify-center rounded-2xl bg-[#edf5ed] md:min-h-96">
              <ProductImage
                productId={product.product_id}
                productName={product.product_name}
                department={product.department}
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
                {product.department
                  ? formatLabel(product.department)
                  : "Grocery Product"}
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#183d2b] md:text-4xl">
                {product.product_name}
              </h1>

              <div className="mt-6 space-y-4 border-y border-[#edf0e9] py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Product ID
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product.product_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Department
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product.department
                      ? formatLabel(product.department)
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Aisle
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {product.aisle
                      ? formatLabel(product.aisle)
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => add(product.product_id)}
                className="mt-7 rounded-xl bg-[#246b45] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#194f32]"
              >
                {quantity > 0
                  ? `Add another (${quantity} in basket)`
                  : "Add to Basket"}
              </button>

              <p
                className="mt-3 min-h-5 text-sm font-medium text-[#246b45]"
                role="status"
              >
                {quantity > 0 ? `${quantity} in your basket` : ""}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="mt-10 border-t border-[#e9ede7] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500">
          <p className="font-bold text-[#246b45]">Basketly</p>
          <p className="mt-1 text-xs">
            A smarter way to shop for groceries.
          </p>
        </div>
      </footer>
    </main>
  );
}
