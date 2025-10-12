const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = false;

// Игрок
const player = { x: canvas.width / 2 - 20, y: canvas.height - 60, width: 40, height: 40, dx: 0 };

// Снаряды игрока
let bullets = [];

// Враги
let enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
let enemySpeed = 1;
let frameCount = 0;

// Счёт
let score = 0;
let gameOver = false;

// ===== Создание волн врагов =====
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
                alive: true
            });
        }
    }
}
createEnemies();

// ===== Управление ПК (ЦЫФВ / WASD + пробел) =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) player.dx = -4;
    if (["d", "в"].includes(key)) player.dx = 4;
    if (key === " ") shoot();
});
document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф", "d", "в"].includes(key)) player.dx = 0;
});

// ===== Управление телефона =====
let startX = 0;
canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});
canvas.addEventListener("touchend", e => {
    let dx = e.changedTouches[0].clientX - startX;
    if (dx > 30) player.x += 40;
    else if (dx < -30) player.x -= 40;
    else shoot();
});

// ===== Функции =====
function shoot() {
    bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10 });
}

function update() {
    if (gameOver) return;

    frameCount++;

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    bullets.forEach(b => b.y -= 5);
    bullets = bullets.filter(b => b.y > 0);

    enemies.forEach(e => {
        if (!e.alive) return;
        e.x += e.dx;
        if (e.x + e.width > canvas.width || e.x < 0) e.dx *= -1;
        e.y += 0.2;
    });

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

    enemies.forEach(e => {
        if (e.alive && e.y + e.height >= player.y) {
            gameOver = true;
        }
    });

    if (enemies.every(e => !e.alive)) {
        createEnemies();
        enemySpeed += 0.2;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    ctx.fillStyle = "red";
    enemies.forEach(e => {
        if (e.alive) ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    }
}

// ===== Основной цикл =====
function gameLoop() {
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
    bullets = [];
    enemySpeed = 1;
    player.x = canvas.width / 2 - 20;
    player.dx = 0;
    createEnemies();
    gameOver = false;
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

