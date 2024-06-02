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

    const startGame = () => {
        const player1 = player1Input.value || 'Jogador 1';
        const player2 = player2Input.value || 'Jogador 2';

        if (!player1 || !player2) {
            alert('Por favor, insira os nomes dos dois jogadores.');
            return;
        }

        socket.emit('startGame', { player1, player2 });
    };

    socket.on('gameStarted', ({ player1, player2, XId, OId }) => {
        players = {
            'X': player1,
            'O': player2,
            'XId': XId,
            'OId': OId
        };
        scorePlayer1.textContent = `${player1}: ${scores.player1} vitórias`;
        scorePlayer2.textContent = `${player2}: ${scores.player2} vitórias`;
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
    startGameButton.addEventListener('click', startGame);
});
