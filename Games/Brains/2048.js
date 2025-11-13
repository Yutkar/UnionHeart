const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRID = 6;
canvas.width = 480;
canvas.height = 480;
const SIZE = canvas.width / GRID;

let board = Array.from({ length: GRID }, () => Array(GRID).fill(0));
let score = 0;
let gameOver = false;
let gameInterval = null;
let isPaused = false;

// ===== Отрисовка =====
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#bbada0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            drawTile(r, c);
        }
    }

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 120, canvas.height / 2);
    }
}

function drawTile(r, c) {
    const val = board[r][c];
    ctx.fillStyle = val === 0 ? "#cdc1b4" : "#f2b179";
    ctx.fillRect(c * SIZE + 5, r * SIZE + 5, SIZE - 10, SIZE - 10);

    if (val !== 0) {
        ctx.fillStyle = "black";
        ctx.font = `${SIZE / 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(val, c * SIZE + SIZE / 2, r * SIZE + SIZE / 2);
    }
}

// ===== Логика движения =====
function slide(row) {
    let arr = row.filter(val => val);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(val => val);
    while (arr.length < GRID) arr.push(0);
    return arr;
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < GRID; r++) {
        const newRow = slide(board[r]);
        if (!moved) moved = newRow.some((val, i) => val !== board[r][i]);
        board[r] = newRow;
    }
    if (moved) addTile();
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < GRID; r++) {
        const newRow = slide(board[r].slice().reverse()).reverse();
        if (!moved) moved = newRow.some((val, i) => val !== board[r][i]);
        board[r] = newRow;
    }
    if (moved) addTile();
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < GRID; c++) {
        const col = [];
        for (let r = 0; r < GRID; r++) col.push(board[r][c]);
        const newCol = slide(col);
        for (let r = 0; r < GRID; r++) {
            if (!moved && board[r][c] !== newCol[r]) moved = true;
            board[r][c] = newCol[r];
        }
    }
    if (moved) addTile();
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < GRID; c++) {
        const col = [];
        for (let r = 0; r < GRID; r++) col.push(board[r][c]);
        const newCol = slide(col.reverse()).reverse();
        for (let r = 0; r < GRID; r++) {
            if (!moved && board[r][c] !== newCol[r]) moved = true;
            board[r][c] = newCol[r];
        }
    }
    if (moved) addTile();
}

// ===== Добавление новой плитки =====
function addTile() {
    let empty = [];
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (board[r][c] === 0) empty.push({ r, c });
        }
    }
    if (empty.length === 0) {
        gameOver = true;
        return;
    }
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ===== Проверка возможности хода =====
function canMove() {
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (board[r][c] === 0) return true;
            if (c < GRID - 1 && board[r][c] === board[r][c + 1]) return true;
            if (r < GRID - 1 && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    if (gameOver) return;
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowRight") moveRight();
    if (e.key === "ArrowUp") moveUp();
    if (e.key === "ArrowDown") moveDown();
    if (!canMove()) gameOver = true;
    drawBoard();
});

// ===== Управление телефоном (свайпы) =====
let startX = 0, startY = 0;
canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) moveRight();
        else if (dx < -30) moveLeft();
    } else {
        if (dy > 30) moveDown();
        else if (dy < -30) moveUp();
    }
    if (!canMove()) gameOver = true;
    drawBoard();
});

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(drawBoard, 100);
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(drawBoard, 100);
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
    score = 0;
    gameOver = false;
    board = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    addTile();
    addTile();
    drawBoard();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Инициализация =====
addTile();
addTile();
drawBoard();
