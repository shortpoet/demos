import vue from "@vitejs/plugin-vue";
import ssr from "vite-plugin-ssr/plugin";
import Unocss from "unocss/vite";

import { defineConfig, loadEnv, UserConfig } from "vite";
import { InlineConfig } from "vitest";
import { fileURLToPath } from "node:url";

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
    plugins: [vue(), ssr(), Unocss()],

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
        "~": fileURLToPath(new URL(".", import.meta.url)),
      },
    },

    test: vitestConfig,
  });
};
