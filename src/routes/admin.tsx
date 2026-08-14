import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadOrders,
  saveOrders,
  rupees,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "@/lib/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Orders Dashboard — Anand Bal Bhandar" },
      {
        name: "description",
        content:
          "Owner dashboard for Anand Bal Bhandar: view incoming snack orders, customer details and update order status.",
      },
      { property: "og:title", content: "Orders Dashboard — Anand Bal Bhandar" },
      {
        property: "og:description",
        content: "View incoming orders and update their status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const sync = () => setOrders(loadOrders());
    sync();
    window.addEventListener("abb-orders-updated", sync);
    return () => window.removeEventListener("abb-orders-updated", sync);
  }, []);

  const setStatus = (id: string, status: OrderStatus) => {
    const next = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(next);
    saveOrders(next);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Incoming Orders</h1>
        <Link to="/" className="text-sm font-semibold text-primary">
          ← Shop
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="card-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-primary">{o.id}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 font-semibold">
                {o.name} · {o.phone}
              </p>
              <p className="text-sm text-muted-foreground">{o.address}</p>
              {o.note ? <p className="mt-1 text-sm italic">“{o.note}”</p> : null}
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>
                      {i.name} × {i.qty}
                    </span>
                    <span>{rupees(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <span className="text-lg font-bold">Total {rupees(o.total)}</span>
                <div className="flex flex-wrap gap-1.5">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(o.id, s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        o.status === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
