const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

let gameInterval = null;
let isPaused = false;
let score = 0;
let tiltControlEnabled = false; // Флаг для контроля гироскопом
let horizontalVelocity = 0;     // Используется для клавиатурного и тач-управления

// Игрок
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    dx: 0, 
    dy: 0,
    jumping: false
};

const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const KEY_SPEED = 5;

// Платформы
let platforms = [];
const PLATFORM_HEIGHT = 10;
const PLATFORM_TYPES = ["static", "moving", "breakable"];
const PLATFORM_SPEED = 2;

// ===== УПРАВЛЕНИЕ НАКЛОНОМ (ГИРОСКОП) =====

function requestDeviceMotionPermission() {
    const tiltButton = document.getElementById('tiltControlButton');

    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    setupDeviceOrientationListener();
                    alert("Управление наклоном активировано!");
                    tiltButton.style.display = 'none';
                } else {
                    alert("Разрешение на управление наклоном отклонено.");
                }
            })
            .catch(console.error);
    } else {
        // Для Android и других, где запрос не требуется
        setupDeviceOrientationListener();
        alert("Управление наклоном активировано!");
        tiltButton.style.display = 'none';
    }
}

function setupDeviceOrientationListener() {
    tiltControlEnabled = true;
    window.addEventListener("deviceorientation", e => {
        if (!tiltControlEnabled || isPaused) return;

        const gamma = e.gamma; // Наклон влево-вправо
        if (gamma !== null) {
            // Если включен гироскоп, его значение переопределяет player.dx
            player.dx = gamma / 4; 
        }
    });
}


// ===== УПРАВЛЕНИЕ ТАПАМИ (КАСАНИЯМИ) =====

function setupTouchControl() {
    canvas.addEventListener("touchstart", e => {
        if (isPaused || tiltControlEnabled) return;
        e.preventDefault();
        
        // Получаем x-координату первого касания
        const touchX = e.touches[0].clientX - canvas.offsetLeft;
        
        if (touchX < canvas.width / 2) {
            // Касание в левой части
            horizontalVelocity = -KEY_SPEED;
        } else {
            // Касание в правой части
            horizontalVelocity = KEY_SPEED;
        }
    });

    canvas.addEventListener("touchend", e => {
        if (isPaused || tiltControlEnabled) return;
        e.preventDefault();
        
        // Прекращаем движение при отпускании касания
        horizontalVelocity = 0;
    });
}

// ===== Генерация платформ (оставлено без изменений) =====
function generatePlatforms() {
    platforms = [];
    platforms.push({ 
        x: canvas.width / 2 - 40, 
        y: canvas.height - 30, 
        width: 80, 
        height: PLATFORM_HEIGHT, 
        type: "static", 
        dx: 0, 
        broken: false 
    });
    
    for (let i = 1; i < 15; i++) {
        const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
        const width = 40 + Math.random() * 40; 
        const x = Math.random() * (canvas.width - width);
        const y = canvas.height - i * (60 + Math.random() * 20); 
        const dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;
        platforms.push({ x, y, width, height: PLATFORM_HEIGHT, type, dx, broken: false });
    }
}

// ===== Движение игрока =====
function updatePlayer() {
    // Выбираем способ управления: если гироскоп не включен, используем horizontalVelocity (тапы/клавиатура)
    if (!tiltControlEnabled) {
        player.dx = horizontalVelocity;
    }
    
    player.dy += GRAVITY;
    player.y += player.dy;
    player.x += player.dx;

    // Ограничение границ
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Коллизии
    platforms.forEach(p => {
        if (!p.broken &&
            player.dy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + player.dy
        ) {
            player.y = p.y - player.height;
            player.dy = JUMP_STRENGTH; 
            player.jumping = false;
            if (p.type === "breakable") p.broken = true;
        }
    });

    if (player.y > canvas.height) {
        alert("Game Over! Вы достигли уровня: " + score);
        restartGame();
    }
}

