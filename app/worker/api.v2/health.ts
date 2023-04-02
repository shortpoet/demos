import { HealthCheck } from "../../types";
import { msToTime } from "../util";
import { Env, WorkerEnv } from "../types";
import { corsify } from "./api";

export const healthCheck = async (req: Request, env: Env) => {
  const gitInfo = (<Env>env).isWorkerEnv
    ? JSON.parse((await (env.DEMO_CFW_SSR as KVNamespace).get("gitInfo")) || "")
    : (await import("../../data/git.json")).default;

  const version = (<Env>env).isWorkerEnv
    ? // @ts-expect-error
      JSON.parse((await import("__STATIC_CONTENT_MANIFEST")) || "")[
        "__STATIC_CONTENT_MANIFEST"
      ]
    : "local";

  const res: HealthCheck = {
    status: "OK",
    version,
    uptime: msToTime(process.uptime()),
    env: env.ENVIRONMENT,
    timestamp: new Date(Date.now()),
    gitInfo: gitInfo,
  };

  return new Response(JSON.stringify(res, null, 2), {
    headers: { "content-type": "application/json" },
  });
};

export const _healthCheck = async (req: Request, env: Env) => {
  const path = new URL(req.url).pathname;
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

  const res: HealthCheck = {
    status: "OK",
    version,
    uptime: msToTime(process.uptime()),
    env: env.ENVIRONMENT,
    timestamp: new Date(Date.now()),
    gitInfo: gitInfo,
  };
  return Promise.resolve(
    corsify(
      new Response(JSON.stringify(res, null, 2), {
        headers: { "content-type": "application/json" },
      })
    )
  );
};
