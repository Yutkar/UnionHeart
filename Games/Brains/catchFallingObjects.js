const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = false;

// Игрок (корзина)
const player = { x: canvas.width / 2 - 30, y: canvas.height - 50, width: 60, height: 20, dx: 0 };

// Падающие предметы
let objects = [];
const objectWidth = 20;
const objectHeight = 20;
let objectSpeed = 3;

// Счёт
let score = 0;
let gameOver = false;

// ===== Управление ПК (ЦЫФВ / WASD + стрелки) =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key) || e.key === "ArrowLeft") player.dx = -5;
    if (["d", "в"].includes(key) || e.key === "ArrowRight") player.dx = 5;
});
document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф", "d", "в"].includes(key) || e.key === "ArrowLeft" || e.key === "ArrowRight") player.dx = 0;
});

// ===== Управление телефона =====
let startX = 0;
canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});
canvas.addEventListener("touchmove", e => {
    const x = e.touches[0].clientX;
    player.x = x - player.width / 2;
});
canvas.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 30) player.x += 20;
    else if (dx < -30) player.x -= 20;
});

// ===== Создание новых объектов =====
function spawnObject() {
    const x = Math.random() * (canvas.width - objectWidth);
    objects.push({ x: x, y: -objectHeight, width: objectWidth, height: objectHeight });
}

// ===== Обновление =====
function update() {
    if (gameOver) return;

    player.x += player.dx;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    objects.forEach(o => o.y += objectSpeed);

    for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        if (
            o.y + o.height >= player.y &&
            o.x < player.x + player.width &&
            o.x + o.width > player.x
        ) {
            score++;
            objects.splice(i, 1);
        } else if (o.y > canvas.height) {
            objects.splice(i, 1);
        }
    }

    if (score % 10 === 0 && score > 0) objectSpeed = 3 + Math.floor(score / 10);
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "red";
    objects.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Основной цикл =====
let frameCount = 0;
function gameLoop() {
    frameCount++;
    if (frameCount % 50 === 0) spawnObject();
    update();
    draw();
}

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        gameOver = false;
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
    objectSpeed = 3;
    objects = [];
    frameCount = 0;
    player.x = canvas.width / 2 - 30;
    player.dx = 0;
    gameOver = false;
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Автозапуск =====
startGame();
