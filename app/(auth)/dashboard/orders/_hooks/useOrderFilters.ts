"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useOrderFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status") || "";
  const tableId = searchParams.get("tableId") || "";
  const selectedOrderId = searchParams.get("orderId") || null;

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (!value) sp.delete(key);
      else sp.set(key, value);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return { status, tableId, selectedOrderId, setParam };
}
