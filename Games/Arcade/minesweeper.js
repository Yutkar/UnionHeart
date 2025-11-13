const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let tileSize = 30;
let rows, cols, numMines;
let board = [];
let revealed = [];
let flags = [];
let gameOver = false;
let gameInterval = null;
let isPaused = false;

// ===== Сложность =====
function setDifficulty(level){
    if(level==="easy"){ rows=8; cols=8; numMines=10; }
    else if(level==="medium"){ rows=16; cols=16; numMines=40; }
    else if(level==="hard"){ rows=16; cols=30; numMines=99; }
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    initBoard();
}

// ===== Инициализация =====
function initBoard(){
    board = Array(rows).fill().map(()=>Array(cols).fill(0));
    revealed = Array(rows).fill().map(()=>Array(cols).fill(false));
    flags = Array(rows).fill().map(()=>Array(cols).fill(false));
    gameOver = false;

    let placed = 0;
    while(placed<numMines){
        let r = Math.floor(Math.random()*rows);
        let c = Math.floor(Math.random()*cols);
        if(board[r][c]!==-1){
            board[r][c]=-1;
            placed++;
        }
    }

    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(board[r][c]===-1) continue;
            let count = 0;
            for(let dr=-1;dr<=1;dr++){
                for(let dc=-1;dc<=1;dc++){
                    let nr=r+dr,nc=c+dc;
                    if(nr>=0 && nr<rows && nc>=0 && nc<cols && board[nr][nc]===-1) count++;
                }
            }
            board[r][c]=count;
        }
    }
}

// ===== Отрисовка =====
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            ctx.strokeStyle="white";
            ctx.strokeRect(c*tileSize,r*tileSize,tileSize,tileSize);

            if(revealed[r][c]){
                if(board[r][c]===-1){
                    ctx.fillStyle="red";
                    ctx.fillRect(c*tileSize,r*tileSize,tileSize,tileSize);
                } else {
                    ctx.fillStyle="gray";
                    ctx.fillRect(c*tileSize,r*tileSize,tileSize,tileSize);
                    if(board[r][c]>0){
                        ctx.fillStyle="black";
                        ctx.font="16px Arial";
                        ctx.fillText(board[r][c],c*tileSize+10,r*tileSize+20);
                    }
                }
            } else if(flags[r][c]){
                ctx.fillStyle="yellow";
                ctx.fillRect(c*tileSize,r*tileSize,tileSize,tileSize);
            } else {
                ctx.fillStyle="darkgray";
                ctx.fillRect(c*tileSize,r*tileSize,tileSize,tileSize);
            }
        }
    }
}

// ===== Логика =====
function revealCell(r,c){
    if(r<0||r>=rows||c<0||c>=cols||revealed[r][c]||flags[r][c]) return;
    revealed[r][c]=true;
    if(board[r][c]===-1){
        gameOver=true;
        alert("Вы проиграли!");
    } else if(board[r][c]===0){
        for(let dr=-1;dr<=1;dr++){
            for(let dc=-1;dc<=1;dc++){
                revealCell(r+dr,c+dc);
            }
        }
    }
}

// ===== Клики мыши =====
canvas.addEventListener("click", e=>{
    if(gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX-rect.left;
    const y = e.clientY-rect.top;
    const c = Math.floor(x/tileSize);
    const r = Math.floor(y/tileSize);
    revealCell(r,c);
});

canvas.addEventListener("contextmenu", e=>{
    e.preventDefault();
    if(gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX-rect.left;
    const y = e.clientY-rect.top;
    const c = Math.floor(x/tileSize);
    const r = Math.floor(y/tileSize);
    flags[r][c]=!flags[r][c];
});

// ===== Для телефонов =====
let touchStartTime=0;
canvas.addEventListener("touchstart", e=>{
    touchStartTime=Date.now();
});
canvas.addEventListener("touchend", e=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.changedTouches[0].clientX-rect.left;
    const y = e.changedTouches[0].clientY-rect.top;
    const c = Math.floor(x/tileSize);
    const r = Math.floor(y/tileSize);
    if(Date.now()-touchStartTime>500) flags[r][c]=!flags[r][c];
    else revealCell(r,c);
});

// ===== Проверка победы =====
function checkWin(){
    let safeCells=0;
    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(board[r][c]!==-1 && revealed[r][c]) safeCells++;
        }
    }
    if(safeCells===rows*cols-numMines && !gameOver){
        alert("Вы выиграли!");
        gameOver=true;
    }
}

// ===== Основной цикл =====
function gameLoop(){
    draw();
    checkWin();
}

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(gameLoop, 100);
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(gameLoop, 100);
        isPaused = false;
    } else {
        clearInterval(gameInterval);
        gameInterval = null;
        isPaused = true;
    }
}

function restartGame() {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = false;
    setDifficulty("easy"); // можно сменить на "medium" или "hard"
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Старт игры =====
setDifficulty("easy");
startGame();
