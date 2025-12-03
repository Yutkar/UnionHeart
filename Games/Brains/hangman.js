// hangmanEnglish.js
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

  // English word categories
  const wordCategories = {
    food: ["PIZZA","BURGER","SUSHI","PASTA","APPLE","BANANA","STEAK","SALAD","BREAD","CHOCOLATE"],
    school: ["BOOK","PENCIL","NOTEBOOK","TEACHER","CLASSROOM","STUDENT","UNIVERSITY","PROJECT","EXAM","LAB"],
    animals: ["ELEPHANT","TIGER","DOG","CAT","MONKEY","KANGAROO","LION","GIRAFFE","PENGUIN","DOLPHIN"],
    tech: ["COMPUTER","KEYBOARD","INTERNET","PROGRAM","ROBOT","PHONE","NETWORK","SOFTWARE","DATABASE","PROCESSOR"],
    countries: ["USA","CANADA","FRANCE","BRAZIL","JAPAN","CHINA","AUSTRALIA","EGYPT","INDIA","SPAIN"]
  };

  // state
  let word = "";
  let guessedLetters = [];
  const maxAttempts = 6;
  let attemptsLeft = maxAttempts;
  let gameRunning = false;
  let isPaused = false;
  let gameOver = false;

  // keyboard
  let keyboardContainer = null;

  // utils
  function safeBlock(){ window.scrollBlock?.block(); }
  function safeUnblock(){ window.scrollBlock?.unblock(); }

  function getRandomWord(){
    const keys = Object.keys(wordCategories);
    const cat = keys[Math.floor(Math.random()*keys.length)];
    return wordCategories[cat][Math.floor(Math.random()*wordCategories[cat].length)];
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
    ctx.lineTo(200, 250);
    ctx.moveTo(150, 250);
    ctx.lineTo(150, 70);
    ctx.lineTo(250, 70);
    ctx.lineTo(250, 100);
    ctx.stroke();
  }

  function drawStickman(stage){
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    if (stage >= 1){
      ctx.beginPath();
      ctx.arc(250,115,15,0,Math.PI*2);
      ctx.stroke();
    }
    if (stage >= 2){
      ctx.beginPath();
      ctx.moveTo(250,130);
      ctx.lineTo(250,180);
      ctx.stroke();
    }
    if (stage >= 3){
      ctx.beginPath();
      ctx.moveTo(250,140);
      ctx.lineTo(230,160);
      ctx.stroke();
    }
    if (stage >= 4){
      ctx.beginPath();
      ctx.moveTo(250,140);
      ctx.lineTo(270,160);
      ctx.stroke();
    }
    if (stage >= 5){
      ctx.beginPath();
      ctx.moveTo(250,180);
      ctx.lineTo(235,210);
      ctx.stroke();
    }
    if (stage >= 6){
      ctx.beginPath();
      ctx.moveTo(250,180);
      ctx.lineTo(265,210);
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

    let display = "";
    for (let ch of word){
      display += (guessedLetters.includes(ch) ? ch : "_") + " ";
    }
    ctx.fillText(display.trim(), canvas.width/2, 100);

    ctx.font = "16px Arial";
    ctx.fillText("Guessed: " + (guessedLetters.length ? guessedLetters.join(", ") : "—"), canvas.width/2, 140);
    ctx.fillText("Attempts left: " + attemptsLeft, canvas.width/2, 170);

    if (gameOver){
      ctx.font = "34px Arial";
      ctx.fillStyle = attemptsLeft > 0 ? "green" : "red";
      ctx.fillText(attemptsLeft > 0 ? "You Win!" : "You Lose!", canvas.width/2, 220);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText("Word: " + word, canvas.width/2, 250);
    }
  }

  // game logic
  function checkGameState(){
    if (attemptsLeft <= 0){
      endGame(false);
      return;
    }
    const solved = Array.from(word).every(ch => guessedLetters.includes(ch));
    if (solved){
      endGame(true);
    }
  }

  function handleLetter(letter){
    if (!gameRunning || gameOver || isPaused) return;
    letter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;
    if (guessedLetters.includes(letter)) return;

    guessedLetters.push(letter);

    const btn = keyboardContainer?.querySelector(`button[data-letter="${letter}"]`);
    if (btn) btn.disabled = true;

    if (!word.includes(letter)){
      attemptsLeft = Math.max(0, attemptsLeft - 1);
    }
    drawWordAndUI();
    checkGameState();
  }

  // keyboard
  function createKeyboardInsideContainer(){
    const existing = container.querySelector(".hangman-keyboard");
    if (existing) existing.remove();

    keyboardContainer = document.createElement("div");
    keyboardContainer.className = "hangman-keyboard";
    keyboardContainer.style.display = "flex";
    keyboardContainer.style.flexWrap = "wrap";
    keyboardContainer.style.justifyContent = "center";
    keyboardContainer.style.gap = "6px";
    keyboardContainer.style.maxWidth = canvas.width + "px";
    keyboardContainer.style.margin = "8px auto 0";
    keyboardContainer.style.padding = "8px";

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

    canvas.insertAdjacentElement("afterend", keyboardContainer);
  }

  function disableKeyboardUI(){
    keyboardContainer?.querySelectorAll("button").forEach(b => b.disabled = true);
  }
  function enableKeyboardUI(){
    keyboardContainer?.querySelectorAll("button").forEach(b => b.disabled = false);
  }

  // controls
  function setupControls(){
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const restartBtn = document.getElementById("restartBtn");

    if (startBtn) startBtn.addEventListener("click", startGame);
    if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
    if (restartBtn) restartBtn.addEventListener("click", () => restartGame());
  }

  // game flow
  function startGame(){
    if (gameRunning && !isPaused) return;
    if (!gameRunning){
      if (!word){
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
    canvas.tabIndex = 0;
    canvas.focus();
    updateGameOverElement();
  }

  function togglePause(){
    if (!gameRunning) return;
    isPaused = !isPaused;
    updateGameOverElement();
    if (!isPaused){
      canvas.focus();
    }
  }

  function restartGame(){
    word = getRandomWord();
    guessedLetters = [];
    attemptsLeft = maxAttempts;
    gameRunning = false;
    isPaused = false;
    gameOver = false;
    if (gameOverEl){
      gameOverEl.style.display = "none";
      gameOverEl.textContent = "";
    }
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
      gameOverEl.textContent = won ?
        `You Win! Score: ${attemptsLeft * 10}` :
        `You Lose! Word: ${word}`;
    }

    try {
      saveScore("hangmanEng", won ? attemptsLeft * 10 : 0);
    } catch(e){
      console.error("saveScore error", e);
    }

    safeUnblock();
    drawWordAndUI();
  }

  function updateGameOverElement(){
    if (!gameOverEl) return;
    if (gameOver) return;
    if (isPaused){
      gameOverEl.style.display = "block";
      gameOverEl.textContent = "PAUSED";
    } else {
      gameOverEl.style.display = "none";
      gameOverEl.textContent = "";
    }
  }

  // keyboard events
  document.addEventListener("keydown", e => {
    if (!gameRunning || gameOver || isPaused) return;
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)){
      handleLetter(key);
    }
  });

  // init
  createKeyboardInsideContainer();
  setupControls();
  restartGame();

  window.startGame = startGame;
  window.pauseGame = togglePause;
  window.restartGame = restartGame;

})();
