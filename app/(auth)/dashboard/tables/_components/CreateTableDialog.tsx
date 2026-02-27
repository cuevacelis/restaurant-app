"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (number: number, capacity: number) => void;
  isPending: boolean;
}

export function CreateTableDialog({ open, onClose, onCreate, isPending }: Props) {
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("4");

  const handleCreate = () => {
    onCreate(parseInt(number), parseInt(capacity));
    setNumber("");
    setCapacity("4");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva mesa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Número de mesa</Label>
            <Input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ej. 11"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label>Capacidad (personas)</Label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="4"
              min={1}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!number || isPending}>
            {isPending ? "Creando..." : "Crear mesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
