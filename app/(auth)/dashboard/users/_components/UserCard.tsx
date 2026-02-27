"use client";

import { Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/utils";
import { ROLE_COLORS } from "./_types";
import type { User } from "./_types";

interface Props {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export function UserCard({ user, onEdit, onDelete }: Props) {
  return (
    <Card className={!user.active ? "opacity-60" : ""}>
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{user.name}</p>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {ROLE_LABELS[user.role]}
            </span>
            {!user.active && (
              <Badge variant="secondary" className="text-xs">Inactivo</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={!user.active}
          >
            ×
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
