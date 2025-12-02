import { saveScore } from "../../scores.js";

class Game {
    SCREEN_WIDTH = 1800;
    SCREEN_HEIGHT = 1100;
    TURN_DELAY_MS = 1000;
    MENU_DELAY_MS = 1000;
    WALL_OFFSET = 150;

    constructor() {
        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("2d", {
            alpha: false
        });

        this.canvas.width = this.SCREEN_WIDTH;
        this.canvas.height = this.SCREEN_HEIGHT;

        this.canvas.style.width = `${this.canvas.width / 2}px`;
        this.canvas.style.height = `${this.canvas.height / 2}px`;

        this.initialize();
        this.listen(); 
    }

    initialize() {
        this.availableColours = ROUND_COLOURS;

        this.playerA = new Player({ // Игрок A (Левый)
            x: this.WALL_OFFSET,
            y: this.canvas.height / 2
        });

        // ИЗМЕНЕНО: Игрок B теперь тоже является классом Player
        this.playerB = new Player({ // Игрок B (Правый)
            x: this.canvas.width - this.WALL_OFFSET,
            y: this.canvas.height / 2
        });

        this.ball = new Ball({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        });

        this.round = 0;
        this.running = false;
        this.gameOver = false;
        this.paused = false;
        this.playerTurn = this.playerB;
        this.timer = performance.now();
        this.colour = COLOURS.DEFAULT;

        this.showMenuScreen("Ready to Start");
    }

