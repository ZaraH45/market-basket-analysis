"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { DepartmentsResponse } from "@/lib/types";

interface CategoryGridProps {
  limit?: number;
}

const featuredDepartments = [
  "produce",
  "dairy eggs",
  "snacks",
  "beverages",
  "bakery",
  "meat seafood",
  "frozen",
  "pantry",
];

const categoryStyles: Record<
  string,
  { label: string; icon: string; color: string; description: string }
> = {
  produce: {
    label: "Fresh Produce",
    icon: "\u{1F951}",
    color: "bg-green-100",
    description: "Fruits and vegetables",
  },
  "dairy eggs": {
    label: "Dairy & Eggs",
    icon: "\u{1F95B}",
    color: "bg-blue-100",
    description: "Milk, cheese and eggs",
  },
  snacks: {
    label: "Snacks",
    icon: "\u{1F37F}",
    color: "bg-yellow-100",
    description: "Chips and snack foods",
  },
  beverages: {
    label: "Beverages",
    icon: "\u{1F964}",
    color: "bg-purple-100",
    description: "Drinks and juices",
  },
  bakery: {
    label: "Bakery",
    icon: "\u{1F35E}",
    color: "bg-orange-100",
    description: "Bread and bakery items",
  },
  "meat seafood": {
    label: "Meat & Seafood",
    icon: "\u{1F357}",
    color: "bg-red-100",
    description: "Meat and seafood products",
  },
  frozen: {
    label: "Frozen Foods",
    icon: "\u{1F9CA}",
    color: "bg-cyan-100",
    description: "Frozen grocery products",
  },
  pantry: {
    label: "Pantry",
    icon: "\u{1F96B}",
    color: "bg-amber-100",
    description: "Everyday pantry essentials",
  },
  babies: {
    label: "Baby Products",
    icon: "\u{1F37C}",
    color: "bg-pink-100",
    description: "Products for babies",
  },
  deli: {
    label: "Deli",
    icon: "\u{1F96A}",
    color: "bg-orange-50",
    description: "Deli counter products",
  },
  household: {
    label: "Household",
    icon: "\u{1F9F9}",
    color: "bg-stone-100",
    description: "Household essentials",
  },
  "personal care": {
    label: "Personal Care",
    icon: "\u{1F9FC}",
    color: "bg-pink-50",
    description: "Personal care essentials",
  },
  pets: {
    label: "Pet Supplies",
    icon: "\u{1F43E}",
    color: "bg-amber-50",
    description: "Everyday pet essentials",
  },
  breakfast: {
    label: "Breakfast",
    icon: "\u{1F95E}",
    color: "bg-yellow-50",
    description: "Breakfast favourites",
  },
  "dry goods pasta": {
    label: "Dry Goods & Pasta",
    icon: "\u{1F35D}",
    color: "bg-orange-100",
    description: "Pasta and dry goods",
  },
  "canned goods": {
    label: "Canned Goods",
    icon: "\u{1F96B}",
    color: "bg-lime-100",
    description: "Canned grocery products",
  },
  bulk: {
    label: "Bulk Items",
    icon: "\u{1F9FA}",
    color: "bg-slate-100",
    description: "Bulk grocery items",
  },
  international: {
    label: "International",
    icon: "\u{1F30D}",
    color: "bg-teal-100",
    description: "International grocery products",
  },
  other: {
    label: "Other Products",
    icon: "\u{1F4E6}",
    color: "bg-gray-100",
    description: "More grocery products",
  },
  alcohol: {
    label: "Alcohol",
    icon: "\u{1F377}",
    color: "bg-purple-100",
    description: "Catalogue department",
  },
};

function formatDepartment(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CategoryGrid({ limit }: CategoryGridProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await apiGet<DepartmentsResponse>(
          "/products/departments"
        );

        setDepartments(
          response.departments.filter((department) => department !== "missing")
        );
      } catch {
        setError("Could not load categories. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadDepartments();
  }, []);

  const visibleDepartments = limit
    ? featuredDepartments.filter((department) =>
        departments.includes(department)
      ).slice(0, limit)
    : [...departments].sort();

  return (
    <div>
      {loading ? (
        <div className="rounded-2xl border border-[#edf0e9] bg-white py-12 text-center text-sm text-gray-500">
          Loading categories...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : visibleDepartments.length === 0 ? (
        <div className="rounded-2xl border border-[#edf0e9] bg-white py-12 text-center text-sm text-gray-500">
          No categories are currently available.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {visibleDepartments.map((department) => {
            const style = categoryStyles[department];
            const label = style?.label || formatDepartment(department);
            const icon = style?.icon || "\u{1F6D2}";
            const color = style?.color || "bg-gray-100";
            const description =
              style?.description || "Explore grocery products";

            return (
              <Link
                key={department}
                href={`/products?department=${encodeURIComponent(department)}`}
                className="group rounded-2xl border border-[#edf0e9] bg-white p-5 text-center transition hover:-translate-y-1 hover:border-[#b9d2bd] hover:shadow-md"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${color}`}
                >
                  {icon}
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#26352c] transition group-hover:text-[#246b45]">
                  {label}
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  {description}
                </p>

                <span className="mt-4 inline-block text-xs font-semibold text-[#246b45]">
                  Explore
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
