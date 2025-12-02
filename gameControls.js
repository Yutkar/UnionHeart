/**
 * gameControls.js
 * 
 * Универсальный контроллер для кнопок игры (Старт, Пауза, Перезапуск).
 * Управляет блокировкой скролла при игре на мобильных устройствах.
 * 
 * Игра должна определить три функции в window:
 *   - window.startGame()    — вызывается при клике на "Старт"
 *   - window.pauseGame()    — вызывается при клике на "Пауза"
 *   - window.restartGame()  — вызывается при клике на "Перезапуск"
 * 
 * Также доступен объект для управления скроллом:
 *   - window.scrollBlock.block()   — заблокировать скролл
 *   - window.scrollBlock.unblock() — разблокировать скролл
 */

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

// ======== Инициализация кнопок управления ========
function initGameControls() {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      console.log("[gameControls] Start clicked");
      if (typeof window.startGame === "function") {
        window.startGame();
      } else {
        console.warn("[gameControls] window.startGame не определена");
      }
      window.scrollBlock.block();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      console.log("[gameControls] Pause clicked");
      if (typeof window.pauseGame === "function") {
        window.pauseGame();
      } else {
        console.warn("[gameControls] window.pauseGame не определена");
      }
      window.scrollBlock.unblock();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      console.log("[gameControls] Restart clicked");
      if (typeof window.restartGame === "function") {
        window.restartGame();
      } else {
        console.warn("[gameControls] window.restartGame не определена");
      }
      window.scrollBlock.block();
    });
  }
}

// Ожидаем загрузки DOM и инициализируем кнопки
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGameControls);
} else {
  // DOM уже загружен
  initGameControls();
}
