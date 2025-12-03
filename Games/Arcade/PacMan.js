import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const rows = 20;
const cols = 20;

let map = [];
let pacman = { x: 1, y: 1 };
let direction = "RIGHT";
let score = 0;
let gameInterval = null;
let isPaused = false;

// HTML-элемент для вывода окончания игры
const gameOverMessage = document.getElementById("gameOverMessage");

// Прячем при загрузке
if (gameOverMessage) gameOverMessage.style.display = "none";

// Призраки
let ghosts = [
    { x: cols - 2, y: rows - 2, color: "red" },
    { x: cols - 2, y: 1, color: "pink" },
    { x: 1, y: rows - 2, color: "cyan" }
];

// ===== Генерация карты =====
function generateMap() {
    map = [];

    for (let y = 0; y < rows; y++) {
        let row = [];

        for (let x = 0; x < cols; x++) {
            if (y === 0 || x === 0 || y === rows - 1 || x === cols - 1) {
                row.push(1);
            } else {
                row.push(Math.random() < 0.2 ? 1 : 2);
            }
        }
        map.push(row);
    }

    map[pacman.y][pacman.x] = 0;
}
generateMap();

// ===== Управление ПК =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (["a", "ф"].includes(key)) direction = "LEFT";
    if (["w", "ц"].includes(key)) direction = "UP";
    if (["d", "в"].includes(key)) direction = "RIGHT";
    if (["s", "ы"].includes(key)) direction = "DOWN";
});

// ===== Управление свайпами =====
let startX, startY;

canvas.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", e => {
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "RIGHT" : "LEFT";
    } else {
        direction = dy > 0 ? "DOWN" : "UP";
    }
});

// ===== Отрисовка =====
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Карта
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "blue";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            } else if (map[y][x] === 2) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    // Pac-Man
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(
        pacman.x * tileSize + tileSize / 2,
        pacman.y * tileSize + tileSize / 2,
        tileSize / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();

    // Ghosts
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(
            g.x * tileSize + tileSize / 2,
            g.y * tileSize + tileSize / 2,
            tileSize / 2 - 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
    });

    // Очки
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Очки: " + score, 10, canvas.height - 10);
}

// ===== Логика Pac-Man =====
function updatePacman() {
    let newX = pacman.x;
    let newY = pacman.y;

    if (direction === "LEFT") newX--;
    if (direction === "UP") newY--;
    if (direction === "RIGHT") newX++;
    if (direction === "DOWN") newY++;

    if (map[newY][newX] !== 1) {
        pacman.x = newX;
        pacman.y = newY;

        if (map[newY][newX] === 2) {
            score++;
            map[newY][newX] = 0;
        }
    }
}

// ===== Логика призраков =====
function updateGhosts() {
    ghosts.forEach(g => {
        let moves = [];

        if (map[g.y][g.x - 1] !== 1) moves.push({ x: g.x - 1, y: g.y });
        if (map[g.y][g.x + 1] !== 1) moves.push({ x: g.x + 1, y: g.y });
        if (map[g.y - 1][g.x] !== 1) moves.push({ x: g.x, y: g.y - 1 });
        if (map[g.y + 1][g.x] !== 1) moves.push({ x: g.x, y: g.y + 1 });

        if (moves.length > 0) {
            // 40% шанс идти к Pac-Man
            if (Math.random() < 0.4) {
                moves.sort((a, b) => {
                    let da = Math.abs(a.x - pacman.x) + Math.abs(a.y - pacman.y);
                    let db = Math.abs(b.x - pacman.x) + Math.abs(b.y - pacman.y);
                    return da - db;
                });
                g.x = moves[0].x;
                g.y = moves[0].y;
            } else {
                let step = moves[Math.floor(Math.random() * moves.length)];
                g.x = step.x;
                g.y = step.y;
            }
        }

        // Проверка столкновения
        if (g.x === pacman.x && g.y === pacman.y) {
            endGame();
        }
    });
}

// ===== Конец игры =====
function endGame() {
    clearInterval(gameInterval);
    gameInterval = null;

    saveScore("pacman", score);

    gameOverMessage.textContent = `ИГРА ОКОНЧЕНА — Ваши очки: ${score}`;
    gameOverMessage.style.display = "block";
}

// ===== Основной цикл =====
function gameLoop() {
    updatePacman();
    updateGhosts();
    draw();
}

// ===== Управление =====
function startGame() {
    if (!gameInterval) {
        hideGameOver();
        gameInterval = setInterval(gameLoop, 200);
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(gameLoop, 200);
        isPaused = false;
    } else {
        clearInterval(gameInterval);
        gameInterval = null;
        isPaused = true;
    }
}

function hideGameOver() {
    gameOverMessage.style.display = "none";
}

function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;

    score = 0;
    direction = "RIGHT";
    pacman = { x: 1, y: 1 };

    ghosts = [
        { x: cols - 2, y: rows - 2, color: "red" },
        { x: cols - 2, y: 1, color: "pink" },
        { x: 1, y: rows - 2, color: "cyan" }
    ];

    generateMap();
    hideGameOver();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
