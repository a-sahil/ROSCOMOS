const { WebSocketServer } = require("ws");
const { logger } = require("./utils/logger");

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  const clients = new Map();

  wss.on("connection", (ws, req) => {
    const id = Date.now().toString();
    clients.set(id, ws);
    logger.info(`WS client connected [${id}]`);
    ws.on("close", () => { clients.delete(id); logger.info(`WS client disconnected [${id}]`); });
    ws.on("error", e => logger.error(`WS error [${id}]:`, e));
  });

  const broadcast = (event, data) => {
    const msg = JSON.stringify({ event, data, ts: Date.now() });
    clients.forEach((ws, id) => {
      if (ws.readyState === ws.OPEN) ws.send(msg);
      else clients.delete(id);
    });
  };

  return { broadcast };
};

module.exports = { setupWebSocket };
