import { Env, LogLevel, LOG_LOVELS } from '../types';

export {
  logger,
  logLevel,
  isAssetURL,
  redirectToHttps,
  isAPI,
  isJsonURL,
  isGenerated,
  isSSR,
};

const logLevel = (level: LogLevel, env: Env): boolean => {
  const envLevel = env.LOG_LEVEL;
  const currentIndex = LOG_LOVELS.indexOf(env.LOG_LEVEL);
  const targetIndex = LOG_LOVELS.indexOf(level);
  const out = currentIndex >= targetIndex;
  // console.log("logLevel", { level, envLevel, currentIndex, targetIndex, out });
  return out;
};

const logger = (level: LogLevel, env: Env) => (msg: any) => {
  if (logLevel(level, env)) {
    typeof msg === 'string'
      ? console.log(msg)
      : console.log(
          ...Object.entries(msg).map(([key, val]) =>
            typeof val === 'string' ? val : `${key}: ${JSON.stringify(val)}`,
          ),
        );
  }
};

const redirectToHttps = (url: URL) =>
  url.protocol === 'http:' &&
  url.hostname !== '127.0.0.1' &&
  url.hostname !== 'localhost' &&
  !url.hostname.startsWith('192.168.1');

const isAssetURL = (url: URL) => url.pathname.startsWith('/assets/');

const isAPI = (url: URL) => url.pathname.startsWith('/api/');

const isJsonURL = (url: URL) => url.pathname.endsWith('.json');

const isSSR = (url: URL) => url.pathname.startsWith('/');

const isGenerated = (url: URL) => url.pathname.startsWith('/_next/');
// const isSSR = (url: URL) => ssrPaths.some((path) => url.pathname.startsWith(path));
