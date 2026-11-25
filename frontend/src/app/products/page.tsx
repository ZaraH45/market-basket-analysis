"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useBasket } from "@/components/basket";
import ProductImage from "@/components/product-image";
import type {
  DepartmentsResponse,
  Product,
  ProductListResponse,
} from "@/lib/types";

const PAGE_SIZE = 24;

function formatDepartment(department: string): string {
  return department
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function subscribeToDepartmentChanges(callback: () => void) {
  window.addEventListener("basketly-department-change", callback);
  window.addEventListener("popstate", callback);

  return () => {
    window.removeEventListener("basketly-department-change", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getDepartmentFromUrl(): string {
  return new URLSearchParams(window.location.search).get("department") || "";
}

function getServerDepartment(): string {
  return "";
}
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const department = useSyncExternalStore(
    subscribeToDepartmentChanges,
    getDepartmentFromUrl,
    getServerDepartment
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { items, add } = useBasket();


  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await apiGet<DepartmentsResponse>(
          "/products/departments"
        );
        setDepartments(response.departments);
      } catch {
        setError("Could not load product departments.");
      }
    }

    loadDepartments();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (department) {
        params.set("department", department);
      }

      try {
        const response = await apiGet<ProductListResponse>(
          `/products?${params.toString()}`
        );

        if (active) {
          setProducts(response.products);
          setTotal(response.total);
        }
      } catch {
        if (active) {
          setError("Could not load products. Please check that the backend is running.");
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [page, search, department]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleDepartmentChange(value: string) {
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set("department", value);
    } else {
      params.delete("department");
    }

    const query = params.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
    window.dispatchEvent(new Event("basketly-department-change"));
    setPage(1);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#26352c]">
<section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#72917b]">
            Explore the catalogue
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            All Products
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Browse products from our grocery catalogue and add your favourites
            to your basket.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products by name..."
            className="min-w-0 flex-1 rounded-xl border border-[#e5e9e3] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#246b45]"
          />

          <button
            type="submit"
            className="rounded-xl bg-[#246b45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#194f32]"
          >
            Search
          </button>
        </form>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="department" className="text-sm font-semibold">
              Department
            </label>

            <select
              id="department"
              value={department}
              onChange={(event) => handleDepartmentChange(event.target.value)}
              className="max-w-full rounded-xl border border-[#e5e9e3] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#246b45]"
            >
              <option value="">All Departments</option>
              {departments
                .filter((item) => item !== "missing")
                .map((item) => (
                  <option key={item} value={item}>
                    {formatDepartment(item)}
                  </option>
                ))}
            </select>

            {(search || department) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  handleDepartmentChange("");
                  setPage(1);
                }}
                className="text-sm font-semibold text-[#246b45] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            {loading ? "Loading products..." : `${total.toLocaleString()} products found`}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#edf0e9] bg-white py-20 text-center text-sm text-gray-500">
            Loading catalogue...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#edf0e9] bg-white py-20 text-center">
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try another search term or choose a different department.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.product_id}
                className="flex flex-col rounded-2xl border border-[#edf0e9] bg-white p-5 transition hover:-translate-y-1 hover:border-[#b9d2bd] hover:shadow-md"
              >
                <Link
                  href={`/products/${product.product_id}`}
                  className="flex flex-1 flex-col"
                  aria-label={`View ${product.product_name} details`}
                >
                  <div className="flex h-28 items-center justify-center rounded-xl bg-[#edf5ed]">
                    <ProductImage
                      productId={product.product_id}
                      productName={product.product_name}
                      department={product.department}
                    />
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="text-xs font-medium text-[#72917b]">
                      {product.department
                        ? formatDepartment(product.department)
                        : "Grocery Product"}
                    </p>

                    <span className="mt-2 block font-semibold leading-6 transition hover:text-[#246b45]">
                      {product.product_name}
                    </span>

                    <p className="mt-2 text-xs text-gray-400">
                      {product.aisle
                        ? `Aisle: ${formatDepartment(product.aisle)}`
                        : "Catalogue product"}
                    </p>
                  </div>

                  <span className="mt-5 text-xs text-gray-400">
                    ID: {product.product_id}
                  </span>
                </Link>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => add(product.product_id)}
                    className="rounded-lg bg-[#edf5ed] px-3 py-2 text-xs font-semibold text-[#246b45] transition hover:bg-[#dcebdc]"
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

        {!loading && totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage(page - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-[#e5e9e3] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage(page + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-[#e5e9e3] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
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
