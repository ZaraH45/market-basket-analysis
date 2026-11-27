"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { useBasket } from "@/components/basket";
import ProductImage from "@/components/product-image";
import type { Product, RecommendationResponse, RecommendedProduct } from "@/lib/types";

const RECOMMENDATION_COUNT = 8;

function formatLabel(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Loads product details (name, department) for a list of product IDs.
function useProductDetails(ids: number[]) {
  const [details, setDetails] = useState<Record<number, Product>>({});
  const key = ids.join(",");

  useEffect(() => {
    let active = true;
    const missing = ids.filter((id) => !details[id]);

    if (missing.length === 0) return;

    Promise.all(
      missing.map((id) =>
        apiGet<Product>(`/products/${id}`).catch(() => null)
      )
    ).then((results) => {
      if (!active) return;
      setDetails((previous) => {
        const next = { ...previous };
        for (const product of results) {
          if (product) next[product.product_id] = product;
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return details;
}

export default function CartPage() {
  const { items, add, remove, removeAll, clear } = useBasket();

  const cartIds = useMemo(
    () =>
      Object.keys(items)
        .map(Number)
        .sort((a, b) => a - b),
    [items]
  );
  const cartKey = cartIds.join(",");
  const totalUnits = cartIds.reduce((sum, id) => sum + items[id], 0);

  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");

  // Ask the backend for recommendations every time the cart contents change.
  useEffect(() => {
    let active = true;
    setRecLoading(true);
    setRecError("");

    apiPost<{ basket: number[]; k: number }, RecommendationResponse>(
      "/recommend",
      { basket: cartIds, k: RECOMMENDATION_COUNT }
    )
      .then((response) => {
        if (active) setRecommendations(response.recommendations);
      })
      .catch((err) => {
        if (active) {
          setRecommendations([]);
          setRecError(
            err instanceof Error
              ? err.message
              : "Could not load recommendations."
          );
        }
      })
      .finally(() => {
        if (active) setRecLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  const cartDetails = useProductDetails(cartIds);
  const recDetails = useProductDetails(recommendations.map((r) => r.product_id));

  const hasRuleRecs = recommendations.some((r) => r.source === "rule");

  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
          Your basket
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Shopping Cart</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ---------- Cart items ---------- */}
          <div className="rounded-2xl border border-[#edf0e9] bg-white p-6 shadow-sm">
            {cartIds.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-5xl" aria-hidden="true">
                  {"\u{1F6D2}"}
                </p>
                <h2 className="mt-4 text-xl font-bold">Your cart is empty</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Add a few products and we will suggest what goes well with them.
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex rounded-xl bg-[#246b45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#194f32]"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[#edf0e9]">
                {cartIds.map((id) => {
                  const product = cartDetails[id];
                  return (
                    <li key={id} className="flex items-center gap-4 py-4">
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-[#edf5ed]">
                        <ProductImage
                          productId={id}
                          productName={product?.product_name ?? `Product ${id}`}
                          department={product?.department}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${id}`}
                          className="block truncate font-semibold hover:text-[#246b45]"
                        >
                          {product?.product_name ?? `Product ${id}`}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">
                          {product?.department
                            ? formatLabel(product.department)
                            : "Grocery Product"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          aria-label="Decrease quantity"
                          className="h-8 w-8 rounded-lg border border-[#e5e9e3] text-lg leading-none transition hover:bg-[#f3f7f1]"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {items[id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => add(id)}
                          aria-label="Increase quantity"
                          className="h-8 w-8 rounded-lg border border-[#e5e9e3] text-lg leading-none transition hover:bg-[#f3f7f1]"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAll(id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ---------- Summary ---------- */}
          <aside className="h-fit rounded-2xl border border-[#edf0e9] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Different products</dt>
                <dd className="font-semibold">{cartIds.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total items</dt>
                <dd className="font-semibold">{totalUnits}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={clear}
              disabled={cartIds.length === 0}
              className="mt-6 w-full rounded-xl border border-[#e5e9e3] px-4 py-3 text-sm font-semibold transition hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear cart
            </button>
          </aside>
        </div>

        {/* ---------- Recommendations ---------- */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
            Powered by association rules
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {cartIds.length === 0
              ? "Popular picks to get you started"
              : "Recommended for your cart"}
          </h2>
          {cartIds.length > 0 && !recLoading && !recError && (
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {hasRuleRecs
                ? "Items marked “Bought together” come from patterns found in real shopping baskets. The rest are popular products."
                : "None of the products in your cart match a strong buying pattern yet, so we are showing popular products."}
            </p>
          )}

          {recLoading ? (
            <div className="mt-6 rounded-2xl border border-[#edf0e9] bg-white py-16 text-center text-sm text-gray-500">
              Finding recommendations...
            </div>
          ) : recError ? (
            <div className="mt-6 rounded-2xl border border-[#edf0e9] bg-white px-6 py-12 text-center text-sm text-gray-500">
              Could not load recommendations: {recError}. Please check that the
              backend is running.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec) => {
                const product = recDetails[rec.product_id];
                const isRule = rec.source === "rule";
                return (
                  <article
                    key={rec.product_id}
                    className="flex flex-col rounded-2xl border border-[#edf0e9] bg-white p-4 shadow-sm"
                  >
                    <div className="h-40 rounded-xl bg-[#edf5ed]">
                      <ProductImage
                        productId={rec.product_id}
                        productName={rec.product_name}
                        department={product?.department}
                      />
                    </div>

                    <span
                      className={`mt-4 w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isRule
                          ? "bg-[#e3f1e7] text-[#246b45]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isRule ? "Bought together" : "Popular"}
                    </span>

                    <Link
                      href={`/products/${rec.product_id}`}
                      className="mt-2 font-semibold leading-snug hover:text-[#246b45]"
                    >
                      {rec.product_name}
                    </Link>

                    {isRule && rec.confidence !== null && rec.lift !== null && (
                      <p className="mt-2 text-xs text-gray-500">
                        {Math.round(rec.confidence * 100)}% of baskets with{" "}
                        {rec.triggered_by.join(", ")} also had this · lift{" "}
                        {rec.lift.toFixed(1)}×
                      </p>
                    )}

                    <p className="mt-2 flex-1 text-xs leading-5 text-gray-500">
                      {rec.explanation}
                    </p>

                    <button
                      type="button"
                      onClick={() => add(rec.product_id)}
                      className="mt-4 rounded-xl bg-[#246b45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f32]"
                    >
                      Add to Cart
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
