import { HealthCheck } from "../../types";
import { msToTime } from "../util";
import { Bindings, Env, WorkerEnv } from "../types";
import { ServerResponse } from "http";
import { IRequest } from "../api.v5/router";
import type { HonoRequest } from "hono";

export const healthCheck = async (
  req: any,
  // hono is tricky to type
  // req: Request | IRequest | HonoRequest,
  res: ServerResponse | Response,
  env: any
  // env: Env | Bindings
) => {
  if (!env) {
    throw new Error("env is undefined");
  }
  const gitInfo = (<Env>env).isWorkerEnv
    ? JSON.parse((await (env.DEMO_CFW_SSR as KVNamespace).get("gitInfo")) || "")
    : (await import("../../data/git.json")).default;

  const version = (<Env>env).isWorkerEnv
    ? // @ts-expect-error
      JSON.parse((await import("__STATIC_CONTENT_MANIFEST")) || "")[
        "__STATIC_CONTENT_MANIFEST"
      ]
    : "local";

  const healthRes: HealthCheck = {
    status: "OK",
    version,
    uptime: msToTime(process.uptime()),
    env: env.ENVIRONMENT,
    timestamp: new Date(Date.now()),
    gitInfo: gitInfo,
  };

  return new Response(JSON.stringify(healthRes, null, 2), {
    headers: { "content-type": "application/json" },
  });
};

export const _healthCheck = async (
  req: Request | IRequest,
  res: ServerResponse,
  env: Env,
  ctx: ExecutionContext
) => {
  let gitInfo;
  let version = "";

  gitInfo = (<Env>env).isWorkerEnv
    ? JSON.parse((await (env.DEMO_CFW_SSR as KVNamespace).get("gitInfo")) || "")
    : (await import("../../data/git.json")).default;

  version = (<Env>env).isWorkerEnv
    ? // @ts-expect-error
      JSON.parse((await import("__STATIC_CONTENT_MANIFEST")) || "")[
        "__STATIC_CONTENT_MANIFEST"
      ]
    : "local";

  const healthRes: HealthCheck = {
    status: "OK",
    version,
    uptime: msToTime(process.uptime()),
    env: env.ENVIRONMENT,
    timestamp: new Date(Date.now()),
    gitInfo: gitInfo,
  };
  let corsify;
  console.log("env.API_VERSION", env.API_VERSION);
  // this might not be needed but only seems to work globally with v5, but before v1?
  // switch (env.API_VERSION) {
  //   case "v3":
  //     corsify = (await import("../api.v3")).corsify;
  //     break;
  //   case "v2":
  //     corsify = (await import("../api.v2")).corsify;
  //   default:
  //     corsify = (await import("../api.v1")).corsify;
  //     break;
  // }
  corsify = (await import("../api.v5")).corsify;

  return Promise.resolve(
    corsify(
      new Response(JSON.stringify(healthRes, null, 2), {
        headers: { "content-type": "application/json" },
      })
    )
  );
};
