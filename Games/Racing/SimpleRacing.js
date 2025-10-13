const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const laneWidth = 100;
const obstacleWidth = 50;
const obstacleHeight = 50;

let car = { x: canvas.width / 2 - 25, y: canvas.height - 80, width: 50, height: 80 };
let obstacles = [];
let score = 0;
let frameCount = 0;
let gameOver = false;
let gameRunning = false;
let isPaused = false;

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (["a", "ф"].includes(key)) {
        // Влево
        car.x = Math.max(0, car.x - laneWidth);
    }
    if (["d", "в"].includes(key)) {
        // Вправо
        car.x = Math.min(canvas.width - car.width, car.x + laneWidth);
    }
});


// ===== Управление телефона =====
let startX = 0;
canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});
canvas.addEventListener("touchend", e => {
    if (isPaused || gameOver) return;
    let dx = e.changedTouches[0].clientX - startX;
    if (dx > 30 && car.x + car.width < canvas.width) car.x += laneWidth;
    else if (dx < -30 && car.x > 0) car.x -= laneWidth;
});

// ===== Создание препятствий =====
function createObstacle() {
    let lane = Math.floor(Math.random() * (canvas.width / laneWidth));
    obstacles.push({
        x: lane * laneWidth + (laneWidth - obstacleWidth) / 2,
        y: -obstacleHeight
    });
}

// ===== Логика =====
function update() {
    if (isPaused || !gameRunning) return;

    frameCount++;
    if (frameCount % 90 === 0) createObstacle();

    obstacles.forEach(o => o.y += 5);

    obstacles = obstacles.filter(o => {
        if (o.y > canvas.height) {
            score++;
            return false;
        }
        return true;
    });

    obstacles.forEach(o => {
        if (
            car.x < o.x + obstacleWidth &&
            car.x + car.width > o.x &&
            car.y < o.y + obstacleHeight &&
            car.y + car.height > o.y
        ) {
            gameOver = true;
            gameRunning = false;
        }
    });
}

// ===== Отрисовка =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    for (let i = 1; i < canvas.width / laneWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }

    ctx.fillStyle = "red";
    ctx.fillRect(car.x, car.y, car.width, car.height);

    ctx.fillStyle = "black";
    obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, obstacleWidth, obstacleHeight);
    });

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    if (gameOver) {
        ctx.fillStyle = "yellow";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    }
}

// ===== Игровой цикл =====
function gameLoop() {
    update();
    draw();
    if (gameRunning) requestAnimationFrame(gameLoop);
}

// ===== Управление игрой =====
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
    obstacles = [];
    score = 0;
    frameCount = 0;
    car.x = canvas.width / 2 - 25;
    gameOver = false;
    gameRunning = true;
    isPaused = false;
    requestAnimationFrame(gameLoop);
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Автозапуск =====
startGame();

