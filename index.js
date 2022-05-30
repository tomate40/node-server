import { Server } from "socket.io";
import { createServer } from "http";
const httpServer = createServer();

import { initGame, gameLoop, getUpdatedVelocity } from "./game.js";
import { FRAME_RATE } from "./constants.js";
import { makeid } from "./utils.js";

const io = new Server(httpServer, {
	allowEIO3: true,
  cors: {
    origin: "https://multiplayer-snake.fromage50.repl.co",
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const state = {};
const clientRooms = {};

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];
		console.log(room);
		console.log("hello");

    let allUsers;
    if (room) {
      allUsers = room.sockets;
			console.log(allUsers);
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    // if (numClients === 0) {
    //   client.emit('unknownCode');
    //   return;
    // } else if (numClients > 1) {
    //   client.emit('tooManyPlayers');
    //   return;
    // }

    clientRooms[client.id] = roomName;

    console.log(client.join(roomName));
    client.number = 2;
    client.emit('init', 2);
    
    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

		console.log(client);
    console.log(client.join(roomName));
		console.log(roomName);
    client.number = 1;
    client.emit('init', 1);
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    
    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(3000, () => {
	console.log("listening")
});
