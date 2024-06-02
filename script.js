// public/script.js
const socket = io();

const cells = document.querySelectorAll('.cell');
let currentPlayer = 'X';

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (cell.textContent === '') {
            cell.textContent = currentPlayer;
            socket.emit('move', { index: cell.dataset.index, player: currentPlayer });
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
    });
});

socket.on('move', (data) => {
    cells[data.index].textContent = data.player;
});
