const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const laneWidth = 100;
const obstacleWidth = 50;
const obstacleHeight = 50;

// ===== Игровые объекты =====
let car = { x: canvas.width / 2 - 25, y: canvas.height - 120, width: 50, height: 100 };
let obstacles = [];
let score = 0;
let frameCount = 0;
let gameOver = false;
let gameRunning = false;
let isPaused = false;

// ===== Скорость =====
let baseSpeed = 5;
let speed = baseSpeed;

// ===== Загрузка изображений =====
const carImage = new Image();
carImage.src = "car.png"; // изображение главной машины

const obstacleImages = ["car1.png", "car2.png", "car3.png"].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) car.x = Math.max(0, car.x - laneWidth);
    if (["d", "в"].includes(key)) car.x = Math.min(canvas.width - car.width, car.x + laneWidth);
});

// ===== Управление телефоном =====
let touchX = null;
let isTouching = false;

canvas.addEventListener("touchstart", e => {
    isTouching = true;
    touchX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
    if (!isTouching || isPaused || gameOver) return;

    let currentX = e.touches[0].clientX;
    let dx = currentX - touchX;

    car.x += dx;

    if (car.x < 0) car.x = 0;
    if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;

    touchX = currentX;
});

canvas.addEventListener("touchend", e => {
    isTouching = false;
    touchX = null;
});

// ===== Создание препятствий =====
function createObstacle() {
    let lane = Math.floor(Math.random() * (canvas.width / laneWidth));
    let img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
    obstacles.push({
        x: lane * laneWidth + (laneWidth - obstacleWidth) / 2,
        y: -obstacleHeight,
        img: img
    });
}

// ===== Логика игры =====
function update() {
    if (isPaused || !gameRunning) return;

    frameCount++;

    if (frameCount % 90 === 0) createObstacle();

    obstacles.forEach(o => o.y += speed);

    obstacles = obstacles.filter(o => {
        if (o.y > canvas.height) {
            score++;
            if (score % 5 === 0) speed += 0.5; // ускорение каждые 5 очков
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

    // Дорога
    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Полосы
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    for (let i = 1; i < canvas.width / laneWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }

    // Главная машина
    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);

    // Препятствия
    obstacles.forEach(o => {
        ctx.drawImage(o.img, o.x, o.y, obstacleWidth, obstacleHeight);
    });

    // Счет
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    // Game Over
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
    speed = baseSpeed;
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
