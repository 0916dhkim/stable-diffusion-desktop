import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import { QueryClientProvider, QueryClient } from "@tanstack/solid-query";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <TanStackRouterDevtools />
    </QueryClientProvider>
  ),
});
