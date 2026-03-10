import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { ordersRouter } from "./orders";
import { menuRouter } from "./menu";
import { tablesRouter } from "./tables";
import { usersRouter } from "./users";
import { paymentsRouter } from "./payments";

export const appRouter = createTRPCRouter({
  orders: ordersRouter,
  menu: menuRouter,
  tables: tablesRouter,
  users: usersRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
