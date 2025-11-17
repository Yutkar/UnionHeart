document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ======== Блокировка/разблокировка скролла ========
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

  // ======== Глобальный объект, с которым будет работать игра ========
  window.scrollBlock = {
    block() { disableScroll(); },
    unblock() { enableScroll(); }
  };

  // ======== КНОПКИ ========
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.startGame?.();
      window.scrollBlock.block();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      window.pauseGame?.();
      window.scrollBlock.unblock();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      window.restartGame?.();
      window.scrollBlock.block();
    });
  }
});
