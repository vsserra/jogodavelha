document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const cells = document.querySelectorAll('.cell');
    const messageElement = document.getElementById('message');
    const restartButton = document.getElementById('restart');
    const startGameButton = document.getElementById('start-game');
    const playerForm = document.getElementById('player-form');
    const scoreboard = document.getElementById('scoreboard');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const confirmPlayer1Button = document.getElementById('confirm-player1');
    const confirmPlayer2Button = document.getElementById('confirm-player2');
    const statusPlayer1 = document.getElementById('status-player1');
    const statusPlayer2 = document.getElementById('status-player2');
    const scorePlayer1 = document.getElementById('score-player1');
    const scorePlayer2 = document.getElementById('score-player2');

    let isXTurn = true;
    let gameActive = true;
    let gameState = Array(9).fill(null);
    let players = {};
    let scores = { player1: 0, player2: 0 };
    let currentPlayer = '';

    const handleCellClick = (event) => {
        const cell = event.target;
        const cellIndex = parseInt(cell.getAttribute('data-index'));

        if (gameState[cellIndex] !== null || !gameActive || currentPlayer !== socket.id) {
            return;
        }

        socket.emit('makeMove', { cellIndex, player: isXTurn ? 'X' : 'O' });
    };

    socket.on('moveMade', ({ cellIndex, player }) => {
        gameState[cellIndex] = player;
        cells[cellIndex].textContent = player;

        if (checkWinner()) {
            gameActive = false;
            messageElement.textContent = `Jogador ${players[player]} venceu!`;
            scores[player === 'X' ? 'player1' : 'player2']++;
            updateScoreboard();
        } else if (gameState.every(cell => cell !== null)) {
            gameActive = false;
            messageElement.textContent = 'Empate!';
        } else {
            isXTurn = !isXTurn;
            currentPlayer = isXTurn ? players.XId : players.OId;
            messageElement.textContent = `Vez do jogador ${players[isXTurn ? 'X' : 'O']}`;
        }
    });

    const checkWinner = () => {
        const winningConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];
        return winningConditions.some(condition => {
            const [a, b, c] = condition;
            return gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c];
        });
    };

    const restartGame = () => {
        socket.emit('restartGame');
    };

    socket.on('gameRestarted', () => {
        isXTurn = true;
        gameActive = true;
        gameState = Array(9).fill(null);
        cells.forEach(cell => (cell.textContent = ''));
        messageElement.textContent = `Vez do jogador ${players['X']}`;
        currentPlayer = players['XId'];
    });

    const confirmPlayer = (playerNumber) => {
        const playerName = playerNumber === 'player1' ? player1Input.value : player2Input.value;

        if (!playerName) {
            alert('Por favor, insira um nome.');
            return;
        }

        socket.emit('confirmPlayer', { playerNumber, playerName });
    };

    socket.on('playerConfirmed', ({ playerNumber, playerName, socketId }) => {
        if (playerNumber === 'player1') {
            players['X'] = playerName;
            players['XId'] = socketId;
            statusPlayer1.textContent = 'Confirmado';
            statusPlayer1.style.color = 'green';
            confirmPlayer1Button.disabled = true;
            player1Input.disabled = true;
        } else {
            players['O'] = playerName;
            players['OId'] = socketId;
            statusPlayer2.textContent = 'Confirmado';
            statusPlayer2.style.color = 'green';
            confirmPlayer2Button.disabled = true;
            player2Input.disabled = true;
        }

        if (players['X'] && players['O']) {
            startGameButton.disabled = false;
        }
    });

    const startGame = () => {
        if (!players['X'] || !players['O']) {
            alert('Os dois jogadores precisam confirmar seus nomes.');
            return;
        }

        socket.emit('startGame', { players });
    };

    socket.on('gameStarted', ({ players }) => {
        scorePlayer1.textContent = `${players['X']}: ${scores.player1} vitórias`;
        scorePlayer2.textContent = `${players['O']}: ${scores.player2} vitórias`;
        playerForm.style.display = 'none';
        scoreboard.style.display = 'block';
        restartGame();
    });

    const updateScoreboard = () => {
        scorePlayer1.textContent = `${players['X']}: ${scores.player1} vitórias`;
        scorePlayer2.textContent = `${players['O']}: ${scores.player2} vitórias`;
    };

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);
    confirmPlayer1Button.addEventListener('click', () => confirmPlayer('player1'));
    confirmPlayer2Button.addEventListener('click', () => confirmPlayer('player2'));
    startGameButton.addEventListener('click', startGame);
});
