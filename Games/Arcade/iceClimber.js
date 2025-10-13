const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = false;

// Игрок
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    dx: 0,
    dy: 0,
    jumping: false
};

const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;

// Платформы
let platforms = [];
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 10;

// Генерация платформ
function generatePlatforms() {
    platforms = [];
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        const y = canvas.height - i * 60;
        platforms.push({ x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT });
    }
}

// ===== Движение игрока =====
function updatePlayer() {
    player.dy += GRAVITY;
    player.y += player.dy;
    player.x += player.dx;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    platforms.forEach(p => {
        if (
            player.dy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + player.dy
        ) {
            player.y = p.y - player.height;
            player.dy = 0;
            player.jumping = false;
        }
    });

    if (player.y > canvas.height) {
        alert("Game Over! Вы достигли уровня: " + score);
        score = 0;
        player.x = canvas.width / 2 - 20;
        player.y = canvas.height - 50;
        player.dy = 0;
        generatePlatforms();
    }
}

// ===== Движение платформ вверх =====
let score = 0;
function updatePlatforms() {
    if (player.y < canvas.height / 2) {
        const dy = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        platforms.forEach(p => p.y += dy);
        score += Math.floor(dy);
    }

    platforms.forEach(p => {
        if (p.y > canvas.height) {
            p.y = 0;
            p.x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        }
    });
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "brown";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Управление (ЦЫФВ / WASD + пробел) =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) player.dx = -5;
    if (["d", "в"].includes(key)) player.dx = 5;
    if (key === " " && !player.jumping) {
        player.dy = JUMP_STRENGTH;
        player.jumping = true;
    }
});
document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф", "d", "в"].includes(key)) player.dx = 0;
});

// ===== Основной цикл =====
function gameLoop() {
    updatePlayer();
    updatePlatforms();
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
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 50;
    player.dx = 0;
    player.dy = 0;
    player.jumping = false;
    generatePlatforms();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Инициализация =====
generatePlatforms();
gameLoop();


