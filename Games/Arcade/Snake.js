const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20; // размер клетки
let snake = [{ x: 9 * box, y: 9 * box }];
let direction = "RIGHT";
let food = spawnFood();
let score = 0;

// ====== Управление для ПК ======
document.addEventListener("keydown", event => {
    if (event.key === "A" || event.key ==="a" || event.key === "Ф" || event.key ==="ф" && direction !== "RIGHT") direction = "LEFT";
    if (event.key === "W" || event.key ==="w" || event.key === "Ц" || event.key ==="ц" && direction !== "DOWN") direction = "UP";
    if (event.key === "D" || event.key ==="d" || event.key === "В" || event.key ==="в" && direction !== "LEFT") direction = "RIGHT";
    if (event.key === "S" || event.key ==="s" || event.key === "Ы" || event.key ==="ы" && direction !== "UP") direction = "DOWN";
});

// ====== Управление для телефонов (свайпы) ======
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== "LEFT") direction = "RIGHT";
        else if (dx < 0 && direction !== "RIGHT") direction = "LEFT";
    } else {
        if (dy > 0 && direction !== "UP") direction = "DOWN";
        else if (dy < 0 && direction !== "DOWN") direction = "UP";
    }
});

// ====== Генерация еды ======
function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / box)) * box,
        y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
}

// ====== Отрисовка ======
function drawGame() {
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // змейка
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "lime" : "green";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // еда
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, box, box);

    // движение
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === "LEFT") snakeX -= box;
    if (direction === "UP") snakeY -= box;
    if (direction === "RIGHT") snakeX += box;
    if (direction === "DOWN") snakeY += box;

    // проверка на еду
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        food = spawnFood();
    } else {
        snake.pop(); // убираем хвост
    }

    const newHead = { x: snakeX, y: snakeY };

    // проверка на смерть
if (
    snakeX < 0 || snakeY < 0 ||
    snakeX >= canvas.width || snakeY >= canvas.height ||
    collision(newHead, snake)
) {
    clearInterval(gameInterval);

    // показываем надпись о конце игры
    const message = document.getElementById("gameOverMessage");
    if (message) {
        message.textContent = "Игра окончена! Очки: " + score;
        message.style.display = "block";
    }

    // сохраняем результат в Firestore
    if (typeof saveScore === "function") {
        saveScore("snake", score);
    }

    return; // выходим, чтобы не отрисовывать дальше
}




    snake.unshift(newHead);

    // очки
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Очки: " + score, 10, 20);
}

function collision(head, array) {
    return array.some(segment => head.x === segment.x && head.y === segment.y);
}

let gameInterval;
let isPaused = false;

function hideGameOverMessage() {
    const message = document.getElementById("gameOverMessage");
    if (message) message.style.display = "none";
}

// обновлённый запуск
function startGame() {
    hideGameOverMessage();
    if (!gameInterval) {
        gameInterval = setInterval(drawGame, 250); 
    }
}

// обновлённый перезапуск
function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    score = 0;
    direction = "RIGHT";
    snake = [{ x: 9 * box, y: 9 * box }];
    food = spawnFood();
    hideGameOverMessage();
    startGame();
}

// Пауза / продолжение
function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(drawGame, 250);
        isPaused = false;
    } else {
        clearInterval(gameInterval);
        gameInterval = null;
        isPaused = true;
    }
}

// Делаем функции глобальными, чтобы другой файл (gameСontrols.js) мог их вызывать
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;




import { db } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth } from "./firebase-init.js"; // если используешь авторизацию

async function saveScore(gameName, score) {
  const user = auth.currentUser;

  if (!user) {
    alert("Нужно авторизоваться, чтобы сохранить результат!");
    return;
  }

  try {
    await addDoc(collection(db, "leaderboard"), {
      userId: user.uid,
      name: user.displayName || "Аноним",
      score: score,
      gameName: gameName, // ← имя игры, чтобы рейтинг был отдельный
      timestamp: serverTimestamp(),
    });
    console.log("Результат сохранён!");
  } catch (e) {
    console.error("Ошибка при сохранении:", e);
  }
}

// Делаем функцию глобальной, чтобы её могла вызвать игра
window.saveScore = saveScore;
