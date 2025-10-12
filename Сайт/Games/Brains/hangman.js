const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 300;

const wordCategories = {
  food: ["PIZZA","BURGER","SUSHI","PASTA","APPLE","BANANA","CHOCOLATE","BREAD","SALAD","STEAK"],
  school: ["BOOK","PENCIL","NOTEBOOK","TEACHER","CLASSROOM","EXAM","STUDENT","UNIVERSITY","LABORATORY","PROJECT"],
  animals: ["ELEPHANT","TIGER","DOG","CAT","MONKEY","KANGAROO","LION","GIRAFFE","PENGUIN","DOLPHIN"],
  tech: ["COMPUTER","KEYBOARD","INTERNET","SOFTWARE","PROGRAMMING","ROBOT","SMARTPHONE","NETWORK","APPLICATION","DATABASE"],
  countries: ["CANADA","FRANCE","BRAZIL","JAPAN","CHINA","AUSTRALIA","EGYPT","RUSSIA","INDIA","SPAIN"]
};

let word = "";
let guessedLetters = [];
let maxAttempts = 6;
let attemptsLeft = maxAttempts;
let gameInterval = null;
let isPaused = false;
let gameOver = false;

// ===== Выбор случайного слова =====
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

// ===== Обработка ввода =====
document.addEventListener("keydown", e => {
  if (gameOver || isPaused) return;
  const letter = e.key.toUpperCase();
  if (/^[A-ZА-ЯЁ]$/.test(letter) && !guessedLetters.includes(letter)) {
    guessedLetters.push(letter);
    if (!word.includes(letter)) attemptsLeft--;
    checkGameState();
    drawGame();
  }
});

// ===== Проверка состояния игры =====
function checkGameState(){
  if (attemptsLeft <= 0) {
    gameOver = true;
    clearInterval(gameInterval);
  } else if (word.split("").every(char => guessedLetters.includes(char))) {
    gameOver = true;
    clearInterval(gameInterval);
  }
}

// ===== Управление игрой =====
function startGame() {
  if (!gameInterval) {
    drawGame();
    gameInterval = setInterval(() => {}, 1000); // просто для управления паузой
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
  guessedLetters = [];
  attemptsLeft = maxAttempts;
  word = getRandomWord();
  gameOver = false;
  isPaused = false;
  startGame();
}
