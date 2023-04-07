import http from "http";
import { corsOpts, useCors } from "../worker/util";
const { preflight, corsify } = useCors(corsOpts);
export { preflight, corsify };
import dotenv from "dotenv";

dotenv.config();
const HOST: string = process.env.HOST || "localhost";
const PORT: number = parseInt(process.env.PORT || "3333");
const { Api: api } = await import(`../worker/api.${process.env.API_VERSION}`);

const mapHttpHeaders = (headers: http.IncomingHttpHeaders): HeadersInit => {
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

const server = http.createServer(async (req, res) => {
  if (req.url) {
    const apiReq = new Request(new URL(req.url, "http://" + req.headers.host), {
      method: req.method,
      headers: mapHttpHeaders(req.headers),
      // body: req.read(),
    });

    //   console.log(`
    // ${new Date().toLocaleTimeString()}
    // START -> ${req.method} -> ${req.url}
    // `);
    const resp = await api
      .handle(apiReq, res, process.env)
      .catch((err) => new Response(err.message, { status: 500 }));

    if (!resp) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    const incomingHeaders = Array.from(resp.headers.entries()) as any;

    res.writeHead(resp.status, resp.statusText, incomingHeaders);
    res.end((await resp.text()) + "\n");

    res.on("finish", () => {
      console.log(`
  ${new Date().toLocaleTimeString()}
  END STATUS -> ${res.statusCode} -> ${
        req.url
      }\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    `);
      if (
        res.statusCode === 403 &&
        res.getHeader("Access-Control-Allow-Origin") === undefined
      ) {
        console.log("status.403.corsify");
        corsify(resp);
      }
    });
  }
});

server.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EADDRINUSE") {
    console.log("Address in use, retrying...");
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);
  }
  console.error(e);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
