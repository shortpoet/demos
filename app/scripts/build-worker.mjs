import esbuild from "esbuild";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

function buildWorker({ entry, out, debug, external } = {}) {
  const plugins = [NodeModulesPolyfillPlugin()];
  const define = {
    plugins,
    platform: "browser",
    conditions: ["worker", "browser"],
    entryPoints: [entry],
    sourcemap: true,
    outfile: out,
    external,
    logLevel: "warning",
    format: "esm",
    target: "es2020",
    bundle: true,
    minify: !debug,
    define: {
      IS_CLOUDFLARE_WORKER: "true",
    },
  };
  console.log("define", define);
  return esbuild.build(define);
}

build();

async function build() {
  const external = [
    // "@vueuse/core",
    // "vue-demi",
    // "node:fs",
    // "node:util",
    // "node:stream",
    // "node:buffer",
    // "node:http",
    "__STATIC_CONTENT_MANIFEST",
  ];

  console.log("[build-worker] Building worker...");
  const { entry, out, debug } = getArgs();
  try {
    await buildWorker({ entry, out, debug, external });
    console.log("[build-worker] Worker built successfully.");
  } catch (err) {
    console.error("[build-worker] Failed to build worker.", err);
  }
}

function getArgs() {
  let entry;
  let out;
  let debug = false;

  const args = process.argv.filter(Boolean);
  let state = null;
  for (const arg of args) {
    if (arg === "--debug") {
      debug = true;
      continue;
    }
    if (arg === "--entry") {
      state = "ENTRY";
      continue;
    }
    if (arg === "--out") {
      state = "OUT";
      continue;
    }
    if (state === "ENTRY") {
      entry = arg;
      state = null;
    }
    if (state === "OUT") {
      out = arg;
      state = null;
    }
  }

  if (!entry) {
    throw new Error("[build-worker] CLI argument --entry missing.");
  }
  if (!out) {
    throw new Error("[build-worker] CLI argument --out missing.");
  }

  return { entry, out, debug };
}
