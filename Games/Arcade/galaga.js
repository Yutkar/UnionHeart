// Games/Arcade/galaga.js
import { saveScore } from "../../scores.js";

window.addEventListener("DOMContentLoaded", () => {

/* ----------------- Elements & canvas ----------------- */
const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas #game not found");
const ctx = canvas.getContext("2d");

// Ensure a score element under the canvas (if not present, create it)
let scoreElement = document.getElementById("galagaScore");
if (!scoreElement) {
  scoreElement = document.createElement("div");
  scoreElement.id = "galagaScore";
  scoreElement.style.marginTop = "8px";
  scoreElement.style.fontFamily = "Arial, sans-serif";
  scoreElement.style.color = "#fff";

  canvas.insertAdjacentElement("afterend", scoreElement);
}

const statusElement = document.getElementById("gameOverMessage");

/* ----------------- Game constants & state ----------------- */
canvas.width = 400;
canvas.height = 400;

let gameInterval = null;
let isPaused = false;

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  dx: 0,
  lives: 3
};

let bullets = [];
let enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
let enemySpeed = 1;

let enemyBullets = [];

let score = 0;
let gameOver = false;

/* ----------------- Helpers ----------------- */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ----------------- Enemies ----------------- */
function createEnemies() {
  enemies = [];
  const cols = 8;
  const rows = 3;
  const startX = 30;
  const startY = 40;
  const gapX = 40;
  const gapY = 36;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * gapX,
        y: startY + r * gapY,
        width: enemyWidth,
        height: enemyHeight,
        dx: enemySpeed,
        alive: true,
        shootCooldown: Math.floor(Math.random() * 200) + 80
      });
    }
  }
}

createEnemies();

/* ----------------- Input (keyboard) ----------------- */
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (key === "a" || key === "ф") player.dx = -5;
  if (key === "d" || key === "в") player.dx = 5;
  if (e.code === "Space") {
    e.preventDefault();
    shoot();
  }
});
document.addEventListener("keyup", e => {
  const key = e.key.toLowerCase();
  if (["a", "ф", "d", "в"].includes(key)) player.dx = 0;
});

/* ----------------- Touch controls ----------------- */
let touchX = null;
let touchStartTime = 0;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touchX = t.clientX;
  touchStartTime = Date.now();
}, { passive: true });

canvas.addEventListener("touchmove", e => {
  if (touchX === null) return;
  const t = e.touches[0];

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;

  const dx = (t.clientX - touchX) * scaleX;
  player.x += dx;

  player.x = clamp(player.x, 0, canvas.width - player.width);
  touchX = t.clientX;
}, { passive: true });

canvas.addEventListener("touchend", e => {
  const dt = Date.now() - touchStartTime;

  if (dt < 200) shoot();
  touchX = null;
}, { passive: true });

/* ----------------- Shooting ----------------- */
function shoot() {
  if (gameOver) return;

  bullets.push({
    x: player.x + player.width / 2 - 2.5,
    y: player.y,
    width: 5,
    height: 10,
    dy: -8
  });
}

function enemyShoot(e) {
  enemyBullets.push({
    x: e.x + e.width / 2 - 2.5,
    y: e.y + e.height,
    width: 5,
    height: 10,
    dy: 4
  });
}

/* ----------------- Update & Draw ----------------- */
function update() {
  if (gameOver || isPaused) return;

  player.x += player.dx;
  player.x = clamp(player.x, 0, canvas.width - player.width);

  bullets.forEach(b => b.y += b.dy);
  bullets = bullets.filter(b => b.y + b.height > 0);

  enemies.forEach(e => {
    if (!e.alive) return;

    e.x += e.dx;

    if (e.x + e.width > canvas.width) {
      e.x = canvas.width - e.width;
      e.dx = -Math.abs(e.dx);
      e.y += 6;
    } else if (e.x < 0) {
      e.x = 0;
      e.dx = Math.abs(e.dx);
      e.y += 6;
    } else {
      e.y += 0.02;
    }

    e.shootCooldown--;
    if (e.shootCooldown <= 0) {
      enemyShoot(e);
      e.shootCooldown = Math.floor(Math.random() * 200) + 80;
    }
  });

  enemyBullets.forEach(b => b.y += b.dy);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (!e.alive) return;

      if (b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y) {

        e.alive = false;
        b._remove = true;
        score += 10;
      }
    });
  });

  bullets = bullets.filter(b => !b._remove);

  enemyBullets.forEach(b => {
    if (b.x < player.x + player.width &&
        b.x + b.width > player.x &&
        b.y < player.y + player.height &&
        b.y + b.height > player.y) {
      b._remove = true;
      player.lives--;

      if (player.lives <= 0) {
        onGameOver();
      }
    }
  });

  enemyBullets = enemyBullets.filter(b => !b._remove);

  if (enemies.every(e => !e.alive)) {
    enemySpeed += 0.3;
    createEnemies();
    enemies.forEach(e => e.dx = Math.sign(e.dx || 1) * enemySpeed);
  }

  scoreElement.textContent = "Score: " + score;
}

/* ----------------- Game over handling ----------------- */
function onGameOver() {
  gameOver = true;
  saveScore("galaga", score);

  statusElement.style.display = "block";
  statusElement.textContent = "GAME OVER — ваш счёт: " + score;

  stopLoop();
}

/* ----------------- Drawing ----------------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.fillStyle = "#33cc33";
  ctx.shadowColor = "lime";
  ctx.shadowBlur = 10;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.restore();

  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  enemies.forEach(e => {
    if (!e.alive) return;

    ctx.save();
    ctx.fillStyle = "#e74c3c";
    ctx.shadowColor = "orange";
    ctx.shadowBlur = 4;
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.restore();
  });

  ctx.fillStyle = "#fff";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

/* ----------------- Loop ----------------- */
function gameLoop() {
  update();
  draw();
}

/* ----------------- Game controls ----------------- */
function startLoop() {
  if (statusElement) {
    statusElement.style.display = "none";
    statusElement.textContent = "";
  }
  gameOver = false;
  isPaused = false;
  if (!gameInterval) gameInterval = setInterval(gameLoop, 30);
}

function stopLoop() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
}

function pauseGame() {
  if (isPaused) {
    isPaused = false;
    startLoop();
  } else {
    isPaused = true;
    stopLoop();
  }
}

function restartGame() {
  stopLoop();

  score = 0;
  bullets = [];
  enemyBullets = [];
  enemySpeed = 1;
  player.x = canvas.width / 2 - 20;
  player.lives = 3;
  gameOver = false;
  isPaused = false;

  scoreElement.textContent = "Score: 0";
  statusElement.style.display = "none";

  createEnemies();
  startLoop();
}

/* ----------------- Bind buttons ----------------- */
document.getElementById("startBtn")?.addEventListener("click", startLoop);
document.getElementById("pauseBtn")?.addEventListener("click", pauseGame);
document.getElementById("restartBtn")?.addEventListener("click", restartGame);

/* ----------------- Init ----------------- */
scoreElement.textContent = "Score: 0";
statusElement.style.display = "none";

}); // DOMContentLoaded END
