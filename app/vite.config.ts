import vue from '@vitejs/plugin-vue';
import ssr from 'vite-plugin-ssr/plugin';
import Unocss from 'unocss/vite';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import path from 'node:path';
import { InlineConfig } from 'vitest';
// import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
// import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}
const vitestConfig: InlineConfig = {
  include: ['test/**/*.test.ts'],
  environment: 'jsdom',
  deps: {
    inline: ['@vue', '@vueuse', 'vue-demi'],
  },
};

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  // const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    define: {
      'process.env': process.env,
      // __SECRET__: env.__SECRET__,
    },
    plugins: [
      vue({
        include: [/\.vue$/, /\.md$/],
      }),
      ssr(),
      Unocss(),
    ],

    server: {
      port: parseInt(process.env.VITE_PORT || '3000'),
      hmr: {
        overlay: false,
      },
    },

    build: {
      outDir: 'build',
      target: 'esnext',
      // rollupOptions: {
      //   plugins: [rollupNodePolyFill()],
      // },
    },

    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },

    test: vitestConfig,

    // optimizeDeps: {
    //   esbuildOptions: {
    //     // Node.js global to browser globalThis
    //     define: {
    //       global: 'globalThis',
    //     },
    //     // Enable esbuild polyfill plugins
    //     plugins: [
    //       NodeGlobalsPolyfillPlugin({
    //         buffer: true,
    //       }),
    //       NodeModulesPolyfillPlugin(),
    //     ],
    //   },
    // },
  });
};
