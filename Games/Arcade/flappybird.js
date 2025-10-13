const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let bird = { x: 80, y: 300, width: 30, height: 30, dy: 0 };
const gravity = 0.5;
const jump = -10;

let pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
let pipeFrequency = 90;
let frameCount = 0;

let score = 0;
let gameOver = false;
let gameInterval = null;
let isPaused = false;

// ===== Управление (ЦЫФВ / WASD / пробел / тап) =====
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (["w", "ц", " "].includes(key)) bird.dy = jump;
});
canvas.addEventListener("touchstart", () => {
  bird.dy = jump;
});

// ===== Создание трубы =====
function createPipe() {
  let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: canvas.height - topHeight - pipeGap,
    width: pipeWidth
  });
}

// ===== Логика =====
function update() {
  if (gameOver) return;

  bird.dy += gravity;
  bird.y += bird.dy;

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    return;
  }

  pipes.forEach(p => p.x -= 2);
  pipes = pipes.filter(p => p.x + p.width > 0);

  frameCount++;
  if (frameCount % pipeFrequency === 0) createPipe();

  pipes.forEach(p => {
    if (bird.x + bird.width > p.x && bird.x < p.x + p.width) {
      if (bird.y < p.top || bird.y + bird.height > canvas.height - p.bottom) {
        endGame();
      }
    }
    if (!p.passed && bird.x > p.x + p.width) {
      score++;
      p.passed = true;
    }
  });
}

// ===== Отрисовка =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "yellow";
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

  ctx.fillStyle = "green";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, p.width, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, p.width, p.bottom);
  });

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Очки: " + score, 10, 30);
}

// ===== Завершение игры =====
function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  gameInterval = null;

  if (gameOver) {
    clearInterval(gameInterval);
    gameInterval = null;

    const gameOverMessage = document.getElementById("gameOverMessage");
    gameOverMessage.textContent = "Игра окончена! Очки: " + score;
    gameOverMessage.style.display = "block";
}

}

// ===== Управление игрой =====
function startGame() {
  clearInterval(gameInterval);
  gameOver = false;
  isPaused = false;
  score = 0;
  pipes = [];
  frameCount = 0;
  bird = { x: 80, y: 300, width: 30, height: 30, dy: 0 };
  createPipe();
  document.getElementById("gameOverMessage").style.display = "none"; // скрываем надпись
  gameInterval = setInterval(gameLoop, 30);
}


  // фон
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // птица
  ctx.fillStyle = "yellow";
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

  // трубы
  ctx.fillStyle = "green";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, p.width, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, p.width, p.bottom);
  });

  // счёт
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Очки: " + score, 10, 30);


// ===== Основной цикл =====
function gameLoop() {
  update();
  draw();
}

// ===== Завершение игры =====
function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  gameInterval = null;
}

// ===== Управление игрой =====
function startGame() {
  // всегда начинаем заново
  clearInterval(gameInterval);
  gameOver = false;
  isPaused = false;
  score = 0;
  pipes = [];
  frameCount = 0;
  bird = { x: 80, y: 300, width: 30, height: 30, dy: 0 };
  createPipe();
  gameInterval = setInterval(gameLoop, 30);
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
  startGame(); // теперь просто вызывает startGame()
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
