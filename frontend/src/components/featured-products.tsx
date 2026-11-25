
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useBasket } from "@/components/basket";
import ProductImage from "@/components/product-image";
import type { PopularProductsResponse } from "@/lib/types";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<
    PopularProductsResponse["products"]
  >([]);
  const [totalBaskets, setTotalBaskets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { items, add } = useBasket();

  useEffect(() => {
    let active = true;

    async function loadPopularProducts() {
      try {
        const response = await apiGet<PopularProductsResponse>(
          "/popular-products?limit=8"
        );

        if (active) {
          setProducts(response.products);
          setTotalBaskets(response.total_baskets);
        }
      } catch {
        if (active) {
          setError("Could not load popular products. Please try again later.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPopularProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="featured" className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
            Based on real shopping patterns
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Popular products
          </h2>
          {totalBaskets > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Frequently purchased across{" "}
              {totalBaskets.toLocaleString()} sampled baskets.
            </p>
          )}
        </div>

        <Link
          href="/products"
          className="text-sm font-semibold text-[#246b45]"
        >
          Browse all products &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#edf0e9] bg-white py-16 text-center text-sm text-gray-500">
          Loading popular products...
        </div>
      ) : error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[#edf0e9] bg-white py-16 text-center text-sm text-gray-500">
          No popular products are available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <article
              key={product.product_id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#edf0e9] bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Link
                href={`/products/${product.product_id}`}
                className="flex flex-1 flex-col"
                aria-label={`View ${product.product_name} details`}
              >
                <div className="relative flex h-40 items-center justify-center bg-[#edf5ed]">
                  <ProductImage
                    productId={product.product_id}
                    productName={product.product_name}
                    department="produce"
                  />

                  {index === 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#246b45] shadow-sm">
                      Most popular
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <span className="font-semibold leading-6 transition hover:text-[#246b45]">
                    {product.product_name}
                  </span>

                  <p className="mt-2 text-xs text-gray-500">
                    Purchased in{" "}
                    <span className="font-semibold text-[#246b45]">
                      {product.basket_count.toLocaleString()}
                    </span>{" "}
                    baskets
                  </p>
                </div>
              </Link>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => add(product.product_id)}
                  className="w-full rounded-xl bg-[#edf5ed] px-4 py-3 text-xs font-semibold text-[#246b45] transition hover:bg-[#dcebdc]"
                >
                  {items[product.product_id]
                    ? `Add more (${items[product.product_id]})`
                    : "Add to basket"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