    // *** ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ВНЕШНЕГО УПРАВЛЕНИЯ ***
    startGame() {
        if (!this.running || this.paused) {
            this.running = true;
            this.paused = false;
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    pauseGame() {
        if (this.running && !this.gameOver) {
            this.showMenuScreen("Paused");
            this.paused = true;
        }
    }

    resetGame() {
        this.initialize();
    }
    // ************************************************

    showMenuScreen(text, callback) {
        const RECTANGLE_WIDTH = 700;
        const RECTANGLE_HEIGHT = 100;
        const MENU_TIMEOUT_MS = 3000;

        this.draw();

        this.context.font = "50px Courier New";
        this.context.fillStyle = this.colour;

        this.context.fillRect(
            this.canvas.width / 2 - RECTANGLE_WIDTH / 2,
            this.canvas.height / 2 - RECTANGLE_HEIGHT / 2,
            RECTANGLE_WIDTH,
            RECTANGLE_HEIGHT
        );

        this.context.fillStyle = COLOURS.WHITE;
        this.context.textAlign = "center";

        this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        if (callback) {
            setTimeout(callback.bind(this), MENU_TIMEOUT_MS);
        }
    }

    hasCollision(ball, player) {
        return (
            ball.x < player.x + player.width &&
            ball.x + ball.width > player.x &&
            ball.y < player.y + player.height &&
            ball.y + ball.height > player.y
        );
    }

    levelUp() {
        this.round += 1;
        this.playerA.levelUp();
        this.playerB.levelUp();
        this.ball.levelUp();
        this.colour = this.getRandomColour();

        // beep3.play(); // Если у вас определены звуки
    }

    hasWonRound(object) {
        return object.getScore() >= ROUNDS[this.round];
    }

    hasNextRound() {
        return ROUNDS[this.round + 1];
    }

    getServeDirection() {
        return this.playerTurn === this.playerA ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }

    update() {
        this.ball.update(this.canvas);
        // ИЗМЕНЕНО: playerB теперь также обновляется как Player
        this.playerB.update(this.canvas);
        this.playerA.update(this.canvas);

        if (this.ball.isOutOfLeftBounds()) {
            this.resetTurn(this.playerB, this.playerA);
        } else if (this.ball.isOutOfRightBounds(this.canvas)) {
            this.resetTurn(this.playerA, this.playerB);
        }

        if (this.isTurnDelayOver() && this.playerTurn) {
            const direction = this.getServeDirection();
            this.ball.handleServe(this.playerTurn, direction);
            this.playerTurn = null;
        }

        if (this.hasCollision(this.ball, this.playerA)) {
            this.ball.handlePaddleCollision(this.playerA);
        }

        if (this.hasCollision(this.ball, this.playerB)) {
            this.ball.handlePaddleCollision(this.playerB);
        }

        if (this.hasWonRound(this.playerA)) {
            if (!this.hasNextRound()) {
                this.gameOver = true;
                this.running = false;
                const showMenuScreen = this.showMenuScreen.bind(
                    this,
                    "Player A Wins!", // Победа Игрока A
                    this.resetGame
                );
                setTimeout(showMenuScreen, this.MENU_DELAY_MS);
            } else {
                this.levelUp();
            }
        } else if (this.hasWonRound(this.playerB)) {
            this.gameOver = true;
            this.running = false;
            const showMenuScreen = this.showMenuScreen.bind(
                    saveScore("pongcoop", this.playerA.getScore());
                    this.safeUnblock?.();
                this,
                "Player B Wins!", // Победа Игрока B
                this.resetGame
            );
            setTimeout(showMenuScreen, this.MENU_DELAY_MS);
        }
    }
    
    // ... (Методы drawCourtNet, drawPlayerScores, drawRoundCount, drawRoundScore, draw, loop, togglePause остаются без изменений)

    // ИЗМЕНЕНО: Обновленный метод listen для двух игроков
    listen() {
                saveScore("pongcoop", this.playerB.getScore());
                this.safeUnblock?.();
        document.addEventListener("keydown", ({ key }) => {
            const k = key.toLowerCase();

            // Игрок 1 (Левый) - W, S
            if (k === "w") {
                this.playerA.move = DIRECTION.UP;
            } else if (k === "s") {
                this.playerA.move = DIRECTION.DOWN;
            }

            // Игрок 2 (Правый) - ArrowUp, ArrowDown
            if (key === "ArrowUp") {
                this.playerB.move = DIRECTION.UP;
            } else if (key === "ArrowDown") {
                this.playerB.move = DIRECTION.DOWN;
            }
            
            if (key === "Escape") {
                this.togglePause();
            }

            // Добавьте это, чтобы автоматически начать игру после нажатия первой клавиши
            if (!this.running && (k === "w" || k === "s" || key === "ArrowUp" || key === "ArrowDown")) {
                this.startGame();
            }
        });

        document.addEventListener("keyup", ({ key }) => {
            const k = key.toLowerCase();

            // Игрок 1 (Левый) - W, S
            if (k === "w" || k === "s") {
                this.playerA.move = DIRECTION.IDLE;
            }

            // Игрок 2 (Правый) - ArrowUp, ArrowDown
            if (key === "ArrowUp" || key === "ArrowDown") {
                this.playerB.move = DIRECTION.IDLE;
            }
        });
    }
    
    // ... (Методы resetTurn, isTurnDelayOver, getRandomColour остаются без изменений)
}

// ====== Вспомогательные функции скролла ======
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

let gameInstanceCoop;

// ====== Инициализация игры ======
document.addEventListener('DOMContentLoaded', () => {
    gameInstanceCoop = new Game();
});

// ====== Экспорт функций для gameControls.js ======
window.startGame = () => {
  if (gameInstanceCoop) {
    gameInstanceCoop.startGame();
    safeBlock();
  }
};

window.pauseGame = () => {
  if (gameInstanceCoop) {
    gameInstanceCoop.pauseGame();
    safeUnblock();
  }
};

window.restartGame = () => {
  if (gameInstanceCoop) {
    gameInstanceCoop.resetGame();
    safeBlock();
    gameInstanceCoop.startGame();
  }
};

// Замените существующие методы Game на полные версии из исходного кода, 
// но с изменениями в initialize, update и listen.

// Инициализация игры
const game = new Game();