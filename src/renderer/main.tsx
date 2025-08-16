import { render } from "solid-js/web";
import { RouterProvider, createRouter } from "@tanstack/solid-router";
import "./main.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { css } from "@flow-css/core/css";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
rootElement.classList.add(css((t) => t.VARS));
if (!rootElement.innerHTML) {
  render(() => <RouterProvider router={router} />, rootElement);
}