// ===== Движение платформ и скроллинг (оставлено без изменений) =====
function updatePlatforms() {
    // Скроллинг
    if (player.y < canvas.height / 2) {
        const dy = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        platforms.forEach(p => p.y += dy);
        score += Math.floor(dy); 
    }

    // Обновление и респаун
    platforms.forEach(p => {
        if (p.type === "moving") {
            p.x += p.dx;
            if (p.x < 0 || p.x + p.width > canvas.width) p.dx *= -1;
        }
        
        if (p.y > canvas.height) {
            const type = PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
            const width = 40 + Math.random() * 40;
            p.x = Math.random() * (canvas.width - width);
            p.y = 0;
            p.width = width;
            p.type = type;
            p.dx = type === "moving" ? (Math.random() < 0.5 ? 1 : -1) * PLATFORM_SPEED : 0;
            p.broken = false;
        }
    });
}

// ===== Рисование (добавлена визуализация зон тапа) =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Добавляем полупрозрачные зоны тапа для мобильных устройств
    if (!tiltControlEnabled) {
        ctx.fillStyle = 'rgba(100, 100, 255, 0.05)'; 
        // Левая зона
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
        // Правая зона
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        
        ctx.fillStyle = 'rgba(100, 100, 255, 0.5)'; 
        ctx.font = "20px Arial";
        ctx.textAlign = 'center';
        ctx.fillText("TAP LEFT", canvas.width / 4, canvas.height / 2);
        ctx.fillText("TAP RIGHT", canvas.width * 3 / 4, canvas.height / 2);
    }


    // Игрок
    ctx.fillStyle = "#3498db"; 
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Платформы
    platforms.forEach(p => {
        if (p.broken) return;
        switch(p.type) {
            case "static": ctx.fillStyle = "#2ecc71"; break; 
            case "moving": ctx.fillStyle = "#e67e22"; break; 
            case "breakable": ctx.fillStyle = "#e74c3c"; break; 
        }
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Счет
    ctx.fillStyle = "#2c3e50";
    ctx.font = "24px Arial";
    ctx.textAlign = 'left';
    ctx.fillText("Score: " + score, 10, 30);
    
    // Пауза
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ecf0f1';
        ctx.textAlign = 'center';
        ctx.font = "40px Arial";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
}

// ===== Управление клавиатурой (оставлено для ПК) =====
document.addEventListener("keydown", e => {
    if (isPaused || tiltControlEnabled) return; // Игнорируем, если включен гироскоп
    
    const key = e.key.toLowerCase();
    
    if (["a", "ф"].includes(key)) horizontalVelocity = -KEY_SPEED;
    if (["d", "в"].includes(key)) horizontalVelocity = KEY_SPEED;
});

document.addEventListener("keyup", e => {
    if (tiltControlEnabled) return; // Игнорируем, если включен гироскоп
    
    const key = e.key.toLowerCase();
    
    if (["a", "ф"].includes(key) && horizontalVelocity < 0) horizontalVelocity = 0;
    if (["d", "в"].includes(key) && horizontalVelocity > 0) horizontalVelocity = 0;
});


// ===== Основной цикл (оставлено без изменений) =====
function gameLoop() {
    if (!isPaused) {
        updatePlayer();
        updatePlatforms();
        draw();
    }
    gameInterval = requestAnimationFrame(gameLoop);
}

// ===== Управление игрой (Глобальный доступ) =====
function startGame() {
    if (gameInterval) cancelAnimationFrame(gameInterval);
    isPaused = false;
    gameInterval = requestAnimationFrame(gameLoop);
}

function pauseGame() {
    isPaused = !isPaused;
    if (!isPaused) {
        startGame();
    } else {
        cancelAnimationFrame(gameInterval);
        gameInterval = null;
        draw();
    }
}

function restartGame() {
    if (gameInterval) cancelAnimationFrame(gameInterval);
    gameInterval = null;
    isPaused = false;
    score = 0;
    
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 50;
    player.dx = 0;
    player.dy = 0;
    player.jumping = false;
    horizontalVelocity = 0; // Сброс скорости для тапов/клавиатуры
    
    generatePlatforms();
    startGame();
}

// ===== Инициализация =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

document.addEventListener('DOMContentLoaded', () => {
    const tiltButton = document.getElementById('tiltControlButton');
    
    if (tiltButton) {
        tiltButton.addEventListener('click', requestDeviceMotionPermission);
    } 

    setupTouchControl(); // Активируем управление тапами
    generatePlatforms();
    startGame();
});