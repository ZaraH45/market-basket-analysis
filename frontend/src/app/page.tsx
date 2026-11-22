
"use client";

import { useState } from "react";

const categories = [
  { name: "Fruits & Vegetables", icon: "🥑", color: "bg-green-100" },
  { name: "Dairy & Eggs", icon: "🥛", color: "bg-blue-100" },
  { name: "Bakery", icon: "🍞", color: "bg-orange-100" },
  { name: "Snacks", icon: "🍿", color: "bg-yellow-100" },
  { name: "Beverages", icon: "🥤", color: "bg-purple-100" },
  { name: "Frozen Foods", icon: "🧊", color: "bg-cyan-100" },
];

const products = [
  { id: 1, name: "Fresh Bananas", category: "Fruits & Vegetables", icon: "🍌", price: "2.49", tag: "Popular" },
  { id: 2, name: "Fresh Milk", category: "Dairy & Eggs", icon: "🥛", price: "3.29", tag: "Fresh" },
  { id: 3, name: "Whole Wheat Bread", category: "Bakery", icon: "🍞", price: "2.99", tag: "Bestseller" },
  { id: 4, name: "Farm Fresh Eggs", category: "Dairy & Eggs", icon: "🥚", price: "4.49", tag: "Popular" },
  { id: 5, name: "Fresh Strawberries", category: "Fruits & Vegetables", icon: "🍓", price: "3.99", tag: "Fresh" },
  { id: 6, name: "Potato Chips", category: "Snacks", icon: "🍟", price: "1.99", tag: "Popular" },
  { id: 7, name: "Orange Juice", category: "Beverages", icon: "🧃", price: "3.49", tag: "Fresh" },
  { id: 8, name: "Ice Cream", category: "Frozen Foods", icon: "🍦", price: "4.99", tag: "New" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#f8faf7] text-gray-800">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">

          <a href="#" className="text-2xl font-extrabold text-green-700">
            🛒 Basketly
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#" className="text-green-700">Home</a>
            <a href="#categories" className="hover:text-green-700">Categories</a>
            <a href="#products" className="hover:text-green-700">All Products</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="#products" className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
              Explore Products
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-800 to-green-600 px-8 py-14 text-white md:px-16 md:py-20">

          <div className="relative z-10 max-w-2xl">
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
              🌿 Freshness at your fingertips
            </span>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight md:text-6xl">
              Fresh Groceries,
              <br />
              Happy Living.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-green-50 md:text-lg">
              Discover your everyday essentials, explore fresh products
              and make grocery shopping simple.
            </p>

            <div className="mt-8 flex max-w-xl overflow-hidden rounded-xl bg-white p-2">
              <input
                type="text"
                placeholder="Search your favourite products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCategory("All");
                }}
                className="min-w-0 flex-1 px-3 text-sm text-gray-800 outline-none"
              />
              <a
                href="#products"
                className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Search
              </a>
            </div>
          </div>

          <div className="absolute -right-10 -top-10 hidden h-80 w-80 items-center justify-center rounded-full bg-white/10 text-9xl lg:flex">
            🥑
          </div>
          <div className="absolute bottom-5 right-36 hidden text-6xl lg:block">
            🍓
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
              Shop by category
            </p>
            <h2 className="mt-2 text-3xl font-bold">Explore Categories</h2>
          </div>
          <a href="#products" className="text-sm font-semibold text-green-700">
            View products →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name);
                setSearch("");
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`${category.color} rounded-2xl p-5 text-center transition hover:-translate-y-1 hover:shadow-md`}
            >
              <div className="text-4xl">{category.icon}</div>
              <p className="mt-4 text-sm font-bold text-gray-800">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
            Our collection
          </p>
          <h2 className="mt-2 text-3xl font-bold">Popular Products</h2>
          <p className="mt-2 text-gray-500">
            Find your everyday grocery essentials.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {["All", ...categories.map((c) => c.name)].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "bg-green-700 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-green-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative flex h-44 items-center justify-center bg-[#f1f7ef] text-7xl">
                  {product.icon}
                  <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700">
                    {product.tag}
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-400">{product.category}</p>
                  <h3 className="mt-2 font-bold">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-green-800">
                      ${product.price}
                    </span>
                    <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-bold text-green-800">
                      Explore
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white py-16 text-center">
            <p className="text-4xl">🔍</p>
            <h3 className="mt-4 text-xl font-bold">No products found</h3>
            <p className="mt-2 text-gray-500">
              Try another search or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="mt-5 rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white"
            >
              Show All Products
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-6 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-2xl font-extrabold">🛒 Basketly</h2>
            <p className="mt-3 text-sm text-gray-400">
              Your everyday grocery shopping destination.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            <a href="#" className="hover:text-green-400">Home</a>
            <a href="#categories" className="hover:text-green-400">Categories</a>
            <a href="#products" className="hover:text-green-400">Products</a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          © 2026 Basketly. All rights reserved.
        </div>
      </footer>

    </main>
  );
}
