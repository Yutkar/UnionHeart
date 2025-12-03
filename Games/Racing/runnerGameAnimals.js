import { saveScore } from "../../scores.js";


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 200;

// ---------- ПЕРЕМЕННЫЕ ИГРЫ ----------
const player = { x: 50, y: 150, width: 40, height: 40, dy: 0, jumping: false };
const GRAVITY = 0.6;
const JUMP = -12;

let obstacles = [];
let spawnInterval = 90;
let speed = 5;
let score = 0;
let frameCount = 0;

let isPaused = false;
let gameRunning = false;

// блокировка скролла
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ---------- ГЕНЕРАЦИЯ ПРЕПЯТСТВИЙ ----------
function spawnObstacle() {
    const r = Math.random();
    let obstacle;

    if (r < 0.4) {
        obstacle = { x: canvas.width, y: canvas.height - 40, width: 40, height: 40, type: "stone" };
    } else if (r < 0.8) {
        obstacle = { x: canvas.width, y: canvas.height - 35, width: 60, height: 35, type: "grass" };
    } else {
        obstacle = { x: canvas.width, y: 40 + Math.random() * 50, width: 50, height: 30, type: "eagle" };
    }

    obstacles.push(obstacle);
}

// ---------- ОТРИСОВКА ОБЪЕКТОВ ----------
function drawPlayer() {
    // тело
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 20, 18, 0, Math.PI * 2);
    ctx.fill();

    // уши
    ctx.fillStyle = "#ffb0d0";
    ctx.fillRect(player.x + 12, player.y - 5, 6, 18);
    ctx.fillRect(player.x + 22, player.y - 5, 6, 18);

    // глаз
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(player.x + 27, player.y + 18, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawStone(o) {
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height);
    ctx.lineTo(o.x + o.width, o.y + o.height);
    ctx.lineTo(o.x + o.width * 0.7, o.y);
    ctx.lineTo(o.x + o.width * 0.3, o.y);
    ctx.closePath();
    ctx.fill();
}

function drawGrass(o) {
    ctx.fillStyle = "#3ad13a";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height);
    ctx.lineTo(o.x + o.width, o.y + o.height);
    ctx.lineTo(o.x + o.width * 0.8, o.y);
    ctx.lineTo(o.x + o.width * 0.2, o.y);
    ctx.closePath();
    ctx.fill();

    // травинки
    ctx.fillStyle = "#2faa2f";
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(o.x + i * (o.width / 4), o.y + o.height);
        ctx.lineTo(o.x + i * (o.width / 4) + 4, o.y + o.height - 10);
        ctx.lineTo(o.x + i * (o.width / 4) + 8, o.y + o.height);
        ctx.fill();
    }
}

function drawEagle(o) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height / 2);
    ctx.lineTo(o.x + o.width / 2, o.y);
    ctx.lineTo(o.x + o.width, o.y + o.height / 2);
    ctx.lineTo(o.x + o.width / 2, o.y + o.height);
    ctx.closePath();
    ctx.fill();

    // клюв
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(o.x + o.width / 2, o.y + o.height / 2);
    ctx.lineTo(o.x + o.width / 2 + 8, o.y + o.height / 2 + 3);
    ctx.lineTo(o.x + o.width / 2, o.y + o.height / 2 + 6);
    ctx.fill();
}

// ---------- ОБНОВЛЕНИЕ ----------
function update() {
    if (!gameRunning || isPaused) return;

    // физика прыжка
    player.dy += GRAVITY;
    player.y += player.dy;

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    // движение препятствий
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.width > 0);

    // столкновения
    for (let o of obstacles) {
        if (
            player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y
        ) {
            gameOver();
            return;
        }
    }

    speed += 0.001;
    score++;
    frameCount++;

    if (frameCount % spawnInterval === 0) spawnObstacle();
}

// ---------- РИСОВАНИЕ ----------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();

    obstacles.forEach(o => {
        if (o.type === "stone") drawStone(o);
        if (o.type === "grass") drawGrass(o);
        if (o.type === "eagle") drawEagle(o);
    });

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Очки: " + score, 10, 28);
}

// ---------- ЛУП ----------
function loop() {
    update();
    draw();
    if (gameRunning) requestAnimationFrame(loop);
}

// ---------- ПРЫЖОК ----------
function jump() {
    if (!player.jumping && !isPaused) {
        player.dy = JUMP;
        player.jumping = true;
    }
}

// ---------- GAME OVER ----------
function gameOver() {
    gameRunning = false;
    isPaused = false;
    safeUnblock();

    // Сохранение очков в Firebase
    saveScore("RunnerGameAnimals", score);


    const msg = document.getElementById("gameOverMessage");
    if (msg) {
        msg.textContent = "Игра окончена! Очки: " + score;
        msg.style.display = "block";
    }
}

// ---------- RESET ----------
function resetGame() {
    obstacles = [];
    player.y = 150;
    player.dy = 0;
    player.jumping = false;

    speed = 5;
    score = 0;
    frameCount = 0;

    isPaused = false;
    gameRunning = false;

    const msg = document.getElementById("gameOverMessage");
    if (msg) msg.style.display = "none";

    draw();
}

// ---------- УПРАВЛЕНИЕ ----------
function startGame() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        isPaused = false;
        safeBlock();
        requestAnimationFrame(loop);
    }
}

function pauseGame() {
    isPaused = !isPaused;

    if (!isPaused) {
        safeBlock();
        requestAnimationFrame(loop);
    } else {
        safeUnblock();
    }
}

function restartGame() {
    resetGame();
    gameRunning = true;
    safeBlock();
    requestAnimationFrame(loop);
}

// ---------- СОБЫТИЯ ----------
document.addEventListener("keydown", e => {
    if (e.key === " ") jump();
});

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
}, { passive: false });

// ---------- ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ gameControls.js ----------
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ---------- ПЕРВЫЙ КАДР ----------
draw();
