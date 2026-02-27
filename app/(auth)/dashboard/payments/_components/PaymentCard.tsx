"use client";

import { Pencil, Trash2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TYPE_LABELS, TYPE_ICONS } from "./_types";
import type { PaymentMethod } from "./_types";

interface Props {
  method: PaymentMethod;
  onEdit: () => void;
  onDelete: () => void;
}

export function PaymentCard({ method, onEdit, onDelete }: Props) {
  const Icon = TYPE_ICONS[method.type] ?? Smartphone;

  return (
    <Card className={!method.active ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{method.name}</p>
              <Badge variant="outline" className="text-xs">{TYPE_LABELS[method.type]}</Badge>
              {!method.active && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>
              )}
            </div>
            {method.display_text && (
              <p className="text-sm text-muted-foreground truncate">{method.display_text}</p>
            )}
            {method.type === "mercadopago" && (
              <p className="text-xs text-muted-foreground">
                Token: {method.config?.access_token ? "••••••••••••" : "No configurado"}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
