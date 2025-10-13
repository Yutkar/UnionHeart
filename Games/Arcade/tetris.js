// ===== TETRIS =====

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const COLORS = [
  null,
  "cyan", // I
  "blue", // J
  "orange", // L
  "yellow", // O
  "green", // S
  "purple", // T
  "red" // Z
];

const SHAPES = [
  [],
  [[1, 1, 1, 1]], // I
  [[2, 0, 0], [2, 2, 2]], // J
  [[0, 0, 3], [3, 3, 3]], // L
  [[4, 4], [4, 4]], // O
  [[0, 5, 5], [5, 5, 0]], // S
  [[0, 6, 0], [6, 6, 6]], // T
  [[7, 7, 0], [0, 7, 7]] // Z
];

let current = createPiece();
let next = createPiece();
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let score = 0;
let gameOver = false;
let isPaused = false;

function createPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  return {
    shape: SHAPES[type],
    color: COLORS[type],
    x: Math.floor(COLS / 2) - 1,
    y: 0
  };
}

// ===== Отрисовка =====
function draw() {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(current, { x: current.x, y: current.y });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Очки: " + score, 10, 25);
}

function drawMatrix(matrix, offset) {
  matrix.shape
    ? matrix.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = COLORS[value];
            ctx.fillRect(
              (x + offset.x) * BLOCK_SIZE,
              (y + offset.y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
            ctx.strokeStyle = "#111";
            ctx.strokeRect(
              (x + offset.x) * BLOCK_SIZE,
              (y + offset.y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        });
      })
    : matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            ctx.fillStyle = COLORS[value];
            ctx.fillRect(
              (x + offset.x) * BLOCK_SIZE,
              (y + offset.y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
            ctx.strokeStyle = "#111";
            ctx.strokeRect(
              (x + offset.x) * BLOCK_SIZE,
              (y + offset.y) * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        });
      });
}

// ===== Игровая логика =====
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
      if (
        piece.shape[y][x] &&
        (board[y + piece.y] && board[y + piece.y][x + piece.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[x][N - 1 - y] = matrix[y][x];
    }
  }
  return result;
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

// ===== Управление =====
document.addEventListener("keydown", (e) => {
  if (gameOver || isPaused) return;

  if (e.key === "A" || e.key === "a" || e.key === "ф" || e.key === "Ф") {
    current.x--;
    if (collide(board, current)) current.x++;
  }
  if (e.key === "d" || e.key === "D" || e.key === "В" || e.key === "в") {
    current.x++;
    if (collide(board, current)) current.x--;
  }
  if (e.key === "Ы" || e.key === "ы" || e.key === "S" || e.key === "s") 
    playerDrop();
  if (e.key === " ") {
    const rotated = rotate(current.shape);
    const oldX = current.x;
    current.shape = rotated;
    if (collide(board, current)) current.x = oldX;
  }
});

// ===== Главный цикл =====
function update(time = 0) {
  if (isPaused) return;

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) playerDrop();
  draw();

  if (!gameOver) {
    requestAnimationFrame(update);
  } else {
    ctx.fillStyle = "red";
    ctx.font = "36px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
  }
}

// ===== Управление кнопками =====
function startGame() {
  if (gameOver) {
    restartGame();
    return;
  }
  isPaused = false;
  update();
}

function pauseGame() {
  isPaused = !isPaused;
  if (!isPaused) update();
}

function restartGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  current = createPiece();
  next = createPiece();
  score = 0;
  gameOver = false;
  isPaused = false;
  update();
}

// ===== Для вызова из gameControls.js =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;