const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 300;
canvas.height = 300;

const SIZE = canvas.width / 3;
let board = Array.from({ length: 3 }, () => Array(3).fill(""));
let currentPlayer = "X";
let gameOver = false;
let gameInterval = null;
let isPaused = false;

// ===== Отрисовка сетки =====
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * SIZE, 0);
        ctx.lineTo(i * SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * SIZE);
        ctx.lineTo(canvas.width, i * SIZE);
        ctx.stroke();
    }

    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] !== "") {
                ctx.fillText(board[r][c], c * SIZE + SIZE / 2, r * SIZE + SIZE / 2);
            }
        }
    }
}

// ===== Проверка победителя =====
function checkWinner() {
    for (let r = 0; r < 3; r++) {
        if (board[r][0] !== "" && board[r][0] === board[r][1] && board[r][1] === board[r][2]) return board[r][0];
    }
    for (let c = 0; c < 3; c++) {
        if (board[0][c] !== "" && board[0][c] === board[1][c] && board[1][c] === board[2][c]) return board[0][c];
    }
    if (board[0][0] !== "" && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
    if (board[0][2] !== "" && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];

    if (board.flat().every(cell => cell !== "")) return "Draw";
    return null;
}

// ===== Ход игрока =====
function makeMove(row, col) {
    if (gameOver || board[row][col] !== "") return;
    board[row][col] = currentPlayer;
    const winner = checkWinner();
    if (winner) {
        gameOver = true;
        setTimeout(() => alert(winner === "Draw" ? "Ничья!" : currentPlayer + " победил!"), 10);
    }
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    drawBoard();
}

// ===== События =====
canvas.addEventListener("click", e => {
    if (isPaused || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / SIZE);
    const row = Math.floor(y / SIZE);
    makeMove(row, col);
});

canvas.addEventListener("touchstart", e => {
    if (isPaused || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const col = Math.floor(x / SIZE);
    const row = Math.floor(y / SIZE);
    makeMove(row, col);
});

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        drawBoard();
        gameInterval = setInterval(() => {}, 1000); // просто для управления паузой
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(() => {}, 1000);
        isPaused = false;
    } else {
        clearInterval(gameInterval);
        gameInterval = null;
        isPaused = true;
    }
}

function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    board = Array.from({ length: 3 }, () => Array(3).fill(""));
    currentPlayer = "X";
    gameOver = false;
    drawBoard();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Инициализация =====
drawBoard();