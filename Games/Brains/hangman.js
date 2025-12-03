import { saveScore } from "../../scores.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 300;

// Сообщение под игрой
const gameResult = document.getElementById("gameOverMessage");

// Контейнер игры
const gameContainer = document.querySelector(".game-container");

// Категории слов
const wordCategories = {
  food: ["PIZZA","BURGER","SUSHI","PASTA","APPLE","BANANA","CHOCOLATE","BREAD","SALAD","STEAK"],
  school: ["BOOK","PENCIL","NOTEBOOK","TEACHER","CLASSROOM","EXAM","STUDENT","UNIVERSITY","LABORATORY","PROJECT"],
  animals: ["ELEPHANT","TIGER","DOG","CAT","MONKEY","KANGAROO","LION","GIRAFFE","PENGUIN","DOLPHIN"],
  tech: ["COMPUTER","KEYBOARD","INTERNET","SOFTWARE","PROGRAMMING","ROBOT","SMARTPHONE","NETWORK","APPLICATION","DATABASE"],
  countries: ["CANADA","FRANCE","BRAZIL","JAPAN","CHINA","AUSTRALIA","EGYPT","RUSSIA","INDIA","SPAIN"]
};

// Игровые переменные
let word = "";
let guessedLetters = [];
let maxAttempts = 6;
let attemptsLeft = maxAttempts;
let gameRunning = false;
let gameOver = false;

// Скролл-блок
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

// Выбор случайного слова
function getRandomWord() {
  const cats = Object.keys(wordCategories);
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const arr = wordCategories[cat];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==================== ОТРИСОВКА ====================
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGallows();
  drawStickman(maxAttempts - attemptsLeft);

  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";

  const display = word.split("").map(ch => guessedLetters.includes(ch) ? ch : "_").join(" ");
  ctx.fillText(display, canvas.width / 2, 100);

  ctx.font = "20px Arial";
  ctx.fillText("Осталось попыток: " + attemptsLeft, canvas.width / 2, 160);
}

function drawGallows() {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 250);
  ctx.lineTo(200, 250);
  ctx.moveTo(150, 250);
  ctx.lineTo(150, 70);
  ctx.lineTo(250, 70);
  ctx.lineTo(250, 100);
  ctx.stroke();
}

function drawStickman(stage) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  if (stage >= 1) { ctx.beginPath(); ctx.arc(250,115,15,0,Math.PI*2); ctx.stroke(); }
  if (stage >= 2) { ctx.beginPath(); ctx.moveTo(250,130); ctx.lineTo(250,180); ctx.stroke(); }
  if (stage >= 3) { ctx.beginPath(); ctx.moveTo(250,140); ctx.lineTo(230,160); ctx.stroke(); }
  if (stage >= 4) { ctx.beginPath(); ctx.moveTo(250,140); ctx.lineTo(270,160); ctx.stroke(); }
  if (stage >= 5) { ctx.beginPath(); ctx.moveTo(250,180); ctx.lineTo(235,210); ctx.stroke(); }
  if (stage >= 6) { ctx.beginPath(); ctx.moveTo(250,180); ctx.lineTo(265,210); ctx.stroke(); }
}

// ==================== СООБЩЕНИЯ ====================
function showMessage(text, color="black") {
  gameResult.textContent = text;
  gameResult.style.color = color;
  gameResult.style.display = "block";
}
function hideMessage() {
  gameResult.style.display = "none";
}

// ==================== ЛОГИКА ====================
function checkState() {
  // Проигрыш
  if (attemptsLeft <= 0) {
    gameOver = true;
    gameRunning = false;

    showMessage("Вы проиграли! Слово: " + word, "red");
    saveScore("hangman", 0);

    safeUnblock();
    return;
  }

  // Победа
  if (word.split("").every(ch => guessedLetters.includes(ch))) {
    gameOver = true;
    gameRunning = false;

    showMessage("Вы выиграли! 🎉 Слово: " + word, "green");
    saveScore("hangman", attemptsLeft * 10);

    safeUnblock();
    return;
  }
}

// ==================== КНОПКИ ====================
function startGame() {
  if (gameRunning) return;

  restartGame();
}

function pauseGame() {
  gameRunning = !gameRunning;

  if (gameRunning) safeBlock();
  else safeUnblock();
}

function restartGame() {
  hideMessage();

  guessedLetters = [];
  attemptsLeft = maxAttempts;
  word = getRandomWord();
  gameOver = false;
  gameRunning = true;

  enableKeyboard();
  safeBlock();

  drawGame();
}

window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ==================== БУКВЫ ====================
document.addEventListener("keydown", e => {
  handleLetter(e.key.toUpperCase());
});

function handleLetter(letter) {
  if (!gameRunning || gameOver) return;
  if (!/^[A-Z]$/.test(letter)) return;
  if (guessedLetters.includes(letter)) return;

  guessedLetters.push(letter);

  const btn = document.querySelector(`.key[data-letter="${letter}"]`);
  if (btn) btn.disabled = true;

  if (!word.includes(letter)) attemptsLeft--;

  checkState();
  drawGame();
}

function enableKeyboard() {
  document.querySelectorAll(".key").forEach(b => b.disabled = false);
}

// ==================== КЛАВИАТУРА ВНУТРИ ИГРЫ ====================
function createKeyboard() {
  const keyboardWrap = document.createElement("div");
  keyboardWrap.className = "keyboard";
  keyboardWrap.style.display = "flex";
  keyboardWrap.style.flexWrap = "wrap";
  keyboardWrap.style.justifyContent = "center";
  keyboardWrap.style.maxWidth = "600px";
  keyboardWrap.style.margin = "10px auto";

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  letters.forEach(l => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.dataset.letter = l;
    btn.textContent = l;

    btn.style.width = "38px";
    btn.style.height = "38px";
    btn.style.margin = "4px";
    btn.style.fontSize = "16px";
    btn.style.border = "1px solid #666";
    btn.style.background = "#eee";
    btn.style.borderRadius = "5px";

    btn.addEventListener("click", () => handleLetter(l));

    keyboardWrap.appendChild(btn);
  });

  gameContainer.appendChild(keyboardWrap);
}

// Создаём клавиатуру (но ИГРУ НЕ ЗАПУСКАЕМ!)
createKeyboard();

// !!! НЕТ drawGame() !!!
// Игра начнётся ТОЛЬКО ПО КНОПКЕ startGame()
