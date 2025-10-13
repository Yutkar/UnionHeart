const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

let gameInterval = null;
let isPaused = false;

// Игрок (прицел)
const crosshair = { x: canvas.width / 2, y: canvas.height / 2, size: 20 };

// Цели
let targets = [];
const targetWidth = 40;
const targetHeight = 40;
let targetSpeed = 2;

// Счёт
let score = 0;
let gameOver = false;

// ===== Создание целей =====
function spawnTarget() {
    const y = Math.random() * (canvas.height - targetHeight - 50);
    const direction = Math.random() < 0.5 ? 1 : -1;
    const x = direction === 1 ? -targetWidth : canvas.width;
    targets.push({ x, y, width: targetWidth, height: targetHeight, dx: direction * targetSpeed });
}

// ===== Обновление =====
function update() {
    if (gameOver) return;

    targets.forEach(t => {
        t.x += t.dx;
    });

    targets = targets.filter(t => t.x + t.width > 0 && t.x < canvas.width);
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // прицел
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(crosshair.x - crosshair.size, crosshair.y);
    ctx.lineTo(crosshair.x + crosshair.size, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - crosshair.size);
    ctx.lineTo(crosshair.x, crosshair.y + crosshair.size);
    ctx.stroke();

    // цели
    ctx.fillStyle = "red";
    targets.forEach(t => ctx.fillRect(t.x, t.y, t.width, t.height));

    // счёт
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Стрельба =====
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (mx > t.x && mx < t.x + t.width && my > t.y && my < t.y + t.height) {
            score++;
            targets.splice(i, 1);
        }
    }
});

// ===== Сенсорный ввод =====
canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.touches[0].clientX - rect.left;
    const my = e.touches[0].clientY - rect.top;

    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (mx > t.x && mx < t.x + t.width && my > t.y && my < t.y + t.height) {
            score++;
            targets.splice(i, 1);
        }
    }
});

// ===== Основной цикл =====
let frameCount = 0;
function gameLoop() {
    frameCount++;
    if (frameCount % 80 === 0) spawnTarget();
    update();
    draw();
}

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(gameLoop, 30);
    }
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
    gameInterval = null;
    isPaused = false;
    score = 0;
    targets = [];
    frameCount = 0;
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Автозапуск =====
startGame();
