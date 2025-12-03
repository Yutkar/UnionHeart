// hangman.js
import { saveScore } from "../../scores.js";

(function(){
  // DOM
  const canvas = document.getElementById("game");
  if (!canvas) throw new Error("Canvas #game not found");
  const container = canvas.closest(".game-container") || document.body;
  const gameOverEl = document.getElementById("gameOverMessage");

  const ctx = canvas.getContext("2d");
  canvas.width = 600;
  canvas.height = 300;

  // word bank (русские категории)
  const wordCategories = {
    еда: ["ПИЦЦА","БУРГЕР","СУШИ","ПАСТА","ЯБЛОКО","БАНАН","ШАШЛЫК","ХЛЕБ","САЛАТ","СТЕЙК"],
    школа: ["КНИГА","РУЧКА","ТЕТРАДЬ","УЧИТЕЛЬ","КЛАСС","ЭКЗАМЕН","СТУДЕНТ","УНИВЕРСИТЕТ","ЛАБОРАТОРИЯ","ПРОЕКТ"],
    животные: ["СЛОН","ТИГР","СОБАКА","КОШКА","ОБЕЗЬЯНА","КЕНГУРУ","ЛЕВ","ЖИРАФ","ПИНГВИН","ДЕЛЬФИН"],
    техника: ["КОМПЬЮТЕР","КЛАВИАТУРА","ИНТЕРНЕТ","ПРОГРАММА","РОБОТ","ТЕЛЕФОН","СЕТЬ","ПРИЛОЖЕНИЕ","БАЗАДАННЫХ","ПРОЦЕССОР"],
    страны: ["КАЗАХСТАН","РОССИЯ","ФРАНЦИЯ","БРАЗИЛИЯ","ЯПОНИЯ","КИТАЙ","АВСТРАЛИЯ","ЕГИПЕТ","ИНДИЯ","ИСПАНИЯ"]
  };

  // state
  let word = "";
  let guessedLetters = [];
  const maxAttempts = 6;
  let attemptsLeft = maxAttempts;
  let gameRunning = false;
  let isPaused = false;
  let gameOver = false;

  // keyboard container inside game container
  let keyboardContainer = null;

  // utility
  function safeBlock(){ window.scrollBlock?.block(); }
  function safeUnblock(){ window.scrollBlock?.unblock(); }
  function getRandomWord(){
    const keys = Object.keys(wordCategories);
    const cat = keys[Math.floor(Math.random()*keys.length)];
    const arr = wordCategories[cat];
    return arr[Math.floor(Math.random()*arr.length)];
  }

  // drawing
  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f6f6f6";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function drawGallows(){
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(200, 250); // base
    ctx.moveTo(150, 250);
    ctx.lineTo(150, 70); // pole
    ctx.lineTo(250, 70); // beam
    ctx.lineTo(250, 100); // rope
    ctx.stroke();
  }

  function drawStickman(stage){
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    if (stage >= 1){
      // head
      ctx.beginPath();
      ctx.arc(250, 115, 15, 0, Math.PI*2);
      ctx.stroke();
    }
    if (stage >= 2){
      // body
      ctx.beginPath();
      ctx.moveTo(250, 130);
      ctx.lineTo(250, 180);
      ctx.stroke();
    }
    if (stage >= 3){
      // left arm
      ctx.beginPath();
      ctx.moveTo(250, 140);
      ctx.lineTo(230, 160);
      ctx.stroke();
    }
    if (stage >= 4){
      // right arm
      ctx.beginPath();
      ctx.moveTo(250, 140);
      ctx.lineTo(270, 160);
      ctx.stroke();
    }
    if (stage >= 5){
      // left leg
      ctx.beginPath();
      ctx.moveTo(250, 180);
      ctx.lineTo(235, 210);
      ctx.stroke();
    }
    if (stage >= 6){
      // right leg
      ctx.beginPath();
      ctx.moveTo(250, 180);
      ctx.lineTo(265, 210);
      ctx.stroke();
    }
  }

  function drawWordAndUI(){
    clearCanvas();
    drawGallows();
    const stage = Math.min(maxAttempts, maxAttempts - attemptsLeft);
    drawStickman(stage);

    ctx.fillStyle = "#111";
    ctx.font = "26px Arial";
    ctx.textAlign = "center";

    // display word with underscores
    let display = "";
    for (let ch of word){
      display += (guessedLetters.includes(ch) ? ch : "_") + " ";
    }
    ctx.fillText(display.trim(), canvas.width/2, 100);

    ctx.font = "16px Arial";
    ctx.fillText("Угаданные: " + (guessedLetters.length ? guessedLetters.join(", ") : "—"), canvas.width/2, 140);
    ctx.fillText("Осталось попыток: " + attemptsLeft, canvas.width/2, 170);

    if (gameOver){
      ctx.font = "34px Arial";
      ctx.fillStyle = attemptsLeft > 0 ? "green" : "red";
      ctx.fillText(attemptsLeft > 0 ? "Вы выиграли!" : "Вы проиграли!", canvas.width/2, 220);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText("Слово: " + word, canvas.width/2, 250);
    }
  }

  // game logic
  function checkGameState(){
    if (attemptsLeft <= 0){
      endGame(false);
      return;
    }
    // win if all letters revealed
    const solved = Array.from(word).every(ch => guessedLetters.includes(ch));
    if (solved){
      endGame(true);
    }
  }

  function handleLetter(letter){
    if (!gameRunning || gameOver || isPaused) return;
    letter = letter.toUpperCase();
    // accept only Russian letters (А-Я and Ё)
    if (!/^[А-ЯЁ]$/.test(letter)) return;
    if (guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);
    // disable button if exists
    const btn = keyboardContainer && keyboardContainer.querySelector(`button[data-letter="${letter}"]`);
    if (btn) btn.disabled = true;

    if (!word.includes(letter)){
      attemptsLeft = Math.max(0, attemptsLeft - 1);
    }
    drawWordAndUI();
    checkGameState();
  }

  // UI: keyboard inside game container (below canvas)
  function createKeyboardInsideContainer(){
    // remove existing if present
    const existing = container.querySelector(".hangman-keyboard");
    if (existing) existing.remove();

    keyboardContainer = document.createElement("div");
    keyboardContainer.className = "hangman-keyboard";
    // style: put it inside container, centered, below canvas
    keyboardContainer.style.display = "flex";
    keyboardContainer.style.flexWrap = "wrap";
    keyboardContainer.style.justifyContent = "center";
    keyboardContainer.style.gap = "6px";
    keyboardContainer.style.maxWidth = (canvas.width) + "px";
    keyboardContainer.style.margin = "8px auto 0";
    keyboardContainer.style.padding = "8px";
    keyboardContainer.style.background = "rgba(255,255,255,0.03)";

    // russian letters array (common layout)
    const letters = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
    letters.forEach(ch => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.letter = ch;
      b.textContent = ch;
      b.style.width = "40px";
      b.style.height = "40px";
      b.style.borderRadius = "6px";
      b.style.border = "1px solid #bbb";
      b.style.background = "#fff";
      b.style.cursor = "pointer";
      b.style.fontSize = "16px";
      b.addEventListener("click", () => handleLetter(ch));
      keyboardContainer.appendChild(b);
    });

    // append after canvas inside same container
    // if container contains canvas and other elements, insert after canvas
    // find next sibling of canvas within container
    if (canvas.parentElement === container) {
      canvas.insertAdjacentElement("afterend", keyboardContainer);
    } else {
      container.appendChild(keyboardContainer);
    }
  }

  function disableKeyboardUI(){
    if (!keyboardContainer) return;
    keyboardContainer.querySelectorAll("button").forEach(b => b.disabled = true);
  }
  function enableKeyboardUI(){
    if (!keyboardContainer) return;
    keyboardContainer.querySelectorAll("button").forEach(b => b.disabled = false);
  }

  // controls: try to hook existing buttons in page, otherwise create small controls area
  function setupControls(){
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const restartBtn = document.getElementById("restartBtn");

    if (startBtn) startBtn.addEventListener("click", startGame);
    if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
    if (restartBtn) restartBtn.addEventListener("click", () => {
      restartGame();
    });

    // if none exist, create minimal controls inside container (under keyboard)
    if (!startBtn && !pauseBtn && !restartBtn){
      const ctrl = document.createElement("div");
      ctrl.style.display = "flex";
      ctrl.style.justifyContent = "center";
      ctrl.style.gap = "8px";
      ctrl.style.marginTop = "8px";

      const s = document.createElement("button");
      s.textContent = "▶ Start";
      s.onclick = startGame;
      const p = document.createElement("button");
      p.textContent = "⏸ Pause";
      p.onclick = togglePause;
      const r = document.createElement("button");
      r.textContent = "🔁 Restart";
      r.onclick = restartGame;

      ctrl.appendChild(s); ctrl.appendChild(p); ctrl.appendChild(r);
      if (keyboardContainer) keyboardContainer.insertAdjacentElement("afterend", ctrl);
      else container.appendChild(ctrl);
    }
  }

  // game flow
  function startGame(){
    if (gameRunning && !isPaused) return;
    if (!gameRunning){
      // fresh start: if no word chosen, pick one
      if (!word) {
        word = getRandomWord();
        guessedLetters = [];
        attemptsLeft = maxAttempts;
        gameOver = false;
      }
      gameRunning = true;
    }
    isPaused = false;
    if (gameOver) return;
    drawWordAndUI();
    safeBlock();
    enableKeyboardUI();
    // focus to capture keyboard input
    canvas.tabIndex = 0;
    canvas.focus();
    updateGameOverElement();
  }

  function togglePause(){
    if (!gameRunning) return;
    isPaused = !isPaused;
    updateGameOverElement();
    if (!isPaused) {
      canvas.focus();
    }
  }

  function restartGame(){
    // reset state and pick new word
    word = getRandomWord();
    guessedLetters = [];
    attemptsLeft = maxAttempts;
    gameRunning = false;
    isPaused = false;
    gameOver = false;
    if (gameOverEl) { gameOverEl.style.display = "none"; gameOverEl.textContent = ""; }
    enableKeyboardUI();
    drawWordAndUI();
    safeBlock();
  }

  function endGame(won){
    gameOver = true;
    gameRunning = false;
    disableKeyboardUI();
    if (gameOverEl){
      gameOverEl.style.display = "block";
      gameOverEl.textContent = won ? `Вы выиграли! Очки: ${attemptsLeft * 10}` : `Вы проиграли! Слово: ${word}`;
    }
    // save score
    try {
      const scoreToSave = won ? attemptsLeft * 10 : 0;
      saveScore("hangmanRus", scoreToSave);
    } catch (e) {
      console.error("saveScore error", e);
    }
    safeUnblock();
    drawWordAndUI();
  }

  function updateGameOverElement(){
    if (!gameOverEl) return;
    if (gameOver){
      // already handled in endGame
      return;
    }
    if (isPaused){
      gameOverEl.style.display = "block";
      gameOverEl.textContent = "PAUSED";
    } else {
      gameOverEl.style.display = "none";
      gameOverEl.textContent = "";
    }
  }

  // keyboard physical input
  document.addEventListener("keydown", e => {
    // map Latin letters if user types on Latin keyboard — attempt to transliterate simple cases
    if (!gameRunning || gameOver || isPaused) return;
    const key = e.key.toUpperCase();
    // Accept Russian letters. If Latin, ignore (we don't transliterate automatically here).
    if (/^[А-ЯЁ]$/.test(key)){
      handleLetter(key);
    }
  });

  // initialize UI
  createKeyboardInsideContainer();
  setupControls();
  restartGame(); // prepare a word but DO NOT auto-start the gameplay

  // expose API
  window.startGame = startGame;
  window.pauseGame = togglePause;
  window.restartGame = restartGame;
  window.hangman_handleLetter = handleLetter; // if you want to call programmatically

})();
