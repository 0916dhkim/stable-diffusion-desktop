import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import { QueryClientProvider, QueryClient } from "@tanstack/solid-query";
import { ToastContainer } from "../toast";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ToastContainer />
      <TanStackRouterDevtools />
    </QueryClientProvider>
  ),
});
