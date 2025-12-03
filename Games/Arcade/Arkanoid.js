const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

import { saveScore } from "../../scores.js";

// ========= Параметры =========
let paddle, balls, bricks, bonuses;
let rows = 5, cols = 8;
let brickW = 50, brickH = 20, brickPadding = 10, offsetTop = 30, offsetLeft = 30;

let rightPressed = false, leftPressed = false;
let gameRunning = false;
let gamePaused = false;
let score = 0;

let touchStartX = null;

// ========= Блокировка скролла =========
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ========= Сообщения =========
function hideGameOverMessage() {
    const msg = document.getElementById("gameOverMessage");
    if (msg) msg.style.display = "none";
}
function showGameOverMessage() {
    const msg = document.getElementById("gameOverMessage");
    if (msg) {
        msg.textContent = "Игра окончена! Очки: " + score;
        msg.style.display = "block";
    }
}

// ========= Пресет игры =========
function initBricks() {
    bricks = [];
    for (let r = 0; r < rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < cols; c++) {
            bricks[r][c] = {
                x: c * (brickW + brickPadding) + offsetLeft,
                y: r * (brickH + brickPadding) + offsetTop,
                status: 1
            };
        }
    }
}

function resetGame() {
    paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, w: 80, h: 10, speed: 6 };
    balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, r: 6 }];
    bonuses = [];
    initBricks();
    score = 0;
    gamePaused = false;
    gameRunning = true;
}

// ========= Управление =========
document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "d") rightPressed = true;
    if (e.key.toLowerCase() === "a") leftPressed = true;
});
document.addEventListener("keyup", e => {
    if (e.key.toLowerCase() === "d") rightPressed = false;
    if (e.key.toLowerCase() === "a") leftPressed = false;
});

// ==== Сенсор ====
canvas.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
});
canvas.addEventListener("touchmove", e => {
    const x = e.touches[0].clientX;
    const delta = x - touchStartX;
    paddle.x += delta;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width)
        paddle.x = canvas.width - paddle.w;

    touchStartX = x;
});

// ========= Отрисовка =========
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- Кирпичи ----
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let b = bricks[r][c];
            if (b.status === 1) {
                ctx.fillStyle = "#0ff";
                ctx.fillRect(b.x, b.y, brickW, brickH);
            }
        }
    }

    // ---- Бонусы ----
    bonuses.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // ---- Мячи ----
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Стены
        if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.dx = -ball.dx;
        if (ball.y < ball.r) ball.dy = -ball.dy;

        // Потеря мяча
        if (ball.y > canvas.height - ball.r) {
            balls.splice(balls.indexOf(ball), 1);
            if (balls.length === 0) {
                gameRunning = false;
                safeUnblock();
                showGameOverMessage();
                saveScore("arkanoid", score);
            }
            return;
        }

        // Платформа
        if (ball.y + ball.r >= paddle.y &&
            ball.x >= paddle.x && ball.x <= paddle.x + paddle.w
        ) {
            ball.dy = -ball.dy;
        }

        // Кирпичи
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let b = bricks[r][c];
                if (b.status === 1 &&
                    ball.x > b.x && ball.x < b.x + brickW &&
                    ball.y > b.y && ball.y < b.y + brickH
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                }
            }
        }
    });

    // ---- Платформа ----
    ctx.fillStyle = "#0f0";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // ---- Движение платформы ----
    if (rightPressed) paddle.x += paddle.speed;
    if (leftPressed) paddle.x -= paddle.speed;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width)
        paddle.x = canvas.width - paddle.w;

    // ---- Очки ----
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Очки: " + score, 10, 25);
}

// ========= Игровой цикл =========
function loop() {
    if (gameRunning && !gamePaused) draw();
    requestAnimationFrame(loop);
}
loop();

// ========= Главные функции (работают с gameControls.js) =========
function startGame() {
    if (!gameRunning) {
        hideGameOverMessage();
        resetGame();
        safeBlock();
    } else if (gamePaused) {
        gamePaused = false;
        hideGameOverMessage();
        safeBlock();
    }
}

function pauseGame() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) safeUnblock();
    else safeBlock();
}

function restartGame() {
    hideGameOverMessage();
    resetGame();
    safeBlock();
}

// ========= Глобально =========
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
