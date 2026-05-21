import * as path from "path";
import * as fs from "fs";

const http = require("http") as typeof import("http");
import { initSocketServer } from "./lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
  if (dev) {
    const { parse } = await import("url");
    const next = (await import("next")).default;
    const app = next({ dev: true, hostname, port });
    await app.prepare();
    const handle = app.getRequestHandler();

    const httpServer = http.createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    initSocketServer(httpServer).catch((err) => {
      console.error("[Socket] init failed", err);
    });

    httpServer
      .once("error", (err) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO listening on path /api/socket`);
      });
  } else {
    const originalCreateServer = http.createServer.bind(http);
    let intercepted = false;

    (http as any).createServer = (...args: any[]) => {
      const server = originalCreateServer(...args);

      if (!intercepted) {
        intercepted = true;
        server.once("listening", () => {
          initSocketServer(server).catch((err) => {
            console.error("[Socket] init failed", err);
          });
          console.log(`> Socket.IO listening on path /api/socket`);
        });
      }

      (http as any).createServer = originalCreateServer;
      return server;
    };

    const dir = path.join(__dirname);
    process.chdir(dir);

    const nextConfig = JSON.parse(
      fs.readFileSync(
        path.join(dir, ".next", "required-server-files.json"),
        "utf8",
      ),
    ).config;

    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

    require("next");
    const { startServer } = require("next/dist/server/lib/start-server");

    await startServer({
      dir,
      isDev: false,
      config: nextConfig,
      hostname,
      port,
      allowRetry: false,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
