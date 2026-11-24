import Link from "next/link";
import { BasketPreview } from "./basket";
export default function Navbar() {
  return <header className="sticky top-0 z-50 border-b border-gray-100 bg-white text-gray-800"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link href="/" className="text-2xl font-extrabold text-green-700">🛒 Basketly</Link><nav aria-label="Main navigation" className="order-last flex w-full flex-wrap gap-5 text-sm font-semibold sm:order-none sm:w-auto"><Link href="/" className="hover:text-green-700">Home</Link><Link href="/categories" className="hover:text-green-700">Categories</Link><Link href="/products" className="hover:text-green-700">All Products</Link></nav><BasketPreview /></div></header>;
}
