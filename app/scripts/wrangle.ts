import { KVNamespace } from '@cloudflare/workers-types';
import { execSync } from 'node:child_process';
import toml from 'toml';
import json2toml from 'json2toml';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import getGitInfo from './get-git-info';

import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function getToml(): string {
  try {
    return toml.parse(
      fs.readFileSync(path.join(__dirname, '../../wrangler.toml'), 'utf8'),
    );
  } catch (error) {
    console.error(error);
  }
}

const writeToml = (data: string) => {
  try {
    fs.writeFileSync(
      path.join(__dirname, '../../wrangler.bak.toml'),
      fs.readFileSync(path.join(__dirname, '../../wrangler.toml'), 'utf8'),
    );
    // console.log('wrote toml');
    // console.log(data);
    fs.writeFileSync(
      path.join(__dirname, '../../wrangler.toml'),
      json2toml(data),
    );
  } catch (error) {
    console.error(error);
  }
};

const getBinding = (env) => {
  return getToml()['env'][`${env}`]['kv_namespaces'][0]['binding'];
};

function executeWranglerCommand(command: string, env: string) {
  return execSync(`npx wrangler --env ${env} ${command}`, { encoding: 'utf8' });
}

const parseId = (binding: string, env: string) =>
  `${binding.toLowerCase().replace(/_/g, '-')}-${env}-${env}-${binding}`;

(async () => {
  const { env, other, debug } = getArgs();
  const envFile = env === 'dev' ? '.env' : '.env.preview';

  const config = dotenv.config({
    path: path.join(__dirname, `../${envFile}`),
  });

  // console.log(config);

  const bindingName = process.env.VITE_APP_NAME.toUpperCase().replace(
    /-/g,
    '_',
  );

  // const binding = getBinding(env);
  const id = parseId(bindingName, env);
  const commitStr = await getGitInfo();

  // writeToml(getToml());

  let getNamespaces = () =>
    JSON.parse(executeWranglerCommand('kv:namespace list', env));

  const getNamespace = () => getNamespaces().find((i) => i.title === id);

  // const namespace = getNamespace();
  // console.log(namespace);

  const getPreview = () =>
    getNamespaces().find((i) => i.title === `${id}_preview`);

  if (!getNamespace()) {
    const cmd = `kv:namespace create ${bindingName}`;
    const cmdPrev = `kv:namespace create ${bindingName} --preview`;
    // if (debug) process.exit(0);
    const res = executeWranglerCommand(cmd, env);
    console.log(res);
    const resPrev = executeWranglerCommand(cmdPrev, env);
    console.log(resPrev);
    const namespaceId = getNamespace().id;
    const previewId = getPreview().id;

    const config = getToml();

    config['env'][`${env}`]['kv_namespaces'][0] = {
      ...config['env'][`${env}`]['kv_namespaces'][0],
      id: namespaceId,
      preview_id: namespaceId,
    };

    writeToml(config);
    // let deleteCmd = `kv:namespace delete --namespace-id ${namespaceId}`;
    // // if (debug) process.exit(0);
    // let deleteRes = executeWranglerCommand(deleteCmd, env);
    // console.log(deleteRes);
    // deleteCmd = `kv:namespace delete --namespace-id ${previewId}`;
    // deleteRes = executeWranglerCommand(deleteCmd, env);
    // console.log(deleteRes);
  }

  const namespaceId = getNamespace().id;
  const previewId = getPreview().id;

  // const prodCommand = `kv:key put --namespace-id=${namespaceId} gitInfo '${commitStr}'`;
  // const devCommand = `kv:key put --namespace-id=${previewId} gitInfo '${commitStr}'`;
  const cmd = `kv:key put --namespace-id=${namespaceId} gitInfo '${commitStr}'`;
  if (debug) {
    console.log('commit', commitStr);
    console.log(`\n`);
    console.log('namespaces', getNamespaces());
    console.log(`\n`);
    console.log('id', id);
    console.log(`\n`);
    console.log('namescpaceId', namespaceId);
    console.log(`\n`);
    console.log('previewId', previewId);
    // console.log(`\n`);
    // console.log('devCommand', devCommand);
    // console.log(`\n`);
    // console.log('prodCommand', prodCommand);
    console.log(`\n`);
    console.log('cmd', cmd);

    process.exit(0);
  }
  // if (env === 'dev') {
  //   const res = executeWranglerCommand(devCommand,);
  //   console.log(res);
  // } else {
  //   const res = executeWranglerCommand(prodCommand);
  //   console.log(res);
  // }
  const res = executeWranglerCommand(cmd, env);
  console.log(res);
})();
