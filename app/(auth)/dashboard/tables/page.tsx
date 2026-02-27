"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrCodeDialog } from "@/components/qr/qr-code-dialog";
import { useTables, useCreateTable, useDeleteTable } from "./services/useTables";
import { useOrders } from "../orders/services/useOrders";
import { useTableSelection } from "./_hooks/useTableSelection";
import { TableCard } from "./_components/TableCard";
import { TableDetailPanel } from "./_components/TableDetailPanel";
import { CreateTableDialog } from "./_components/CreateTableDialog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function qrUrl(tableNumber: number) {
  return `${APP_URL}/menu?tableId=${tableNumber}`;
}

export default function TablesPage() {
  const { selectedTableId, setTableParam } = useTableSelection();
  const [showCreate, setShowCreate] = useState(false);
  const [qrTable, setQrTable] = useState<{ number?: number; label?: string; url: string } | null>(null);

  const { data: tablesData } = useTables();
  const { data: ordersData } = useOrders({ tableId: selectedTableId || undefined });
  const { mutate: createTable, isPending: creating } = useCreateTable();
  const { mutate: deleteTable } = useDeleteTable();
  const { data: allActiveOrders } = useOrders({});

  const tables = tablesData?.tables ?? [];
  const orders = ordersData?.orders ?? [];
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const activeByTable = (tableId: string) =>
    (allActiveOrders?.orders ?? []).filter(
      (o) =>
        o.table_id === tableId &&
        o.status !== "completed" &&
        o.order_type !== "takeout"
    );

  const handleCreate = (number: number, capacity: number) => {
    createTable(
      { number, capacity },
      { onSuccess: () => setShowCreate(false) }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrTable({ label: "Menú General", url: `${APP_URL}/menu` })}
          >
            <QrCode className="h-4 w-4 mr-1" />
            QR General
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            Nueva mesa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            activeOrders={activeByTable(table.id)}
            isSelected={selectedTableId === table.id}
            onSelect={() => setTableParam(selectedTableId === table.id ? null : table.id)}
            onOpenQr={() => setQrTable({ number: table.number, url: qrUrl(table.number) })}
          />
        ))}
      </div>

      {selectedTable ? (
        <TableDetailPanel
          table={selectedTable}
          orders={orders}
          qrUrl={qrUrl(selectedTable.number)}
          onOpenQr={() =>
            setQrTable({ number: selectedTable.number, url: qrUrl(selectedTable.number) })
          }
          onDelete={() => {
            deleteTable(selectedTable.id);
            setTableParam(null);
          }}
        />
      ) : null}

      <QrCodeDialog
        open={!!qrTable}
        onOpenChange={(open) => !open && setQrTable(null)}
        tableNumber={qrTable?.number}
        label={qrTable?.label}
        url={qrTable?.url ?? ""}
      />

      <CreateTableDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        isPending={creating}
      />
    </div>
  );
}
