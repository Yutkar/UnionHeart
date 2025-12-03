// Games/Arcade/galaga.js
import { saveScore } from "../../scores.js";

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
  // Insert after canvas
  canvas.parentNode.insertBefore(scoreElement, canvas.nextSibling);
}

// Use existing gameOverMessage element (HTML already has it)
const statusElement = document.getElementById("gameOverMessage");

/* ----------------- Game constants & state ----------------- */
canvas.width = 400;
canvas.height = 400; // as in your HTML

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
let frameCount = 0;

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
  if (e.code === "Space" || key === " ") {
    e.preventDefault();
    shoot();
  }
});
document.addEventListener("keyup", e => {
  const key = e.key.toLowerCase();
  if (["a", "ф", "d", "в"].includes(key)) player.dx = 0;
});

/* ----------------- Touch controls (mobile) -----------------
   - touchstart: remember X
   - touchmove: move player by delta X
   - touchend: if short tap -> shoot
*/
let touchX = null;
let touchStartTime = 0;
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  if (!t) return;
  touchX = t.clientX;
  touchStartTime = Date.now();
}, { passive: true });

canvas.addEventListener("touchmove", e => {
  if (touchX === null) return;
  const t = e.touches[0];
  if (!t) return;
  const delta = t.clientX - touchX;
  // apply movement; scale if canvas is CSS-scaled
  // compute actual canvas rect to convert client delta -> canvas pixels
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const dx = delta * scaleX;
  player.x += dx;
  player.x = clamp(player.x, 0, canvas.width - player.width);
  touchX = t.clientX;
}, { passive: true });

// on touchend: if quick tap (small movement & short time) -> shoot; else stop moving
canvas.addEventListener("touchend", e => {
  const t = (e.changedTouches && e.changedTouches[0]) || null;
  const dt = Date.now() - touchStartTime;
  // if short tap -> shoot
  if (dt < 220 && (!t || Math.abs((t.clientX || 0) - (touchX || 0)) < 12)) {
    shoot();
  }
  touchX = null;
  touchStartTime = 0;
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
  frameCount++;

  // Move player (keyboard)
  player.x += player.dx;
  player.x = clamp(player.x, 0, canvas.width - player.width);

  // Bullets
  bullets.forEach(b => { b.y += b.dy; });
  bullets = bullets.filter(b => b.y + b.height > 0);

  // Enemies movement & shooting
  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += e.dx;
    // reverse and slightly descend when hitting edge
    if (e.x + e.width > canvas.width) {
      e.x = canvas.width - e.width;
      e.dx = -Math.abs(e.dx);
      e.y += 6;
    } else if (e.x < 0) {
      e.x = 0;
      e.dx = Math.abs(e.dx);
      e.y += 6;
    } else {
      // slight natural descend
      e.y += 0.02;
    }

    e.shootCooldown--;
    if (e.shootCooldown <= 0) {
      enemyShoot(e);
      e.shootCooldown = Math.floor(Math.random() * 200) + 80;
    }
  });

  // Enemy bullets
  enemyBullets.forEach(b => b.y += b.dy);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

  // Player bullets hit enemies
  bullets.forEach((b, bi) => {
    enemies.forEach(e => {
      if (!e.alive) return;
      if (b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y) {
        e.alive = false;
        // remove bullet safely: mark then filter (avoid index issues)
        b._remove = true;
        score += 10;
      }
    });
  });
  bullets = bullets.filter(b => !b._remove);

  // Enemy bullets hit player
  enemyBullets.forEach((b) => {
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

  // Wave finished?
  if (enemies.every(e => !e.alive)) {
    // next wave: increase speed slightly
    enemySpeed += 0.3;
    // recreate enemies but give them initial horizontal speed = enemySpeed sign preserved
    createEnemies();
    enemies.forEach(e => e.dx = Math.sign(e.dx || 1) * enemySpeed);
  }

  // update score element
  if (scoreElement) scoreElement.textContent = "Score: " + score;
}

/* ----------------- Game over handler ----------------- */
function onGameOver() {
  if (gameOver) return;
  gameOver = true;
  // persist score
  try { saveScore("galaga", score); } catch (err) { console.warn("saveScore failed", err); }

  // show message under the canvas
  if (statusElement) {
    statusElement.style.display = "block";
    statusElement.textContent = "GAME OVER — ваш счёт: " + score;
  } else {
    // fallback: create small status element
    const el = document.createElement("p");
    el.id = "gameOverMessage";
    el.textContent = "GAME OVER — ваш счёт: " + score;
    canvas.parentNode.insertBefore(el, canvas.nextSibling);
  }

  // stop the loop (interval will be cleared by caller or we can clear here)
  stopLoop();
}

/* ----------------- Drawing (no "GAME OVER" on canvas) ----------------- */
function draw() {
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#000011";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // player
  ctx.save();
  ctx.fillStyle = "#33cc33";
  ctx.shadowColor = "lime";
  ctx.shadowBlur = 10;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.restore();

  // bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.save();
    ctx.fillStyle = "#e74c3c";
    ctx.shadowColor = "orange";
    ctx.shadowBlur = 4;
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.restore();
  });

  // enemy bullets
  ctx.fillStyle = "#fff";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

/* ----------------- Main loop ----------------- */
function gameLoop() {
  update();
  draw();
}

/* ----------------- Start / Pause / Stop / Restart ----------------- */
function startLoop() {
  if (gameInterval) return;
  // ensure status cleared
  if (statusElement) { statusElement.style.display = "none"; statusElement.textContent = ""; }
  gameOver = false;
  isPaused = false;
  gameInterval = setInterval(gameLoop, 30);
}

function stopLoop() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
}

function pauseGame() {
  if (isPaused) {
    // resume
    isPaused = false;
    if (!gameOver && !gameInterval) startLoop();
  } else {
    // pause
    isPaused = true;
    stopLoop();
  }
}

function restartGame() {
  // stop loop, reset state
  stopLoop();
  score = 0;
  bullets = [];
  enemyBullets = [];
  enemySpeed = 1;
  player.x = canvas.width / 2 - 20;
  player.dx = 0;
  player.lives = 3;
  gameOver = false;
  isPaused = false;

  // reset DOM elements
  if (scoreElement) scoreElement.textContent = "Score: 0";
  if (statusElement) { statusElement.style.display = "none"; statusElement.textContent = ""; }

  createEnemies();
  startLoop();
}

/* ----------------- Buttons binding (from your HTML) ----------------- */
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

if (startBtn) startBtn.addEventListener("click", () => {
  startLoop();
});
if (pauseBtn) pauseBtn.addEventListener("click", () => {
  pauseGame();
});
if (restartBtn) restartBtn.addEventListener("click", () => {
  restartGame();
});

/* ----------------- Init: show score initially, hide status ----------------- */
if (scoreElement) scoreElement.textContent = "Score: " + score;
if (statusElement) {
  statusElement.style.display = "none";
  statusElement.textContent = "";
}

/* ----------------- expose for debug if needed ----------------- */
window.galaga = {
  start: startLoop,
  pause: pauseGame,
  restart: restartGame,
  _state: () => ({ score, player, enemies, bullets, enemyBullets, gameOver, isPaused })
};
