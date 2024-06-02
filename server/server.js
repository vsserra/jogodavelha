const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = Array(9).fill(null);
let players = {};
let playerAssignments = { X: null, O: null };
let readyPlayers = { player1: false, player2: false };

io.on('connection', (socket) => {
    console.log('Novo jogador conectado');

    socket.on('confirmPlayer', ({ playerNumber, playerName }) => {
        if (playerNumber === 'player1' && !playerAssignments.X) {
            playerAssignments.X = socket.id;
            players[socket.id] = { playerNumber, playerName };
            io.emit('playerConfirmed', { playerNumber, playerName, socketId: socket.id });
        } else if (playerNumber === 'player2' && !playerAssignments.O) {
            playerAssignments.O = socket.id;
            players[socket.id] = { playerNumber, playerName };
            io.emit('playerConfirmed', { playerNumber, playerName, socketId: socket.id });
        }
    });

    socket.on('playerReady', ({ playerNumber }) => {
        readyPlayers[playerNumber] = true;
        io.emit('playerReadyConfirmed', { playerNumber });

        if (readyPlayers.player1 && readyPlayers.player2) {
            io.emit('bothPlayersReady');
        }
    });

    socket.on('startGame', ({ players }) => {
        io.emit('gameStarted', { players });
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
        if (playerAssignments.X === socket.id) {
            playerAssignments.X = null;
        } else if (playerAssignments.O === socket.id) {
            playerAssignments.O = null;
        }
        delete players[socket.id];
        readyPlayers = { player1: false, player2: false };
    });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
