import type { DraftItem } from "../_components/_types";

export function upsertDraftItem(
  items: DraftItem[],
  menuItem: { id: string; name: string; price: string }
): DraftItem[] {
  const existing = items.findIndex((d) => d.menu_item_id === menuItem.id);
  if (existing >= 0) {
    return items.map((d, i) => (i === existing ? { ...d, quantity: d.quantity + 1 } : d));
  }
  return [
    ...items,
    {
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      quantity: 1,
      unit_price: parseFloat(menuItem.price),
    },
  ];
}

export function updateDraftQty(items: DraftItem[], idx: number, delta: number): DraftItem[] {
  return items
    .map((item, i) => (i === idx ? { ...item, quantity: item.quantity + delta } : item))
    .filter((item) => item.quantity > 0);
}
