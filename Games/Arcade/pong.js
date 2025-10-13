const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const width = canvas.width;
const height = canvas.height;

let gameInterval = null;
let isPaused = false;

// ===== Платформы =====
const paddleWidth = 10;
const paddleHeight = 80;

let leftPaddle = { x: 10, y: height / 2 - paddleHeight / 2, dy: 0 };
let rightPaddle = { x: width - 20, y: height / 2 - paddleHeight / 2, dy: 0 };

// ===== Мяч =====
let ball = {
    x: width / 2,
    y: height / 2,
    radius: 8,
    dx: 4,
    dy: 4
};

// ===== Счёт =====
let leftScore = 0;
let rightScore = 0;

// ===== Управление ПК (ЦЫФВ / WASD + стрелки) =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["w", "ц"].includes(key)) leftPaddle.dy = -6;
    if (["s", "ы"].includes(key)) leftPaddle.dy = 6;
    if (e.key === "ArrowUp") rightPaddle.dy = -6;
    if (e.key === "ArrowDown") rightPaddle.dy = 6;
});
document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (["w", "ц", "s", "ы"].includes(key)) leftPaddle.dy = 0;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") rightPaddle.dy = 0;
});

// ===== Управление телефона (тач для левой платформы) =====
let touchStartY = 0;
canvas.addEventListener("touchstart", e => {
    touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchmove", e => {
    let dy = e.touches[0].clientY - touchStartY;
    leftPaddle.y += dy;
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y + paddleHeight > height) leftPaddle.y = height - paddleHeight;
    touchStartY = e.touches[0].clientY;
});

// ===== Отрисовка =====
function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "white";
    ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();

    ctx.font = "20px Arial";
    ctx.fillText(leftScore, width / 4, 20);
    ctx.fillText(rightScore, 3 * width / 4, 20);
}

// ===== Логика =====
function update() {
    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;

    leftPaddle.y = Math.max(0, Math.min(height - paddleHeight, leftPaddle.y));
    rightPaddle.y = Math.max(0, Math.min(height - paddleHeight, rightPaddle.y));

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) ball.dy *= -1;

    if (
        ball.x - ball.radius < leftPaddle.x + paddleWidth &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + paddleHeight
    ) ball.dx *= -1;

    if (
        ball.x + ball.radius > rightPaddle.x &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + paddleHeight
    ) ball.dx *= -1;

    if (ball.x - ball.radius < 0) {
        rightScore++;
        resetBall();
    }
    if (ball.x + ball.radius > width) {
        leftScore++;
        resetBall();
    }
}

function resetBall() {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// ===== Основной цикл =====
function gameLoop() {
    update();
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
    leftScore = 0;
    rightScore = 0;
    leftPaddle.y = height / 2 - paddleHeight / 2;
    rightPaddle.y = height / 2 - paddleHeight / 2;
    resetBall();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
