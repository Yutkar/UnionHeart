const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

let gameInterval = null;
let isPaused = false;

// ===== Игрок (прицел) =====
const crosshair = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: 5 };

// ===== Цели =====
let targets = [];
const targetWidth = 40;
const targetHeight = 40;
let targetSpeed = 2;

// ===== Счёт =====
let score = 0;
let gameOver = false;

// ===== Эффекты попадания =====
let hitEffects = [];

// ===== Создание целей =====
function spawnTarget() {
    const y = Math.random() * (canvas.height - targetHeight - 50);
    const direction = Math.random() < 0.5 ? 1 : -1;
    const x = direction === 1 ? -targetWidth : canvas.width;
    targets.push({
        x,
        y,
        width: targetWidth,
        height: targetHeight,
        dx: direction * (targetSpeed + Math.random() * 2),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });
}

// ===== Обновление =====
function update() {
    if (gameOver) return;

    // обновление целей
    targets.forEach(t => t.x += t.dx);
    targets = targets.filter(t => t.x + t.width > 0 && t.x < canvas.width);

    // обновление эффектов попадания
    hitEffects.forEach(e => e.alpha -= 0.05);
    hitEffects = hitEffects.filter(e => e.alpha > 0);
}

// ===== Рисование =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // фон
    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // прицел
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crosshair.x - crosshair.size, crosshair.y);
    ctx.lineTo(crosshair.x + crosshair.size, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - crosshair.size);
    ctx.lineTo(crosshair.x, crosshair.y + crosshair.size);
    ctx.stroke();

    // цели
    targets.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.fillRect(t.x, t.y, t.width, t.height);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(t.x, t.y, t.width, t.height);
    });

    // эффекты попадания
    hitEffects.forEach(e => {
        ctx.fillStyle = `rgba(255, 0, 0, ${e.alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // счёт
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);
}

// ===== Стрельба с учётом промаха =====
function shoot() {
    let hit = false;
    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (
            crosshair.x > t.x &&
            crosshair.x < t.x + t.width &&
            crosshair.y > t.y &&
            crosshair.y < t.y + t.height
        ) {
            score++;
            hitEffects.push({ x: crosshair.x, y: crosshair.y, size: 15, alpha: 1 });
            targets.splice(i, 1);
            hit = true;
        }
    }
    if (!hit) {
        score = Math.max(0, score - 1); // уменьшение очков при промахе
    }
}

// ===== Управление клавиатурой =====
const keys = {};
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") shoot();
});
document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// ===== Движение прицела =====
function moveCrosshair() {
    if (keys['w'] || keys['ц']) crosshair.y -= crosshair.speed;
    if (keys['s'] || keys['ы']) crosshair.y += crosshair.speed;
    if (keys['a'] || keys['ф']) crosshair.x -= crosshair.speed;
    if (keys['d'] || keys['в']) crosshair.x += crosshair.speed;

    // ограничения, чтобы прицел не выходил за экран
    crosshair.x = Math.max(crosshair.size, Math.min(canvas.width - crosshair.size, crosshair.x));
    crosshair.y = Math.max(crosshair.size, Math.min(canvas.height - crosshair.size, crosshair.y));
}

// ===== Основной цикл =====
let frameCount = 0;
function gameLoop() {
    frameCount++;
    if (frameCount % 50 === 0) spawnTarget(); // чаще спавн
    moveCrosshair();
    update();
    draw();
}

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(gameLoop, 30);
        gameOver = false;
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
    score = 0;
    targets = [];
    hitEffects = [];
    frameCount = 0;
    startGame();
}

// ===== Завершение игры =====
function endGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    gameOver = true;
    alert("Игра завершена! Ваш счёт: " + score);
    // Здесь можно отправить очки на сервер
    uploadScore(score);
}

// ===== Пример функции загрузки очков =====
function uploadScore(finalScore) {
    console.log("Отправка очков на сервер: " + finalScore);
    // fetch('/upload', { method: 'POST', body: JSON.stringify({ score: finalScore }) });
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
window.endGame = endGame;

// ===== Автозапуск =====
startGame();
