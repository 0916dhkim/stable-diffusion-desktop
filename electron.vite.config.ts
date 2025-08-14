import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import solid from "vite-plugin-solid";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import flowCss from "@flow-css/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
      },
    },
    plugins: [
      tanstackRouter({
        target: "solid",
        routesDirectory: "src/renderer/routes",
        generatedRouteTree: "src/renderer/routeTree.gen.ts",
      }),
      solid(),
      flowCss(),
    ],
  },
});
