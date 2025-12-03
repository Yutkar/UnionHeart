import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

let gameInterval = null;
let isPaused = false;
let gameRunning = false;
let gameOver = false;

// ===== Вспомогательные функции =====
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

function hideGameOverMessage() {
    const m = document.getElementById("gameOverMessage");
    if (m) m.style.display = "none";
}

// ===== Прицел =====
const crosshair = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 12,
    speed: 6
};

// ===== Цели =====
let targets = [];
const targetWidth = 40;
const targetHeight = 40;
let targetSpeed = 2;

// ===== Очки =====
let score = 0;

// ===== Эффекты попадания =====
let hitEffects = [];

// ===== Создание цели =====
function spawnTarget() {
    const y = Math.random() * (canvas.height - targetHeight - 30);
    const direction = Math.random() < 0.5 ? 1 : -1;
    const x = direction === 1 ? -targetWidth : canvas.width;

    targets.push({
        x,
        y,
        width: targetWidth,
        height: targetHeight,
        dx: direction * (targetSpeed + Math.random() * 2),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });
}

// ===== Обновление =====
function update() {
    if (gameOver) return;

    // движение целей
    targets.forEach(t => t.x += t.dx);
    targets = targets.filter(t => t.x + t.width > 0 && t.x < canvas.width);

    // эффекты попадания
    hitEffects.forEach(e => e.alpha -= 0.05);
    hitEffects = hitEffects.filter(e => e.alpha > 0);
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // фон
    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // прицел
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crosshair.x - crosshair.size, crosshair.y);
    ctx.lineTo(crosshair.x + crosshair.size, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - crosshair.size);
    ctx.lineTo(crosshair.x, crosshair.y + crosshair.size);
    ctx.stroke();

    // цели
    targets.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.fillRect(t.x, t.y, t.width, t.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(t.x, t.y, t.width, t.height);
    });

    // эффекты попадания
    hitEffects.forEach(e => {
        ctx.fillStyle = `rgba(255, 0, 0, ${e.alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // счёт на canvas
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Выстрел =====
function shoot() {
    let hit = false;

    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];

        if (
            crosshair.x > t.x &&
            crosshair.x < t.x + t.width &&
            crosshair.y > t.y &&
            crosshair.y < t.y + t.height
        ) {
            // попадание
            score++;
            hitEffects.push({ x: crosshair.x, y: crosshair.y, size: 15, alpha: 1 });
            targets.splice(i, 1);
            hit = true;
        }
    }

    if (!hit) {
        score = Math.max(0, score - 1); // промах — минус очко
    }
}

// ===== Управление клавиатурой =====
const keys = {};

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") shoot();
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// ===== Движение прицела =====
function moveCrosshair() {
    if (keys["w"] || keys["ц"]) crosshair.y -= crosshair.speed;
    if (keys["s"] || keys["ы"]) crosshair.y += crosshair.speed;
    if (keys["a"] || keys["ф"]) crosshair.x -= crosshair.speed;
    if (keys["d"] || keys["в"]) crosshair.x += crosshair.speed;

    // ограничения
    crosshair.x = Math.max(crosshair.size, Math.min(canvas.width - crosshair.size, crosshair.x));
    crosshair.y = Math.max(crosshair.size, Math.min(canvas.height - crosshair.size, crosshair.y));
}

// ===== Основной цикл =====
let frameCount = 0;

function gameLoop() {
    frameCount++;
    if (frameCount % 50 === 0) spawnTarget(); // частый спавн

    moveCrosshair();
    update();
    draw();
}

// ===== Управление — старт/пауза/рестарт =====
function startGame() {
    hideGameOverMessage();

    if (gameInterval && !isPaused) return;

    gameRunning = true;
    gameOver = false;
    isPaused = false;

    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 30);
    safeBlock();
}

function pauseGame() {
    if (!gameInterval) return;

    if (isPaused) {
        startGame();
        return;
    }

    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = true;
    safeUnblock();
}

function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;

    isPaused = false;
    gameRunning = false;
    gameOver = false;

    score = 0;
    targets = [];
    hitEffects = [];
    frameCount = 0;

    hideGameOverMessage();
    startGame();
}

// ===== Завершение игры =====
function endGame() {
    clearInterval(gameInterval);
    gameInterval = null;

    gameOver = true;
    isPaused = false;
    gameRunning = false;

    saveScore("shootingGallery", score);

    const message = document.getElementById("gameOverMessage");
    if (message) {
        message.textContent = "Игра окончена! Очки: " + score;
        message.style.display = "block";
    }

    safeUnblock();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
window.endGame = endGame;
