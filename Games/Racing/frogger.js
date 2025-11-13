const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

const tileSize = 40;
const rows = 10;
const cols = 10;

let frog = { x: 4, y: 9, width: tileSize - 4, height: tileSize - 4 };
let gameInterval = null;
let isPaused = false;

// ===== Дорога и машины =====
let cars = [];
const roadRows = [6, 7, 8];
roadRows.forEach(row => {
    for (let i = 0; i < 3; i++) {
        cars.push({
            x: Math.random() * canvas.width,
            y: row * tileSize,
            width: tileSize - 10,
            height: tileSize - 10,
            speed: 2 + Math.random() * 2
        });
    }
});

// ===== Река и бревна =====
let logs = [];
const riverRows = [1, 2, 3];
riverRows.forEach(row => {
    for (let i = 0; i < 2; i++) {
        logs.push({
            x: Math.random() * canvas.width,
            y: row * tileSize,
            width: tileSize * 2,
            height: tileSize - 10,
            speed: 1 + Math.random() * 2
        });
    }
});

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    if (isPaused) return;
    if (e.key === "ArrowLeft" && frog.x > 0) frog.x--;
    if (e.key === "ArrowRight" && frog.x < cols - 1) frog.x++;
    if (e.key === "ArrowUp" && frog.y > 0) frog.y--;
    if (e.key === "ArrowDown" && frog.y < rows - 1) frog.y++;
});

// ===== Управление телефона =====
let startX = 0, startY = 0;
canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
    if (isPaused) return;
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && frog.x < cols - 1) frog.x++;
        else if (dx < 0 && frog.x > 0) frog.x--;
    } else {
        if (dy > 0 && frog.y < rows - 1) frog.y++;
        else if (dy < 0 && frog.y > 0) frog.y--;
    }
});

// ===== Отрисовка =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (riverRows.includes(y)) ctx.fillStyle = "#00f";
            else if (roadRows.includes(y)) ctx.fillStyle = "#555";
            else ctx.fillStyle = "#0a0";
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    ctx.fillStyle = "lime";
    ctx.fillRect(frog.x * tileSize + 2, frog.y * tileSize + 2, frog.width, frog.height);

    ctx.fillStyle = "red";
    cars.forEach(c => ctx.fillRect(c.x, c.y, c.width, c.height));

    ctx.fillStyle = "brown";
    logs.forEach(l => ctx.fillRect(l.x, l.y, l.width, l.height));
}

// ===== Логика =====
function update() {
    cars.forEach(c => {
        c.x += c.speed;
        if (c.x > canvas.width) c.x = -c.width;
    });

    logs.forEach(l => {
        l.x += l.speed;
        if (l.x > canvas.width) l.x = -l.width;
    });

    cars.forEach(c => {
        if (
            frog.x * tileSize < c.x + c.width &&
            frog.x * tileSize + frog.width > c.x &&
            frog.y * tileSize < c.y + c.height &&
            frog.height + frog.y * tileSize > c.y
        ) {
            resetFrog();
        }
    });

    if (riverRows.includes(frog.y)) {
        let onLog = false;
        logs.forEach(l => {
            if (
                frog.x * tileSize + frog.width / 2 > l.x &&
                frog.x * tileSize + frog.width / 2 < l.x + l.width &&
                frog.y * tileSize < l.y + l.height &&
                frog.y * tileSize + frog.height > l.y
            ) onLog = true;
        });
        if (!onLog) resetFrog();
    }

    if (frog.y === 0) {
        alert("Вы выиграли!");
        resetFrog();
    }
}

function resetFrog() {
    frog.x = 4;
    frog.y = 9;
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
    frog.x = 4;
    frog.y = 9;
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Автозапуск =====
startGame();