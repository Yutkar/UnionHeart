// ===== ИГРА MELLSTROY SHIP — ПРОКАЧАННАЯ ВЕРСИЯ =====

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const shipImg = new Image();
shipImg.src = "images/melstroy.png";
const itemImages = [
  "images/coin1.png",
  "images/coin2.png",
  "images/coin3.png",
  "images/coin4.png",
  "images/coin5.png",
  "images/coin6.png",
  "images/coin7.png",
  "images/coin8.png",
  "images/coin9.png"
];



const coinSound = new Audio("Audio/AmAmAm.mp3");
const crashSound = new Audio("Audio/CrashMell.mp3");


// Настройка звуков
coinSound.volume = 0.2;        // умеренная громкость
coinSound.playbackRate = 1.2;  // немного быстрее

crashSound.volume = 1.0;
crashSound.playbackRate = 1.1;

// ===== МУЗЫКА ФОНА =====
const bgMusic = new Audio("Audio/FonMell.mp3"); // путь к твоему файлу
bgMusic.loop = true;     // зацикливаем
bgMusic.volume = 1.0;    // громкость (0.0–1.0)
bgMusic.playbackRate = 1.0; // скорость (1.0 = обычная)



let ship = { x: 100, y: 300, width: 60, height: 60, speed: 5 };

let score = 0;
let money = [];
let walls = [];
let stars = [];
let keys = {};

// ==== Добавляем переменные для управления ====
let gameRunning = false;
let gamePaused = false;
let moneyInterval;
let wallInterval;
let animationFrame;

// ===== Создание фона со звёздами =====
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    speed: 0.5 + Math.random() * 1.5
  });
}

// ===== Управление =====
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function collide(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ======== УПРАВЛЕНИЕ ДЛЯ ТЕЛЕФОНОВ ========

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", e => {
  const touch = e.changedTouches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;

  handleSwipe();
});

function handleSwipe() {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // Проверяем, по какой оси движение больше
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // Горизонтальный свайп
    if (diffX > 30) {
      ship.x += ship.speed * 10; // вправо
    } else if (diffX < -30) {
      ship.x -= ship.speed * 10; // влево
    }
  } else {
    // Вертикальный свайп
    if (diffY > 30) {
      ship.y += ship.speed * 10; // вниз
    } else if (diffY < -30) {
      ship.y -= ship.speed * 10; // вверх
    }
  }

  // Ограничиваем движение за границы
  if (ship.x < 0) ship.x = 0;
  if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;
  if (ship.y < 0) ship.y = 0;
  if (ship.y + ship.height > canvas.height) ship.y = canvas.height - ship.height;
}

// ===== Создание денег =====
function spawnMoney() {
  const img = new Image();
  img.src = itemImages[Math.floor(Math.random() * itemImages.length)]; // выбираем случайное изображение

  const m = {
    x: canvas.width,
    y: Math.random() * (canvas.height - 40),
    width: 45,
    height: 45,
    img: img // сохраняем индивидуальную картинку для каждой монеты
  };
  money.push(m);
}

function spawnWall() {
  const h = 80 + Math.random() * 220;
  const y = Math.random() < 0.5 ? 0 : canvas.height - h;
  const moving = Math.random() < 0.4;
  const w = {
    x: canvas.width,
    y: y,
    width: 40,
    height: h,
    speedY: moving ? (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1) : 0
  };
  walls.push(w);
}

function update() {
  if (!gameRunning || gamePaused) return;

  // управление на WASD и ФЦЫВ (русская раскладка)
  if (keys["w"] || keys["W"] || keys["ц"] || keys["Ц"]) ship.y -= ship.speed;
  if (keys["s"] || keys["S"] || keys["ы"] || keys["Ы"]) ship.y += ship.speed;
  if (keys["a"] || keys["A"] || keys["ф"] || keys["Ф"]) ship.x -= ship.speed;
  if (keys["d"] || keys["D"] || keys["в"] || keys["В"]) ship.x += ship.speed;

  if (ship.y < 0) ship.y = 0;
  if (ship.y + ship.height > canvas.height) ship.y = canvas.height - ship.height;
  if (ship.x < 0) ship.x = 0;
  if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;

  stars.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
      star.size = Math.random() * 2;
    }
  });

  money.forEach(m => m.x -= 4);
  walls.forEach(w => {
    w.x -= 4;
    w.y += w.speedY;
    if (w.y < 0 || w.y + w.height > canvas.height) w.speedY *= -1;
  });

  money = money.filter(m => m.x + m.width > 0);
  walls = walls.filter(w => w.x + w.width > 0);

  money.forEach((m, i) => {
    if (collide(ship, m)) {
      score++;
      coinSound.currentTime = 0;
      coinSound.play();
      money.splice(i, 1);
    }
  });

  walls.forEach(w => {
    if (collide(ship, w)) {
      crashSound.play();
      alert("💥 Игра окончена!\nТвои очки: " + score);
      window.restartGame();
    }
  });
}


function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 💰 Исправлено: теперь каждая монета рисуется со своим изображением
  money.forEach(m => ctx.drawImage(m.img, m.x, m.y, m.width, m.height));

  ctx.fillStyle = "#3366ff";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

  ctx.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Очки: " + score, 20, 30);
}


function gameLoop() {
  update();
  draw();
  if (gameRunning && !gamePaused) {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

// ====== ФУНКЦИИ ДЛЯ КНОПОК ======
window.startGame = function () {
  if (!gameRunning) {
    gameRunning = true;
    gamePaused = false;

    // 🎶 Запускаем музыку только при первом старте
    if (bgMusic.paused) {
      bgMusic.play().catch(err => console.log("Музыка не может быть запущена:", err));
    }

    moneyInterval = setInterval(spawnMoney, 1500);
    wallInterval = setInterval(spawnWall, 2000);
    gameLoop();
  } else if (gamePaused) {
    gamePaused = false;
    gameLoop();

    // 🎶 Возобновляем музыку после паузы
    if (bgMusic.paused) {
      bgMusic.play().catch(err => console.log("Музыка не может быть запущена:", err));
    }
  }
};

window.pauseGame = function () {
  gamePaused = true;
  cancelAnimationFrame(animationFrame);

  // ⏸ Останавливаем музыку
  bgMusic.pause();
};

window.restartGame = function () {
  cancelAnimationFrame(animationFrame);
  clearInterval(moneyInterval);
  clearInterval(wallInterval);

  gameRunning = false;
  gamePaused = false;
  score = 0;
  ship = { x: 100, y: 300, width: 60, height: 60, speed: 5 };
  money = [];
  walls = [];

  // 🔁 Останавливаем и перематываем музыку
  bgMusic.pause();
  bgMusic.currentTime = 0;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Нажмите ▶ Старт", 120, 200);
};

