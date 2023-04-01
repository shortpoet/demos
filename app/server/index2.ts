import fs from "node:fs";
import http2, { SecureServerOptions, ServerOptions } from "node:http2";
import url, { fileURLToPath } from "node:url";
import querystring from "node:querystring";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Api } from "../worker/api.v1";
import path, { dirname } from "node:path";

const HOST: string = process.env.HOST || "localhost";
const PORT: number = parseInt(process.env.PORT || "3333");

const SECURE_PORT: number = parseInt(process.env.SECURE_PORT || "4443");

const api = Api;

const options = {
  key: fs.readFileSync(path.resolve(__dirname, "server.key.pem")),
  cert: fs.readFileSync(path.resolve(__dirname, "server.crt.pem")),
  allowHTTP1: true,
};

const mapHttpHeaders = (headers: http2.IncomingHttpHeaders): HeadersInit => {
  const mappedHeaders: HeadersInit = {};
  for (const key in headers) {
    if (headers.hasOwnProperty(key)) {
      const value = headers[key];
      if (typeof value === "string") {
        mappedHeaders[key] = value;
      } else if (Array.isArray(value)) {
        mappedHeaders[key] = value.join(",");
      }
    }
  }
  return mappedHeaders;
};

async function onRequest(req, res) {
  // console.log("Incoming request:", req);
  if (req.url) {
    const reqUrl = url.parse(req.url);
    const reqQuery = querystring.parse(reqUrl.query);
    const reqHeaders = req.headers;

    console.log("Incoming request URL:", reqUrl.pathname);
    console.log("Incoming request query:", reqQuery);
    console.log("Incoming request headers:", reqHeaders);

    const {
      socket: { alpnProtocol },
    } = req.httpVersion === "2.0" ? req.stream.session : req;

    console.log("ALPN Protocol:", alpnProtocol);
    const resp = await api
      .handle(
        new Request(new URL(req.url, "https://" + req.headers[":authority"]), {
          method: req.method,
          headers: req.headers,
        })
      )
      .catch((err) => new Response(err.message, { status: 500 }));
    if (!resp) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }
    // console.log("Outgoing respons", resp);
    const respHeaders = resp.headers;
    console.log("Outgoing response headers:", respHeaders);
    // const contentLength = respHeaders.get("content-length");
    // if (contentLength) {
    //   res.setHeader("content-length", contentLength);
    // } else {
    //   res.setHeader("transfer-encoding", "chunked");
    // }

    res.writeHead(resp.status, Array.from(respHeaders));
    const body = await resp.text();
    console.log(`body: ${body}\n`);
    console.log(`END REQ\t\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n`);
    res.end(body + "\n");
  }
}

const server = http2.createSecureServer(options, onRequest);

const o: SecureServerOptions = {
  allowHTTP1: true,
};
// Create insecure server for local development
const insecureServer = http2.createSecureServer(o, onRequest);

// Set up error handling for the server
server.on("error", (err) => {
  console.error(err);
});

insecureServer.on("error", (err) => {
  console.error(err);
});

insecureServer.listen(PORT, HOST, () => {
  console.log(`Insecure Server listening on ${HOST}:${PORT}`);
});

server.listen(SECURE_PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${SECURE_PORT}`);
});
