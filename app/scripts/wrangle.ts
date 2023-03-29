import path, { dirname } from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import getGitInfo from './get-git-info';

import * as dotenv from 'dotenv';
import {
  createNamespace,
  getNamespace,
  parseId,
  writeKV,
  deleteNamespace,
  getPreview,
} from './kv';
import { command, getToml, writeFile, writeToml } from './util';
import {
  generateSecret,
  passGet,
  passWrite,
  setSecretFile,
  writeSecret,
} from './secret';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let KV_DEBUG = false;

type Env = {
  env: 'dev' | 'prod';
  envFile: string;
  debug: boolean;
};

export { KV_DEBUG, Env };

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

async function setGitconfig(id, env) {
  const commitStr = await getGitInfo();
  writeKV(id, env, commitStr);
}

async function setSecrets(env) {
  setSecretFile(
    '__SECRET__',
    `Cloud/auth0/${process.env.VITE_APP_NAME}/${env.env}/__SECRET__`,
    env,
    32,
  );

  setSecretFile(
    'NEXTAUTH_SECRET',
    `Cloud/auth0/${process.env.VITE_APP_NAME}/${env.env}/NEXTAUTH_SECRET`,
    env,
    32,
  );

  setSecretFile(
    'AUTH0_CLIENT_ID',
    `Cloud/auth0/${process.env.VITE_APP_NAME}/client_id`,
    env,
  );

  setSecretFile(
    'AUTH0_CLIENT_SECRET',
    `Cloud/auth0/${process.env.VITE_APP_NAME}/client_secret`,
    env,
  );

  setSecretFile(
    'ADMIN_USERS',
    `Cloud/auth0/${process.env.VITE_APP_NAME}/admin_users`,
    env,
  );
}

async function setVars(_env: Env, envVars) {
  const env = _env.env;
  const ssrDir = path.join(__dirname, '../src/pages');
  const ssrDirs = fs
    .readdirSync(ssrDir)
    .map((dir) => path.join(ssrDir, dir).split('/').pop())
    .join(',');

  const config = getToml();

  const domain = (await command(`pass Cloud/auth0/shortpoet/domain`)).trim();
  // const newVars = Object.entries(envVars.parsed).reduce((acc, [key, value]) => {
  //   acc[key] = value;
  //   return acc;
  // }, {});
  const newVars = {
    ...config['env'][`${env}`]['vars'],
    AUTH0_DOMAIN: domain,
    NEXTAUTH_URL: envVars.parsed['NEXTAUTH_URL'],
    SSR_BASE_PATHS: ssrDirs,
  };
  // TODO seems to be a bug where NEXTAUTH_URL
  // prod value is ending up in dev
  writeToml({
    ...config,
    env: {
      ...config['env'],
      [`${env}`]: {
        ...config['env'][`${env}`],
        vars: newVars,
      },
    },
  });
}

async function assertBinding(bindingName, env, appName) {
  const id = parseId(bindingName, env, appName);
  if (!getNamespace(id, env)) {
    createNamespace(bindingName, env, appName);
  }
}

async function setBindings(bindingName, appName, env, debug) {
  if (debug || process.env.VITLE_LOG_LEVEL === 'debug') {
    console.log('bindingName', bindingName);
    KV_DEBUG = true;
  }

  assertBinding(bindingName, env, appName);
  const otherBindings = [`${bindingName}_SESSIONS`, `${bindingName}_USERS`];

  for (const binding of otherBindings) {
    // console.log(`binding: ${binding}`);
    assertBinding(binding, env, appName);
  }
}

async function main(env, debug) {
  const config = dotenv.config({
    path: path.join(__dirname, `../${env.envFile}`),
  });
  const appName = process.env.VITE_APP_NAME;
  const bindingName = process.env.VITE_APP_NAME.toUpperCase().replace(
    /-/g,
    '_',
  );
  const id = parseId(bindingName, env, appName);

  if (debug || process.env.VITLE_LOG_LEVEL === 'debug') {
    console.log(config);
    console.log('bindingName', bindingName);
    console.log('id', id);
  }

  await setBindings(bindingName, appName, env, debug);
  await setGitconfig(id, env);
  await setSecrets(env);
  await setVars(env, config);
}

(async () => {
  //TODO change to mode
  const { env, other, debug } = getArgs();

  const envFile =
    env === 'dev'
      ? '.env'
      : env === 'preview'
      ? '.env.preview'
      : env === '.env.uat'
      ? '.env.uat'
      : '.env.prod';

  const _env = {
    debug,
    env,
    envFile,
  };

  _env.env = env === 'prod' ? 'prod' : 'dev';
  await main(_env, debug);
})();
