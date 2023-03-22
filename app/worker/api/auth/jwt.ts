import { Env } from '../../types';
import { logLevel } from '../../util';
import { Jwt, Key, ValidateJWT, WellKnownResponse } from '../types';
import { cacheResponse } from '../../util';
import { RequestHandler } from '../RequestHandler';

export { isValidJwt };

const FILE_LOG_LEVEL = 'debug';

async function isValidJwt(
  request: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
): Promise<ValidateJWT> {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.jwt.isValidJwt');
  }
  const encodedToken = getJwt(request, env);
  if (encodedToken === 'null') {
    return {
      valid: false,
      status: 401,
      payload: { error: 'No Authorization header' },
    };
  }

  if (encodedToken === 'format') {
    return {
      valid: false,
      status: 400,
      payload: { error: 'Bad token format' },
    };
  }

  const token = decodeJwt(encodedToken, env);

  let expiryDate = new Date(token.payload.exp * 1000);
  let currentDate = new Date(Date.now());
  if (expiryDate <= currentDate) {
    return { valid: false, status: 401 };
  }

  const valid = await isValidJwtSignature(token, env, ctx);
  return { valid, payload: token.payload, status: 200 };
}

function _atob(data) {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

function getJwt(request: Request, env: Env) {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.getJwt');
    // console.log(JSON.stringify(request, null, 2));
  }
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return 'null';
  }

  if (authHeader.substring(0, 6) !== 'Bearer') {
    return 'format';
  }

  if (!authHeader.includes('.')) return 'format';

  if (authHeader.split('.').length !== 3) return 'format';

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`worker.getting.headers: ${authHeader.slice(0, 15)}...`);
  }
  return authHeader.substring(6).trim();
}

function jwtPadding(part: string) {
  const paddingLength = part.length % 4;
  if (paddingLength !== 0) {
    part += '='.repeat(4 - paddingLength);
  }
  return part;
}

function jwtPaddingSwitch(part: string) {
  part = part.replace(/_/g, '/').replace(/-/g, '+');
  switch (part.length % 4) {
    case 0:
      break;
    case 2:
      part += '==';
      break;
    case 3:
      part += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  return part;
}

function decodeJwt(token: any, env: Env): Jwt {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.decodeJwt');
    console.log('worker.getting.headers');
  }

  const [rawHeader, rawPayload, rawSignature] = token.split('.');

  const header = _atob(rawHeader); // JSON.parse(atob(parts[0]));
  const payload = _atob(rawPayload); // JSON.parse(atob(parts[1]));

  // add padding if necessary
  for (let part of [rawHeader, rawPayload, rawSignature]) {
    part = jwtPaddingSwitch(part);
  }
  // replace base64url characters
  const signature = Buffer.from(
    rawSignature.replace(/_/g, '/').replace(/-/g, '+'),
    'base64',
  ).toString('binary'); // binary was the crucial change to make this match // atob(parts[2].replace(/_/g, "/").replace(/-/g, "+"));

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`decoding token: ${token.slice(0, 7)}...\n`);
    console.log(
      `header: ${JSON.stringify(header)}\npayload: ${JSON.stringify(
        { ...payload, signature: signature.slice(0, 16) },
        null,
        2,
      )}\n`,
    );
  }

  return {
    header: header,
    payload: payload,
    signature: signature,
    raw: { header: rawHeader, payload: rawPayload, signature: rawSignature },
  };
}

async function isValidJwtSignature(
  token: Jwt,
  env: Env,
  ctx: ExecutionContext,
) {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.isValidJwtSignature');
    const logToken = {
      ...token,
      signature: token.signature.slice(0, 16),
      raw: {
        header: token.raw.header.slice(0, 7),
        payload: token.raw.payload.slice(0, 7),
        signature: token.raw.signature.slice(0, 16),
      },
    };
    console.log(
      `validating token signature - token:  ${JSON.stringify(
        logToken,
        null,
        2,
      )}\n`,
    );
  }
  const encoder = new TextEncoder();
  const encoded = encoder.encode(
    [token.raw.header, token.raw.payload].join('.'),
  );
  const signature = new Uint8Array(
    Array.from(token.signature).map((c: any) => c.charCodeAt(0)),
  );
  const dataReq = new Request(
    `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  );
  const data = await cacheResponse(dataReq, env, ctx, {
    cacheTTL: 60 * 60 * 24,
  });
  const { keys }: WellKnownResponse = await data.json();
  const { kid } = JSON.parse(
    Buffer.from(token.raw.header, 'base64').toString(),
  );
  const jwk = keys.find((key) => key.kid === kid);

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`importing key: \n`);
    const logKeys = (keys: Key[]) =>
      keys.map((key) => {
        return {
          ...key,
          n: key.n.slice(0, 16),
          e: key.e,
          x5c: [key.x5c[0].slice(0, 16)],
        };
      });
    console.log(`encoded: ${encoded.slice(0, 35)}\n`);
    console.log(`signature: ${signature.slice(0, 35)}\n`);
    console.log(`keys: ${JSON.stringify(logKeys(keys), null, 2)}\n`);
    console.log(`kid: ${kid}\n`);
    console.log(`jwk: ${JSON.stringify(logKeys([jwk]), null, 2)}\n`);
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`verifying signature: \n`);
    console.log(`key: ${JSON.stringify(key, null, 2)}\n`);
  }
  const res = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    encoded,
  );
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`signature verify response: ${res}\n`);
  }
  return res;
}

function base64urlDecode(encoded: string): Uint8Array {
  // add padding if necessary
  const paddingLength = encoded.length % 4;
  if (paddingLength !== 0) {
    encoded += '='.repeat(4 - paddingLength);
  }
  // replace base64url characters
  encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  // decode base64 string
  const decoded = _atob(encoded);
  // convert string to Uint8Array
  return new Uint8Array(decoded.split('').map((c) => c.charCodeAt(0)));
}

function decodeHeader(encoded: string): Record<string, unknown> {
  const decoded = base64urlDecode(encoded);
  const headerString = new TextDecoder().decode(decoded);
  return JSON.parse(headerString);
}

const jwtDecode = function (jwt, env) {
  function b64DecodeUnicode(str) {
    return decodeURIComponent(
      atob(str).replace(/(.)/g, function (m, p) {
        let code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
          code = '0' + code;
        }
        return '%' + code;
      }),
    );
  }

  function decode(str) {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw 'Illegal base64url string!';
    }

    try {
      return JSON.parse(b64DecodeUnicode(output));
    } catch (err) {
      return atob(output);
    }
  }

  const jwtArray = jwt.split('.');

  return {
    header: decode(jwtArray[0]),
    payload: decode(jwtArray[1]),
    signature: decode(jwtArray[2]),
    raw: { header: jwtArray[0], payload: jwtArray[1], signature: jwtArray[2] },
  };
};

// further reading:
// https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings

// https://stackoverflow.com/a/58907605/12658653
// function b64DecodeUnicode(str) {
//   return decodeURIComponent(
//     atob(str).replace(/(.)/g, function (m, p) {
//       const code = p.charCodeAt(0).toString(16).toUpperCase();
//       if (code.length < 2) {
//         code = "0" + code;
//       }
//       return "%" + code;
//     })
//   );
// }
// ...
