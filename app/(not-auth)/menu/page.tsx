"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart, Plus, Minus, Trash2, Star, ChefHat,
  CheckCircle, Clock, PackageCheck, UtensilsCrossed, CreditCard, Banknote, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMenu } from "../mesa/[tableId]/services/useMenu";
import { useCreateOrder, useOrder, useSubmitReview } from "../mesa/[tableId]/services/useOrder";
import { usePaymentMethods, useCreateMPPreference } from "../mesa/[tableId]/services/usePayment";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/utils";

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuSession {
  name: string;
  orderId?: string;
}

const STATUS_ICONS = {
  pending: Clock,
  in_preparation: ChefHat,
  ready_to_deliver: PackageCheck,
  completed: CheckCircle,
  paid: CreditCard,
};

const STATUS_STEPS = ["pending", "in_preparation", "ready_to_deliver", "completed", "paid"];

const COOKIE_KEY = "menu_session";

// ── Cookie helpers ────────────────────────────────────────────
function readSession(): MenuSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_KEY}=([^;]+)`));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[2])) as MenuSession; }
  catch { return null; }
}

function saveSession(session: MenuSession, hours = 3) {
  const expires = new Date(Date.now() + hours * 3600 * 1000).toUTCString();
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(session))}; expires=${expires}; path=/; SameSite=Strict`;
}

