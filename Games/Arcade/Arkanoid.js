const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

import { saveScore } from "../../scores.js";

let paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, w: 80, h: 10, speed: 6 };
let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, r: 6 }];
let bricks = [];
let bonuses = [];
let rows = 5, cols = 8;
let brickW = 50, brickH = 20, brickPadding = 10, offsetTop = 30, offsetLeft = 30;

let rightPressed = false, leftPressed = false;
let gameRunning = false;
let gamePaused = false;
let gameInterval = null;
let score = 0;

let touchStartX = null;  // Для отслеживания свайпов

// ====== Блокировка/разблокировка скролла ======
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ====== Сообщение об окончании игры ======
function hideGameOverMessage() {
  const message = document.getElementById("gameOverMessage");
  if (message) message.style.display = "none";
}
function showGameOverMessage() {
  const message = document.getElementById("gameOverMessage");
  if (message) {
    message.textContent = "Игра окончена! Очки: " + score;
    message.style.display = "block";
  }
}

// ====== Инициализация кирпичей ======
function initBricks() {
  bricks = [];
  for (let r = 0; r < rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1 };
    }
  }
}
initBricks();

// ====== Управление клавиатурой (W/A) ======
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "d") rightPressed = true;
  if (e.key.toLowerCase() === "a") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key.toLowerCase() === "d") rightPressed = false;
  if (e.key.toLowerCase() === "a") leftPressed = false;
});

// ====== Сенсорное управление (свайпы/тачи) ======
canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
  }
});

canvas.addEventListener("touchmove", e => {
  if (e.touches.length === 1 && touchStartX !== null) {
    const touchX = e.touches[0].clientX;
    const delta = touchX - touchStartX;
    paddle.x += delta;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
    touchStartX = touchX;
  }
});

canvas.addEventListener("touchend", e => {
  touchStartX = null;
});

// ====== Кнопки управления игрой ======
document.getElementById("startBtn")?.addEventListener("click", startGame);
document.getElementById("pauseBtn")?.addEventListener("click", pauseGame);
document.getElementById("restartBtn")?.addEventListener("click", restartGame);

// ====== Перезапуск игры ======
function restartGame() {
  paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, w: 80, h: 10, speed: 6 };
  balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, r: 6 }];
  bonuses = [];
  initBricks();
  score = 0;
  hideGameOverMessage();
  gamePaused = false;
  gameRunning = true;
  safeBlock();
}

// ====== Основная отрисовка ======
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Кирпичи и бонусы
  bricks.forEach((row) => row.forEach(b => { 
    if (b.status === 1) {
      ctx.fillStyle = "#0ff";
      ctx.fillRect(b.x = b.x || b.col * (brickW+brickPadding) + offsetLeft, b.y = b.y || b.row * (brickH+brickPadding) + offsetTop, brickW, brickH);
    }
  }));
  bonuses.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI*2);
    ctx.fill();
  });

  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.dx > canvas.width - ball.r || ball.x + ball.dx < ball.r) ball.dx = -ball.dx;
    if (ball.y + ball.dy < ball.r) ball.dy = -ball.dy;
    else if (ball.y + ball.dy > canvas.height - ball.r) {
      if (ball.x > paddle.x && ball.x < paddle.x + paddle.w) ball.dy = -ball.dy;
      else {
        balls.splice(balls.indexOf(ball), 1);
        if (balls.length === 0) {
          gameRunning = false;
          safeUnblock();
          showGameOverMessage();
          saveScore("arkanoid", score);
        }
      }
    }

    // Коллизия с кирпичами
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let b = bricks[r][c];
        if (b.status === 1 && ball.x > b.x && ball.x < b.x + brickW && ball.y > b.y && ball.y < b.y + brickH) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;
        }
      }
    }
  });

  // Платформа
  ctx.fillStyle = "#0f0";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  if (rightPressed && paddle.x < canvas.width - paddle.w) paddle.x += paddle.speed;
  if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

  // Очки
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Очки: " + score, 10, 25);
}

// ====== Игровой цикл ======
function loop() {
  if (gameRunning && !gamePaused) draw();
  requestAnimationFrame(loop);
}

// ====== Кнопки ======
function startGame() { 
  if (!gameRunning) { 
    restartGame();
  } else { 
    hideGameOverMessage();
    gamePaused = false;
    safeBlock();
  }
}

function pauseGame() { 
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (!gamePaused) safeBlock();
  else safeUnblock();
}

// ====== Глобальные вызовы ======
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ====== Запуск цикла ======
loop();
