const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

import { saveScore } from "../../scores.js";

// ========= ПАРАМЕТРЫ =========
let paddle, ball, bricks;
let rows = 5, cols = 8;
let brickW = 50, brickH = 20, brickPadding = 10, offsetTop = 40, offsetLeft = 25;

let rightPressed = false, leftPressed = false;
let gameRunning = false;
let gamePaused = false;
let score = 0;

let touchStartX = null;

// ========= БЛОКИРОВКА СКРОЛЛА =========
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ========= СООБЩЕНИЯ =========
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

// ========= СОЗДАНИЕ КИРПИЧЕЙ =========
function initBricks() {
    bricks = [];
    for (let r = 0; r < rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < cols; c++) {
            bricks[r][c] = {
                x: offsetLeft + c * (brickW + brickPadding),
                y: offsetTop + r * (brickH + brickPadding),
                status: 1
            };
        }
    }
}

// ========= СБРОС ИГРЫ =========
function resetGame() {
    paddle = { 
        x: canvas.width / 2 - 45, 
        y: canvas.height - 20,
        w: 90,
        h: 12,
        speed: 8 
    };

    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        dx: 4,
        dy: -4,
        r: 7
    };

    score = 0;
    initBricks();

    gameRunning = true;
    gamePaused = false;
}

// ========= УПРАВЛЕНИЕ КЛАВИАТУРОЙ =========
document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rightPressed = true;
    if (e.key === "ArrowLeft"  || e.key.toLowerCase() === "a") leftPressed = true;
});

document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rightPressed = false;
    if (e.key === "ArrowLeft"  || e.key.toLowerCase() === "a") leftPressed = false;
});

// ========= ТАЧ УПРАВЛЕНИЕ =========
canvas.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;

    paddle.x += delta;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width)
        paddle.x = canvas.width - paddle.w;

    touchStartX = currentX;
});

// ========= ОТРИСОВКА =========
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- КИРПИЧИ ----
    bricks.forEach(row => row.forEach(b => {
        if (b.status === 1) {
            ctx.fillStyle = "#00eaff";
            ctx.fillRect(b.x, b.y, brickW, brickH);
        }
    }));

    // ---- ПЛАТФОРМА ----
    ctx.fillStyle = "#00ff22";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // ---- МЯЧ ----
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // ---- СТЕНЫ ----
    if (ball.x + ball.dx > canvas.width - ball.r || ball.x + ball.dx < ball.r)
        ball.dx = -ball.dx;

    if (ball.y + ball.dy < ball.r)
        ball.dy = -ball.dy;

    // ---- ПЛАТФОРМА ----
    if (
        ball.y + ball.r >= paddle.y &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w
    ) {
        ball.dy = -Math.abs(ball.dy);
    }

    // ---- ПРОИГРЫШ ----
    if (ball.y > canvas.height) {
        gameRunning = false;
        safeUnblock();
        showGameOverMessage();
        saveScore("arkanoid", score);
    }

    // ---- ДВИЖЕНИЕ МЯЧА ----
    ball.x += ball.dx;
    ball.y += ball.dy;

    // ---- УПРАВЛЕНИЕ ПЛАТФОРМОЙ ----
    if (rightPressed) paddle.x += paddle.speed;
    if (leftPressed) paddle.x -= paddle.speed;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;

    // ---- КОЛЛИЗИИ С КИРПИЧАМИ ----
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const b = bricks[r][c];
            if (b.status === 1 &&
                ball.x > b.x && ball.x < b.x + brickW &&
                ball.y > b.y && ball.y < b.y + brickH) {

                ball.dy = -ball.dy;
                b.status = 0;
                score += 10;
            }
        }
    }

    // ---- ОЧКИ ----
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Очки: " + score, 10, 25);
}

// ========= ИГРОВОЙ ЦИКЛ =========
function loop() {
    if (gameRunning && !gamePaused) draw();
    requestAnimationFrame(loop);
}
loop();

// ========= ФУНКЦИИ ДЛЯ gameControls.js =========
function startGame() {
    if (!gameRunning) {
        hideGameOverMessage();
        resetGame();
        safeBlock();
    } else if (gamePaused) {
        gamePaused = false;
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

// ========= ГЛОБАЛЬНО =========
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
