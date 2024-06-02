document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const cells = document.querySelectorAll('.cell');
    const messageElement = document.getElementById('message');
    const restartButton = document.getElementById('restart');
    const readyPlayer1Button = document.getElementById('ready-player1');
    const readyPlayer2Button = document.getElementById('ready-player2');
    const playerForm = document.getElementById('player-form');
    const scoreboard = document.getElementById('scoreboard');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const confirmPlayer1Button = document.getElementById('confirm-player1');
    const confirmPlayer2Button = document.getElementById('confirm-player2');
    const statusPlayer1 = document.getElementById('status-player1');
    const statusPlayer2 = document.getElementById('status-player2');
    const countdownElement = document.getElementById('countdown');
    const scorePlayer1 = document.getElementById('score-player1');
    const scorePlayer2 = document.getElementById('score-player2');
    const scoreTies = document.getElementById('score-ties');

    let isXTurn = true;
    let gameActive = true;
    let gameState = Array(9).fill(null);
    let players = {};
    let scores = { player1: 0, player2: 0, ties: 0 };
    let currentPlayer = '';
    let readyPlayers = 0;

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
        cells[cellIndex].innerHTML = `<div>${player}</div>`;

        if (checkWinner()) {
            gameActive = false;
            messageElement.textContent = `Jogador ${players[player]} venceu!`;
            scores[player === 'X' ? 'player1' : 'player2']++;
            updateScoreboard();
        } else if (gameState.every(cell => cell !== null)) {
            gameActive = false;
            messageElement.textContent = 'Empate!';
            scores.ties++;
            updateScoreboard();
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
        cells.forEach(cell => (cell.innerHTML = ''));
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
            statusPlayer1.style.color = 'lightgreen';
            confirmPlayer1Button.disabled = true;
            player1Input.disabled = true;
            readyPlayer1Button.disabled = false;
        } else {
            players['O'] = playerName;
            players['OId'] = socketId;
            statusPlayer2.textContent = 'Confirmado';
            statusPlayer2.style.color = 'lightgreen';
            confirmPlayer2Button.disabled = true;
            player2Input.disabled = true;
            readyPlayer2Button.disabled = false;
        }

        if (socket.id !== socketId) {
            if (playerNumber === 'player1') {
                player2Input.disabled = false;
                confirmPlayer2Button.disabled = false;
            } else {
                player1Input.disabled = false;
                confirmPlayer1Button.disabled = false;
            }
        }

        if (players['X'] && players['O']) {
            player1Input.disabled = true;
            player2Input.disabled = true;
        }
    });

    const playerReady = (playerNumber) => {
        socket.emit('playerReady', { playerNumber });
    };

    socket.on('playerReadyConfirmed', ({ playerNumber }) => {
        readyPlayers++;
        if (playerNumber === 'player1') {
            readyPlayer1Button.disabled = true;
            statusPlayer1.textContent = 'Pronto';
            statusPlayer1.style.color = '#3498db';
        } else {
            readyPlayer2Button.disabled = true;
            statusPlayer2.textContent = 'Pronto';
            statusPlayer2.style.color = '#3498db';
        }

        if (readyPlayers === 2) {
            startCountdown();
        }
    });

    const startCountdown = () => {
        let countdown = 3;
        countdownElement.style.display = 'block';
        const interval = setInterval(() => {
            countdownElement.textContent = countdown;
            countdown--;
            if (countdown < 0) {
                clearInterval(interval);
                countdownElement.style.display = 'none';
                startGame();
            }
        }, 1000);
    };

    const startGame = () => {
        socket.emit('startGame', { players });
    };

    socket.on('gameStarted', ({ players }) => {
        scorePlayer1.textContent = `${players['X']}: ${scores.player1} vitórias`;
        scorePlayer2.textContent = `${players['O']}: ${scores.player2} vitórias`;
        scoreTies.textContent = `Empates: ${scores.ties}`;
        playerForm.style.display = 'none';
        scoreboard.style.display = 'block';
        restartGame();
    });

    const updateScoreboard = () => {
        scorePlayer1.textContent = `${players['X']}: ${scores.player1} vitórias`;
        scorePlayer2.textContent = `${players['O']}: ${scores.player2} vitórias`;
        scoreTies.textContent = `Empates: ${scores.ties}`;
    };

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);
    confirmPlayer1Button.addEventListener('click', () => confirmPlayer('player1'));
    confirmPlayer2Button.addEventListener('click', () => confirmPlayer('player2'));
    readyPlayer1Button.addEventListener('click', () => playerReady('player1'));
    readyPlayer2Button.addEventListener('click', () => playerReady('player2'));
});
