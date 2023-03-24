import toml from 'toml';
import json2toml from 'json2toml';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { getToml, writeToml, command };

function command(cmd): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
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
