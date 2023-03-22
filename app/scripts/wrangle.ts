console.log('wrangle', process.env);
import { KVNamespace } from '@cloudflare/workers-types';
import { execSync } from 'node:child_process';
import toml from 'toml';
import json2toml from 'json2toml';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import getGitInfo from './get-git-info';

import * as dotenv from 'dotenv';
import { createNamespace, getNamespace, parseId, writeKV } from './kv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _debug = false;

export { _debug as debug };

function getArgs() {
  let env = 'dev';
  let other = 'other';
  let debug = false;

  const args = process.argv.filter(Boolean);
  let state = null;
  for (const arg of args) {
    if (arg === '--debug') {
      debug = true;
      continue;
    }
    if (arg === '--env') {
      state = 'ENV';
      continue;
    }
    if (arg === '--other') {
      state = 'OTHER';
      continue;
    }
    if (state === 'ENV') {
      env = arg;
      state = null;
    }
    if (state === 'OTHER') {
      other = arg;
      state = null;
    }
  }

  // if (!env) {
  //   throw new Error("[build-worker] CLI argument --entry missing.");
  // }
  // if (!other) {
  //   throw new Error("[build-worker] CLI argument --out missing.");
  // }

  return { env, other, debug };
}

async function main(env, debug) {
  const envFile = env === 'dev' ? '.env' : '.env.preview';
  const config = dotenv.config({
    path: path.join(__dirname, `../${envFile}`),
  });
  console.log(config);
  const bindingName = process.env.VITE_APP_NAME.toUpperCase().replace(
    /-/g,
    '_',
  );
  if (debug || process.env.VITLE_LOG_LEVEL === 'debug') {
    _debug = true;
  }
  console.log('debug', _debug);
  const id = parseId(bindingName, env);

  if (!getNamespace(id, env)) {
    createNamespace(bindingName, env);
  }

  const commitStr = await getGitInfo();

  writeKV(id, env, commitStr);
}

(async () => {
  const { env, other, debug } = getArgs();
  await main(env, debug);
})();
