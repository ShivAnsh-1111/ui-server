const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js'); // Import chess.js library

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://on-chess-ui.vercel.app", // or your React app's origin
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Store game state for each socket (or room)
const gameStates = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Initialize a new game state for the socket
  gameStates[socket.id] = new Chess();

  socket.on('move', (move) => {
    console.log('Received move:', move);

    const game = gameStates[socket.id];
    const chessMove = { from: move.from, to: move.to, promotion: move.promotion }; // Include promotion if needed

    try {
      const result = game.move(chessMove);

      if (result) {
        io.emit('move', move); // Broadcast valid move
        console.log('Valid move. Updated board:', game.fen()); // Log the updated board state
      } else {
        socket.emit('invalidMove', { error: 'Invalid move' });
        console.log('Invalid move attempt:', move);
      }
    } catch (error) {
      socket.emit('invalidMove', { error: error.message || 'Invalid move' });
      console.error('Error during move:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete gameStates[socket.id]; // Remove game state on disconnect
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});