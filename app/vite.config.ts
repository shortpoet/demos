import vue from "@vitejs/plugin-vue";
import ssr from "vite-plugin-ssr/plugin";
import { defineConfig, loadEnv, UserConfig } from "vite";
import path from "node:path";
import { InlineConfig } from "vitest";

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}
const vitestConfig: InlineConfig = {
  include: ["test/**/*.test.ts"],
  environment: "jsdom",
  deps: {
    inline: ["@vue", "@vueuse", "vue-demi"],
  },
};

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [vue(), ssr()],

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
        "~/": `${path.resolve(__dirname, "app/src")}/`,
      },
    },

    test: vitestConfig,
  });
};
