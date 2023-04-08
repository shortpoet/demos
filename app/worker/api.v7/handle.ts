import { App, toNodeListener, useBase } from "h3";
import { createCall } from "unenv/runtime/fetch/index";
import type { Handle } from "unenv/runtime/fetch/call";
import { requestHasBody, useRequestBody } from "./utils/body";
// import { WorkerApp, WorkerWrapperOptions } from '.'
import { sortStack } from "./sortStack";
import { WorkerApp } from "./types";

export interface WorkerWrapperOptions {
  /** The base path for the app - defaults to '/' */
  basePath?: string;
  /** Sort the h3 route stack by length to avoid ordering issues */
  sortStack?: boolean;
}
const defaultOpts: Required<WorkerWrapperOptions> = {
  basePath: "",
  sortStack: true,
};

export const handleEvent = async (
  event: FetchEvent,
  workerApp: WorkerApp,
  opts?: WorkerWrapperOptions
): Promise<Response> => {
  opts = { ...defaultOpts, ...opts };

  // Type the app to make ts happy
  const app = workerApp as unknown as App;

  // sort the stack if needed - why wouldn't you?
  if (opts.sortStack) sortStack(workerApp);

  // add the base path to the app
  // const handle = useBase(opts.basePath || '', app) as unknown as Handle

  // wrap and un-node the call handler
  // const localCall = createCall(handle)
  const localCall = createCall(toNodeListener(app) as any);

  // make a new url
  const url = new URL(event.request.url);

  // handle body
  let body;
  if (requestHasBody(event.request)) {
    body = await useRequestBody(event.request);
  }

  // call the handler
  const r = await localCall({
    event,
    url: url.pathname + url.search,
    host: url.hostname,
    protocol: url.protocol,
    // @ts-ignore
    headers: event.request.headers,
    method: event.request.method,
    redirect: event.request.redirect,
    body,
  });

  // return the response
  return new Response(r.body, {
    // @ts-ignore
    headers: r.headers,
    status: r.status,
    statusText: r.statusText,
  });
};
