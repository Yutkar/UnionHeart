const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

let gameInterval = null;
let isPaused = false;
let isGameOver = false;
let score = 0;

// ===== Корабль =====
let ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 15,
    speed: 0,
};

// ===== Астероиды =====
let asteroids = [];
const numAsteroids = 5;
function createAsteroids() {
    asteroids = [];
    for (let i = 0; i < numAsteroids; i++) {
        asteroids.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 20 + Math.random() * 20,
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2
        });
    }
}
createAsteroids();

// ===== Пули =====
let bullets = [];
const bulletSpeed = 5;
let canShoot = true;

// ===== Управление ПК =====
let leftPressed = false, rightPressed = false, upPressed = false;

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) leftPressed = true;
    if (["d", "в"].includes(key)) rightPressed = true;
    if (["w", "ц"].includes(key)) upPressed = true;

    if (e.code === "Space" && canShoot) {
        shoot();
        canShoot = false;
        setTimeout(() => (canShoot = true), 250); // задержка между выстрелами
    }
});
document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key)) leftPressed = false;
    if (["d", "в"].includes(key)) rightPressed = false;
    if (["w", "ц"].includes(key)) upPressed = false;
});

// ===== Сенсорное управление =====
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchmove", e => {
    let dx = e.touches[0].clientX - touchStartX;
    let dy = e.touches[0].clientY - touchStartY;
    ship.angle += dx * 0.002;
    ship.speed = -dy * 0.05;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", shoot);

// ===== Стрельба =====
function shoot() {
    bullets.push({
        x: ship.x,
        y: ship.y,
        dx: Math.cos(ship.angle) * bulletSpeed,
        dy: Math.sin(ship.angle) * bulletSpeed
    });
}

// ===== Отрисовка =====
function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
}

function drawAsteroids() {
    ctx.fillStyle = "gray";
    asteroids.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// ===== Логика =====
function updateShip() {
    if (leftPressed) ship.angle -= 0.05;
    if (rightPressed) ship.angle += 0.05;
    if (upPressed) {
        ship.x += Math.cos(ship.angle) * 2;
        ship.y += Math.sin(ship.angle) * 2;
    }

    // за границы
    if (ship.x > width) ship.x = 0;
    if (ship.x < 0) ship.x = width;
    if (ship.y > height) ship.y = 0;
    if (ship.y < 0) ship.y = height;
}

function updateAsteroids() {
    asteroids.forEach(a => {
        a.x += a.dx;
        a.y += a.dy;
        if (a.x > width) a.x = 0;
        if (a.x < 0) a.x = width;
        if (a.y > height) a.y = 0;
        if (a.y < 0) a.y = height;
    });
}

function updateBullets() {
    bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) bullets.splice(i, 1);
    });
}

function checkCollisions() {
    asteroids.forEach((a, i) => {
        bullets.forEach((b, j) => {
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < a.radius) {
                bullets.splice(j, 1);
                asteroids.splice(i, 1);
                score += 10;
                asteroids.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: 20 + Math.random() * 20,
                    dx: (Math.random() - 0.5) * 2,
                    dy: (Math.random() - 0.5) * 2
                });
            }
        });

        let dx = a.x - ship.x;
        let dy = a.y - ship.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.radius + ship.radius) {
            endGame();
        }
    });
}

// ===== Завершение игры =====
function endGame() {
    clearInterval(gameInterval);
    isGameOver = true;
    document.getElementById("gameOverMessage").textContent = `Игра окончена! Очки: ${score}`;
    document.getElementById("gameOverMessage").style.display = "block";
}

// ===== Основной цикл =====
function gameLoop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    if (!isPaused && !isGameOver) {
        updateShip();
        updateAsteroids();
        updateBullets();
        checkCollisions();
    }

    drawShip();
    drawAsteroids();
    drawBullets();

    // очки
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Очки: ${score}`, 10, 25);
}

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval && !isGameOver) {
        gameInterval = setInterval(gameLoop, 30);
    }
}

function pauseGame() {
    isPaused = !isPaused;
}

function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    isGameOver = false;
    score = 0;
    bullets = [];
    ship = {
        x: width / 2,
        y: height / 2,
        angle: 0,
        radius: 15,
        speed: 0
    };
    createAsteroids();
    document.getElementById("gameOverMessage").style.display = "none";
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
