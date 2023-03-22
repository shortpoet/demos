import { KVNamespace } from '@cloudflare/workers-types';
import { execSync } from 'node:child_process';
import toml from 'toml';
import json2toml from 'json2toml';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import getGitInfo from './get-git-info';

import * as dotenv from 'dotenv';

export { createNamespace, writeKV, getNamespace, parseId };
import { KV_DEBUG as debug } from './wrangle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Env = 'dev' | 'prod';

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

const parseId = (binding: string, env: Env) =>
  `${binding.toLowerCase().replace(/_/g, '-')}-${env}-${env}-${binding}`;

// const binding = getBinding(env);

// writeToml(getToml());

function getNamespaces(env: Env) {
  return JSON.parse(executeWranglerCommand('kv:namespace list', env));
}

function getNamespace(id: string, env: Env) {
  return getNamespaces(env).find((i) => i.title === id);
}

// const namespace = getNamespace();
// console.log(namespace);

function getPreview(id: string, env: Env) {
  return getNamespaces(env).find((i) => i.title === `${id}_preview`);
}

function deleteNamespace(env: Env, namespaceId: string, previewId: string) {
  let deleteCmd = `kv:namespace delete --namespace-id ${namespaceId}`;
  // if (debug) process.exit(0);
  let deleteRes = executeWranglerCommand(deleteCmd, env);
  console.log(deleteRes);
  deleteCmd = `kv:namespace delete --namespace-id ${previewId}`;
  deleteRes = executeWranglerCommand(deleteCmd, env);
  console.log(deleteRes);
}

function createNamespace(bindingName: string, env: Env) {
  const id = parseId(bindingName, env);
  const cmd = `kv:namespace create ${bindingName}`;
  const cmdPrev = `kv:namespace create ${bindingName} --preview`;
  // if (debug) process.exit(0);
  const res = executeWranglerCommand(cmd, env);
  console.log(res);
  const resPrev = executeWranglerCommand(cmdPrev, env);
  console.log(resPrev);
  if (debug) {
  }

  const namespaceId = getNamespace(id, env).id;

  // updateToml(`env.${env}.kv_namespaces.0.title`, id);
  const config = getToml();

  config['env'][`${env}`]['kv_namespaces'][0] = {
    ...config['env'][`${env}`]['kv_namespaces'][0],
    id: namespaceId,
    preview_id: namespaceId,
  };

  writeToml(config);
}

function updateToml(nestedKey: string, value: string) {
  const config = getToml();
  const keys = nestedKey.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  writeToml(config);
}

function writeKV(id: string, env: Env, value: string) {
  const namespaceId = getNamespace(id, env).id;
  const previewId = getPreview(id, env).id;

  const cmd = `kv:key put --namespace-id=${namespaceId} gitInfo '${value}'`;
  if (debug) {
    console.log('value', value);
    console.log(`\n`);
    console.log('namespaces', getNamespaces(env));
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
  const res = executeWranglerCommand(cmd, env);
  console.log(res);
}
