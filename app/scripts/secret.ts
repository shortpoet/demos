import crypto from 'crypto';
import { command } from './util';

export { writeSecret, generateSecret, passGet, passWrite };

async function writeSecret(key: string, value: string, env: string) {
  console.log(`writing ${key} to ${env}\n`);
  const res = await command(
    `echo ${value} | npx wrangler --env ${env} secret put ${key}`,
  );
  console.log(res + '\n');
}

function generateSecret(length: number) {
  return crypto.randomBytes(length / 2).toString('hex');
}

async function passGet(path: string): Promise<string> {
  return (await command(`pass ${path}`)).trim();
}

async function passWrite(path: string, value: string) {
  return await command(`pass insert -m ${path} << EOF
${value}
EOF`);
}

function generateSecret1(lenth: number) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = lenth; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const getRanHex = (size) => {
  let result = [];
  let hexRef = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ];

  for (let n = 0; n < size; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return result.join('');
};

const genRanHex1 = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');
