const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = Array(9).fill(null);

io.on('connection', (socket) => {
    console.log('Novo jogador conectado');

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
    });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
