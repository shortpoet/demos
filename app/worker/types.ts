import { AssetManifestType } from "@cloudflare/kv-asset-handler/dist/types";

declare const DEMO_CFW_SSR: KVNamespace;
declare const __STATIC_CONTENT: KVNamespace;
declare const __STATIC_CONTENT_MANIFEST: AssetManifestType;
declare const ENVIRONMENT: string;
declare type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface WorkerEnv {
  // APP
  ENVIRONMENT: "dev" | "prod";
  LOG_LEVEL: LogLevel;
  SSR_BASE_PATHS: string;

  // CLOUDFLARE
  DEMO_CFW_SSR: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: AssetManifestType;

  // MY_DURABLE_OBJECT: DurableObjectNamespace
  // MY_BUCKET: R2Bucket
  isWorkerEnv(): void;
}

interface NodeEnv {
  [key: string]: string;
}

type Env = WorkerEnv | NodeEnv;

export {
  WorkerEnv,
  Env,
  DEMO_CFW_SSR,
  __STATIC_CONTENT,
  __STATIC_CONTENT_MANIFEST,
  ENVIRONMENT,
};
