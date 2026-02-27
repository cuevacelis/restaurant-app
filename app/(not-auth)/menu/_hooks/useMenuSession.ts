"use client";

import { useState, useEffect } from "react";
import { readSession } from "@/lib/menu-session";
import type { MenuStep } from "../_components/_types";

export function useMenuSession(tableId?: string) {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [step, setStep] = useState<MenuStep>("name");
  const [customerName, setCustomerName] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Cookie reads must happen client-side; batch setState in effect is intentional here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const session = readSession(tableId);
    if (session?.orderId) {
      setCustomerName(session.name);
      setOrderId(session.orderId);
      setStep("tracking");
    } else if (session?.name) {
      setCustomerName(session.name);
      setStep("menu");
    }
    setSessionLoaded(true);
  }, [tableId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { sessionLoaded, customerName, setCustomerName, orderId, setOrderId, step, setStep };
}
