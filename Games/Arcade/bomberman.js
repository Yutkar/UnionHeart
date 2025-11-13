/**
 * Константы и конфигурация игры
 */
const GRID_SIZE = 64; // Размер одной ячейки в пикселях
const NUM_ROWS = 13;
const NUM_COLS = 19;

// Цвета
const COLORS = {
    BACKGROUND: '#4A602B', // Глубокий зеленый для земли/фона
    WALL: '#585858',       // Неразрушимая стена (серый)
    SOFT_WALL: '#AB783A',  // Разрушаемая стена (коричневый)
    PLAYER: '#3498DB',     // Игрок (синий)
    BOMB: '#000000',       // Бомба (черный)
    EXPLOSION_OUTER: '#E74C3C', // Красный
    EXPLOSION_INNER: '#F39C12', // Оранжевый
    EXPLOSION_CENTER: '#FFE5A8',// Светло-желтый
    WHITE: '#FFFFFF'
};

// Типы ячеек
const TYPES = {
    EMPTY: 0,
    WALL: 1,
    SOFT_WALL: 2,
    BOMB: 3,
    EXIT: 4
};

// Шаблон для неразрушимых стен (1 = WALL, 0 = EMPTY)
// Стандартная сетка Bomberman с чередующимися блоками.
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

// Направления для взрыва
const DIRS = [
    { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }
];

/**
 * Класс игрока
 */
class Player {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.radius = GRID_SIZE * 0.35;
        this.numBombs = 1; // Макс. бомб, которые можно разместить
        this.bombSize = 3; // Радиус взрыва
        this.alive = true;
    }

    render(context) {
        if (!this.alive) return;
        const x = (this.col + 0.5) * GRID_SIZE;
        const y = (this.row + 0.5) * GRID_SIZE;
        context.fillStyle = COLORS.PLAYER;
        context.beginPath();
        context.arc(x, y, this.radius, 0, 2 * Math.PI);
        context.fill();
    }
}

/**
 * Класс Бомбы
 */
class Bomb {
    constructor(row, col, size, owner, game) {
        this.row = row;
        this.col = col;
        this.size = size;
        this.owner = owner;
        this.game = game;
        this.alive = true;
        this.type = TYPES.BOMB;
        this.timer = 3000; // 3 секунды до взрыва
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.game.blowUpBomb(this);
            return;
        }
        // Эффект мигания: изменение радиуса
        const interval = Math.ceil(this.timer / 500);
        this.radius = interval % 2 === 0 ? GRID_SIZE * 0.4 : GRID_SIZE * 0.5;
    }

    render(context) {
        const x = (this.col + 0.5) * GRID_SIZE;
        const y = (this.row + 0.5) * GRID_SIZE;

        // Тело бомбы
        context.fillStyle = COLORS.BOMB;
        context.beginPath();
        context.arc(x, y, this.radius, 0, 2 * Math.PI);
        context.fill();

        // Фитиль (для красоты)
        context.strokeStyle = COLORS.WHITE;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(x + this.radius / 2, y - this.radius / 2);
        context.lineTo(x + this.radius / 2 + 5, y - this.radius / 2 - 10);
        context.stroke();
    }
}

/**
 * Класс Взрыва (отдельный элемент для каждого сегмента пламени)
 */
class Explosion {
    constructor(row, col, isCenter) {
        this.row = row;
        this.col = col;
        this.alive = true;
        this.type = 'explosion';
        this.timer = 300; // Длительность взрыва в мс
        this.isCenter = isCenter;
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.alive = false;
        }
    }

    render(context, horizontal, vertical) {
        const x = this.col * GRID_SIZE;
        const y = this.row * GRID_SIZE;

        // Внешний (Красный)
        context.fillStyle = COLORS.EXPLOSION_OUTER;
        context.fillRect(x, y, GRID_SIZE, GRID_SIZE);

        // Средний (Оранжевый)
        context.fillStyle = COLORS.EXPLOSION_INNER;
        if (this.isCenter || horizontal) {
            context.fillRect(x, y + 8, GRID_SIZE, GRID_SIZE - 16);
        }
        if (this.isCenter || vertical) {
            context.fillRect(x + 8, y, GRID_SIZE - 16, GRID_SIZE);
        }

        // Внутренний/Центр (Желтый)
        context.fillStyle = COLORS.EXPLOSION_CENTER;
        if (this.isCenter || horizontal) {
            context.fillRect(x, y + 16, GRID_SIZE, GRID_SIZE - 32);
        }
        if (this.isCenter || vertical) {
            context.fillRect(x + 16, y, GRID_SIZE - 32, GRID_SIZE);
        }
    }
}


/**
 * Главный класс игры Bomberman
 */
