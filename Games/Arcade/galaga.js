import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Строка под экраном (как в Snake.js)
const statusLine = document.getElementById("game-status");
statusLine.textContent = "";

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = false;

// Игрок
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    dx: 0,
    lives: 3
};

// Снаряды игрока
let bullets = [];

// Враги
let enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
let enemySpeed = 1;

// Вражеские пули
let enemyBullets = [];

// Счёт
let score = 0;
let gameOver = false;

// ===== Создание врагов =====
function createEnemies() {
    enemies = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            enemies.push({
                x: 50 + c * 40,
                y: 50 + r * 40,
                width: enemyWidth,
                height: enemyHeight,
                dx: enemySpeed,
                alive: true,
                shootCooldown: Math.floor(Math.random() * 200) + 100
            });
        }
    }
}
createEnemies();

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) player.dx = -5;
    if (["d", "в"].includes(key)) player.dx = 5;
    if (key === " ") shoot();
});

document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф", "d", "в"].includes(key)) player.dx = 0;
});

// ===== Управление телефоном =====
let touchX = null;

canvas.addEventListener("touchstart", e => {
    touchX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
    if (touchX !== null) {
        const delta = e.touches[0].clientX - touchX;
        player.x += delta;

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        touchX = e.touches[0].clientX;
    }
});

canvas.addEventListener("touchend", () => {
    shoot();
    touchX = null;
});

// ===== Функции =====
function shoot() {
    bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10 });
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

function update() {
    if (gameOver) return;

    // Движение игрока
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Снаряды игрока
    bullets.forEach(b => b.y -= 7);
    bullets = bullets.filter(b => b.y > 0);

    // Враги
    enemies.forEach(e => {
        if (!e.alive) return;

        e.x += e.dx;

        if (e.x + e.width > canvas.width || e.x < 0)
            e.dx *= -1;

        e.y += 0.2;

        e.shootCooldown--;
        if (e.shootCooldown <= 0) {
            enemyShoot(e);
            e.shootCooldown = Math.floor(Math.random() * 200) + 100;
        }
    });

    // Пули врагов
    enemyBullets.forEach(b => b.y += b.dy);
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

    // Попадание по врагам
    bullets.forEach((b, bi) => {
        enemies.forEach(e => {
            if (e.alive &&
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y) {

                e.alive = false;
                bullets.splice(bi, 1);
                score += 10;
            }
        });
    });

    // Попадание по игроку
    enemyBullets.forEach((b, bi) => {
        if (b.x < player.x + player.width &&
            b.x + b.width > player.x &&
            b.y < player.y + player.height &&
            b.y + b.height > player.y) {

            enemyBullets.splice(bi, 1);
            player.lives--;

            if (player.lives <= 0) {
                gameOver = true;
                saveScore("galaga", score);

                // Вывод под канвасом
                statusLine.textContent = "GAME OVER — ваш счёт: " + score;
            }
        }
    });

    // Новая волна
    if (enemies.every(e => !e.alive)) {
        createEnemies();
        enemySpeed += 0.3;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Игрок
    ctx.fillStyle = "green";
    ctx.shadowColor = "lime";
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.shadowBlur = 0;

    // Пули игрока
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // Враги
    ctx.fillStyle = "red";
    enemies.forEach(e => {
        if (e.alive) {
            ctx.shadowColor = "orange";
            ctx.shadowBlur = 5;
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    });

    ctx.shadowBlur = 0;

    // Пули врагов
    ctx.fillStyle = "white";
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Lives: " + player.lives, canvas.width - 100, 30);
}

// ===== Основной цикл =====
function gameLoop() {
    update();
    draw();
}

// ===== Управление =====
function startGame() {
    if (!gameInterval) {
        gameOver = false;
        player.lives = 3;

        statusLine.textContent = ""; // очистить строку под игрой

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

    saveScore("galaga", score);

    statusLine.textContent = ""; // очистка

    score = 0;
    bullets = [];
    enemyBullets = [];
    enemySpeed = 1;
    player.x = canvas.width / 2 - 20;
    player.dx = 0;
    player.lives = 3;

    createEnemies();
    gameOver = false;

    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
