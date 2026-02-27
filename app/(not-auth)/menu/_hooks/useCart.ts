"use client";

import { useState } from "react";
import type { CartItem } from "../_components/_types";

export function useCart(defaultOrderType: "dine_in" | "takeout" = "takeout") {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "takeout">(defaultOrderType);
  const [notes, setNotes] = useState("");

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const addToCart = (item: { id: string; name: string; price: string }) => {
    setCart((prev) => {
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

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== id));
  };

  return {
    cart,
    orderType,
    notes,
    cartTotal,
    cartCount,
    addToCart,
    updateQty,
    removeFromCart,
    setOrderType,
    setNotes,
  };
}
