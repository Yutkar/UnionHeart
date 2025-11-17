document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  function disableScroll() {
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventScroll, { passive: false });
  }

  function enableScroll() {
    document.body.style.overflow = "";
    document.removeEventListener("touchmove", preventScroll, { passive: false });
  }

  function preventScroll(e) {
    e.preventDefault();
  }

  // ======== Глобальные функции, которые ИГРА может вызывать ========
  window.scrollBlock = {
    onStart() { disableScroll(); },
    onStop() { enableScroll(); }
  };

  // ======== Подключение кнопок ========
  if (startBtn) startBtn.addEventListener("click", () => {
    window.startGame?.();
    window.scrollBlock.onStart();
  });

  if (pauseBtn) pauseBtn.addEventListener("click", () => {
    window.pauseGame?.();
    window.scrollBlock.onStop();
  });

  if (restartBtn) restartBtn.addEventListener("click", () => {
    window.restartGame?.();
    window.scrollBlock.onStart();
  });

  const gameOverMessage = document.getElementById("gameOverMessage");
  if (gameOverMessage) gameOverMessage.style.display = "none";
});
