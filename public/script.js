document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const cells = document.querySelectorAll('.cell');
    const messageElement = document.getElementById('message');
    const restartButton = document.getElementById('restart');
    let isXTurn = true;
    let gameActive = true;
    let gameState = Array(9).fill(null);

    const handleCellClick = (event) => {
        const cell = event.target;
        const cellIndex = parseInt(cell.getAttribute('data-index'));

        if (gameState[cellIndex] !== null || !gameActive) {
            return;
        }

        socket.emit('makeMove', { cellIndex, player: isXTurn ? 'X' : 'O' });
    };

    socket.on('moveMade', ({ cellIndex, player }) => {
        gameState[cellIndex] = player;
        cells[cellIndex].textContent = player;

        if (checkWinner()) {
            gameActive = false;
            messageElement.textContent = `Jogador ${player} venceu!`;
        } else if (gameState.every(cell => cell !== null)) {
            gameActive = false;
            messageElement.textContent = 'Empate!';
        } else {
            isXTurn = !isXTurn;
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
        messageElement.textContent = '';
    });

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);
});
