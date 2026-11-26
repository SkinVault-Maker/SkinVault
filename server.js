
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("Skinvault Multiplayer działa!");
});

const rooms = {};

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  socket.on("createRoom", (name, callback) => {
    const code = makeCode();

    rooms[code] = {
      players: [{ id: socket.id, name: String(name).slice(0, 20) }],
      started: false
    };

    socket.join(code);
    callback({ success: true, code });
  });

  socket.on("joinRoom", ({ code, name }, callback) => {
    const room = rooms[String(code).toUpperCase()];

    if (!room) return callback({ error: "Nie znaleziono pokoju" });
    if (room.players.length >= 4) return callback({ error: "Pokój jest pełny" });
    if (room.started) return callback({ error: "Gra już się rozpoczęła" });

    room.players.push({
      id: socket.id,
      name: String(name).slice(0, 20)
    });

    socket.join(String(code).toUpperCase());
    io.to(String(code).toUpperCase()).emit("players", room.players);
    callback({ success: true });
  });

  socket.on("disconnect", () => {
    for (const [code, room] of Object.entries(rooms)) {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[code];
      } else {
        io.to(code).emit("players", room.players);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Skinvault Multiplayer działa na porcie " + PORT);
});
                 
