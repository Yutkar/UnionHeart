import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 300;

const wordCategories = {
  еда: ["ПИЦЦА","БУРГЕР","СУШИ","ПАСТА","ЯБЛОКО","БАНАН","ШАШЛЫК","ХЛЕБ","САЛАТ","СТЕЙК"],
  школа: ["КНИГА","РУЧКА","ТЕТРАДЬ","УЧИТЕЛЬ","КЛАСС","ЭКЗАМЕН","СТУДЕНТ","УНИВЕРСИТЕТ","ЛАБОРАТОРИЯ","ПРОЕКТ"],
  животные: ["СЛОН","ТИГР","СОБАКА","КОШКА","ОБЕЗЬЯНА","КЕНГУРУ","ЛЕВ","ЖИРАФ","ПИНГВИН","ДЕЛЬФИН"],
  техника: ["КОМПЬЮТЕР","КЛАВИАТУРА","ИНТЕРНЕТ","ПРОГРАММА","РОБОТ","ТЕЛЕФОН","СЕТЬ","ПРИЛОЖЕНИЕ","БАЗАДАННЫХ","ПРОЦЕССОР"],
  страны: ["КАЗАХСТАН","РОССИЯ","ФРАНЦИЯ","БРАЗИЛИЯ","ЯПОНИЯ","КИТАЙ","АВСТРАЛИЯ","ЕГИПЕТ","ИНДИЯ","ИСПАНИЯ"]
};

let word = "";
let guessedLetters = [];
let maxAttempts = 6;
let attemptsLeft = maxAttempts;
let gameInterval = null;
let isPaused = false;
let gameOver = false;

// ====== Блокировка скролла ======
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// ===== Случайное слово =====
function getRandomWord(){
  const categories = Object.keys(wordCategories);
  const category = categories[Math.floor(Math.random()*categories.length)];
  const words = wordCategories[category];
  return words[Math.floor(Math.random()*words.length)];
}

// ===== Отрисовка =====
function drawGame(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGallows();
  drawStickman(maxAttempts - attemptsLeft);

  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";

  let display = "";
  for (let char of word) {
    display += guessedLetters.includes(char) ? char + " " : "_ ";
  }
  ctx.fillText(display.trim(), canvas.width / 2, 100);

  ctx.font = "20px Arial";
  ctx.fillText("Угаданные буквы: " + guessedLetters.join(", "), canvas.width / 2, 150);
  ctx.fillText("Осталось попыток: " + attemptsLeft, canvas.width / 2, 180);

  if (gameOver) {
    ctx.fillStyle = attemptsLeft === 0 ? "red" : "green";
    ctx.font = "40px Arial";
    ctx.fillText(
      attemptsLeft === 0 ? "Вы проиграли!" : "Вы выиграли!",
      canvas.width / 2,
      230
    );
    ctx.font = "20px Arial";
    ctx.fillText("Слово было: " + word, canvas.width / 2, 260);
  }
}

// ===== Виселица =====
function drawGallows(){
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 250);
  ctx.lineTo(200, 250); // основание
  ctx.moveTo(150, 250);
  ctx.lineTo(150, 70); // стойка
  ctx.lineTo(250, 70); // перекладина
  ctx.lineTo(250, 100); // веревка
  ctx.stroke();
}

