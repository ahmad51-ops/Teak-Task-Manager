import http from "http";
import dns from "dns";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initSocket } from "./sockets/socket.js";

// Render's outbound networking doesn't reliably support IPv6, but
// Node's default DNS resolution can still hand back a dual-stack host's
// IPv6 (AAAA) address first — e.g. Gmail's SMTP servers. The resulting
// connection then fails outright with ENETUNREACH instead of falling
// back to IPv4, before authentication is ever attempted. This makes
// every outbound connection from this process prefer IPv4 when both
// are available, matching what actually works on this host.
dns.setDefaultResultOrder("ipv4first");

const startServer = async () => {
  await connectDB();

  // Socket.io needs the raw http.Server, not the Express app directly —
  // wrapping app in http.createServer gives us one server that handles
  // both regular HTTP requests and the WebSocket upgrade handshake.
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });
};

startServer();
