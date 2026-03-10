import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, staffProcedure, kitchenProcedure } from "../init";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderTable,
  updateOrderItems,
  appendOrderItems,
  addOrderReview,
} from "@/lib/db/queries/orders";
import { getTableByNumber } from "@/lib/db/queries/tables";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTableId(tableId: string): Promise<string | null> {
  if (UUID_REGEX.test(tableId)) return tableId;
  const num = parseInt(tableId, 10);
  if (isNaN(num)) return null;
  const table = await getTableByNumber(num);
  return table?.id ?? null;
}
import { VALID_STATUSES, type OrderStatus } from "@/lib/db/order-status";

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  notes: z.string().optional(),
});

export const ordersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        tableId: z.string().optional(),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const orders = await getOrders({
        status: input?.status as OrderStatus | undefined,
        tableId: input?.tableId,
        limit: input?.limit,
        offset: input?.offset,
      });
      return { orders };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      return { order };
    }),

  create: publicProcedure
    .input(
      z.object({
        customer_name: z.string().min(1),
        order_type: z.enum(["dine_in", "takeout"]),
        table_id: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(orderItemSchema).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = !!ctx.session?.user;
      const table_id = input.table_id ? await resolveTableId(input.table_id) : undefined;
      const order = await createOrder({
        ...input,
        table_id: table_id ?? undefined,
        status: isStaff ? "pending" : "pending_verification",
      });
      return { order };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().refine((s) => VALID_STATUSES.has(s as OrderStatus), {
          message: "Estado inválido",
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const order = await updateOrderStatus(input.id, input.status as OrderStatus, userId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      return { order };
    }),

  changeTable: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        table_id: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await updateOrderTable(input.orderId, input.table_id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      return { order };
    }),

  replaceItems: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        items: z.array(orderItemSchema).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const order = await updateOrderItems(input.orderId, input.items);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
      return { order };
    }),

  appendItems: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        items: z.array(orderItemSchema).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getOrderById(input.orderId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se pueden agregar ítems a pedidos pendientes" });
      }
      const order = await appendOrderItems(input.orderId, input.items);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return { order };
    }),

  submitReview: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await addOrderReview(input.orderId, {
        rating: input.rating,
        comment: input.comment,
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return { order };
    }),
});
