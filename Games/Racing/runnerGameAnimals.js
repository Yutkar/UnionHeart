const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 200;

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
    if (typeRand < 0.3) {
        obstacle = { x: canvas.width, y: canvas.height - 40, width: 40, height: 40, type: "stone" };
    } else if (typeRand < 0.6) {
        obstacle = { x: canvas.width, y: canvas.height - 50, width: 50, height: 50, type: "wolf" };
    } else if (typeRand < 0.9) {
        obstacle = { x: canvas.width, y: canvas.height - 45, width: 45, height: 45, type: "fox" };
    } else {
        obstacle = { x: canvas.width, y: 50, width: 50, height: 40, type: "eagle" };
    }
    obstacles.push(obstacle);
}

// ===== Обновление =====
function update() {
    if (isPaused || !gameRunning) return;

    player.dy += GRAVITY;
    player.y += player.dy;

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.width > 0);

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

    score++;
    frameCount++;
    if (frameCount % spawnInterval === 0) spawnObstacle();
    if (score % 500 === 0) speed += 0.5;
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "orange";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    obstacles.forEach(o => {
        switch (o.type) {
            case "stone": ctx.fillStyle = "gray"; break;
            case "wolf": ctx.fillStyle = "brown"; break;
            case "fox": ctx.fillStyle = "red"; break;
            case "eagle": ctx.fillStyle = "black"; break;
        }
        ctx.fillRect(o.x, o.y, o.width, o.height);
    });

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
document.addEventListener("keydown", e => {
    if (e.key === " " && !player.jumping && !isPaused) {
        player.dy = JUMP_STRENGTH;
        player.jumping = true;
    }
});

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

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
