
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Overview",
    href: "/analytics",
    description: "Dataset and mining summary",
  },
  {
    name: "Frequent Itemsets",
    href: "/analytics/itemsets",
    description: "Frequently purchased products",
  },
  {
    name: "Association Rules",
    href: "/analytics/rules",
    description: "Product relationships",
  },
  {
    name: "Evaluation",
    href: "/analytics/evaluation",
    description: "Model performance",
  },
];

export default function AnalyticsSidebar()
{
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-[#e9ede7] bg-white p-3">
        <p className="px-3 pb-3 pt-2 text-xs font-bold uppercase tracking-widest text-[#829487]">
          Analytics
        </p>

        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {navigation.map((item) => {
            const active = item.href === "/analytics" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={`min-w-fit rounded-xl px-3 py-3 transition ${
                  active ? "bg-[#edf5ed] text-[#246b45]" : "text-gray-600 hover:bg-[#f7f9f6] hover:text-[#246b45]"}`}>
                <span className="block whitespace-nowrap text-sm font-semibold">
                  {item.name}
                </span>
                <span className={`mt-1 hidden text-xs lg:block ${active ? "text-[#63836b]" : "text-gray-400"}`}>
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
