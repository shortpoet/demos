import path, { dirname } from 'node:path';
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

console.log('wrangle.ts');
console.log(__filename);
console.log(__dirname);

let KV_DEBUG = false;

export { KV_DEBUG };

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
    `Cloud/auth0/${process.env.VITE_APP_NAME}/${env}/__SECRET__`,
    env,
    16,
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

async function setVars(id, env, envVars) {
  console.log(env);
  console.log(id);
  console.log(envVars);

  const config = getToml();

  const domain = await command(`pass Cloud/auth0/shortpoet/domain`);
  const clientId = await command(
    `pass Cloud/auth0/${envVars.parsed.VITE_APP_NAME}/client_id`,
  );

  console.log(config['env'][`${env}`]['vars']);
  // const newVars = Object.entries(envVars.parsed).reduce((acc, [key, value]) => {
  //   acc[key] = value;
  //   return acc;
  // }, {});
  const newVars = {
    ...config['env'][`${env}`]['vars'],
    ...envVars.parsed,
    VITE_AUTH0_CLIENT_ID: clientId,
    VITE_AUTH0_DOMAIN: domain,
  };
  console.log(newVars);
  // writeToml(config);
}
async function main(env, debug) {
  const envFile =
    env === 'dev' ? '.env' : env === 'preview' ? '.env.preview' : '.env.uat';
  const config = dotenv.config({
    path: path.join(__dirname, `../${envFile}`),
  });
  const appName = process.env.VITE_APP_NAME;
  const bindingName = process.env.VITE_APP_NAME.toUpperCase().replace(
    /-/g,
    '_',
  );

  const otherBindings = [`${bindingName}_SESSIONS`, `${bindingName}_USERS`];

  for (const binding of otherBindings) {
    // console.log(`binding: ${binding}`);
    const id = parseId(binding, env, appName);
    // console.log(`id: ${id}`);
    const namespace = getNamespace(id, env);
    // console.log(`namespace: ${namespace}`);
    const preview = getPreview(id, env);
    // console.log(`preview: ${preview}`);

    // await deleteNamespace(env, namespace.id, preview.id);
    if (!namespace) {
      createNamespace(binding, env, appName);
    }
  }

  const id = parseId(bindingName, env, appName);
  if (debug || process.env.VITLE_LOG_LEVEL === 'debug') {
    console.log(config);
    console.log('bindingName', bindingName);
    console.log('id', id);
    KV_DEBUG = true;
  }

  if (!getNamespace(id, env)) {
    createNamespace(bindingName, env, appName);
  }
  await setGitconfig(id, env);

  await setSecrets(env);
  // await setVars(id, env, config);
}

(async () => {
  const { env, other, debug } = getArgs();
  await main(env, debug);
})();
