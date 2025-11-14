document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");

  // ======== Блокировка прокрутки во время игры ========
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

  // ======== Обёртка для безопасного подключения к игровым функциям ========
  function wrapGameFunction(func, afterCallback) {
    if (!func) return undefined;
    return function() {
      func();
      if (afterCallback) afterCallback();
    };
  }

  // Навешиваем кнопки, если глобальные функции уже существуют
  if (window.startGame) window.startGame = wrapGameFunction(window.startGame, disableScroll);
  if (window.pauseGame) window.pauseGame = wrapGameFunction(window.pauseGame, enableScroll);
  if (window.restartGame) window.restartGame = wrapGameFunction(window.restartGame, enableScroll);

  // Кнопки управления
  if (startBtn) startBtn.addEventListener("click", () => window.startGame?.());
  if (pauseBtn) pauseBtn.addEventListener("click", () => window.pauseGame?.());
  if (restartBtn) restartBtn.addEventListener("click", () => window.restartGame?.());

  // Скрываем сообщение об окончании игры при загрузке
  const gameOverMessage = document.getElementById("gameOverMessage");
  if (gameOverMessage) gameOverMessage.style.display = "none";
});
