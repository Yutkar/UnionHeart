const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, w: 80, h: 10, speed: 6 };
let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, r: 6 }];
let bricks = [];
let bonuses = [];
let rows = 5, cols = 8;
let brickW = 50, brickH = 20, brickPadding = 10, offsetTop = 30, offsetLeft = 30;

let rightPressed = false, leftPressed = false;
let gameRunning = false;
let gamePaused = false;
let score = 0;

// ====== Блокировка/разблокировка скролла ======
function safeBlock() { document.body.style.overflow = 'hidden'; }
function safeUnblock() { document.body.style.overflow = ''; }

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

// ====== Управление ======
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

// Сенсорное управление (телефон)
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

leftBtn?.addEventListener("touchstart", e => { e.preventDefault(); leftPressed = true; });
leftBtn?.addEventListener("touchend", e => { e.preventDefault(); leftPressed = false; });
rightBtn?.addEventListener("touchstart", e => { e.preventDefault(); rightPressed = true; });
rightBtn?.addEventListener("touchend", e => { e.preventDefault(); rightPressed = false; });

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

// ====== Рисуем кирпичи ======
function drawBricks() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let b = bricks[r][c];
      if (b.status === 1) {
        let brickX = c * (brickW + brickPadding) + offsetLeft;
        let brickY = r * (brickH + brickPadding) + offsetTop;
        b.x = brickX; b.y = brickY;
        ctx.fillStyle = "#0ff";
        ctx.fillRect(brickX, brickY, brickW, brickH);
      }
    }
  }
}

// ====== Рисуем бонусы ======
function drawBonuses() {
  bonuses.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateBonuses() {
  bonuses.forEach((b, i) => {
    b.y += 2;
    if (b.y > paddle.y && b.y < paddle.y + paddle.h &&
        b.x > paddle.x && b.x < paddle.x + paddle.w) {
      applyBonus(b.type);
      bonuses.splice(i, 1);
    } else if (b.y > canvas.height) {
      bonuses.splice(i, 1);
    }
  });
}

function applyBonus(type) {
  switch (type) {
    case "expand": paddle.w += 30; break;
    case "slow": balls.forEach(ball => { ball.dx *= 0.7; ball.dy *= 0.7; }); break;
    case "fast": balls.forEach(ball => { ball.dx *= 1.3; ball.dy *= 1.3; }); break;
    case "multi": balls.push({ ...balls[0], dx: -balls[0].dx }); break;
  }
}

// ====== Основная отрисовка ======
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBonuses();

  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
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
          if (Math.random() < 0.3) {
            const types = ["expand","slow","fast","multi"];
            const type = types[Math.floor(Math.random()*types.length)];
            bonuses.push({ x: b.x + brickW/2, y: b.y, type, color: type==="expand"?"#0f0":type==="slow"?"#00f":type==="fast"?"#f00":"#ff0" });
          }
        }
      }
    }
  });

  ctx.fillStyle = "#0f0";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  if (rightPressed && paddle.x < canvas.width - paddle.w) paddle.x += paddle.speed;
  if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

  updateBonuses();

  // Очки всегда сверху слева
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
