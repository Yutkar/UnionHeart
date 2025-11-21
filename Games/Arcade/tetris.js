import { scrollBlock } from "../../gameControls.js";

// ===== НАСТРОЙКА CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

// ===== ФОН =====
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#26233a");
    grad.addColorStop(1, "#1a1826");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ===== СЕТКА =====
function drawGrid() {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let x = 0; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK, 0);
        ctx.lineTo(x * BLOCK, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK);
        ctx.lineTo(canvas.width, y * BLOCK);
        ctx.stroke();
    }
}

// ===== ПОЛЕ =====
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const COLORS = [
    null,
    "#00f0f0", // I
    "#0000f0", // J
    "#f0a000", // L
    "#f0f000", // O
    "#00f000", // S
    "#a000f0", // T
    "#f00000"  // Z
];

const SHAPES = [
    [],
    [[1,1,1,1]],
    [[2,0,0],[2,2,2]],
    [[0,0,3],[3,3,3]],
    [[4,4],[4,4]],
    [[0,5,5],[5,5,0]],
    [[0,6,0],[6,6,6]],
    [[7,7,0],[0,7,7]]
];

// ===== ФИГУРА =====
function createPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    return {
        shape: SHAPES[type].map(r => [...r]),
        color: COLORS[type],
        x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
        y: 0
    };
}

let current = createPiece();
let next = createPiece();
let score = 0;
let level = 1;
let clearedLines = 0;

let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let isPaused = false;
let gameOver = false;

// ===== ТЕНЬ-ФАНТОМ =====
function getGhost() {
    const ghost = JSON.parse(JSON.stringify(current));
    while (!collide(board, ghost)) ghost.y++;
    ghost.y--;
    return ghost;
}

// ===== ОТРИСОВКА =====
function drawBlock(x, y, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    ctx.globalAlpha = 1;
}

function drawMatrix(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((v, x) => {
            if (v) drawBlock(x + piece.x, y + piece.y, COLORS[v]);
        });
    });
}

function drawGhostPiece() {
    const g = getGhost();
    g.shape.forEach((row, y) => {
        row.forEach((v, x) => {
            if (v) drawBlock(x + g.x, y + g.y, COLORS[v], 0.2);
        });
    });
}

function draw() {
    drawBackground();
    drawGrid();

    drawGhostPiece();
    drawMatrix(current);

    // поле
    board.forEach((row, y) => {
        row.forEach((v, x) => {
            if (v) drawBlock(x, y, COLORS[v]);
        });
    });

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Очки: ${score}`, 10, 25);
    ctx.fillText(`Уровень: ${level}`, 10, 45);
}

// ===== КОЛЛИЗИИ =====
function collide(board, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (
                piece.shape[y][x] &&
                (board[piece.y + y] &&
                 board[piece.y + y][piece.x + x]) !== 0
            ) return true;
        }
    }
    return false;
}

function merge(board, p) {
    p.shape.forEach((row, y) =>
        row.forEach((v, x) => {
            if (v) board[p.y + y][p.x + x] = v;
        })
    );
}

// ===== ОЧИСТКА ЛИНИЙ =====
function sweep() {
    let lines = 0;

    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) continue outer;
        }
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        score += 10;
        lines++;
        y++;
    }

    clearedLines += lines;

    if (clearedLines >= 12) {
        clearedLines = 0;
        level++;
        dropInterval = Math.max(200, dropInterval - 80);
    }
}

// ===== ОБНОВЛЕНИЕ =====
function update(time = 0) {
    if (isPaused || gameOver) return;

    const dt = time - lastTime;
    dropCounter += dt;
    lastTime = time;

    if (dropCounter > dropInterval) drop();

    draw();
    requestAnimationFrame(update);
}

function drop() {
    current.y++;
    if (collide(board, current)) {
        current.y--;
        merge(board, current);
        sweep();
        current = next;
        next = createPiece();

        if (collide(board, current)) {
            gameOver = true;
            scrollBlock.unblock();
            return;
        }
    }
    dropCounter = 0;
}

// ===== УПРАВЛЕНИЕ КЛАВИАТУРОЙ =====
document.addEventListener("keydown", e => {
    if (gameOver) return;

    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
    if (e.key === "ArrowDown") drop();
    if (e.key === " " || e.key === "ArrowUp") rotate();
});

function move(dir) {
    current.x += dir;
    if (collide(board, current)) current.x -= dir;
}

function rotate() {
    const old = current.shape;
    current.shape = old[0].map((_, i) => old.map(r => r[i]).reverse());
    if (collide(board, current)) current.shape = old;
}

// ===== СВАЙПЫ =====
let sx = 0, sy = 0;

canvas.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
});

canvas.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) move(1);
        if (dx < -30) move(-1);
    } else {
        if (dy > 30) drop();
        if (dy < -30) rotate();
    }
});

// ===== КНОПКИ САЙТА =====
function startGame() {
    if (gameOver) restartGame();

    isPaused = false;
    scrollBlock.block();
    lastTime = 0;
    update();
}

function pauseGame() {
    isPaused = true;
    scrollBlock.unblock();
}

function restartGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    current = createPiece();
    next = createPiece();
    score = 0;
    level = 1;
    clearedLines = 0;
    gameOver = false;
    isPaused = false;

    scrollBlock.block();
    update();
}

// ===== ГЛОБАЛЬНО =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// стартовый рендер
draw();
