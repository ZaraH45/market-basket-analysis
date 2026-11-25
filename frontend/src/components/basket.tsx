"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

type BasketItems = Record<number, number>;

const STORAGE_KEY = "basketly.basket.v1";

const emptyBasket: BasketItems = {};

let cachedRaw: string | null | undefined = undefined;
let cachedBasket: BasketItems = emptyBasket;

const listeners = new Set<() => void>();

function getSnapshot(): BasketItems {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw !== cachedRaw) {
      const parsed: unknown = JSON.parse(raw || "{}");
      const next: BasketItems = {};

      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        for (const [rawId, rawQuantity] of Object.entries(parsed)) {
          const productId = Number(rawId);

          if (
            Number.isSafeInteger(productId) &&
            productId > 0 &&
            Number.isSafeInteger(rawQuantity) &&
            Number(rawQuantity) > 0
          ) {
            next[productId] = Number(rawQuantity);
          }
        }
      }

      cachedRaw = raw;
      cachedBasket = next;
    }
  } catch {
    // Keep the in-memory basket if browser storage is unavailable.
  }

  return cachedBasket;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      cachedRaw = undefined;
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyListeners() {
  listeners.forEach((callback) => callback());
}

function updateBasket(productId: number, change: number) {
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return;
  }

  const next = { ...getSnapshot() };
  const newQuantity = (next[productId] || 0) + change;

  if (newQuantity > 0) {
    next[productId] = newQuantity;
  } else {
    delete next[productId];
  }

  cachedBasket = next;

  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
  } catch {
    // Keep the in-memory basket if browser storage is unavailable.
    cachedRaw = undefined;
  }

  notifyListeners();
}

export function useBasket() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => emptyBasket
  );

  return {
    items,
    add: (productId: number) => updateBasket(productId, 1),
    remove: (productId: number) => updateBasket(productId, -1),
  };
}

export function BasketPreview() {
  const { items } = useBasket();

  let count = 0;

  for (const quantity of Object.values(items)) {
    count += quantity;
  }

  return (
    <Link
      href="/cart"
      className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e9e3] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f3f7f1]"
    >
      <span>Cart</span>
      <span className="rounded-full bg-[#246b45] px-2 py-0.5 text-xs text-white">
        {count}
      </span>
    </Link>
  );
}
