import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  loadOrders,
  saveOrders,
  rupees,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "@/lib/shop";

const ADMIN_USER = "anand@123";
const ADMIN_PASS = "anand@123";
const AUTH_KEY = "abb_admin_ok";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Orders Dashboard — Anand Bel Bhandar" },
      {
        name: "description",
        content:
          "Owner dashboard for Anand Bel Bhandar: view incoming snack orders, customer details and update order status.",
      },
      { property: "og:title", content: "Orders Dashboard — Anand Bel Bhandar" },
      {
        property: "og:description",
        content: "View incoming orders and update their status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const dayKey = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [creds, setCreds] = useState({ u: "", p: "" });
  const [err, setErr] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [day, setDay] = useState(() => dayKey(new Date()));

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const sync = () => setOrders(loadOrders());
    sync();
    window.addEventListener("abb-orders-updated", sync);
    return () => window.removeEventListener("abb-orders-updated", sync);
  }, [authed]);

  const setStatus = (id: string, status: OrderStatus) => {
    const next = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(next);
    saveOrders(next);
  };

  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 86400000));

  const dayOrders = useMemo(
    () => orders.filter((o) => dayKey(o.createdAt) === day),
    [orders, day],
  );
  const dayTotal = dayOrders.reduce((s, o) => s + o.total, 0);

  const month = day.slice(0, 7);
  const monthOrders = useMemo(
    () => orders.filter((o) => dayKey(o.createdAt).slice(0, 7) === month),
    [orders, month],
  );
  const monthTotal = monthOrders.reduce((s, o) => s + o.total, 0);

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (creds.u.trim() === ADMIN_USER && creds.p === ADMIN_PASS) {
              sessionStorage.setItem(AUTH_KEY, "1");
              setAuthed(true);
            } else setErr(true);
          }}
          className="card-soft space-y-3 p-5"
        >
          <h1 className="text-2xl font-bold">Owner Login</h1>
          <p className="text-sm text-muted-foreground">Anand Bel Bhandar admin</p>
          <label className="block">
            <span className="text-sm font-semibold">Username</span>
            <input
              value={creds.u}
              onChange={(e) => setCreds({ ...creds, u: e.target.value })}
              className="mt-1 h-12 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="password"
              value={creds.p}
              onChange={(e) => setCreds({ ...creds, p: e.target.value })}
              className="mt-1 h-12 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"
              required
            />
          </label>
          {err && <p className="text-sm font-semibold text-destructive">Wrong username or password</p>}
          <button className="w-full rounded-full warm-gradient py-4 text-lg font-bold text-primary-foreground active:scale-95">
            Login
          </button>
          <Link to="/" className="block text-center text-sm font-semibold text-primary">
            ← Shop
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Incoming Orders</h1>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link to="/" className="text-primary">
            ← Shop
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem(AUTH_KEY);
              setAuthed(false);
            }}
            className="text-destructive"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Date picker */}
      <div className="card-soft mt-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDay(today)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${day === today ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Today
          </button>
          <button
            onClick={() => setDay(tomorrow)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${day === tomorrow ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Orders on {day}</p>
            <p className="text-xl font-bold">{dayOrders.length}</p>
            <p className="font-bold text-primary">{rupees(dayTotal)}</p>
          </div>
          <div className="rounded-2xl bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Month {month}</p>
            <p className="text-xl font-bold">{monthOrders.length} orders</p>
            <p className="font-bold text-primary">{rupees(monthTotal)}</p>
          </div>
        </div>
      </div>

      {dayOrders.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No orders on this date.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {dayOrders.map((o) => (
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
