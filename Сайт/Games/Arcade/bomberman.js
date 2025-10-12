const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = 10;
const cols = 10;

let gameInterval = null;
let isPaused = false;
let isGameOver = false;

let score = 0;
let level = 1;
let gameSpeed = 120;

// ===== Карта =====
function generateMap() {
    map = [];

    // Базовое поле — всё пустое
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) row.push(1);
            else row.push(0);
        }
        map.push(row);
    }

    // Добавляем стены, но оставляем вокруг игрока безопасную зону
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            if ((x === 1 && y === 1) || (x === 2 && y === 1) || (x === 1 && y === 2)) continue; // зона старта
            if (Math.random() < 0.15) map[y][x] = 1; // случайные стены
        }
    }

    // Добавляем ящики, но только там, где нет стен
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            if (map[y][x] === 0 && Math.random() < 0.3) map[y][x] = 2;
        }
    }

    // Проверяем, есть ли вообще хоть один ящик (иначе уровень будет пустым)
    if (!map.flat().includes(2)) {
        // добавим один гарантированный ящик
        map[rows - 2][cols - 2] = 2;
    }
}


// ===== Игрок =====
let player = { x: 1, y: 1 };

// ===== Бомбы и взрывы =====
let bombs = [];
let explosions = [];
const bombDelay = 2000;
const explosionRange = 1;

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    if (isGameOver) return;
    const key = e.key.toLowerCase();
    if (["a", "ф"].includes(key) && map[player.y][player.x - 1] === 0) player.x--;
    if (["d", "в"].includes(key) && map[player.y][player.x + 1] === 0) player.x++;
    if (["w", "ц"].includes(key) && map[player.y - 1][player.x] === 0) player.y--;
    if (["s", "ы"].includes(key) && map[player.y + 1][player.x] === 0) player.y++;
    if (key === " ") placeBomb();
});

// ===== Сенсорное управление =====
let startX = 0, startY = 0, touchTimer = null;

canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    touchTimer = setTimeout(placeBomb, 500);
});

canvas.addEventListener("touchend", e => {
    clearTimeout(touchTimer);
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && map[player.y][player.x + 1] === 0) player.x++;
        else if (dx < 0 && map[player.y][player.x - 1] === 0) player.x--;
    } else {
        if (dy > 0 && map[player.y + 1][player.x] === 0) player.y++;
        else if (dy < 0 && map[player.y - 1][player.x] === 0) player.y--;
    }
});

// ===== Функции =====
function placeBomb() {
    if (bombs.some(b => b.x === player.x && b.y === player.y)) return;
    bombs.push({ x: player.x, y: player.y, timer: Date.now() + bombDelay });
}

function explode(bomb) {
    let positions = [{ x: bomb.x, y: bomb.y }];
    for (let i = 1; i <= explosionRange; i++) {
        if (map[bomb.y][bomb.x + i] !== 1) positions.push({ x: bomb.x + i, y: bomb.y }); else break;
    }
    for (let i = 1; i <= explosionRange; i++) {
        if (map[bomb.y][bomb.x - i] !== 1) positions.push({ x: bomb.x - i, y: bomb.y }); else break;
    }
    for (let i = 1; i <= explosionRange; i++) {
        if (map[bomb.y + i][bomb.x] !== 1) positions.push({ x: bomb.x, y: bomb.y + i }); else break;
    }
    for (let i = 1; i <= explosionRange; i++) {
        if (map[bomb.y - i][bomb.x] !== 1) positions.push({ x: bomb.x, y: bomb.y - i }); else break;
    }

    explosions.push({ positions, endTime: Date.now() + 400 });

    positions.forEach(pos => {
        if (map[pos.y][pos.x] === 2) {
            map[pos.y][pos.x] = 0;
            score += 10;
        }
        if (player.x === pos.x && player.y === pos.y) endGame();
    });

    // Проверка: остались ли ящики
    if (!map.flat().includes(2)) {
        nextLevel();
    }
}

function nextLevel() {
    clearInterval(gameInterval);
    level++;
    gameSpeed = Math.max(70, gameSpeed - 10); // ускорение
    bombs = [];
    explosions = [];
    player = { x: 1, y: 1 };
    generateMap();

    const msg = document.getElementById("gameOverMessage");
    msg.style.display = "block";
    msg.style.color = "#34d399";
    msg.textContent = `✅ Уровень ${level - 1} пройден!`;
    setTimeout(() => {
        msg.style.display = "none";
        startGame();
    }, 1500);
}

// ===== Отрисовка =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (map[y][x] === 1) ctx.fillStyle = "#5b5b5b";
            else if (map[y][x] === 2) ctx.fillStyle = "#c47f2c";
            else ctx.fillStyle = "#1b1b1b";
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    // взрывы
    explosions.forEach(ex => {
        ctx.fillStyle = "orange";
        ex.positions.forEach(p => {
            ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
        });
    });

    // игрок
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x * tileSize + 5, player.y * tileSize + 5, tileSize - 10, tileSize - 10);

    // бомбы
    ctx.fillStyle = "red";
    bombs.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x * tileSize + tileSize / 2, b.y * tileSize + tileSize / 2, 10, 0, 2 * Math.PI);
        ctx.fill();
    });

    // счёт и уровень
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Очки: ${score}`, 10, 25);
    ctx.fillText(`Уровень: ${level}`, 10, 45);
}

// ===== Логика =====
function update() {
    let now = Date.now();
    for (let i = bombs.length - 1; i >= 0; i--) {
        if (now >= bombs[i].timer) {
            explode(bombs[i]);
            bombs.splice(i, 1);
        }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        if (now >= explosions[i].endTime) explosions.splice(i, 1);
    }
}

// ===== Game Over =====
function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    const msg = document.getElementById("gameOverMessage");
    msg.textContent = `💥 Игра окончена! Очки: ${score}`;
    msg.style.display = "block";
}

// ===== Основной цикл =====
function gameLoop() {
    if (!isPaused && !isGameOver) update();
    draw();
}


// ===== Управление игрой =====
function startGame() {
    clearInterval(gameInterval); // гарантированно сбрасываем старый интервал
    gameInterval = setInterval(gameLoop, 100);
    isPaused = false;
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(gameLoop, 100);
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
    bombs = [];
    player = { x: 1, y: 1 };
    map = [];
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) row.push(1);
            else if (Math.random() < 0.2) row.push(1);
            else if (Math.random() < 0.3) row.push(2);
            else row.push(0);
        }
        map.push(row);
    }
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

