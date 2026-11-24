"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { products } from "@/lib/catalog";
type Items = Record<number, number>;
const key = "basketly.member1.basket.v1";
const empty: Items = {};
let cachedRaw: string | null = null;
let cached: Items = empty;
const listeners = new Set<() => void>();
function snapshot(): Items {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed: unknown = JSON.parse(raw || "{}");
      cached = {};
      if (parsed && typeof parsed === "object") {
        for (const p of products) {
          const n = (parsed as Items)[p.id];
          if (Number.isInteger(n) && n > 0) cached[p.id] = n;
        }
      }
    }
  } catch { /* Retain in-memory basket when storage is unavailable. */ }
  return cached;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => { listeners.delete(fn); window.removeEventListener("storage", fn); };
}
function update(id: number, delta: number) {
  const next = { ...snapshot() };
  const quantity = (next[id] || 0) + delta;
  if (quantity > 0) next[id] = quantity; else delete next[id];
  cached = next;
  try { cachedRaw = JSON.stringify(next); localStorage.setItem(key, cachedRaw); } catch { /* Storage unavailable. */ }
  listeners.forEach(fn => fn());
}
export function useBasket() {
  const items = useSyncExternalStore(subscribe, snapshot, () => empty);
  return { items, add: (id: number) => update(id, 1), remove: (id: number) => update(id, -1) };
}
export function BasketPreview() {
  const {items, add, remove} = useBasket();
  const count = Object.values(items).reduce((a,b) => a+b,0);
  return <details className="relative text-sm text-gray-800"><summary className="cursor-pointer rounded-full bg-green-100 px-4 py-2 font-bold text-green-800">Basket ({count})</summary><div className="absolute right-0 z-50 mt-2 w-64 max-w-[85vw] rounded-xl border bg-white p-4 shadow-xl"><p className="mb-2 font-bold">Your basket</p>{!count && <p>Your basket is empty.</p>}{products.filter(p => items[p.id]).map(p => <div key={p.id} className="flex items-center gap-2 border-b py-2"><Link href={`/products/${p.id}`} className="flex-1">{p.name}</Link><button aria-label={`Remove one ${p.name}`} onClick={() => remove(p.id)}>−</button><span>{items[p.id]}</span><button aria-label={`Add one ${p.name}`} onClick={() => add(p.id)}>+</button></div>)}<p className="mt-3 font-semibold">Subtotal: ${products.reduce((sum,p) => sum + Number(p.price)*(items[p.id]||0),0).toFixed(2)}</p></div></details>;
}
