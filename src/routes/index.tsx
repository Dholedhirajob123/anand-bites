import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import hero from "@/assets/hero.jpg";
import {
  PRODUCTS,
  SHOP,
  loadOrders,
  saveOrders,
  newOrderId,
  rupees,
  type CartLine,
  type Order,
} from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anand Bal Bhandar — गरमागरम नाश्ता ऑनलाइन" },
      {
        name: "description",
        content:
          "Order fresh Bel, Mung Vada and Samosa online from Anand Bal Bhandar. ताजे आणि चविष्ट नाश्त्याचे पदार्थ, फक्त ₹15.",
      },
      { property: "og:title", content: "Anand Bal Bhandar — गरमागरम नाश्ता ऑनलाइन" },
      {
        property: "og:description",
        content: "Bel, Mung Vada आणि Samosa — ताजे, गरम आणि ऑनलाइन ऑर्डरसाठी तयार.",
      },
    ],
  }),
  component: Home,
});

type Step = "cart" | "form" | "done";

function Home() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(PRODUCTS.map((p) => [p.id, 1])),
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [placed, setPlaced] = useState<Order | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const addToCart = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id)!;
    const add = qty[id] ?? 1;
    setCart((c) => {
      const found = c.find((l) => l.id === id);
      return found
        ? c.map((l) => (l.id === id ? { ...l, qty: l.qty + add } : l))
        : [...c, { id: p.id, name: p.name, price: p.price, qty: add }];
    });
    setStep("cart");
    setOpen(true);
  };

  const changeLine = (id: string, delta: number) =>
    setCart((c) =>
      c
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );

  const confirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      name: form.name,
      phone: form.phone,
      address: form.address,
      note: form.note || undefined,
      items: cart,
      total,
      status: "New",
    };
    saveOrders([order, ...loadOrders()]);
    setPlaced(order);
    setStep("done");
    setCart([]);
    setForm({ name: "", phone: "", address: "", note: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <a href="#home" className="text-lg font-bold leading-tight text-primary">
            Anand Bal Bhandar
          </a>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <a href="#home" className="hidden sm:inline">
              Home
            </a>
            <a href="#menu">Menu</a>
            <a href="#contact">Contact</a>
            <button
              onClick={() => {
                setStep(placed && cart.length === 0 ? "done" : "cart");
                setOpen(true);
              }}
              className="relative rounded-full bg-primary px-4 py-2 text-primary-foreground"
            >
              Cart
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative">
        <img
          src={hero}
          alt="Anand Bal Bhandar snack counter with hot samosas and bhel"
          width={1400}
          height={900}
          className="h-[62vh] min-h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Anand Bal Bhandar
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-snug text-primary-foreground sm:text-4xl">
            गरमागरम नाश्ता, आता ऑनलाइन ऑर्डर करा!
          </h1>
          <p className="mt-2 text-primary-foreground/90">ताजे आणि चविष्ट नाश्त्याचे पदार्थ</p>
          <a
            href="#menu"
            className="mt-5 inline-flex items-center justify-center rounded-full warm-gradient px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            Order Now
          </a>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-2xl font-bold">आमचा मेनू</h2>
        <p className="text-muted-foreground">Fresh, hot & made to order</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <article key={p.id} className="card-soft overflow-hidden">
              <img
                src={p.image}
                alt={`${p.name} — ${p.marathi}`}
                loading="lazy"
                width={800}
                height={800}
                className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <span className="text-2xl font-bold text-primary">{rupees(p.price)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{p.marathi}</p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center rounded-full bg-secondary">
                    <button
                      aria-label={`Decrease ${p.name}`}
                      onClick={() =>
                        setQty((q) => ({ ...q, [p.id]: Math.max(1, (q[p.id] ?? 1) - 1) }))
                      }
                      className="h-11 w-11 rounded-full text-xl font-bold text-secondary-foreground"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{qty[p.id] ?? 1}</span>
                    <button
                      aria-label={`Increase ${p.name}`}
                      onClick={() => setQty((q) => ({ ...q, [p.id]: (q[p.id] ?? 1) + 1 }))}
                      className="h-11 w-11 rounded-full text-xl font-bold text-secondary-foreground"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(p.id)}
                    className="h-11 flex-1 rounded-full warm-gradient font-bold text-primary-foreground transition-transform active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Address */}
      <section id="contact" className="mx-auto max-w-3xl px-4 pb-10">
        <div className="card-soft p-5">
          <h2 className="text-xl font-bold">📍 Anand Bal Bhandar</h2>
          <p className="mt-1 text-muted-foreground">Address: {SHOP.address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${SHOP.name} ${SHOP.address}`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border-2 border-primary px-6 py-3 font-bold text-primary"
          >
            Get Directions
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="warm-gradient px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground">
          आजच ऑर्डर करा – Anand Bal Bhandar
        </h2>
        <a
          href="#menu"
          className="mt-5 inline-flex rounded-full bg-card px-8 py-4 text-lg font-bold text-primary shadow-lg active:scale-95"
        >
          Order Now
        </a>
      </section>

      <footer className="px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Anand Bal Bhandar ·{" "}
        <Link to="/admin" className="font-semibold text-primary">
          Owner Orders
        </Link>
      </footer>

      {/* Cart / Order drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl duration-200 animate-in slide-in-from-bottom sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {step === "cart" ? "Your Cart" : step === "form" ? "Order Details" : "Order Confirmed"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none">
                ×
              </button>
            </div>

            {step === "cart" && (
              <>
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">Your cart is empty.</p>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {cart.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
                          <div className="flex-1">
                            <p className="font-bold">{l.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {rupees(l.price)} × {l.qty} = {rupees(l.price * l.qty)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              aria-label="decrease"
                              onClick={() => changeLine(l.id, -1)}
                              className="h-9 w-9 rounded-full bg-card font-bold"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-bold">{l.qty}</span>
                            <button
                              aria-label="increase"
                              onClick={() => changeLine(l.id, 1)}
                              className="h-9 w-9 rounded-full bg-card font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => setCart((c) => c.filter((x) => x.id !== l.id))}
                            className="text-sm font-semibold text-destructive"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{rupees(total)}</span>
                    </div>
                    <button
                      onClick={() => setStep("form")}
                      className="mt-4 w-full rounded-full warm-gradient py-4 text-lg font-bold text-primary-foreground active:scale-95"
                    >
                      Place Order
                    </button>
                  </>
                )}
              </>
            )}

            {step === "form" && (
              <form onSubmit={confirmOrder} className="space-y-3">
                {(
                  [
                    ["name", "Customer Name", "text", true],
                    ["phone", "Mobile Number", "tel", true],
                    ["address", "Delivery / Pickup Address", "text", true],
                    ["note", "Optional note", "text", false],
                  ] as const
                ).map(([key, label, type, required]) => (
                  <label key={key} className="block">
                    <span className="text-sm font-semibold">{label}</span>
                    <input
                      type={type}
                      required={required}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 h-12 w-full rounded-xl border bg-background px-3 outline-none focus:border-primary"
                    />
                  </label>
                ))}
                <div className="rounded-2xl bg-secondary p-3 text-sm">
                  {cart.map((l) => (
                    <div key={l.id} className="flex justify-between">
                      <span>
                        {l.name} × {l.qty}
                      </span>
                      <span>{rupees(l.price * l.qty)}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{rupees(total)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full warm-gradient py-4 text-lg font-bold text-primary-foreground active:scale-95"
                >
                  Confirm Order
                </button>
              </form>
            )}

            {step === "done" && placed && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl">
                  ✓
                </div>
                <p className="mt-3 font-semibold">धन्यवाद, {placed.name}!</p>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="text-2xl font-bold text-primary">{placed.id}</p>
                <div className="mt-4 rounded-2xl bg-secondary p-4 text-left text-sm">
                  <p>
                    <b>Phone:</b> {placed.phone}
                  </p>
                  <p>
                    <b>Address:</b> {placed.address}
                  </p>
                  {placed.note && (
                    <p>
                      <b>Note:</b> {placed.note}
                    </p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {placed.items.map((l) => (
                      <li key={l.id} className="flex justify-between">
                        <span>
                          {l.name} × {l.qty}
                        </span>
                        <span>{rupees(l.price * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{rupees(placed.total)}</span>
                  </div>
                  <p className="mt-2">
                    <b>Status:</b> {placed.status}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 w-full rounded-full warm-gradient py-4 text-lg font-bold text-primary-foreground"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
