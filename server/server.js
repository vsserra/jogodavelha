const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = Array(9).fill(null);
let players = {};
let playerSockets = [];

io.on('connection', (socket) => {
    console.log('Novo jogador conectado');

    socket.on('startGame', ({ player1, player2 }) => {
        if (playerSockets.length < 2) {
            players[socket.id] = playerSockets.length === 0 ? 'X' : 'O';
            playerSockets.push(socket.id);
        }

        if (playerSockets.length === 2) {
            const XId = playerSockets[0];
            const OId = playerSockets[1];
            io.emit('gameStarted', { player1, player2, XId, OId });
        }
    });

    socket.on('makeMove', ({ cellIndex, player }) => {
        if (gameState[cellIndex] === null) {
            gameState[cellIndex] = player;
            io.emit('moveMade', { cellIndex, player });
        }
    });

    socket.on('restartGame', () => {
        gameState = Array(9).fill(null);
        io.emit('gameRestarted');
    });

    socket.on('disconnect', () => {
        console.log('Jogador desconectado');
        playerSockets = playerSockets.filter(id => id !== socket.id);
        delete players[socket.id];
    });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
