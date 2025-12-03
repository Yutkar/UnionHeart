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

function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ---------- ГЕНЕРАЦИЯ ПРЕПЯТСТВИЙ ----------
function spawnObstacle() {
    const r = Math.random();
    let obstacle;

    if (r < 0.4) {
        obstacle = { x: canvas.width, y: canvas.height - 40, width: 40, height: 40, type: "stone" };
    } else if (r < 0.8) {
        obstacle = { x: canvas.width, y: canvas.height - 35, width: 50, height: 35, type: "grass" };
    } else {
        obstacle = { x: canvas.width, y: 50 + Math.random() * 50, width: 50, height: 40, type: "eagle" };
    }

    obstacles.push(obstacle);
}

// ---------- РИСОВАНИЕ ОБЪЕКТОВ ----------
function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 20, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "pink";
    ctx.fillRect(player.x + 12, player.y + 5, 8, 20);
    ctx.fillRect(player.x + 22, player.y + 5, 8, 20);
}

function drawStone(o) {
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height);
    ctx.lineTo(o.x + o.width, o.y + o.height);
    ctx.lineTo(o.x + o.width * 0.7, o.y);
    ctx.lineTo(o.x + o.width * 0.3, o.y);
    ctx.closePath();
    ctx.fill();
}

function drawGrass(o) {
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height);
    ctx.lineTo(o.x + o.width, o.y + o.height);
    ctx.lineTo(o.x + o.width * 0.8, o.y);
    ctx.lineTo(o.x + o.width * 0.2, o.y);
    ctx.closePath();
    ctx.fill();
}

function drawEagle(o) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.height * 0.5);
    ctx.lineTo(o.x + o.width * 0.5, o.y);
    ctx.lineTo(o.x + o.width, o.y + o.height * 0.5);
    ctx.lineTo(o.x + o.width * 0.5, o.y + o.height);
    ctx.closePath();
    ctx.fill();
}

// ---------- ОБНОВЛЕНИЕ ----------
function update() {
    if (!gameRunning || isPaused) return;

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
    ctx.fillText("Score: " + score, 10, 30);
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

    isPaused = false;
    gameRunning = false;

    speed = 5;
    score = 0;
    frameCount = 0;

    const msg = document.getElementById("gameOverMessage");
    if (msg) msg.style.display = "none";

    draw();
}

// ---------- УПРАВЛЕНИЕ ----------
function startGame() {
    if (!gameRunning) {
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

// ---------- ПЕРВЫЙ РИСУНОК ----------
draw();
