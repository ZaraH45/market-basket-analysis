export const categories = [
  { name: "Fresh Produce", icon: "🥑", count: "Fruits & vegetables", color: "bg-green-100" },
  { name: "Dairy & Eggs", icon: "🥛", count: "Milk, cheese & eggs", color: "bg-blue-100" },
  { name: "Snacks", icon: "🍿", count: "Chips & snacks", color: "bg-yellow-100" },
  { name: "Beverages", icon: "🥤", count: "Drinks & juices", color: "bg-purple-100" },
  { name: "Bakery", icon: "🍞", count: "Bread & bakery items", color: "bg-orange-100" },
  { name: "Meat & Seafood", icon: "🍗", count: "Fresh meat & seafood", color: "bg-red-100" },
  { name: "Frozen Foods", icon: "🧊", count: "Frozen products", color: "bg-cyan-100" },
  { name: "Pantry", icon: "🥫", count: "Daily essentials", color: "bg-amber-100" },
];

export const products = [
  { id: 1, name: "Banana", category: "Fresh Produce", price: "1.49", icon: "🍌", description: "Fresh and naturally sweet bananas, perfect for everyday snacks and smoothies." },
  { id: 2, name: "Strawberries", category: "Fresh Produce", price: "3.99", icon: "🍓", description: "Sweet and juicy strawberries, great for desserts and healthy snacks." },
  { id: 3, name: "Whole Milk", category: "Dairy & Eggs", price: "2.79", icon: "🥛", description: "A classic dairy essential for breakfast, tea and everyday cooking." },
  { id: 4, name: "Cheddar Cheese", category: "Dairy & Eggs", price: "4.49", icon: "🧀", description: "Rich and creamy cheddar cheese for sandwiches and meals." },
  { id: 5, name: "Potato Chips", category: "Snacks", price: "2.99", icon: "🍟", description: "Crunchy potato chips for a quick and tasty snack." },
  { id: 6, name: "Orange Juice", category: "Beverages", price: "3.49", icon: "🧃", description: "Refreshing orange juice for your breakfast and daily routine." },
  { id: 7, name: "White Bread", category: "Bakery", price: "2.49", icon: "🍞", description: "Soft white bread, suitable for toast and sandwiches." },
  { id: 8, name: "Chicken", category: "Meat & Seafood", price: "6.99", icon: "🍗", description: "A versatile kitchen staple for a variety of meals." },
  { id: 9, name: "Eggs", category: "Dairy & Eggs", price: "3.29", icon: "🥚", description: "Everyday eggs for breakfast, baking and cooking." },
  { id: 10, name: "Apples", category: "Fresh Produce", price: "2.99", icon: "🍎", description: "Crisp apples, perfect for a fresh and simple snack." },
  { id: 11, name: "Ice Cream", category: "Frozen Foods", price: "4.99", icon: "🍨", description: "A sweet frozen treat for dessert lovers." },
  { id: 12, name: "Cereal", category: "Pantry", price: "3.79", icon: "🥣", description: "A convenient breakfast option for busy mornings." },
];

export function categoryUrl(name: string) { return `/products?category=${encodeURIComponent(name)}`; }
