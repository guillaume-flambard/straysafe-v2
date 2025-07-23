import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import dogInteractionsRoute from "./routes/dogs/interactions/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  dogs: createTRPCRouter({
    interactions: dogInteractionsRoute,
  }),
});

export type AppRouter = typeof appRouter;