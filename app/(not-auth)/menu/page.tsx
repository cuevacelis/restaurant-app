"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UtensilsCrossed, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useMenu } from "./_services/useMenu";
import { useCreateOrder, useOrder, useSubmitReview, useAddOrderItems } from "./_services/useOrder";
import { usePaymentMethods, useCreateMPPreference } from "./_services/usePayment";
import { useMenuSession } from "./_hooks/useMenuSession";
import { useCart } from "./_hooks/useCart";
import { saveSession, clearSession } from "@/lib/menu-session";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LoadingSpinner } from "./_components/shared/LoadingSpinner";
import { NameStep } from "./_components/name-step/NameStep";
import { MenuHeader } from "./_components/menu-step/MenuHeader";
import { CategoryTabs } from "./_components/menu-step/CategoryTabs";
import { MenuItemCard } from "./_components/menu-step/MenuItemCard";
import { CartSheet } from "./_components/menu-step/CartSheet";
import { CartFab } from "./_components/menu-step/CartFab";
import { StatusTracker } from "./_components/tracking-step/StatusTracker";
import { OrderDetails } from "./_components/tracking-step/OrderDetails";
import { MpBanners } from "./_components/tracking-step/MpBanners";
import { PaymentSection } from "./_components/tracking-step/PaymentSection";
import { ReviewSection } from "./_components/tracking-step/ReviewSection";
import { AddItemsStep } from "./_components/add-items-step/AddItemsStep";
import type { CartItem } from "./_components/_types";