class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.canvas.width = NUM_COLS * GRID_SIZE;
        this.canvas.height = NUM_ROWS * GRID_SIZE;

        this.cells = [];
        this.entities = [];
        this.player = new Player(1, 1);
        this.lastTime = 0;
        this.gameState = 'MENU'; // 'MENU', 'RUNNING', 'PAUSED', 'GAMEOVER', 'WIN'

        this.input = {
            37: false, // Left Arrow
            38: false, // Up Arrow
            39: false, // Right Arrow
            40: false, // Down Arrow
            32: false  // Spacebar (Bomb)
        };

        this.generateLevel();
        this.setupEventListeners();
        
        // Внешние функции управления, как вы просили
        window.game = this; // Делаем объект доступным из глобальной области
        
        // Запускаем цикл рендеринга для меню
        requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Методы для внешнего управления
     */
    startGame() {
        if (this.gameState !== 'RUNNING') {
            this.gameState = 'RUNNING';
            // Если игра уже запущена (например, на паузе), requestAnimationFrame уже работает.
            // Если из GAMEOVER, то resetGame() перед startGame().
            if (this.player.alive) {
                 this.loop(performance.now());
            } else {
                 this.resetGame();
                 this.startGame();
            }
        }
    }

    pauseGame() {
        if (this.gameState === 'RUNNING') {
            this.gameState = 'PAUSED';
        }
    }

    resetGame() {
        this.player = new Player(1, 1);
        this.entities = [];
        this.generateLevel();
        this.gameState = 'MENU';
    }

    /**
     * Логика генерации уровня
     */
    generateLevel() {
        this.cells = [];
        for (let row = 0; row < NUM_ROWS; row++) {
            this.cells[row] = [];
            for (let col = 0; col < NUM_COLS; col++) {
                // Неразрушимые стены по шаблону
                if (WALL_TEMPLATE[row][col] === TYPES.WALL) {
                    this.cells[row][col] = TYPES.WALL;
                } 
                // Разрушимые стены (случайные, кроме стартовой области)
                else if (row > 2 || col > 2) { 
                    if (Math.random() < 0.7) { // 70% шанс
                        this.cells[row][col] = TYPES.SOFT_WALL;
                    } else {
                        this.cells[row][col] = TYPES.EMPTY;
                    }
                } else {
                    this.cells[row][col] = TYPES.EMPTY;
                }
            }
        }
        
        // Установка выхода в правом нижнем углу (должен быть за мягкой стеной)
        this.cells[NUM_ROWS - 2][NUM_COLS - 2] = TYPES.EXIT;
    }
    
    /**
     * Обработка взрыва бомбы
     */
    blowUpBomb(bomb) {
        if (!bomb.alive) return;
        bomb.alive = false;
        
        // Очищаем ячейку, где была бомба
        if (this.cells[bomb.row][bomb.col] === TYPES.BOMB) {
            this.cells[bomb.row][bomb.col] = TYPES.EMPTY;
        }

        // Создаем взрыв в центре
        this.entities.push(new Explosion(bomb.row, bomb.col, true));

        // Распространение взрыва
        DIRS.forEach((dir) => {
            for (let i = 1; i < bomb.size; i++) {
                const row = bomb.row + dir.row * i;
                const col = bomb.col + dir.col * i;

                // Проверка границ
                if (row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS) {
                    break;
                }

                const cell = this.cells[row][col];
                
                // 1. Встреча с неразрушимой стеной - останавливаем распространение
                if (cell === TYPES.WALL) {
                    break; 
                }
                
                // 2. Создаем сегмент взрыва
                const isCenter = (i === 1);
                this.entities.push(new Explosion(row, col, isCenter));
                
                // 3. Если разрушили мягкую стену - останавливаем распространение в этом направлении
                if (cell === TYPES.SOFT_WALL) {
                    this.cells[row][col] = TYPES.EMPTY;
                    break; 
                } 
                
                // 4. Если попали в другую бомбу - вызываем цепную реакцию (рекурсия)
                if (cell === TYPES.BOMB) {
                    const nextBomb = this.entities.find(e => 
                        e.type === TYPES.BOMB && e.row === row && e.col === col
                    );
                    if (nextBomb) {
                        this.blowUpBomb(nextBomb);
                    }
                    // Взрыв от бомбы останавливает распространение (если это не взрываемая бомба)
                    break; 
                }
                
                // Если попали в пустую ячейку или ячейку выхода, продолжаем
            }
        });
    }

    /**
     * Обработка ввода (W, A, S, D или стрелки, Пробел)
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.input[e.which] = true;
            // Размещение бомбы только при нажатии и если игра запущена
            if (this.gameState === 'RUNNING' && e.which === 32) {
                this.placeBomb();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.input[e.which] = false;
        });
    }
    
    placeBomb() {
        if (!this.player.alive) return;
        
        // Проверяем, не превышен ли лимит бомб
        const activeBombs = this.entities.filter(e => e.type === TYPES.BOMB && e.owner === this.player).length;
        if (activeBombs >= this.player.numBombs) {
            return;
        }
        
        // Проверяем, нет ли уже бомбы в этой ячейке
        if (this.cells[this.player.row][this.player.col] === TYPES.BOMB) {
            return;
        }

        const bomb = new Bomb(this.player.row, this.player.col, this.player.bombSize, this.player, this);
        this.entities.push(bomb);
        this.cells[this.player.row][this.player.col] = TYPES.BOMB;
    }

    // Попытка переместить игрока
    tryMove(rowChange, colChange) {
        if (!this.player.alive) return;

        let newRow = this.player.row + rowChange;
        let newCol = this.player.col + colChange;

        // Проверяем, что новая ячейка не является стеной (WALL, SOFT_WALL, BOMB)
        const targetCell = this.cells[newRow] ? this.cells[newRow][newCol] : TYPES.WALL;

        if (targetCell === TYPES.EMPTY || targetCell === TYPES.EXIT) {
            this.player.row = newRow;
            this.player.col = newCol;
        }
    }

    /**
     * Главный цикл игры
     */
    loop(currentTime) {
        if (this.gameState === 'PAUSED') {
            this.render();
            this.drawMessage('PAUSED');
            return;
        }
        
        if (this.gameState === 'MENU') {
            this.render();
            this.drawMessage('Press START Button');
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        const dt = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState === 'RUNNING') {
            this.update(dt);
        }
        
        this.render();
        
        if (this.gameState === 'RUNNING') {
            requestAnimationFrame(this.loop.bind(this));
        } else if (this.gameState === 'GAMEOVER') {
            this.drawMessage('GAME OVER');
        } else if (this.gameState === 'WIN') {
            this.drawMessage('YOU WIN!');
        }
    }

    update(dt) {
        // Обновление ввода игрока
        if (this.input[37] || this.input[65]) { // Left / A
            this.tryMove(0, -1);
        } else if (this.input[39] || this.input[68]) { // Right / D
            this.tryMove(0, 1);
        } else if (this.input[38] || this.input[87]) { // Up / W
            this.tryMove(-1, 0);
        } else if (this.input[40] || this.input[83]) { // Down / S
            this.tryMove(1, 0);
        }

        // Обновление сущностей (Бомбы и Взрывы)
        this.entities.forEach(entity => entity.update(dt));
        this.entities = this.entities.filter(entity => entity.alive);

        // Проверка коллизий игрока с взрывами
        this.checkPlayerCollision();
        
        // Проверка на победу (достижение выхода)
        if (this.cells[this.player.row][this.player.col] === TYPES.EXIT) {
            this.gameState = 'WIN';
        }
    }

    checkPlayerCollision() {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.type === 'explosion' && entity.row === this.player.row && entity.col === this.player.col) {
                this.player.alive = false;
                this.gameState = 'GAMEOVER';
                break;
            }
        }
    }

    /**
     * Отрисовка
     */
    render() {
        this.context.fillStyle = COLORS.BACKGROUND;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Отрисовка карты (стен)
        for (let row = 0; row < NUM_ROWS; row++) {
            for (let col = 0; col < NUM_COLS; col++) {
                const type = this.cells[row][col];
                const x = col * GRID_SIZE;
                const y = row * GRID_SIZE;

                if (type === TYPES.WALL) {
                    this.drawTile(x, y, COLORS.WALL);
                } else if (type === TYPES.SOFT_WALL) {
                    this.drawTile(x, y, COLORS.SOFT_WALL);
                } else if (type === TYPES.EXIT) {
                    this.drawTile(x, y, COLORS.PLAYER); // Условное обозначение выхода
                }
            }
        }

        // Отрисовка сущностей (Взрывы, Бомбы)
        this.entities.forEach(entity => {
            if (entity.type === 'explosion') {
                const horizontal = DIRS.some(d => d.col !== 0 && entity.row === entity.row + d.row && entity.col === entity.col + d.col);
                const vertical = DIRS.some(d => d.row !== 0 && entity.row === entity.row + d.row && entity.col === entity.col + d.col);
                entity.render(this.context, horizontal, vertical);
            } else if (entity.type === TYPES.BOMB) {
                entity.render(this.context);
            }
        });
        
        // Отрисовка игрока
        this.player.render(this.context);
    }
    
    drawTile(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    }
    
    drawMessage(message) {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = COLORS.WHITE;
        this.context.font = '60px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }
}

// Инициализация игры
// Убедитесь, что в вашем HTML есть <canvas id="gameCanvas"></canvas>
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляр игры.
    // game теперь доступен глобально для управления кнопками: game.startGame(), game.pauseGame(), game.resetGame().
    const game = new BombermanGame('gameCanvas'); 
});