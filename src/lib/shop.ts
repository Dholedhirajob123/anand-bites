import bel from "@/assets/bel.jpg";
import mungVada from "@/assets/mung-vada.jpg";
import samosa from "@/assets/samosa.jpg";

export type Product = {
  id: string;
  name: string;
  marathi: string;
  price: number;
  image: string;
};

export const PRODUCTS: Product[] = [
  { id: "bel", name: "Bel", marathi: "भेळ", price: 15, image: bel },
  { id: "mung-vada", name: "Mung Vada", marathi: "मूग वडा", price: 15, image: mungVada },
  { id: "samosa", name: "Samosa", marathi: "समोसा", price: 15, image: samosa },
];

export const SHOP = {
  name: "Anand Bal Bhandar",
  address: "[ADD SHOP ADDRESS HERE]",
  phone: "",
};

export type CartLine = { id: string; name: string; price: number; qty: number };

export type OrderStatus = "New" | "Preparing" | "Ready" | "Completed";

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  note?: string;
  items: CartLine[];
  total: number;
  status: OrderStatus;
};

export const ORDER_STATUSES: OrderStatus[] = ["New", "Preparing", "Ready", "Completed"];

const KEY = "abb_orders";

// Local persistence layer. Swap these two functions for a backend/WhatsApp
// integration without touching the UI.
export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("abb-orders-updated"));
}

export function newOrderId() {
  return "ABB-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export const rupees = (n: number) => `₹${n}`;
