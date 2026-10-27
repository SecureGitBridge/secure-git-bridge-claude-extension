"use strict";

const net = require("net");
const crypto = require("crypto");

function fail(message = "Secure Git Bridge connection failed.") {
  try {
    process.stderr.write(message + "\n");
  } finally {
    process.exit(1);
  }
}

function decodePairing(value) {
  if (
    typeof value !== "string"
    || value.length < 24
    || value.length > 2048
    || !value.startsWith("sgb1.")
    || !/^sgb1\.[A-Za-z0-9_-]+$/.test(value)
  ) {
    fail("Secure Git Bridge pairing is missing or invalid. Open Secure Git Bridge, choose Claude, and copy a fresh pairing value.");
  }

  const encoded = value.slice(5);
  const base64 =
    encoded.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - (encoded.length % 4)) % 4);

  let decoded;
  try {
    decoded = Buffer.from(base64, "base64").toString("utf8");
  } catch (_) {
    fail();
  }

  if (Buffer.byteLength(decoded, "utf8") > 2048) {
    fail();
  }

  try {
    return JSON.parse(decoded);
  } catch (_) {
    fail();
  }
}

const connection = decodePairing(
  String(process.env.SSGB_CLAUDE_PAIRING || "").trim()
);

const port = Number(connection.port);
const token = String(connection.token || "");
const connectorID = String(connection.connector_id || "");

if (
  connection.v !== 1
  || !Number.isInteger(port)
  || port < 49152
  || port > 65535
  || !/^[0-9a-fA-F]{64}$/.test(token)
  || connection.provider !== "claude"
  || !/^[A-Za-z0-9-]{8,80}$/.test(connectorID)
) {
  fail();
}

const secret = Buffer.from(token, "hex");
const clientNonce = crypto.randomBytes(32);

function tag(domain, serverNonce) {
  const input = Buffer.concat([
    Buffer.from(domain, "utf8"),
    Buffer.from([0]),
    clientNonce,
    serverNonce,
  ]);
  return crypto
    .createHmac("sha256", secret)
    .update(input)
    .digest();
}

const socket = net.connect({
  host: "127.0.0.1",
  port,
});
socket.setTimeout(5000);

let pending = "";
let phase = "server";

function send(frame) {
  socket.write(JSON.stringify(frame) + "\n");
}

function onHandshakeData(chunk) {
  pending += chunk.toString("utf8");
  if (Buffer.byteLength(pending, "utf8") > 8192) {
    fail();
  }

  for (;;) {
    const newline = pending.indexOf("\n");
    if (newline < 0) {
      return;
    }

    const line = pending.slice(0, newline);
    pending = pending.slice(newline + 1);
    if (!line) {
      continue;
    }

    let frame;
    try {
      frame = JSON.parse(line);
    } catch (_) {
      fail();
    }

    if (phase === "server") {
      if (
        frame.v !== 1
        || typeof frame.n !== "string"
        || typeof frame.m !== "string"
        || !/^[0-9a-fA-F]{64}$/.test(frame.n)
        || !/^[0-9a-fA-F]{64}$/.test(frame.m)
      ) {
        fail();
      }

      const serverNonce = Buffer.from(frame.n, "hex");
      const expected = tag(
        "ssgb-broker-v1/server",
        serverNonce
      );
      const serverTag = Buffer.from(frame.m, "hex");

      if (
        expected.length !== serverTag.length
        || !crypto.timingSafeEqual(expected, serverTag)
      ) {
        fail();
      }

      send({
        m: tag(
          "ssgb-broker-v1/client",
          serverNonce
        ).toString("hex"),
      });
      phase = "result";
      continue;
    }

    if (phase === "result") {
      if (frame.ok !== true) {
        fail();
      }

      send({
        v: 1,
        session_id:
          "claude-"
          + connectorID
          + "-"
          + process.pid
          + "-"
          + Date.now()
          + "-"
          + crypto.randomBytes(8).toString("hex"),
      });

      phase = "relay";
      socket.setTimeout(0);
      socket.removeListener("data", onHandshakeData);
      socket.pause();

      if (pending.length > 0) {
        process.stdout.write(pending);
        pending = "";
      }

      process.stdin.pipe(socket);
      socket.pipe(process.stdout);
      socket.resume();
      return;
    }

    fail();
  }
}

socket.on("connect", () => {
  send({
    v: 1,
    n: clientNonce.toString("hex"),
  });
});
socket.on("data", onHandshakeData);
socket.on("timeout", () => fail());
socket.on("error", () => fail());
socket.on("close", () => {
  if (phase !== "relay") {
    process.exit(1);
  }
});
