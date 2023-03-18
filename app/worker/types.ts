import { AssetManifestType } from "@cloudflare/kv-asset-handler/dist/types";

declare const DEMO_CFW_SSR: KVNamespace;
declare const __STATIC_CONTENT: KVNamespace;
declare const __STATIC_CONTENT_MANIFEST: AssetManifestType;
declare const ENVIRONMENT: string;

interface Env {
  DEMO_CFW_SSR: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: AssetManifestType;
  ENVIRONMENT: "dev" | "prod";
  LOG_LEVEL: string;

  // MY_DURABLE_OBJECT: DurableObjectNamespace
  // MY_BUCKET: R2Bucket
}

export {
  Env,
  DEMO_CFW_SSR,
  __STATIC_CONTENT,
  __STATIC_CONTENT_MANIFEST,
  ENVIRONMENT,
};