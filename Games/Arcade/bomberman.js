import { saveScore } from "../../scores.js";

/**
 * Константы и конфигурация игры
 */
const GRID_SIZE = 64;
const NUM_ROWS = 13;
const NUM_COLS = 19;

const COLORS = {
    BACKGROUND: '#4A602B',
    WALL: '#585858',
    SOFT_WALL: '#AB783A',
    PLAYER: '#3498DB',
    BOMB: '#000000',
    EXPLOSION_OUTER: '#E74C3C',
    EXPLOSION_INNER: '#F39C12',
    EXPLOSION_CENTER: '#FFE5A8',
    WHITE: '#FFFFFF'
};

const TYPES = {
    EMPTY: 0,
    WALL: 1,
    SOFT_WALL: 2,
    BOMB: 3,
    EXIT: 4
};

const WALL_TEMPLATE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const DIRS = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
];

/** ===== КЛАССЫ ===== **/

class Player {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.radius = GRID_SIZE * 0.35;
        this.numBombs = 1;
        this.bombSize = 3;
        this.alive = true;
    }

    render(ctx) {
        if (!this.alive) return;
        const x = (this.col + 0.5) * GRID_SIZE;
        const y = (this.row + 0.5) * GRID_SIZE;
        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class Bomb {
    constructor(row, col, size, owner, game) {
        this.row = row;
        this.col = col;
        this.size = size;
        this.owner = owner;
        this.game = game;
        this.alive = true;
        this.type = TYPES.BOMB;
        this.timer = 3000;
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.game.blowUpBomb(this);
            return;
        }

        const interval = Math.ceil(this.timer / 500);
        this.radius = interval % 2 === 0 ? GRID_SIZE * 0.4 : GRID_SIZE * 0.5;
    }

    render(ctx) {
        const x = (this.col + 0.5) * GRID_SIZE;
        const y = (this.row + 0.5) * GRID_SIZE;
        ctx.fillStyle = COLORS.BOMB;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + this.radius / 2, y - this.radius / 2);
        ctx.lineTo(x + this.radius / 2 + 5, y - this.radius / 2 - 10);
        ctx.stroke();
    }
}

class Explosion {
    constructor(row, col, isCenter) {
        this.row = row;
        this.col = col;
        this.isCenter = isCenter;
        this.alive = true;
        this.type = "explosion";
        this.timer = 300;
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) this.alive = false;
    }

    render(ctx) {
        const x = this.col * GRID_SIZE;
        const y = this.row * GRID_SIZE;

        ctx.fillStyle = COLORS.EXPLOSION_OUTER;
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

        ctx.fillStyle = COLORS.EXPLOSION_INNER;
        ctx.fillRect(x + 8, y + 8, GRID_SIZE - 16, GRID_SIZE - 16);

        ctx.fillStyle = COLORS.EXPLOSION_CENTER;
        ctx.fillRect(x + 16, y + 16, GRID_SIZE - 32, GRID_SIZE - 32);
    }
}

/** ===== ОСНОВНОЙ КЛАСС ИГРЫ ===== **/

class BombermanGame {
    constructor(id) {
    this.canvas = document.getElementById(id);
    this.context = this.canvas.getContext("2d");

    // Логические размеры игры
    this.canvas.width = NUM_COLS * GRID_SIZE;
    this.canvas.height = NUM_ROWS * GRID_SIZE;

    /* === АВТОМАСШТАБИРОВАНИЕ ПОД ЭКРАН === */
    const maxWidth = Math.min(window.innerWidth * 0.95, this.canvas.width);
    const scale = maxWidth / this.canvas.width;

    // CSS-уменьшение canvаs без изменения логики игры
    this.canvas.style.width = maxWidth + "px";
    this.canvas.style.height = (this.canvas.height * scale) + "px";

    /* === Обрезка блюра и соблюдение пикселей === */
    this.canvas.style.imageRendering = "pixelated";

    /* === Остальная логика === */
    this.cells = [];
    this.entities = [];
    this.player = new Player(1, 1);

    this.lastTime = 0;
    this.gameState = "MENU";

    this.input = {
        37: false,
        38: false,
        39: false,
        40: false,
        32: false
    };

    this.generateLevel();
    this.setupEventListeners();

    requestAnimationFrame(this.loop.bind(this));
}


    /** === Управление игрой === **/

    startGame() {
        if (this.gameState === "RUNNING") return;

        this.gameState = "RUNNING";
        window.scrollBlock?.block();
    }

    pauseGame() {
        if (this.gameState === "RUNNING") {
            this.gameState = "PAUSED";
            window.scrollBlock?.unblock();
        }
    }

    resetGame() {
        this.player = new Player(1, 1);
        this.entities = [];
        this.generateLevel();
        this.gameState = "MENU";
        window.scrollBlock?.block();
    }

    /** === LEVEL === **/

    generateLevel() {
        this.cells = [];
        for (let r = 0; r < NUM_ROWS; r++) {
            this.cells[r] = [];
            for (let c = 0; c < NUM_COLS; c++) {
                if (WALL_TEMPLATE[r][c] === 1) {
                    this.cells[r][c] = TYPES.WALL;
                } else if (r > 2 || c > 2) {
                    this.cells[r][c] = Math.random() < 0.7 ? TYPES.SOFT_WALL : TYPES.EMPTY;
                } else {
                    this.cells[r][c] = TYPES.EMPTY;
                }
            }
        }

        this.cells[NUM_ROWS - 2][NUM_COLS - 2] = TYPES.EXIT;
    }

    /** === Взрыв === **/

