import toml from "toml";
import json2toml from "json2toml";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { getToml, writeToml, command, writeFile, readFile };

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

function getToml(): Record<string, any> {
  try {
    return toml.parse(
      fs.readFileSync(path.join(__dirname, "../../wrangler.toml"), "utf8")
    );
  } catch (error) {
    console.error(error);
  }
}

const writeToml = (data: any) => {
  try {
    fs.writeFileSync(
      path.join(__dirname, "../../wrangler.bak.toml"),
      fs.readFileSync(path.join(__dirname, "../../wrangler.toml"), "utf8")
    );
    // console.log('wrote toml');
    // console.log(data);
    fs.writeFileSync(
      path.join(__dirname, "../../wrangler.toml"),
      json2toml(data)
    );
  } catch (error) {
    console.error(error);
  }
};

const writeFile = async (file: string, data: string) => {
  try {
    await fs.promises.writeFile(file, data);
  } catch (error) {
    console.error(error);
  }
};

const readFile = async (file: string) => {
  try {
    if (fs.existsSync(file)) {
      return await fs.promises.readFile(file, "utf8");
    } else {
      return "";
    }
  } catch (error) {
    console.error(error);
  }
};