function MenuPageInner() {
  const searchParams = useSearchParams();
  const mpStatus = searchParams.get("mp");
  const tableId = searchParams.get("tableId") ?? undefined;

  const { sessionLoaded, customerName, setCustomerName, orderId, setOrderId, step, setStep } =
    useMenuSession(tableId);
  const { cart, orderType, notes, cartTotal, cartCount, addToCart, updateQty, removeFromCart, setOrderType, setNotes } =
    useCart(tableId ? "dine_in" : "takeout");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [addCart, setAddCart] = useState<CartItem[]>([]);

  const { data: menuData, isLoading: menuLoading } = useMenu();
  const { data: orderData, refetch: refetchOrder } = useOrder(orderId);
  const { mutate: createOrder, isPending: creatingOrder } = useCreateOrder();
  const { mutate: submitReview, isPending: submittingReview } = useSubmitReview(orderId ?? "");
  const { mutate: addItems, isPending: addingItems } = useAddOrderItems(orderId ?? "");
  const { data: paymentData } = usePaymentMethods();
  const { mutate: createMPPreference, isPending: creatingPreference } = useCreateMPPreference(
    orderId ?? ""
  );

  const order = orderData?.order;
  const activeMethods = paymentData?.methods ?? [];

  useEffect(() => {
    if (order?.status === "paid") clearSession(tableId);
  }, [order?.status, tableId]);

  // WebSocket: real-time order updates (only for table customers with an active order)
  useWebSocket({
    role: "customer",
    tableId,
    orderId: orderId ?? undefined,
    onMessage: (msg) => {
      if (msg.type === "ORDER_UPDATE" && msg.data.order_id === orderId) {
        refetchOrder();
      }
    },
    enabled: !!(tableId && orderId),
  });

  const activeCategory = selectedCategory ?? menuData?.categories[0]?.id ?? "";

  const handleNameSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const name = customerName.trim();
    if (!name) return;
    setCustomerName(name);
    saveSession({ name }, tableId);
    setStep("menu");
  };

  const handlePlaceOrder = () => {
    createOrder(
      {
        ...(tableId ? { table_id: tableId } : {}),
        customer_name: customerName,
        order_type: orderType,
        notes: notes || undefined,
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          quantity: c.quantity,
          unit_price: c.price,
        })),
      },
      {
        onSuccess: (data) => {
          const newOrderId = data.order.id;
          setOrderId(newOrderId);
          saveSession({ name: customerName, orderId: newOrderId }, tableId);
          setStep("tracking");
        },
      }
    );
  };

  const handleSubmitReview = () => {
    if (!rating) return;
    submitReview(
      { rating, comment: reviewComment || undefined },
      {
        onSuccess: () => {
          setReviewSubmitted(true);
          clearSession(tableId);
        },
      }
    );
  };

  const addToAddCart = (item: { id: string; name: string; price: string }) => {
    setAddCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { menu_item_id: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 },
      ];
    });
  };

  const updateAddQty = (id: string, delta: number) => {
    setAddCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleAddItems = () => {
    if (!addCart.length || !orderId) return;
    addItems(
      addCart.map((c) => ({ menu_item_id: c.menu_item_id, quantity: c.quantity, unit_price: c.price })),
      {
        onSuccess: () => {
          setAddCart([]);
          setStep("tracking");
        },
      }
    );
  };

  if (!sessionLoaded) return <LoadingSpinner />;

  // ── STEP: Name ──────────────────────────────────────────────
  if (step === "name") {
    return (
      <NameStep
        customerName={customerName}
        onChange={setCustomerName}
        onSubmit={handleNameSubmit}
        tableId={tableId}
      />
    );
  }

  // ── STEP: Add items ──────────────────────────────────────────
  if (step === "add-items") {
    return (
      <AddItemsStep
        order={order}
        menuData={menuData}
        addCart={addCart}
        activeCategory={activeCategory}
        addingItems={addingItems}
        onCategorySelect={setSelectedCategory}
        onAddItem={addToAddCart}
        onUpdateQty={updateAddQty}
        onBack={() => { setAddCart([]); setStep("tracking"); }}
        onConfirm={handleAddItems}
      />
    );
  }

  // ── STEP: Menu / Cart ────────────────────────────────────────
  if (step === "menu" || step === "cart") {
    const itemsByCategory = menuData?.items.filter((i) => i.category_id === activeCategory) ?? [];

    return (
      <div className="min-h-screen bg-background">
        <MenuHeader
          customerName={customerName}
          cartCount={cartCount}
          onCartClick={() => setStep("cart")}
          tableId={tableId}
        />

        {menuLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <CategoryTabs
              categories={menuData?.categories ?? []}
              activeCategory={activeCategory}
              onSelect={setSelectedCategory}
            />
            <div className="p-4 pb-24 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {itemsByCategory.map((item) => {
                const cartItem = cart.find((c) => c.menu_item_id === item.id);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    cartQuantity={cartItem?.quantity ?? 0}
                    onAdd={() => addToCart(item)}
                    onUpdateQty={(delta) => updateQty(item.id, delta)}
                  />
                );
              })}
            </div>
          </>
        )}

        {step === "cart" ? (
          <CartSheet
            cart={cart}
            orderType={orderType}
            notes={notes}
            cartTotal={cartTotal}
            creatingOrder={creatingOrder}
            onClose={() => setStep("menu")}
            onOrderTypeChange={setOrderType}
            onUpdateQty={updateQty}
            onRemoveItem={removeFromCart}
            onNotesChange={setNotes}
            onPlaceOrder={handlePlaceOrder}
          />
        ) : null}

        {step === "menu" && cartCount > 0 ? (
          <CartFab cartCount={cartCount} cartTotal={cartTotal} onClick={() => setStep("cart")} />
        ) : null}
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
            <p className="text-sm font-semibold">
              {tableId ? `Mesa #${tableId}` : "Tu pedido"}
            </p>
            <p className="text-xs text-muted-foreground">{customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {tableId ? <NotificationBell role="customer" tableId={tableId} /> : null}
        </div>
      </header>

      {order ? <StatusTracker status={order.status} orderId={order.id} /> : null}

      {order?.items ? (
        <OrderDetails items={order.items} totalAmount={order.total_amount} />
      ) : null}

      {/* Add more items (only when pending) */}
      {order?.status === "pending" ? (
        <Card className="mb-6">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Tu pedido aún no comenzó a prepararse. ¿Quieres agregar algo más?
            </p>
            <Button variant="outline" onClick={() => setStep("add-items")}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar más ítems
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {order?.status === "cancelled" ? (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <p className="font-semibold text-destructive">Pedido cancelado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Habla con el personal si tienes dudas
            </p>
          </CardContent>
        </Card>
      ) : null}

      <MpBanners mpStatus={mpStatus} orderStatus={order?.status} />

      {order?.status === "completed" && activeMethods.length > 0 ? (
        <PaymentSection
          totalAmount={order.total_amount}
          methods={activeMethods}
          creatingPreference={creatingPreference}
          onMPPay={() =>
            createMPPreference(undefined, {
              onSuccess: (data) => {
                window.location.href = data.init_point;
              },
            })
          }
        />
      ) : null}

      <ReviewSection
        orderStatus={order?.status}
        hasReviewed={!!order?.rating}
        submitted={reviewSubmitted}
        rating={rating}
        comment={reviewComment}
        submitting={submittingReview}
        onRatingChange={setRating}
        onCommentChange={setReviewComment}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MenuPageInner />
    </Suspense>
  );
}
