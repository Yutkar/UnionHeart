const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const bubbleRadius = 20;
const cols = 10;
const rows = 12;
const colors = ["red", "green", "blue", "yellow", "purple"];

let grid = [];
let gameInterval = null;
let isPaused = false;
let score = 0;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  angle: -Math.PI / 2
};

let bullet = null;
let shooting = false;
let currentBubble = { color: colors[Math.floor(Math.random() * colors.length)] };

// ===== Инициализация поля =====
function initGrid() {
  grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        color: Math.random() < 0.8 ? colors[Math.floor(Math.random() * colors.length)] : null
      });
    }
    grid.push(row);
  }
}
initGrid();

// ===== Отрисовка =====
function drawGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bubble = grid[r][c];
      if (bubble.color) {
        const x = c * bubbleRadius * 2 + bubbleRadius;
        const y = r * bubbleRadius * 2 + bubbleRadius;
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(x, y, bubbleRadius - 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = currentBubble.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, bubbleRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * 50, player.y + Math.sin(player.angle) * 50);
  ctx.stroke();
}

function drawBullet() {
  if (shooting && bullet) {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bubbleRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Очки: " + score, 10, 25);
}

// ===== Функции =====
function shootBubble() {
  if (!shooting) {
    const speed = 6;
    bullet = {
      x: player.x,
      y: player.y,
      dx: Math.cos(player.angle) * speed,
      dy: Math.sin(player.angle) * speed,
      color: currentBubble.color
    };
    shooting = true;
    currentBubble.color = colors[Math.floor(Math.random() * colors.length)];
  }
}

function updateBullet() {
  if (!shooting || !bullet) return;

  bullet.x += bullet.dx;
  bullet.y += bullet.dy;

  // Отражение от стен
  if (bullet.x - bubbleRadius < 0 || bullet.x + bubbleRadius > canvas.width) bullet.dx *= -1;

  // Проверяем столкновение с верхом
  if (bullet.y - bubbleRadius < 0) {
    attachBubble(bullet.x, bullet.y, bullet.color);
    shooting = false;
    bullet = null;
    return;
  }

  // Проверяем столкновение с пузырями
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bubble = grid[r][c];
      if (bubble.color) {
        const bx = c * bubbleRadius * 2 + bubbleRadius;
        const by = r * bubbleRadius * 2 + bubbleRadius;
        const dist = Math.hypot(bullet.x - bx, bullet.y - by);
        if (dist < bubbleRadius * 2 - 2) {
          attachBubble(bullet.x, bullet.y, bullet.color);
          shooting = false;
          bullet = null;
          return;
        }
      }
    }
  }
}

// ===== Прикрепление пузыря =====
function attachBubble(x, y, color) {
  const c = Math.round((x - bubbleRadius) / (bubbleRadius * 2));
  const r = Math.round((y - bubbleRadius) / (bubbleRadius * 2));

  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (grid[r][c].color) return;

  grid[r][c].color = color;
  checkForMatches(r, c, color);
}

// ===== Проверка совпадений =====
function checkForMatches(row, col, color) {
  const toCheck = [[row, col]];
  const matched = new Set();

  while (toCheck.length > 0) {
    const [r, c] = toCheck.pop();
    const key = `${r},${c}`;
    if (matched.has(key)) continue;
    if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
    const bubble = grid[r][c];
    if (bubble.color !== color) continue;

    matched.add(key);
    toCheck.push([r + 1, c]);
    toCheck.push([r - 1, c]);
    toCheck.push([r, c + 1]);
    toCheck.push([r, c - 1]);
  }

  if (matched.size >= 3) {
    matched.forEach(k => {
      const [r, c] = k.split(",").map(Number);
      grid[r][c].color = null;
    });
    score += matched.size * 10;
  }
}

// ===== Основной цикл =====
function draw() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawPlayer();
  drawBullet();
  drawScore();
}

function gameLoop() {
  updateBullet();
  draw();
}

// ===== Управление =====
document.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  player.angle = Math.atan2(my - player.y, mx - player.x);
});

document.addEventListener("keydown", e => {
  if (e.key === " ") shootBubble();
  if (e.key === "ArrowLeft") player.angle -= 0.1;
  if (e.key === "ArrowRight") player.angle += 0.1;
});

canvas.addEventListener("click", shootBubble);

// ===== Управление игрой =====
function startGame() {
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 30);
  isPaused = false;
}

function pauseGame() {
  if (isPaused) {
    gameInterval = setInterval(gameLoop, 30);
    isPaused = false;
  } else {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = true;
  }
}

function restartGame() {
  clearInterval(gameInterval);
  isPaused = false;
  score = 0;
  shooting = false;
  bullet = null;
  initGrid();
  startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
