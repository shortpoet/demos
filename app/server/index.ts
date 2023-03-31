import http from "http";
import { Api } from "../worker/api";

const HOST: string = process.env.HOST || "localhost";
const PORT: number = parseInt(process.env.PORT || "3333");

const api = Api;
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
    res.writeHead(
      resp.status,
      resp.statusText,
      Array.from(resp.headers.entries())
    );
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
