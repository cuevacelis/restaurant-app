"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, UtensilsCrossed, Clock, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { QrCodeDialog } from "@/components/qr/qr-code-dialog";
import { useTables, useCreateTable, useDeleteTable } from "./services/useTables";
import { useOrders } from "../orders/services/useOrders";
import { formatWaitTime, getWaitTimeColor, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";

export default function TablesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [showCreate, setShowCreate] = useState(false);
  const [qrTable, setQrTable] = useState<{ number?: number; label?: string; url: string } | null>(null);

  const selectedTableId = searchParams.get("tableId") || null;

  const { data: tablesData } = useTables();
  const { data: ordersData } = useOrders({ tableId: selectedTableId || undefined });
  const { mutate: createTable, isPending: creating } = useCreateTable();
  const { mutate: deleteTable } = useDeleteTable();

  const tables = tablesData?.tables ?? [];
  const orders = ordersData?.orders ?? [];
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const { data: allActiveOrders } = useOrders({});
  const activeByTable = (tableId: string) =>
    (allActiveOrders?.orders ?? []).filter(
      (o) =>
        o.table_id === tableId &&
        o.status !== "completed" &&
        o.order_type !== "takeout"
    );

  const handleCreate = () => {
    createTable(
      { number: parseInt(newTableNumber), capacity: parseInt(newTableCapacity) },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewTableNumber("");
          setNewTableCapacity("4");
        },
      }
    );
  };

  const setTableParam = (id: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!id) sp.delete("tableId");
    else sp.set("tableId", id);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const qrUrl = (tableNumber: number) =>
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/mesa/${tableNumber}`;

  const generalMenuUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/menu`;

  const openQr = (e: React.MouseEvent, tableNumber: number) => {
    e.stopPropagation(); // no seleccionar la mesa al hacer click en QR
    setQrTable({ number: tableNumber, url: qrUrl(tableNumber) });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrTable({ label: "Menú General", url: generalMenuUrl })}
          >
            <QrCode className="h-4 w-4 mr-1" />
            QR General
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nueva mesa
          </Button>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tables.map((table) => {
          const active = activeByTable(table.id);
          const hasOrders = active.length > 0;
          const oldest = hasOrders
            ? active.reduce((a, b) => (a.created_at < b.created_at ? a : b))
            : null;

          return (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTableId === table.id ? "ring-2 ring-primary" : ""
              } ${hasOrders ? "border-orange-300 dark:border-orange-700" : ""}`}
              onClick={() => setTableParam(selectedTableId === table.id ? null : table.id)}
            >
              <CardContent className="p-3 text-center space-y-1">
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                    hasOrders ? "bg-orange-100 dark:bg-orange-900" : "bg-muted"
                  }`}
                >
                  <UtensilsCrossed
                    className={`h-5 w-5 ${
                      hasOrders ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <p className="font-bold text-lg leading-none">#{table.number}</p>
                <p className="text-xs text-muted-foreground">{table.capacity} personas</p>
                {hasOrders && oldest && (
                  <p className={`text-xs font-medium ${getWaitTimeColor(oldest.created_at)}`}>
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {formatWaitTime(oldest.created_at)}
                  </p>
                )}
                {hasOrders && (
                  <Badge variant="warning" className="text-xs">
                    {active.length} pedido{active.length > 1 ? "s" : ""}
                  </Badge>
                )}
                {/* Botón QR en cada tarjeta */}
                <button
                  onClick={(e) => openQr(e, table.number)}
                  className="mt-1 flex items-center justify-center gap-1 w-full rounded-md py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <QrCode className="h-3 w-3" />
                  Ver QR
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table detail panel */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mesa #{selectedTable.number}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrTable({ number: selectedTable.number, url: qrUrl(selectedTable.number) })}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  Ver QR
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    deleteTable(selectedTable.id);
                    setTableParam(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin pedidos activos en esta mesa
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className={`text-xs ${getWaitTimeColor(order.created_at)}`}>
                        {formatWaitTime(order.created_at)}
                      </p>
                    </div>
                    <Badge className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground break-all">
              {qrUrl(selectedTable.number)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Code modal */}
      <QrCodeDialog
        open={!!qrTable}
        onOpenChange={(open) => !open && setQrTable(null)}
        tableNumber={qrTable?.number}
        label={qrTable?.label}
        url={qrTable?.url ?? ""}
      />

      {/* Create table dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogCloseButton onClose={() => setShowCreate(false)} />
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Número de mesa</Label>
              <Input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Ej. 11"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidad (personas)</Label>
              <Input
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                placeholder="4"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newTableNumber || creating}>
              {creating ? "Creando..." : "Crear mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
