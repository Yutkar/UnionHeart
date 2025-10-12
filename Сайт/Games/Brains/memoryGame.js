const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

const ROWS = 4;
const COLS = 4;
const CARD_SIZE = canvas.width / COLS;

let cards = [];
let firstCard = null;
let secondCard = null;
let moves = 0;
let gameInterval = null;
let isPaused = false;

// ===== Инициализация карточек =====
function initCards(){
    let values = [];
    for(let i=1;i<=ROWS*COLS/2;i++){
        values.push(i);
        values.push(i);
    }
    values.sort(()=>Math.random()-0.5);

    cards = [];
    for(let r=0;r<ROWS;r++){
        cards[r]=[];
        for(let c=0;c<COLS;c++){
            cards[r][c]={value: values.pop(), revealed:false, matched:false};
        }
    }
    moves = 0;
    firstCard = null;
    secondCard = null;
}

// ===== Рисуем карточки =====
function drawCards(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLS;c++){
            const card = cards[r][c];
            ctx.fillStyle = card.revealed || card.matched ? "white" : "gray";
            ctx.fillRect(c*CARD_SIZE, r*CARD_SIZE, CARD_SIZE-5, CARD_SIZE-5);
            ctx.strokeStyle="black";
            ctx.strokeRect(c*CARD_SIZE, r*CARD_SIZE, CARD_SIZE-5, CARD_SIZE-5);

            if(card.revealed || card.matched){
                ctx.fillStyle="black";
                ctx.font="30px Arial";
                ctx.textAlign="center";
                ctx.textBaseline="middle";
                ctx.fillText(card.value, c*CARD_SIZE+CARD_SIZE/2, r*CARD_SIZE+CARD_SIZE/2);
            }
        }
    }

    ctx.fillStyle="black";
    ctx.font="20px Arial";
    ctx.fillText("Moves: "+moves, 10, 20);
}

// ===== Обработка клика =====
function clickCard(x,y){
    const c = Math.floor(x / CARD_SIZE);
    const r = Math.floor(y / CARD_SIZE);
    const card = cards[r][c];
    if(card.revealed || card.matched || secondCard) return;

    card.revealed = true;

    if(!firstCard){
        firstCard = {r,c};
    } else {
        secondCard = {r,c};
        moves++;

        const first = cards[firstCard.r][firstCard.c];
        const second = cards[secondCard.r][secondCard.c];

        if(first.value === second.value){
            first.matched = true;
            second.matched = true;
            firstCard = null;
            secondCard = null;
            if(checkWin()){
                setTimeout(()=>alert("Вы выиграли за "+moves+" ходов!"),100);
            }
        } else {
            setTimeout(()=>{
                first.revealed=false;
                second.revealed=false;
                firstCard=null;
                secondCard=null;
                drawCards();
            }, 800);
        }
    }
    drawCards();
}

function checkWin(){
    return cards.flat().every(c=>c.matched);
}

// ===== События =====
canvas.addEventListener("click", e=>{
    if (isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    clickCard(x,y);
});

canvas.addEventListener("touchstart", e=>{
    if (isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    clickCard(x,y);
});

// ===== Управление игрой =====
function startGame() {
    if (!gameInterval) {
        drawCards();
        gameInterval = setInterval(() => {}, 1000); // просто для управления паузой
    }
}

function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(() => {}, 1000);
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
    initCards();
    drawCards();
    startGame();
}

// ===== Глобальный доступ =====
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = restartGame;

// ===== Инициализация =====
initCards();
drawCards();
