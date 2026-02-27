"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useTableSelection() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTableId = searchParams.get("tableId") || null;

  const setTableParam = useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (!id) sp.delete("tableId");
      else sp.set("tableId", id);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return { selectedTableId, setTableParam };
}
