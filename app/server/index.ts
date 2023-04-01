import http from "http";
import { Api } from "../worker/api";

const HOST: string = process.env.HOST || "localhost";
const PORT: number = parseInt(process.env.PORT || "3333");

const api = Api;

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
    const resp = await api
      .handle(
        // ******************** 🙋‍♂️ ADAPTER STUFF : START ***********************
        // create a Request (requires node 18+) object from node's IncomingMessage,
        // which can be accepted by itty - router

        new Request(new URL(req.url, "http://" + req.headers.host), {
          // should also map headers, body....
          method: req.method,
          headers: mapHttpHeaders(req.headers),
        })
        // *********************** ADAPTER STUFF : END ***********************
      )
      .catch((err) => new Response(err.message, { status: 500 }));

    // ******************** 🙋‍♂️ ADAPTER STUFF : START ***********************
    // map the Response to node's expected ServerResponse
    if (!resp) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }
    console.log(resp.headers);
    console.log(resp.headers.entries());
    console.log(Array.from(resp.headers.entries()));

    const outGoingHeaders: http.OutgoingHttpHeaders =
      req.method === "GET"
        ? (Array.from(
            resp.headers.entries()
            // ) as any;
          ).concat([["Access-Control-Allow-Origin", "*"]]) as any)
        : (Array.from(resp.headers.entries()) as any);

    console.log(outGoingHeaders);
    console.log(resp.status, resp.statusText);
    // res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(resp.status, resp.statusText, outGoingHeaders);
    res.end((await resp.text()) + "\n");
    // *********************** ADAPTER STUFF : END ***********************
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
