const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

const buttons = [
    {x:0, y:0, width:200, height:200, color:"red"},
    {x:200, y:0, width:200, height:200, color:"green"},
    {x:0, y:200, width:200, height:200, color:"blue"},
    {x:200, y:200, width:200, height:200, color:"yellow"}
];

let sequence = [];
let playerSequence = [];
let level = 0;
let waiting = false;
let gameInterval = null;
let isPaused = false;

// ===== Рисуем кнопки =====
function drawButtons(highlightIndex = -1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buttons.forEach((b, i) => {
        ctx.fillStyle = i === highlightIndex ? "white" : b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    });

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Level: " + level, 10, 20);
}

// ===== Генерация нового хода =====
function addStep() {
    const next = Math.floor(Math.random() * 4);
    sequence.push(next);
    level++;
}

// ===== Показываем последовательность =====
function showSequence() {
    waiting = true;
    let i = 0;
    const interval = setInterval(() => {
        drawButtons(sequence[i]);
        i++;
        if (i >= sequence.length) {
            clearInterval(interval);
            setTimeout(() => {
                drawButtons();
                waiting = false;
            }, 500);
        }
    }, 600);
}

// ===== Проверка нажатия игрока =====
function checkClick(mx, my) {
    if (waiting || isPaused) return;
    for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (mx > b.x && mx < b.x + b.width && my > b.y && my < b.y + b.height) {
            playerSequence.push(i);
            drawButtons(i);
            setTimeout(() => drawButtons(), 300);

            for (let j = 0; j < playerSequence.length; j++) {
                if (playerSequence[j] !== sequence[j]) {
                    alert("Game Over! Ваш уровень: " + level);
                    resetGame();
                    return;
                }
            }

            if (playerSequence.length === sequence.length) {
                playerSequence = [];
                addStep();
                setTimeout(showSequence, 500);
            }
        }
    }
}

// ===== События =====
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    checkClick(mx, my);
});

canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.touches[0].clientX - rect.left;
    const my = e.touches[0].clientY - rect.top;
    checkClick(mx, my);
});

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        drawButtons();
        gameInterval = setInterval(() => {}, 1000); // просто для управления паузой
        sequence = [];
        playerSequence = [];
        level = 0;
        addStep();
        setTimeout(showSequence, 500);
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(() => {}, 1000);
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
    sequence = [];
    playerSequence = [];
    level = 0;
    drawButtons();
    addStep();
    setTimeout(showSequence, 500);
}

function resetGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    sequence = [];
    playerSequence = [];
    level = 0;
    drawButtons();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;
