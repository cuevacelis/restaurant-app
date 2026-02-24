"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useMenuManagement,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  type MenuItem,
} from "./services/useMenuManagement";
import { formatCurrency } from "@/lib/utils";

type ItemForm = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  available: boolean;
};

const EMPTY_FORM: ItemForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  available: true,
};

export default function MenuPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || "";

  const { data } = useMenuManagement();
  const { mutate: createItem, isPending: creating } = useCreateMenuItem();
  const { mutate: updateItem, isPending: updating } = useUpdateMenuItem();
  const { mutate: deleteItem } = useDeleteMenuItem();
  const { mutate: createCategory, isPending: creatingCat } = useCreateCategory();

  const [itemDialog, setItemDialog] = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];

  const filteredItems = category
    ? items.filter((i) => i.category_id === category)
    : items;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setItemDialog({ open: true });
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id || "",
      image_url: item.image_url || "",
      available: item.available,
    });
    setItemDialog({ open: true, item });
  };

  const handleSave = () => {
    const payload = {
      ...form,
      price: form.price,  // keep as string, DB cast handles it
      category_id: form.category_id || undefined,
      image_url: form.image_url || undefined,
      description: form.description || undefined,
    };

    if (itemDialog.item) {
      updateItem(
        { id: itemDialog.item.id, data: payload },
        { onSuccess: () => setItemDialog({ open: false }) }
      );
    } else {
      createItem(payload, { onSuccess: () => setItemDialog({ open: false }) });
    }
  };

  const setCategory = (cat: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!cat) sp.delete("category");
    else sp.set("category", cat);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Menú</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo platillo
        </Button>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Platillos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        {/* ── Items tab ── */}
        <TabsContent value="items" className="space-y-4 mt-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.name}</p>
                        {!item.available && (
                          <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                        )}
                        {item.category_name && (
                          <Badge variant="outline" className="text-xs">{item.category_name}</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateItem({ id: item.id, data: { available: !item.available } })}
                        disabled={updating}
                        title={item.available ? "Desactivar" : "Activar"}
                      >
                        {item.available ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredItems.length === 0 && (
              <p className="py-8 text-center text-muted-foreground text-sm">Sin platillos</p>
            )}
          </div>
        </TabsContent>

        {/* ── Categories tab ── */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Nombre de categoría"
              className="max-w-xs"
            />
            <Input
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="max-w-xs"
            />
            <Button
              onClick={() => {
                createCategory({ name: catName, description: catDescription || undefined });
                setCatName("");
                setCatDescription("");
              }}
              disabled={!catName || creatingCat}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {items.filter((i) => i.category_id === cat.id).length} platillos
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Item create/edit dialog */}
      <Dialog open={itemDialog.open} onOpenChange={(open) => !open && setItemDialog({ open: false })}>
        <DialogContent>
          <DialogCloseButton onClose={() => setItemDialog({ open: false })} />
          <DialogHeader>
            <DialogTitle>{itemDialog.item ? "Editar platillo" : "Nuevo platillo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                placeholder="Sin categoría"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL de imagen</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="available">Disponible en menú</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false })}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.price || creating || updating}>
              {creating || updating ? "Guardando..." : itemDialog.item ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
