import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  PRODUCTS,
  loadAvailability,
  saveAvailability,
  loadOrders,
  saveOrders,
  rupees,
  ORDER_STATUSES,
  type Availability,
  type Order,
  type OrderStatus,
  mapsLink,
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
  const [detail, setDetail] = useState<Order | null>(null);
  const [avail, setAvail] = useState<Availability>({});

  useEffect(() => {
    if (authed) setAvail(loadAvailability());
  }, [authed]);

  const toggleAvail = (id: string) => {
    const next = { ...avail, [id]: !(avail[id] ?? true) };
    setAvail(next);
    saveAvailability(next);
  };

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
  const yesterday = dayKey(new Date(Date.now() - 86400000));

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

  const year = day.slice(0, 4);
  const yearOrders = useMemo(
    () => orders.filter((o) => dayKey(o.createdAt).slice(0, 4) === year),
    [orders, year],
  );
  const yearTotal = yearOrders.reduce((s, o) => s + o.total, 0);

  // Month-by-month breakdown for the selected year
  const monthlyRows = useMemo(() => {
    const map = new Map<string, { orders: number; total: number }>();
    for (const o of yearOrders) {
      const k = dayKey(o.createdAt).slice(0, 7);
      const cur = map.get(k) ?? { orders: 0, total: 0 };
      map.set(k, { orders: cur.orders + 1, total: cur.total + o.total });
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [yearOrders]);

  // Item-wise sales for the selected day
  const itemRows = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of dayOrders)
      for (const i of o.items) {
        const cur = map.get(i.id) ?? { name: i.name, qty: 0, total: 0 };
        map.set(i.id, { name: i.name, qty: cur.qty + i.qty, total: cur.total + i.price * i.qty });
      }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [dayOrders]);

  const exportCsv = (rows: Order[], label: string) => {
    const head = "Order ID,Date,Time,Customer,Phone,Address,Items,Total,Status";
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const body = rows.map((o) => {
      const d = new Date(o.createdAt);
      return [
        o.id,
        dayKey(d),
        d.toLocaleTimeString(),
        esc(o.name),
        o.phone,
        esc(o.address),
        esc(o.items.map((i) => `${i.name} x${i.qty}`).join("; ")),
        String(o.total),
        o.status,
      ].join(",");
    });
    const total = rows.reduce((s, o) => s + o.total, 0);
    const csv = [head, ...body, `,,,,,,TOTAL,${total},`].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `anand-bel-bhandar-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


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

      {/* Item availability */}
      <section className="card-soft mt-5 p-4">
        <h2 className="font-bold">Item Availability</h2>
        <p className="text-sm text-muted-foreground">
          Turn an item off and customers cannot add it to the cart.
        </p>
        <div className="mt-3 space-y-2">
          {PRODUCTS.map((p) => {
            const on = avail[p.id] ?? true;
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3">
                <span className="font-semibold">
                  {p.name} <span className="text-muted-foreground">· {p.marathi}</span>
                </span>
                <button
                  onClick={() => toggleAvail(p.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {on ? "Available" : "Not available"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

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
              {o.location && (
                <a
                  href={mapsLink(o.location)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-primary underline"
                >
                  📍 View live location
                </a>
              )}
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
              <button
                onClick={() => setDetail(o)}
                className="mt-3 w-full rounded-full border border-primary py-2.5 text-sm font-bold text-primary"
              >
                View Details
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setDetail(null)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={() => setDetail(null)} className="text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <p>
                <span className="font-semibold text-muted-foreground">Order ID:</span>{" "}
                <span className="font-bold text-primary">{detail.id}</span>
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Order Time:</span>{" "}
                {new Date(detail.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Customer Name:</span>{" "}
                {detail.name}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Mobile Number:</span>{" "}
                {detail.phone}
              </p>
              <p>
                <span className="font-semibold text-muted-foreground">Address:</span>{" "}
                {detail.address}
              </p>
              {detail.location && (
                <div>
                  <p>
                    <span className="font-semibold text-muted-foreground">Live Location:</span>{" "}
                    {detail.location.lat}, {detail.location.lng}
                  </p>
                  <iframe
                    title="Customer live location"
                    src={`https://www.google.com/maps?q=${detail.location.lat},${detail.location.lng}&z=16&output=embed`}
                    loading="lazy"
                    className="mt-2 h-44 w-full rounded-xl border-0"
                  />
                  <a
                    href={mapsLink(detail.location)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-semibold text-primary underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}

              {detail.note && (
                <p>
                  <span className="font-semibold text-muted-foreground">Note:</span>{" "}
                  {detail.note}
                </p>
              )}
              <p>
                <span className="font-semibold text-muted-foreground">Status:</span>{" "}
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {detail.status}
                </span>
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-secondary p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Ordered Items</h3>
              <ul className="space-y-2 text-sm">
                {detail.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between">
                    <span>
                      {i.name} × {i.qty}
                    </span>
                    <span className="font-semibold">{rupees(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{rupees(detail.total)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(detail.id, s);
                    setDetail({ ...detail, status: s });
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    detail.status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setDetail(null)}
              className="mt-4 w-full rounded-full warm-gradient py-3 text-lg font-bold text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