    blowUpBomb(bomb) {
        if (!bomb.alive) return;

        bomb.alive = false;

        if (this.cells[bomb.row][bomb.col] === TYPES.BOMB) {
            this.cells[bomb.row][bomb.col] = TYPES.EMPTY;
        }

        this.entities.push(new Explosion(bomb.row, bomb.col, true));

        DIRS.forEach(dir => {
            for (let i = 1; i < bomb.size; i++) {
                const r = bomb.row + dir.row * i;
                const c = bomb.col + dir.col * i;

                if (r < 0 || r >= NUM_ROWS || c < 0 || c >= NUM_COLS) break;

                const cell = this.cells[r][c];

                if (cell === TYPES.WALL) break;

                this.entities.push(new Explosion(r, c, false));

                if (cell === TYPES.SOFT_WALL) {
                    this.cells[r][c] = TYPES.EMPTY;
                    break;
                }

                if (cell === TYPES.BOMB) {
                    const anotherBomb = this.entities.find(
                        e => e.type === TYPES.BOMB && e.row === r && e.col === c
                    );
                    if (anotherBomb) this.blowUpBomb(anotherBomb);
                    break;
                }
            }
        });
    }

    /** === Input === **/

    setupEventListeners() {
        document.addEventListener("keydown", e => {
            this.input[e.which] = true;

            if (this.gameState === "RUNNING" && e.which === 32) {
                this.placeBomb();
            }
        });

        document.addEventListener("keyup", e => {
            this.input[e.which] = false;
        });
    }

    placeBomb() {
        if (!this.player.alive) return;

        const activeBombs = this.entities.filter(
            e => e.type === TYPES.BOMB && e.owner === this.player
        ).length;

        if (activeBombs >= this.player.numBombs) return;

        if (this.cells[this.player.row][this.player.col] === TYPES.BOMB) return;

        const bomb = new Bomb(
            this.player.row,
            this.player.col,
            this.player.bombSize,
            this.player,
            this
        );

        this.entities.push(bomb);
        this.cells[this.player.row][this.player.col] = TYPES.BOMB;
    }

    tryMove(r, c) {
        if (!this.player.alive) return;

        const nr = this.player.row + r;
        const nc = this.player.col + c;

        const target = this.cells[nr]?.[nc] ?? TYPES.WALL;

        if (target === TYPES.EMPTY || target === TYPES.EXIT) {
            this.player.row = nr;
            this.player.col = nc;
        }
    }

    /** === Loop === **/

    loop(time) {
        requestAnimationFrame(this.loop.bind(this));

        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.gameState === "PAUSED") {
            this.render();
            this.drawMessage("PAUSED");
            return;
        }

        if (this.gameState === "MENU") {
            this.render();
            this.drawMessage("Нажмите СТАРТ");
            return;
        }

        if (this.gameState === "RUNNING") {
            this.update(dt);
            this.render();
        }

        if (this.gameState === "GAMEOVER") {
            this.render();
            this.drawMessage("GAME OVER");
        }

        if (this.gameState === "WIN") {
            this.render();
            this.drawMessage("YOU WIN!");
        }
    }

    update(dt) {
        if (this.input[37] || this.input[65]) this.tryMove(0, -1);
        else if (this.input[39] || this.input[68]) this.tryMove(0, 1);
        else if (this.input[38] || this.input[87]) this.tryMove(-1, 0);
        else if (this.input[40] || this.input[83]) this.tryMove(1, 0);

        this.entities.forEach(e => e.update(dt));
        this.entities = this.entities.filter(e => e.alive);

        this.checkPlayerCollision();

        if (this.cells[this.player.row][this.player.col] === TYPES.EXIT) {
            this.gameState = "WIN";
        }
    }

    checkPlayerCollision() {
        for (const e of this.entities) {
            if (e.type === "explosion" && e.row === this.player.row && e.col === this.player.col) {
                this.player.alive = false;
                this.gameState = "GAMEOVER";
                saveScore("bomberman", 0);
                window.scrollBlock?.unblock();
                break;
            }
        }
    }

    /** === Render === **/

    render() {
        const ctx = this.context;

        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let r = 0; r < NUM_ROWS; r++) {
            for (let c = 0; c < NUM_COLS; c++) {
                const t = this.cells[r][c];
                const x = c * GRID_SIZE;
                const y = r * GRID_SIZE;

                if (t === TYPES.WALL) this.drawTile(x, y, COLORS.WALL);
                else if (t === TYPES.SOFT_WALL) this.drawTile(x, y, COLORS.SOFT_WALL);
                else if (t === TYPES.EXIT) this.drawTile(x, y, COLORS.PLAYER);
            }
        }

        this.entities.forEach(e => e.render(ctx));
        this.player.render(ctx);
    }

    drawTile(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    }

    drawMessage(msg) {
        const ctx = this.context;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = "60px Arial";
        ctx.textAlign = "center";
        ctx.fillText(msg, this.canvas.width / 2, this.canvas.height / 2);
    }
}

/** === Инициализация === **/

let gameInstance;
window.addEventListener("load", () => {
    gameInstance = new BombermanGame("game");
});

/** === Глобальные функции как у Snake.js === **/

window.startGame = () => {
    if (gameInstance) {
        gameInstance.startGame();
        window.scrollBlock?.block();
    }
};

window.pauseGame = () => {
    if (gameInstance) {
        gameInstance.pauseGame();
    }
};

window.restartGame = () => {
    if (gameInstance) {
        gameInstance.resetGame();
        gameInstance.startGame();
        window.scrollBlock?.block();
    }
};
