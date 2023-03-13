import vue from "@vitejs/plugin-vue";
import ssr from "vite-plugin-ssr/plugin";
import { defineConfig, loadEnv } from "vite";
import path from "node:path";

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    server: {
      port: parseInt(process.env.VITE_PORT || "3333"),
      hmr: {
        overlay: false,
      },
    },
    build: {
      outDir: "build",
      target: "esnext",
    },
    resolve: {
      alias: {
        "~/": `${path.resolve(__dirname, ".")}/`,
      },
    },

    plugins: [vue(), ssr()],
  });
};
