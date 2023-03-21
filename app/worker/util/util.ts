import { mapRequestToAsset, Options } from '@cloudflare/kv-asset-handler';
import { Env, LogLevel, LOG_LOVELS } from '../types';

export { logLevel, isAssetURL, redirectToHttps, isAPI };

const logLevel = (level: LogLevel, env: Env): boolean => {
  const envLevel = env.LOG_LEVEL;
  const currentIndex = LOG_LOVELS.indexOf(env.LOG_LEVEL);
  const targetIndex = LOG_LOVELS.indexOf(level);
  const out = currentIndex <= targetIndex;
  // console.log("logLevel", { level, envLevel, currentIndex, targetIndex, out });
  return out;
};

const redirectToHttps = (url: URL) =>
  url.protocol === 'http:' &&
  url.hostname !== '127.0.0.1' &&
  url.hostname !== 'localhost' &&
  !url.hostname.startsWith('192.168.1');

const isAssetURL = (url: URL) => url.pathname.startsWith('/assets/');

const isAPI = (url: URL) => url.pathname.startsWith('/api/');
