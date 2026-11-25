"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  productId: number;
  productName: string;
  department?: string | null;
}

const departmentIcons: Record<string, string> = {
  produce: "\u{1F34E}",
  "dairy eggs": "\u{1F95B}",
  snacks: "\u{1F36A}",
  beverages: "\u{1F964}",
  bakery: "\u{1F35E}",
  "meat seafood": "\u{1F969}",
  frozen: "\u{1F9CA}",
  pantry: "\u{1F96B}",
  "dry goods pasta": "\u{1F35D}",
  "canned goods": "\u{1F96B}",
  babies: "\u{1F37C}",
  deli: "\u{1F96A}",
  household: "\u{1F9F9}",
  "personal care": "\u{1F9FC}",
  pets: "\u{1F43E}",
  breakfast: "\u{1F95E}",
  bulk: "\u{1F9FA}",
  international: "\u{1F30D}",
  other: "\u{1F4E6}",
  alcohol: "\u{1F377}",
};

export default function ProductImage({
  productId,
  productName,
  department,
}: ProductImageProps) {
  const normalizedDepartment = department?.toLowerCase().trim() || "other";
  const departmentSlug = normalizedDepartment.replace(/\s+/g, "-");

  const productImagePath = `/images/products/${productId}.jpg`;

  // Select one of five department images consistently for each product.
  const categoryImageNumber = (Math.abs(productId) % 5) + 1;
  const categoryImagePath =
    `/images/categories/${departmentSlug}/${categoryImageNumber}.jpg`;

  const [imageSource, setImageSource] = useState<string | null>(
    productImagePath
  );

  const icon = departmentIcons[normalizedDepartment] || "\u{1F6D2}";

  function handleImageError() {
    if (imageSource === productImagePath) {
      setImageSource(categoryImagePath);
    } else {
      setImageSource(null);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {imageSource ? (
        <Image
          src={imageSource}
          alt={productName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-3"
          onError={handleImageError}
        />

      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#edf5ed]">
          <span className="text-5xl" aria-hidden="true">
            {icon}
          </span>
        </div>
      )}
    </div>
  );
}
