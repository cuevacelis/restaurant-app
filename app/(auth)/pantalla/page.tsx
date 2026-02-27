"use client";

import { Utensils } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePantalla } from "./services/usePantalla";
import { PantallaColumn } from "./_components/PantallaColumn";
import { COLUMNS } from "./_components/_types";

export default function PantallaPage() {
  const { activeOrders } = usePantalla();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">
              Estado de pedidos
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeOrders.length} pedido{activeOrders.length !== 1 ? "s" : ""}{" "}
              activo{activeOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 grid grid-cols-3 gap-4 p-6">
        {COLUMNS.map((col) => (
          <PantallaColumn
            key={col.status}
            col={col}
            orders={activeOrders.filter((o) => o.status === col.status)}
          />
        ))}
      </div>

      <footer className="px-6 py-3 border-t text-center text-xs text-muted-foreground">
        Actualización en tiempo real ·{" "}
        {new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </footer>
    </div>
  );
}
