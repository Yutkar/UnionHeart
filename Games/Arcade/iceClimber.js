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
const PLATFORM_HEIGHT = 10;
const PLATFORM_TYPES = ["static", "moving", "breakable"];
const PLATFORM_SPEED = 2;

// ===== Генерация платформ =====
function generatePlatforms() {
    platforms = [];
    for (let i = 0; i < 10; i++) {
        const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
        const width = 40 + Math.random() * 40; // Разные размеры
        const x = Math.random() * (canvas.width - width);
        const y = canvas.height - i * 60;
        const dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;
        platforms.push({ x, y, width, height: PLATFORM_HEIGHT, type, dx, broken: false });
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
        if (!p.broken &&
            player.dy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + player.dy
        ) {
            player.y = p.y - player.height;
            player.dy = 0;
            player.jumping = false;
            if (p.type === "breakable") p.broken = true;
        }
    });

    if (player.y > canvas.height) {
        alert("Game Over! Вы достигли уровня: " + score);
        restartGame();
    }
}

// ===== Движение платформ =====
let score = 0;
function updatePlatforms() {
    if (player.y < canvas.height / 2) {
        const dy = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        platforms.forEach(p => p.y += dy);
        score += Math.floor(dy);
    }

    platforms.forEach(p => {
        if (p.type === "moving") {
            p.x += p.dx;
            if (p.x < 0 || p.x + p.width > canvas.width) p.dx *= -1;
        }
        if (p.y > canvas.height) {
            const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
            const width = 40 + Math.random() * 40;
            p.x = Math.random() * (canvas.width - width);
            p.y = 0;
            p.width = width;
            p.type = type;
            p.dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;
            p.broken = false;
        }
    });
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Игрок
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Платформы
    platforms.forEach(p => {
        if (p.broken) return;
        switch(p.type) {
            case "static": ctx.fillStyle = "brown"; break;
            case "moving": ctx.fillStyle = "green"; break;
            case "breakable": ctx.fillStyle = "red"; break;
        }
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Счет
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Управление клавиатурой =====
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

// ===== Управление наклоном смартфона =====
window.addEventListener("deviceorientation", e => {
    const gamma = e.gamma; // Наклон влево-вправо
    if (gamma !== null) {
        player.dx = gamma / 5; // Делим на 5 чтобы скорость была адекватной
    }
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
