import { AssetManifestType } from "@cloudflare/kv-asset-handler/dist/types";
import type { STATUS } from "./constants";
import type { DefaultSession } from "next-auth";
import type UserModel from "../../../sp-cloud/demos/app/database/schemas/User";

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
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  // NEXTAUTH_DATABASE_URL: string;

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

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      status: Record<keyof typeof STATUS, boolean>;
    };
  }
  interface User extends InstanceType<typeof UserModel> {}
}

declare module "next-auth/jwt" {
  interface JWT {
    status?: number;
  }
}