// ===== Человечек =====
function drawStickman(stage){
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  switch(stage){
    case 1:
      ctx.beginPath();
      ctx.arc(250, 115, 15, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 2:
      drawStickman(1);
      ctx.beginPath();
      ctx.moveTo(250, 130);
      ctx.lineTo(250, 180);
      ctx.stroke();
      break;
    case 3:
      drawStickman(2);
      ctx.beginPath();
      ctx.moveTo(250, 140);
      ctx.lineTo(230, 160);
      ctx.stroke();
      break;
    case 4:
      drawStickman(3);
      ctx.beginPath();
      ctx.moveTo(250, 140);
      ctx.lineTo(270, 160);
      ctx.stroke();
      break;
    case 5:
      drawStickman(4);
      ctx.beginPath();
      ctx.moveTo(250, 180);
      ctx.lineTo(235, 210);
      ctx.stroke();
      break;
    case 6:
      drawStickman(5);
      ctx.beginPath();
      ctx.moveTo(250, 180);
      ctx.lineTo(265, 210);
      ctx.stroke();
      break;
  }
}

// ===== Проверка состояния =====
function checkGameState(){
  if (attemptsLeft <= 0) {
    gameOver = true;
    clearInterval(gameInterval);
    gameInterval = null;
    disableKeyboard();
    saveScore("hangmanRus", Math.max(0, attemptsLeft + 1));
    safeUnblock();
  } else if (word.split("").every(char => guessedLetters.includes(char))) {
    gameOver = true;
    clearInterval(gameInterval);
    gameInterval = null;
    disableKeyboard();
    saveScore("hangmanRus", attemptsLeft * 10);
    safeUnblock();
  }
}

// ===== Управление =====
function startGame() {
  if (!gameInterval) {
    drawGame();
    gameInterval = setInterval(() => {}, 1000);
    safeBlock();
  }
}

function pauseGame() {
  if (isPaused) {
    gameInterval = setInterval(() => {}, 1000);
    isPaused = false;
    safeBlock();
  } else {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = true;
    safeUnblock();
  }
}

function restartGame() {
  clearInterval(gameInterval);
  gameInterval = null;
  guessedLetters = [];
  attemptsLeft = maxAttempts;
  word = getRandomWord();
  gameOver = false;
  isPaused = false;
  enableKeyboard();
  drawGame();
  safeBlock();
  startGame();
}

// ====== Глобальный доступ ======
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Клавиатура =====
document.addEventListener("keydown", e => {
  handleLetterInput(e.key.toUpperCase());
});

function handleLetterInput(letter){
  if (gameOver || isPaused) return;
  if (/^[А-ЯЁ]$/.test(letter) && !guessedLetters.includes(letter)) {
    guessedLetters.push(letter);
    const button = document.querySelector(`.key[data-letter="${letter}"]`);
    if (button) button.disabled = true;

    if (!word.includes(letter)) attemptsLeft--;
    checkGameState();
    drawGame();
  }
}

function disableKeyboard(){
  document.querySelectorAll(".key").forEach(b => b.disabled = true);
}
function enableKeyboard(){
  document.querySelectorAll(".key").forEach(b => b.disabled = false);
}

// ===== Создание виртуальной клавиатуры =====
function createKeyboard(){
  const keyboardContainer = document.createElement("div");
  keyboardContainer.className = "keyboard";
  keyboardContainer.style.display = "flex";
  keyboardContainer.style.flexWrap = "wrap";
  keyboardContainer.style.justifyContent = "center";
  keyboardContainer.style.maxWidth = "600px";
  keyboardContainer.style.margin = "20px auto";

  const letters = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
  letters.forEach(l => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.dataset.letter = l;
    btn.textContent = l;
    btn.style.width = "40px";
    btn.style.height = "40px";
    btn.style.margin = "4px";
    btn.style.fontSize = "18px";
    btn.style.border = "none";
    btn.style.background = "#ddd";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.transition = "0.2s";
    btn.addEventListener("click", () => handleLetterInput(l));
    keyboardContainer.appendChild(btn);
  });

  document.body.appendChild(keyboardContainer);
}

// ===== Кнопки управления =====
function createControls(){
  const controls = document.createElement("div");
  controls.className = "controls";
  controls.style.marginTop = "20px";

  const btnRestart = document.createElement("button");
  btnRestart.textContent = "🔁 Новая игра";
  btnRestart.onclick = restartGame;
  btnRestart.style.margin = "5px";
  btnRestart.style.padding = "10px 20px";
  btnRestart.style.fontSize = "16px";

  const btnPause = document.createElement("button");
  btnPause.textContent = "⏸ Пауза";
  btnPause.onclick = pauseGame;
  btnPause.style.margin = "5px";
  btnPause.style.padding = "10px 20px";
  btnPause.style.fontSize = "16px";

  controls.appendChild(btnRestart);
  controls.appendChild(btnPause);
  document.body.appendChild(controls);
}

// ===== Запуск =====
createControls();
createKeyboard();
restartGame();
