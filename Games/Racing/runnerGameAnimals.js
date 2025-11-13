const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 200;

// ===== Загрузка изображений =====
const images = {};
function loadImages() {
    const sources = {
        player: "images/rabbit.png", // главный герой
        stone: "images/stone.png",   // препятствия
        grass: "images/grass.png",
        eagle: "images/eagle.png"    // враг в небе
    };

    let loaded = 0;
    const total = Object.keys(sources).length;

    return new Promise(resolve => {
        for (let key in sources) {
            images[key] = new Image();
            images[key].src = sources[key];
            images[key].onload = () => {
                loaded++;
                if (loaded === total) resolve();
            };
        }
    });
}

// ===== Игровые объекты =====
const player = { x: 50, y: 150, width: 40, height: 40, dy: 0, jumping: false };
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;

let obstacles = [];
let spawnInterval = 90;
let speed = 5;
let score = 0;
let frameCount = 0;
let isPaused = false;
let gameRunning = false;

// ===== Генерация препятствий =====
function spawnObstacle() {
    const typeRand = Math.random();
    let obstacle = {};
    if (typeRand < 0.4) {
        obstacle = { x: canvas.width, y: canvas.height - 40, width: 40, height: 40, type: "stone" };
    } else if (typeRand < 0.8) {
        obstacle = { x: canvas.width, y: canvas.height - 35, width: 50, height: 35, type: "grass" };
    } else {
        obstacle = { x: canvas.width, y: 50 + Math.random() * 50, width: 50, height: 40, type: "eagle" };
    }
    obstacles.push(obstacle);
}

// ===== Обновление =====
function update() {
    if (isPaused || !gameRunning) return;

    // Гравитация и прыжок
    player.dy += GRAVITY;
    player.y += player.dy;

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    // Движение препятствий
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.width > 0);

    // Проверка столкновений
    for (let o of obstacles) {
        if (
            player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y
        ) {
            alert("Game Over! Score: " + score);
            resetGame();
            return;
        }
    }

    // Постепенное ускорение
    speed += 0.001;

    score++;
    frameCount++;
    if (frameCount % spawnInterval === 0) spawnObstacle();
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Игрок
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

    // Препятствия
    obstacles.forEach(o => {
        switch (o.type) {
            case "stone": ctx.drawImage(images.stone, o.x, o.y, o.width, o.height); break;
            case "grass": ctx.drawImage(images.grass, o.x, o.y, o.width, o.height); break;
            case "eagle": ctx.drawImage(images.eagle, o.x, o.y, o.width, o.height); break;
        }
    });

    // Счёт
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Игровой цикл =====
function gameLoop() {
    update();
    draw();
    if (gameRunning) requestAnimationFrame(gameLoop);
}

// ===== Прыжок =====
function jump() {
    if (!player.jumping && !isPaused) {
        player.dy = JUMP_STRENGTH;
        player.jumping = true;
    }
}

// ===== Сброс =====
function resetGame() {
    obstacles = [];
    player.y = 150;
    player.dy = 0;
    player.jumping = false;
    score = 0;
    speed = 5;
    frameCount = 0;
    isPaused = false;
    gameRunning = false;
    draw();
}

// ===== Управление =====
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        isPaused = false;
        requestAnimationFrame(gameLoop);
    }
}

function pauseGame() {
    isPaused = !isPaused;
    if (!isPaused && gameRunning) requestAnimationFrame(gameLoop);
}

function restartGame() {
    resetGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// ===== События =====
// Клавиатура
document.addEventListener("keydown", e => {
    if (e.key === " ") jump();
});

// Сенсор (для телефонов)
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
}, { passive: false });

canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
canvas.addEventListener("touchend", e => e.preventDefault(), { passive: false });

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Инициализация =====
loadImages().then(() => draw());
