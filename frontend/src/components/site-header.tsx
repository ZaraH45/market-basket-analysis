"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBasket } from "@/components/basket";

export default function SiteHeader() {
  const pathname = usePathname();
  const { items } = useBasket();

  let basketCount = 0;

  for (const quantity of Object.values(items)) {
    basketCount += quantity;
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
    { label: "Categories", href: "/categories" },
    { label: "Insights & Analytics", href: "/analytics" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-[#e9ede7] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246b45] text-xl text-white">
            {"\u{1F6D2}"}
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#246b45]">
              Basketly
            </h1>
            <p className="text-[10px] tracking-wide text-gray-500">
              FRESHNESS AT YOUR DOOR
            </p>
          </div>
        </Link>

        <div className="hidden max-w-xl flex-1 md:block">
          <div className="flex items-center rounded-xl border border-[#e5e9e3] bg-[#f8faf7] px-4 py-3">
            <span className="mr-3 text-gray-400">{"\u{1F50D}"}</span>
            <input
              type="text"
              placeholder="Search for fruits, vegetables, groceries..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            <span className="text-xs text-gray-400">Search</span>
          </div>
        </div>

        <Link
          href="/cart"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e9e3] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f3f7f1]"
        >
          <span>{"\u{1F6D2}"}</span>
          <span className="font-semibold text-[#246b45]">Cart</span>
          <span className="rounded-full bg-[#246b45] px-2 py-0.5 text-xs text-white">
            {basketCount}
          </span>
        </Link>
      </div>

      <nav className="border-t border-[#f0f1ed]">
        <div className="mx-auto flex max-w-7xl items-center gap-8 overflow-x-auto px-6 py-3 text-sm">
          {navLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/categories"
                  ? pathname === "/categories"
                  : item.href === "/products"
                    ? pathname === "/products" || pathname.startsWith("/products/")
                    : pathname.startsWith("/analytics");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap transition hover:text-[#246b45] ${
                  active
                    ? "font-semibold text-[#246b45]"
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