function clearSession() {
  document.cookie = `${COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

// ── Component ─────────────────────────────────────────────────
function MenuPageInner() {
  const searchParams = useSearchParams();
  const mpStatus = searchParams.get("mp");

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [step, setStep] = useState<"name" | "menu" | "cart" | "tracking">("name");
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<"dine_in" | "takeout">("takeout");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session?.orderId) {
      setCustomerName(session.name);
      setOrderId(session.orderId);
      setStep("tracking");
    } else if (session?.name) {
      setCustomerName(session.name);
      setStep("menu");
    }
    setSessionLoaded(true);
  }, []);

  const { data: menuData, isLoading: menuLoading } = useMenu();
  const { data: orderData, refetch: refetchOrder } = useOrder(orderId);
  const { mutate: createOrder, isPending: creatingOrder } = useCreateOrder();
  const { mutate: submitReview, isPending: submittingReview } = useSubmitReview(orderId || "");
  const { data: paymentData } = usePaymentMethods();
  const { mutate: createMPPreference, isPending: creatingPreference } = useCreateMPPreference(orderId || "");
  const activeMethods = paymentData?.methods ?? [];

  const order = orderData?.order;

  // Poll every 10s as fallback (no WebSocket here since no tableId context)
  useEffect(() => {
    if (!orderId || !["pending", "in_preparation", "ready_to_deliver", "completed"].includes(order?.status ?? "")) return;
    const id = setInterval(refetchOrder, 10000);
    return () => clearInterval(id);
  }, [orderId, order?.status, refetchOrder]);

  // Clear cookie when paid
  useEffect(() => {
    if (order?.status === "paid") clearSession();
  }, [order?.status]);

  useEffect(() => {
    if (menuData?.categories.length && !activeCategory) {
      setActiveCategory(menuData.categories[0].id);
    }
  }, [menuData, activeCategory]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    const name = customerName.trim();
    setCustomerName(name);
    saveSession({ name });
    setStep("menu");
  };

  const addToCart = (item: { id: string; name: string; price: string }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) return prev.map((c) => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item_id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handlePlaceOrder = () => {
    createOrder(
      {
        customer_name: customerName,
        order_type: orderType,
        notes: notes || undefined,
        items: cart.map((c) => ({ menu_item_id: c.menu_item_id, quantity: c.quantity, unit_price: c.price })),
      },
      {
        onSuccess: (data) => {
          const newOrderId = data.order.id;
          setOrderId(newOrderId);
          saveSession({ name: customerName, orderId: newOrderId });
          setStep("tracking");
        },
      }
    );
  };

  const handleSubmitReview = () => {
    if (!rating) return;
    submitReview(
      { rating, comment: reviewComment || undefined },
      { onSuccess: () => { setReviewSubmitted(true); clearSession(); } }
    );
  };

  const currentStatusIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── STEP: Name ──────────────────────────────────────────────
  if (step === "name") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-7 w-7" />
            </div>
            <CardTitle>Bienvenido</CardTitle>
            <p className="text-sm text-muted-foreground">Ver nuestro menú y hacer tu pedido</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tu nombre</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Juan García"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!customerName.trim()}>
                Ver la carta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEP: Menu / Cart ────────────────────────────────────────
  if (step === "menu" || step === "cart") {
    const itemsByCategory = (catId: string) =>
      menuData?.items.filter((i) => i.category_id === catId) ?? [];

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold leading-none">Menú</p>
                <p className="text-xs text-muted-foreground">{customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="relative" onClick={() => setStep("cart")}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Carrito
                {cartCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {menuLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
            {menuData?.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 pb-24 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {itemsByCategory(activeCategory).map((item) => {
            const cartItem = cart.find((c) => c.menu_item_id === item.id);
            return (
              <Card key={item.id} className="overflow-hidden">
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.name} className="h-32 w-full object-cover" />
                )}
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{cartItem.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(item)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cart bottom sheet */}
        {step === "cart" && (
          <div className="fixed inset-0 z-40 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setStep("menu")} />
            <div className="relative bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-background/90 backdrop-blur-sm px-4 pt-4 pb-2">
                <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-muted" />
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Tu pedido</h2>
                  <Button variant="ghost" size="sm" onClick={() => setStep("menu")}>Continuar comprando</Button>
                </div>
              </div>
              <div className="px-4 space-y-3 pb-4">
                <div className="flex gap-2">
                  {(["takeout", "dine_in"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        orderType === type ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
                      }`}
                    >
                      {type === "dine_in" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <UtensilsCrossed className="h-4 w-4" />
                          Comer aquí
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Truck className="h-4 w-4" />
                          Para llevar
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <Separator />
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Agrega artículos desde el menú</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.menu_item_id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.menu_item_id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => setCart((p) => p.filter((c) => c.menu_item_id !== item.menu_item_id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Alergias, preferencias, etc."
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button className="w-full" onClick={handlePlaceOrder} disabled={creatingOrder}>
                      {creatingOrder ? "Enviando pedido..." : "Confirmar pedido"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "menu" && cartCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
            <Button onClick={() => setStep("cart")} size="lg" className="shadow-xl rounded-full px-6 gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ver pedido ({cartCount})
              <span className="ml-1 font-semibold">{formatCurrency(cartTotal)}</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── STEP: Tracking ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Tu pedido</p>
            <p className="text-xs text-muted-foreground">{customerName}</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Status tracker */}
      {order && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              {STATUS_STEPS.map((status, idx) => {
                const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
                const done = idx <= currentStatusIndex;
                const active = idx === currentStatusIndex;
                return (
                  <div key={status} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      } ${active ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-center text-muted-foreground hidden sm:block">
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <Badge
                variant={["completed", "paid"].includes(order.status) ? "success" : "info"}
                className="text-sm px-4 py-1"
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order details */}
      {order?.items && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tu pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menu_item_name}</span>
                <span className="font-medium">{formatCurrency(parseFloat(item.unit_price) * item.quantity)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled state */}
      {order?.status === "cancelled" && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <p className="font-semibold text-destructive">Pedido cancelado</p>
            <p className="text-sm text-muted-foreground mt-1">Habla con el personal si tienes dudas</p>
          </CardContent>
        </Card>
      )}

      {/* MercadoPago return banners */}
      {mpStatus === "success" && order?.status !== "paid" && (
        <Card className="mb-6 border-green-500/50 bg-green-500/5">
          <CardContent className="py-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-1" />
            <p className="text-sm font-medium text-green-600">¡Pago recibido! Confirmando...</p>
          </CardContent>
        </Card>
      )}
      {mpStatus === "failure" && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-center">
            <p className="text-sm font-medium text-destructive">El pago no se completó. Intenta de nuevo.</p>
          </CardContent>
        </Card>
      )}
      {mpStatus === "pending" && (
        <Card className="mb-6">
          <CardContent className="py-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Pago pendiente de confirmación.</p>
          </CardContent>
        </Card>
      )}

      {/* Payment section */}
      {order?.status === "completed" && activeMethods.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">¿Cómo deseas pagar?</CardTitle>
            <p className="text-sm text-muted-foreground">Total: {formatCurrency(order.total_amount)}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMethods.map((method) =>
              method.type === "manual" ? (
                <div key={method.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">{method.name}</p>
                  </div>
                  {method.display_text && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{method.display_text}</p>
                  )}
                </div>
              ) : (
                <Button
                  key={method.id}
                  className="w-full"
                  onClick={() =>
                    createMPPreference(undefined, {
                      onSuccess: (data) => { window.location.href = data.init_point; },
                    })
                  }
                  disabled={creatingPreference}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {creatingPreference ? "Cargando..." : `Pagar con ${method.name}`}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Review section */}
      {order?.status === "paid" && !reviewSubmitted && !order.rating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Cómo fue tu experiencia?</CardTitle>
            <p className="text-sm text-muted-foreground">Calificación opcional</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Cuéntanos tu experiencia... (opcional)"
              rows={3}
            />
            <Button
              className="w-full"
              onClick={handleSubmitReview}
              disabled={!rating || submittingReview}
            >
              {submittingReview ? "Enviando..." : "Enviar calificación"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(reviewSubmitted || (order?.status === "paid" && order.rating)) && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <p className="font-semibold">¡Gracias por tu visita!</p>
            <p className="text-sm text-muted-foreground mt-1">Esperamos verte pronto</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <MenuPageInner />
    </Suspense>
  );
}
