import { saveScore } from "../../scores.js"; // если нужна запись очков

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
const COLORS = [null, "cyan","blue","orange","yellow","green","purple","red"];
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

let current = createPiece();
let next = createPiece();
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let score = 0;
let gameOver = false;
let isPaused = false;
let gameInterval;

// ====== Вспомогательные функции ======
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

function hideGameOverMessage() {
  const message = document.getElementById("gameOverMessage");
  if (message) message.style.display = "none";
}

function showScore() {
  const message = document.getElementById("gameOverMessage");
  if (message) {
    message.textContent = "Очки: " + score;
    message.style.display = "block";
  }
}

// ====== Создание фигуры ======
function createPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  return {
    shape: SHAPES[type].map(r => [...r]),
    color: COLORS[type],
    x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
    y: 0
  };
}

// ====== Отрисовка ======
function draw() {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(current, { x: current.x, y: current.y });
}

function drawMatrix(matrix, offset) {
  const shape = matrix.shape ? matrix.shape : matrix;
  shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "#111";
        ctx.strokeRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });
}

// ====== Логика игры ======
function merge(board, piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) board[y + piece.y][x + piece.x] = value;
    });
  });
}

function collide(board, piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] &&
         (board[y + piece.y] && board[y + piece.y][x + piece.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = matrix[y][x];
    }
  }
  return rotated;
}

function playerDrop() {
  current.y++;
  if (collide(board, current)) {
    current.y--;
    merge(board, current);
    sweep();
    current = next;
    next = createPiece();
    if (collide(board, current)) gameOver = true;
  }
  dropCounter = 0;
}

function sweep() {
  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0) continue outer;
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    score += 10;
    y++;
  }
}

// ====== Игровой цикл через setInterval ======
function drawGame() {
  if (gameOver) return;
  const now = performance.now();
  const deltaTime = now - lastTime;
  lastTime = now;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) playerDrop();
  draw();
  showScore();
}

// ====== Управление ======
document.addEventListener("keydown", (e) => {
  if (gameOver || isPaused) return;

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a" || e.key === "ф") {
    current.x--;
    if (collide(board, current)) current.x++;
  }
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d" || e.key === "в") {
    current.x++;
    if (collide(board, current)) current.x--;
  }
  if (e.key === "ArrowDown" || e.key.toLowerCase() === "s" || e.key === "ы") {
    playerDrop();
  }
  if (e.key === " " || e.key === "ArrowUp") {
    const rotated = rotate(current.shape);
    const oldShape = current.shape;
    current.shape = rotated;
    if (collide(board, current)) current.shape = oldShape;
  }
});

// ====== Игровые функции для кнопок ======
function startGame() {
  hideGameOverMessage();
  if (gameInterval && !isPaused) return;

  if (isPaused) {
    gameInterval = setInterval(drawGame, 50);
    isPaused = false;
    safeBlock();
    return;
  }

  if (!gameInterval) {
    gameInterval = setInterval(drawGame, 50);
    isPaused = false;
    safeBlock();
  }
}

function pauseGame() {
  if (isPaused) {
    gameInterval = setInterval(drawGame, 50);
    isPaused = false;
    safeBlock();
  } else {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = true;
    safeUnblock();
  }
}

function restartGame() {
  clearInterval(gameInterval);
  gameInterval = null;
  isPaused = false;
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  current = createPiece();
  next = createPiece();
  score = 0;
  gameOver = false;
  hideGameOverMessage();
  safeBlock();
  startGame();
}

// ====== Свайпы для мобильных ======
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", e => {
  if (gameOver || isPaused) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) { current.x++; if (collide(board,current)) current.x--; }
    else { current.x--; if (collide(board,current)) current.x++; }
  } else {
    if (dy > 0) playerDrop();
    else {
      const rotated = rotate(current.shape);
      const oldShape = current.shape;
      current.shape = rotated;
      if (collide(board,current)) current.shape = oldShape;
    }
  }
});

// ====== Глобальный доступ ======
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ====== Изначально вывод очков ======
showScore();
