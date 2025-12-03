import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = true;       // 👉 Игра НЕ запускается сама
let score = 0;

let tiltControlEnabled = false;
let horizontalVelocity = 0;

// ===== Игрок =====
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    dx: 0,
    dy: 0,
    jumping: false
};

const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const KEY_SPEED = 5;

// ===== Платформы =====
let platforms = [];
const PLATFORM_HEIGHT = 10;
const PLATFORM_TYPES = ["static", "moving", "breakable"];
const PLATFORM_SPEED = 2;

// ===== Уведомление под игрой =====
const gameOverMessage = document.getElementById("gameOverMessage");


// ======================================================
// 📱 ГИРОСКОП
// ======================================================

function requestDeviceMotionPermission() {
    const btn = document.getElementById("tiltControlButton");

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {

        DeviceOrientationEvent.requestPermission()
            .then(state => {
                if (state === "granted") {
                    enableTiltControl();
                    btn.style.display = "none";
                }
            })
            .catch(console.error);

    } else {
        enableTiltControl();
        btn.style.display = "none";
    }
}

function enableTiltControl() {
    tiltControlEnabled = true;

    window.addEventListener("deviceorientation", e => {
        if (!tiltControlEnabled || isPaused) return;
        if (e.gamma !== null) player.dx = e.gamma / 4;
    });
}


// ======================================================
// 📱 ТАЧ-УПРАВЛЕНИЕ
// ======================================================

function setupTouchControl() {
    canvas.addEventListener("touchstart", e => {
        if (isPaused || tiltControlEnabled) return;
        const x = e.touches[0].clientX - canvas.offsetLeft;

        horizontalVelocity = x < canvas.width / 2 ? -KEY_SPEED : KEY_SPEED;
    });

    canvas.addEventListener("touchend", () => {
        if (!tiltControlEnabled) horizontalVelocity = 0;
    });
}


// ======================================================
// 🎲 Генерация платформ
// ======================================================

function generatePlatforms() {
    platforms = [];

    platforms.push({
        x: canvas.width / 2 - 40,
        y: canvas.height - 20,
        width: 80,
        height: PLATFORM_HEIGHT,
        type: "static",
        dx: 0,
        broken: false
    });

    for (let i = 1; i < 15; i++) {
        const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
        const width = 40 + Math.random() * 40;
        const x = Math.random() * (canvas.width - width);
        const y = canvas.height - i * (60 + Math.random() * 20);
        const dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;

        platforms.push({
            x, y, width, height: PLATFORM_HEIGHT, type, dx, broken: false
        });
    }
}


// ======================================================
// 🧍 Движение игрока
// ======================================================

function updatePlayer() {
    if (!tiltControlEnabled) player.dx = horizontalVelocity;

    player.dy += GRAVITY;
    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    platforms.forEach(p => {
        if (!p.broken &&
            player.dy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + player.dy
        ) {
            player.y = p.y - player.height;
            player.dy = JUMP_STRENGTH;

            if (p.type === "breakable") p.broken = true;
        }
    });

    // ==== GAME OVER ====
    if (player.y > canvas.height) {
        saveScore("iceClimber", score);

        gameOverMessage.style.display = "block";
        gameOverMessage.textContent = "Вы набрали: " + score;

        isPaused = true;
        cancelAnimationFrame(gameInterval);
    }
}


// ======================================================
// 🎚 Движение платформ
// ======================================================

function updatePlatforms() {
    if (player.y < canvas.height / 2) {
        const dy = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        platforms.forEach(p => p.y += dy);
        score += Math.floor(dy);
    }

    platforms.forEach(p => {
        if (p.type === "moving") {
            p.x += p.dx;
            if (p.x < 0 || p.x + p.width > canvas.width) p.dx *= -1;
        }

        if (p.y > canvas.height) {
            const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
            const width = 40 + Math.random() * 40;
            p.x = Math.random() * (canvas.width - width);
            p.y = 0;
            p.width = width;
            p.type = type;
            p.dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;
            p.broken = false;
        }
    });
}


// ======================================================
// ✏ Рендер
// ======================================================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!tiltControlEnabled) {
        ctx.fillStyle = "rgba(150,150,255,0.05)";
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    }

    ctx.fillStyle = "#3498db";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    platforms.forEach(p => {
        if (p.broken) return;
        if (p.type === "static") ctx.fillStyle = "#2ecc71";
        if (p.type === "moving") ctx.fillStyle = "#e67e22";
        if (p.type === "breakable") ctx.fillStyle = "#e74c3c";
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    ctx.fillStyle = "#2c3e50";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    if (isPaused && gameInterval === null) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "40px Arial";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
}


// ======================================================
// 🔁 Игровой цикл
// ======================================================

function gameLoop() {
    if (!isPaused) {
        updatePlayer();
        updatePlatforms();
        draw();
    }
    gameInterval = requestAnimationFrame(gameLoop);
}


// ======================================================
// 🎮 Управление клавиатурой
// ======================================================

document.addEventListener("keydown", e => {
    if (isPaused || tiltControlEnabled) return;

    if (["a", "ф"].includes(e.key.toLowerCase())) horizontalVelocity = -KEY_SPEED;
    if (["d", "в"].includes(e.key.toLowerCase())) horizontalVelocity = KEY_SPEED;
});

document.addEventListener("keyup", e => {
    if (tiltControlEnabled) return;

    if (["a", "ф"].includes(e.key.toLowerCase()) && horizontalVelocity < 0) horizontalVelocity = 0;
    if (["d", "в"].includes(e.key.toLowerCase()) && horizontalVelocity > 0) horizontalVelocity = 0;
});


// ======================================================
// 🕹 Старт / Пауза / Рестарт
// ======================================================

function startGame() {
    gameOverMessage.style.display = "none";
    isPaused = false;
    cancelAnimationFrame(gameInterval);
    gameLoop();
}

function pauseGame() {
    isPaused = !isPaused;
}

function restartGame() {
    cancelAnimationFrame(gameInterval);

    score = 0;
    horizontalVelocity = 0;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 80;
    player.dx = 0;
    player.dy = 0;

    gameOverMessage.style.display = "none";

    generatePlatforms();
    startGame();
}


// ======================================================
// 🔗 Глобальный доступ
// ======================================================

window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;


// ======================================================
// 🚀 Инициализация
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const tiltButton = document.getElementById("tiltControlButton");
    if (tiltButton) tiltButton.addEventListener("click", requestDeviceMotionPermission);

    setupTouchControl();
    generatePlatforms();
    draw(); // 👉 Просто отрисовываем, игра не стартует
});
