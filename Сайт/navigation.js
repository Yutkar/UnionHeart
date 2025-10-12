document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ navigation.js подключен");

  // ===== Переход к игре 'Змейка' =====
  const openSnake = document.getElementById("openSnake");
  if (openSnake) {
    openSnake.addEventListener("click", () => {
      console.log("➡ Переход к Snake.html");
      window.location.href = "Snake.html"; // если Snake.html лежит рядом с Katalog.html
    });
  }

  // ===== Переход к игре 'Тетрис' =====
  const openMenu = document.getElementById("openTetris");
  if (openTetris) {
    openMenu.addEventListener("click", () => {
      window.location.href = "Tetris.html";
    });
  }

// ===== Переход к игре 'Арканоид' =====
  const openArconoid = document.getElementById("openArconoid");
  if (openArconoid) {
    openArconoid.addEventListener("click", () => {
      window.location.href = "Arcanoid.html";
    });
  }

  // ===== Переход к игре 'Астероиды' =====
  const openAsteroids = document.getElementById("openAsteroids");
  if (openAsteroids) {
    openAsteroids.addEventListener("click", () => {
      window.location.href = "Asteroids.html";
    });
  }

// ===== Переход к игре 'Астероиды' =====
  const openBomberman = document.getElementById("openBomberman");
  if (openBomberman) {
    openBomberman.addEventListener("click", () => {
      window.location.href = "Bomberman.html";
    });
  }

// ===== Переход к игре 'Бабл шутер' =====
  const openBubbleShooter = document.getElementById("openBubbleShooter");
  if (openBubbleShooter) {
    openBubbleShooter.addEventListener("click", () => {
      window.location.href = "BubbleShooter.html";
    });
  }

// ===== Переход к игре 'Флэппи Бёрд' =====
  const openFlappyBird = document.getElementById("openFlappyBird");
  if (openFlappyBird) {
    openFlappyBird.addEventListener("click", () => {
      window.location.href = "FlappyBird.html";
    });
  }

// ===== Переход к игре 'Космический бой' =====
  const openGalaga = document.getElementById("openGalaga");
  if (openGalaga) {
    openGalaga.addEventListener("click", () => {
      window.location.href = "galaga.html";
    });
  }

// ===== Переход к игре 'Покоритель льда' =====
  const openIceClimber = document.getElementById("openIceClimber");
  if (openIceClimber) {
    openIceClimber.addEventListener("click", () => {
      window.location.href = "iceClimber.html";
    });
  }

// ===== Переход к игре 'Сапёр' =====
  const openMinesweeper = document.getElementById("openMinesweeper");
  if (openMinesweeper) {
    openMinesweeper.addEventListener("click", () => {
      window.location.href = "minesweeper.html";
    });
  }

// ===== Переход к игре 'Пакман' =====
  const openPacMan = document.getElementById("openPacMan");
  if (openPacMan) {
    openPacMan.addEventListener("click", () => {
      window.location.href = "PacMan.html";
    });
  }

// ===== Переход к игре 'Стрелковый тир' =====
  const openShootingGallery = document.getElementById("openShootingGallery");
  if (openShootingGallery) {
    openShootingGallery.addEventListener("click", () => {
      window.location.href = "shootingGallery.html";
    });
  }

// ===== Переход к игре 'Космические захватчики' =====
  const openSpaceInvaders = document.getElementById("openSpaceInvaders");
  if (openSpaceInvaders) {
    openSpaceInvaders.addEventListener("click", () => {
      window.location.href = "spaceInvaders.html";
    });
  }

// ===== Переход к игре '2048' =====
  const open2048 = document.getElementById("open2048");
  if (open2048) {
    open2048.addEventListener("click", () => {
      window.location.href = "2048.html";
    });
  }

// ===== Переход к игре 'Лови падающие предметы' =====
  const openCatchFallingObjects = document.getElementById("openCatchFallingObjects");
  if (openCatchFallingObjects) {
    openCatchFallingObjects.addEventListener("click", () => {
      window.location.href = "catchFallingObjects.html";
    });
  }

// ===== Переход к игре 'Виселица' =====
  const openHangman = document.getElementById("openHangman");
  if (openHangman) {
    openHangman.addEventListener("click", () => {
      window.location.href = "hangman.html";
    });
  }

// ===== Переход к игре 'Игра на память' =====
  const openMemoryGame = document.getElementById("openMemoryGame");
  if (openMemoryGame) {
    openMemoryGame.addEventListener("click", () => {
      window.location.href = "memoryGame.html";
    });
  }

// ===== Переход к игре 'Саймон говорит' =====
  const openSimonSays = document.getElementById("openSimonSays");
  if (openSimonSays) {
    openSimonSays.addEventListener("click", () => {
      window.location.href = "simonSays.html";
    });
  }

// ===== Переход к игре 'Крестики-нолики' =====
  const openXO = document.getElementById("openXO");
  if (openXO) {
    openXO.addEventListener("click", () => {
      window.location.href = "xo.html";
    });
  }

// ===== Переход к игре 'Лягушонок' =====
  const openFrogger = document.getElementById("openFrogger");
  if (openFrogger) {
    openFrogger.addEventListener("click", () => {
      window.location.href = "frogger.html";
    });
  }

// ===== Переход к игре 'Бег с животными' =====
  const openRunnerGameAnimals = document.getElementById("openRunnerGameAnimals");
  if (openRunnerGameAnimals) {
    openRunnerGameAnimals.addEventListener("click", () => {
      window.location.href = "runnerGameAnimals.html";
    });
  }

// ===== Переход к игре 'Простые гонки' =====
  const openSimpleRacing = document.getElementById("openSimpleRacing");
  if (openSimpleRacing) {
    openSimpleRacing.addEventListener("click", () => {
      window.location.href = "SimpleRacing.html";
    });
  }
});
