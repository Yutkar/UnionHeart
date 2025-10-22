document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.startGame?.();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      window.pauseGame?.();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      window.restartGame?.();
    });
  }
});


// ======== Блокировка прокрутки во время игры ========

function disableScroll() {
  document.body.style.overflow = "hidden";
  document.addEventListener("touchmove", preventScroll, { passive: false });
}

function enableScroll() {
  document.body.style.overflow = "";
  document.removeEventListener("touchmove", preventScroll);
}

function preventScroll(e) {
  e.preventDefault();
}

// Отключаем прокрутку, когда игра запущена
window.startGame = (function(originalStartGame) {
  return function() {
    originalStartGame();
    disableScroll(); // блокируем прокрутку
  };
})(window.startGame);

// Включаем обратно при паузе или перезапуске
window.pauseGame = (function(originalPauseGame) {
  return function() {
    originalPauseGame();
    enableScroll(); // разрешаем прокрутку
  };
})(window.pauseGame);

window.restartGame = (function(originalRestartGame) {
  return function() {
    originalRestartGame();
    enableScroll(); // разрешаем прокрутку
  };
})(window.restartGame);

