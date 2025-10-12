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
