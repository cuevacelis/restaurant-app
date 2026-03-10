import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import { getTables, getTableById, createTable, updateTable, deleteTable } from "@/lib/db/queries/tables";
import { getOrders } from "@/lib/db/queries/orders";

export const tablesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    const tables = await getTables();
    return { tables };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const table = await getTableById(input.id);
      if (!table) throw new TRPCError({ code: "NOT_FOUND" });
      return { table };
    }),

  ordersByTable: publicProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .query(async ({ input }) => {
      const orders = await getOrders({ tableId: input.tableId });
      return { orders };
    }),

  create: adminProcedure
    .input(z.object({ number: z.number().int().positive(), capacity: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const table = await createTable(input);
      return { table };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        number: z.number().int().positive().optional(),
        capacity: z.number().int().positive().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const table = await updateTable(id, data);
      if (!table) throw new TRPCError({ code: "NOT_FOUND" });
      return { table };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deleteTable(input.id);
      return { ok: true };
    }),
});
