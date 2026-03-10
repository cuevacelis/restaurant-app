import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/db/queries/menu";

export const menuRouter = createTRPCRouter({
  // ── Items ─────────────────────────────────────────────────────

  listItems: publicProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
        availableOnly: z.boolean().optional().default(true),
      }).optional()
    )
    .query(async ({ input }) => {
      const [items, categories] = await Promise.all([
        getMenuItems({
          categoryId: input?.categoryId,
          availableOnly: input?.availableOnly ?? true,
        }),
        getCategories(),
      ]);
      return { items, categories };
    }),

  getItem: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const item = await getMenuItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Ítem no encontrado" });
      return { item };
    }),

  createItem: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().nonnegative(),
        category_id: z.string().uuid().optional(),
        description: z.string().optional(),
        image_url: z.string().url().optional(),
        available: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const item = await createMenuItem(input);
      return { item };
    }),

  updateItem: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        price: z.number().nonnegative().optional(),
        category_id: z.string().uuid().nullable().optional(),
        description: z.string().nullable().optional(),
        image_url: z.string().url().nullable().optional(),
        available: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const item = await updateMenuItem(id, data);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return { item };
    }),

  deleteItem: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deleteMenuItem(input.id);
      return { ok: true };
    }),

  // ── Categories ────────────────────────────────────────────────

  listCategories: publicProcedure.query(async () => {
    const categories = await getCategories();
    return { categories };
  }),

  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        order_index: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const category = await createCategory(input);
      return { category };
    }),

  updateCategory: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        order_index: z.number().int().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const category = await updateCategory(id, data);
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      return { category };
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { ok: true };
    }),
});
