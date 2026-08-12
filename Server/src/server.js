import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initSocket } from "./sockets/socket.js";

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
