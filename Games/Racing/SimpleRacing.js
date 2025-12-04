// Games/Racing/SimpleRacing.js
import { saveScore } from "../../scores.js";

(function () {
  // DOM refs (must exist in HTML)
  const carEl = document.getElementById('car');
  const carsEl = document.getElementById('cars');
  const roadEl = document.getElementById('road');
  const mountainsEl = document.getElementById('mountains');
  const kmEl = document.getElementById('km');
  const positionEl = document.getElementById('position');
  const lapEl = document.getElementById('lap');
  const fogEl = document.getElementById('fog');
  const gameOverEl = document.getElementById('gameOverMessage');

  // safety: if required elements missing, warn
  const required = { carEl, carsEl, roadEl, kmEl, positionEl, lapEl, fogEl };
  for (const [k, v] of Object.entries(required)) {
    if (!v) console.warn(`SimpleRacing: missing element ${k}`);
  }

  // small helper: ensure element has style defaults for our sprites
  function ensureCarCss() {
    if (carsEl) {
      const style = document.createElement('style');
      style.innerHTML = `
        #cars .car { background-size: cover; background-position: center; width: 40px; height: 70px; position: absolute; transform-origin: center; }
        #car { background-size: cover; background-position: center; width: 50px; height: 90px; position: absolute; transform-origin: center; z-index: 10; }
      `;
      document.head.appendChild(style);
    }
  }
  ensureCarCss();

  // utilities
  function safeBlock(){ window.scrollBlock?.block(); }
  function safeUnblock(){ window.scrollBlock?.unblock(); }

  // ----------------------------
  // Sprite generation (Canvas)
  // ----------------------------
  // Draw a detailed enemy car (40x70)
  function drawEnemyCarSprite() {
    const w = 40, h = 70;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // background shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(3, h - 8, w - 6, 6);

    // body base
    ctx.fillStyle = '#c0c0c0';
    roundRect(ctx, 6, 8, 28, 48, 6, true, false);

    // roof / windshield
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(28, 12);
    ctx.lineTo(26, 26);
    ctx.lineTo(14, 26);
    ctx.closePath();
    ctx.fill();

    // bonnet highlight
    const g = ctx.createLinearGradient(6, 8, 34, 56);
    g.addColorStop(0, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    roundRect(ctx, 8, 18, 24, 20, 4, true, false);

    // stripes
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(18, 20, 4, 28);

    // wheels
    ctx.fillStyle = '#111';
    roundRect(ctx, 6, 18, 6, 12, 2, true, false);
    roundRect(ctx, 28, 18, 6, 12, 2, true, false);
    roundRect(ctx, 6, 42, 6, 12, 2, true, false);
    roundRect(ctx, 28, 42, 6, 12, 2, true, false);

    // headlights
    ctx.fillStyle = 'rgba(255,230,120,0.95)';
    roundRect(ctx, 14, 7, 4, 4, 1.5, true, false);
    roundRect(ctx, 22, 7, 4, 4, 1.5, true, false);

    // return dataURL
    return c.toDataURL();
  }

  // Draw a detailed player car (50x90) - bigger, more fancy
  function drawPlayerCarSprite() {
    const w = 50, h = 90;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(6, h - 12, w - 12, 8);

    // main body
    ctx.fillStyle = '#33d14a'; // default green - will be changed by hue-rotate later
    roundRect(ctx, 8, 12, 34, 62, 10, true, false);

    // windshield
    ctx.fillStyle = 'rgba(190,220,255,0.95)';
    roundRect(ctx, 14, 20, 22, 26, 6, true, false);

    // bonnet & rear details
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(20, 36, 10, 24);

    // decorative stripe
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(17, 36, 4, 28);
    ctx.fillRect(29, 36, 4, 28);

    // wheels (slightly bigger)
    ctx.fillStyle = '#131313';
    roundRect(ctx, 8, 26, 8, 20, 3, true, false);
    roundRect(ctx, 34, 26, 8, 20, 3, true, false);
    roundRect(ctx, 8, 54, 8, 20, 3, true, false);
    roundRect(ctx, 34, 54, 8, 20, 3, true, false);

    // headlights
    ctx.fillStyle = 'rgba(255,240,140,0.98)';
    roundRect(ctx, 20, 10, 10, 6, 3, true, false);

    // small badge
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, 22, 46, 6, 12, 2, true, false);

    // return dataURL
    return c.toDataURL();
  }

  // small utility: rounded rect
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // pre-generate sprites once
  const PLAYER_SPRITE = drawPlayerCarSprite();
  const ENEMY_SPRITE = drawEnemyCarSprite();

  // ----------------------------
  // Car object (player)
  // ----------------------------
  const car = {
    init() {
      this.speed = 0.2;
      this.x = carEl ? (parseInt(carEl.style.left, 10) || carEl.offsetLeft || 120) : 120;
      this.y = 0;
      this.width = carEl ? (carEl.offsetWidth || 50) : 60;
      this.height = carEl ? (carEl.offsetHeight || 90) : 28;
      this.maxSpeed = 5.0;
      this.km = 0;
      this.motor = 1;
      this.crashed = false;
      this.acc = 0.025;
      this.break = 0.02;
      this.sx = 0;
      this.position = 200;

      // ensure player sprite applied
      if (carEl) {
        carEl.style.backgroundImage = `url(${PLAYER_SPRITE})`;
        carEl.style.width = this.width + 'px';
        carEl.style.height = this.height + 'px';
        carEl.style.bottom = '40px';
      }
    },
    frame() {
      this.motor *= -1;
      if (carEl) {
        carEl.style.left = parseInt(this.x) + 'px';
        carEl.style.transform = `scaleX(${this.motor})`;
      }
      this.steer();
    },
    steer() {
      this.x += this.sx;
      if (roadEl && roadEl.P0) roadEl.P0.x -= this.sx / 4;
    },
    crash(d) {
      if (!this.crashed) {
        this.crashed = true;
        this.speed = 0.2;
        this.sx = d || 0;
        try {
          saveScore("simpleracing", Math.floor(this.km));
        } catch (e) {
          console.warn("saveScore failed", e);
        }
        safeUnblock();
        setTimeout(() => {
          this.crashed = false;
          this.sx = 0;
        }, 800);
      }
    }
  };

  // ----------------------------
  // Opponent cars manager
  // ----------------------------
  const cars = {
    init() {
      this.n = 32;
      this.speed = 1;
      this.oponents = [];
      this.easy = 0.2;
      // create grid of opponents
      for (let j = 0; j < this.n; j++) {
        this.oponents[j] = [];
        for (let i = 0; i < 3; i++) {
          this.oponents[j][i] = this.create(i, j);
        }
      }
      // dynamic style used by original script
      car.st = document.createElement('style');
      document.body.appendChild(car.st);
      this.builded = true;
    },
    frame() {
      const relative = this.speed - car.speed;
      for (let j = 0; j < this.n; j++) {
        for (let i = 0; i < 3; i++) {
          const c = this.oponents[j][i];
          if (!c) continue;
          const d = (roadEl && roadEl.width) ? roadEl.width * 0.42 : 100;
          const w = ((roadEl && roadEl.width) ? roadEl.width : 300) - d - car.width;
          c.x = (roadEl && roadEl.P0 ? roadEl.P0.x : 150) * (c.y * c.y * 0.00001) + (d / 2) + (i * (w / 2));
          c.y += relative;
          const h = this.n * car.height * 3;

          if (!c.classList.contains('hidden') && c.y < car.height - 5 && c.y > 0) {
            if (car.x < 115 && i === 0) car.crash(0.1);
            if (car.x > 100 && car.x < 175 && i === 1) car.crash();
            if (car.x > 165 && i === 2) car.crash(-0.1);
          }
          if (c.y > h) {
            this.color(c);
            c.classList.remove('hidden');
            if (car.x < 115 && i === 0) c.classList.add('hidden');
            if (car.x > 100 && car.x < 175 && i === 1) c.classList.add('hidden');
            if (car.x > 165 && i === 2) c.classList.add('hidden');
            if (Math.random() > this.easy) c.classList.add('hidden');
            if (!c.classList.contains('hidden')) car.position++;
            c.y = 0;
          } else if (c.y < 0) {
            if (!c.classList.contains('hidden')) car.position--;
            this.color(c);
            c.classList.remove('hidden');
            if (Math.random() > this.easy) c.classList.add('hidden');
            c.y = h;
            this.color(c);
          }
          c.style.left = parseInt(c.x) + 'px';
          c.style.bottom = parseInt(c.y) + 'px';
          const o = 1 / (c.y * (fogEl && fogEl.value ? fogEl.value : 0.02));
          c.style.opacity = Math.min(o, 1);
        }
        if (!this.oponents[j][0].classList.contains('hidden') &&
            !this.oponents[j][1].classList.contains('hidden') &&
            !this.oponents[j][2].classList.contains('hidden')) {
          this.oponents[j][parseInt(Math.random() * 3)].classList.add('hidden');
        }
      }
      if (car.st) car.st.innerHTML = '#cars .car {transform: rotateX(-56deg) scaleX(' + car.motor + ') }';
      if (carEl) carEl.style.left = parseInt(car.x) + 'px';
    },
    create(i, j) {
      const c = document.createElement('div');
      c.className = 'car';
      // size & sprite
      c.style.width = '40px';
      c.style.height = '70px';
      c.style.backgroundImage = `url(${ENEMY_SPRITE})`;
      c.style.backgroundSize = 'cover';
      c.style.position = 'absolute';
      // initial placement
      const d = (roadEl && roadEl.width) ? (roadEl.width * 0.42) : 120;
      const w = ((roadEl && roadEl.width) ? roadEl.width : 300) - d - car.width;
      c.x = (d / 2) + (i * (w / 2));
      c.y = -car.height + (j * car.height * 3);
      carsEl && carsEl.appendChild(c);
      if (Math.random() > 0.1) c.classList.add('hidden');
      if ((i === 1 && j === 0) || (i === 1 && j === 1)) c.classList.add('hidden');
      return c;
    },
    color(c) {
      // keep original approach: apply hue-rotate + brightness to diversify colors
      const randomColor = Math.random() * 360;
      const randomLight = 2.0 + (Math.random() * 1.5);
      c.style.filter = 'hue-rotate(' + randomColor + 'deg) brightness(' + randomLight + ')';
    }
  };

  // ----------------------------
  // Road (canvas)
  // ----------------------------
  if (roadEl) {
    roadEl.init = function() {
      // if it's a canvas element, set width/height attributes
      if (roadEl.getContext) {
        roadEl.ctx = roadEl.getContext('2d');
      } else {
        console.warn('roadEl has no getContext — road rendering disabled');
      }
      roadEl.width = roadEl.offsetWidth || parseInt(roadEl.style.width) || 360;
      roadEl.height = roadEl.offsetHeight || parseInt(roadEl.style.height) || 640;
      // ensure canvas element uses pixel sizes
      if (roadEl.width && roadEl.getContext) {
        roadEl.width = roadEl.offsetWidth;
        roadEl.height = roadEl.offsetHeight;
        roadEl.ctx = roadEl.getContext('2d');
      }
      roadEl.state = 0;
      roadEl.x = 0;
      roadEl.offset = 40;
      roadEl.lineWidth = 2.5;
      roadEl.lineColor = 'rgba(255,255,255,0.85)';
      roadEl.lineDashOffset = 0;
      roadEl.P0 =  {x: parseInt(roadEl.width/2), y: 0, xs: 0};
      roadEl.P1 =  {x: roadEl.offset, y: roadEl.height};
      roadEl.P2 =  {x: roadEl.width - roadEl.offset, y: roadEl.height};
      roadEl.Pc =  {x1: roadEl.P1.x + 86, x2: roadEl.P2.x - 86};
    };
    roadEl.frame = function() {
      if (!roadEl.ctx) return;
      roadEl.P0.x  += roadEl.P0.xs/2;
      roadEl.Pc.x1 -= roadEl.P0.xs/3;
      roadEl.Pc.x2 -= roadEl.P0.xs/3;
      roadEl.lineDashOffset -= car.speed;

      roadEl.ctx.clearRect(0,0,roadEl.width,roadEl.height);
      roadEl.ctx.beginPath();
      roadEl.ctx.moveTo(roadEl.P1.x, roadEl.P1.y);
      roadEl.ctx.bezierCurveTo(roadEl.Pc.x1, roadEl.P1.y - (roadEl.height*0.7),
                               roadEl.P0.x, roadEl.P0.y,
                               roadEl.P0.x, roadEl.P0.y);
      roadEl.ctx.moveTo(roadEl.P2.x, roadEl.P2.y);
      roadEl.ctx.bezierCurveTo(roadEl.Pc.x2, roadEl.P2.y - (roadEl.height*0.7),
                               roadEl.P0.x, roadEl.P0.y,
                               roadEl.P0.x, roadEl.P0.y);
      roadEl.ctx.strokeStyle = roadEl.lineColor;
      roadEl.ctx.lineWidth = roadEl.lineWidth;
      roadEl.ctx.setLineDash([roadEl.lineWidth, roadEl.lineWidth]);
      roadEl.ctx.lineDashOffset = roadEl.lineDashOffset * -0.5;
      roadEl.ctx.stroke();
    };
    roadEl.curve = function(side) {
      if (!(roadEl.state == -1 && side == 'left') &&
          !(roadEl.state == 1 && side == 'right')) {
        if (roadEl.state == 1 && side == 'left') roadEl.state = 0;
        else if (roadEl.state == -1 && side == 'right') roadEl.state = 0;
        else if (roadEl.state == 0 && side == 'left') roadEl.state = -1;
        else if (roadEl.state == 0 && side == 'right') roadEl.state = 1;
        roadEl.P0.xs = 1.5 * ((side == 'left') ? -1 : 1);
      }
      roadEl.randomCurve();
      setTimeout(function(){ roadEl.P0.xs = 0; }, 1000);
    };
    roadEl.randomCurve = function(){
      game.curveCount = setTimeout(function(){ roadEl.curve(Math.random()>0.5 ? 'left' : 'right'); }, 2000);
    };
  }

  // Mountains frame
  mountainsEl && (mountainsEl.frame = function() {
    const curve = (roadEl.P0.x - roadEl.width/2)/100;
    let left = mountainsEl.offsetLeft;
    if (left < -4.5 * roadEl.width) left = 1.5 * roadEl.width;
    if (left > 1.5 * roadEl.width) left = -4.5 * roadEl.width;
    const d = curve + ((car.speed)*curve*0.5);
    mountainsEl.style.left = parseInt(left - d) + 'px';
  });

  // UI frames
  kmEl && (kmEl.frame = function(){
    car.km += (car.speed/1000);
    let value = parseInt(car.km * 10).toString();
    while (value.length < kmEl.querySelectorAll('span').length - 0) value = '0' + value;
    const digits = kmEl.querySelectorAll('span');
    for (let i=0;i<digits.length;i++){
      digits[i].innerText = value[i] || '0';
    }
  });

  positionEl && (positionEl.init = function(){
    cars.total = 200;
    car.position = cars.total;
  });
  positionEl && (positionEl.frame = function(){
    const value = parseInt(car.position).toString();
    const digits = positionEl.querySelectorAll('span');
    for (let i=0;i<digits.length && i<value.length;i++){
      digits[i].innerText = value[i];
    }
  });

  lapEl && (lapEl.init = function(){
    lapEl.value = 1;
  });
  lapEl && (lapEl.frame = function(){
    if (car.position <= 0) {
      lapEl.value++;
      car.easy += 0.5;
      car.position = 200;
    }
    lapEl.innerText = lapEl.value;
  });

  // Fog
  if (fogEl) {
    fogEl.init = function() { fogEl.value = 0.02; fogEl.status = false; };
    fogEl.toggle = function() { fogEl.classList.toggle('hidden'); fogEl.status = !fogEl.status; fogEl.value = fogEl.status ? 0.1 : 0.02; };
  }

  // Frame loop
  let rafId = null;
  let running = false;
  function loop(){
    if (!running) return;
    try { key.frame(); } catch(e){}
    try { car.frame(); } catch(e){}
    try { cars.frame(); } catch(e){}
    try { mountainsEl && mountainsEl.frame && mountainsEl.frame(); } catch(e){}
    try { roadEl.frame(); } catch(e){}
    try { kmEl && kmEl.frame && kmEl.frame(); } catch(e){}
    try { positionEl && positionEl.frame && positionEl.frame(); } catch(e){}
    try { lapEl && lapEl.frame && lapEl.frame(); } catch(e){}
    rafId = requestAnimationFrame(loop);
  }

  // Keyboard input
  const key = {
    pressed: {},
    frame() {
      if (!car.crashed) {
        car.sx = 0;
        if (car.x > (roadEl.width * 0.15)) {
          if (key.pressed['left'] || key.pressed[37] || key.pressed[65]) car.sx = -2.5;
        } else car.crash(0.2);
        if (car.x < ((roadEl.width * 0.85) - car.width)) {
          if (key.pressed['right'] || key.pressed[39] || key.pressed[68]) car.sx = 2.5;
        } else car.crash(-0.2);

        if (key.pressed['up'] || key.pressed[32] || key.pressed[38] || key.pressed[87]) {
          if (car.speed < car.maxSpeed) car.speed += car.acc;
        } else {
          if (car.speed > 0.2) car.speed -= car.break;
        }
      }
    }
  };

  window.addEventListener('keydown', function(e){ key.pressed[e.keyCode] = true; if (e.key === 'ArrowLeft') key.pressed['left']=true; if (e.key === 'ArrowRight') key.pressed['right']=true; if (e.key === 'ArrowUp' || e.key === ' ') key.pressed['up']=true; });
  window.addEventListener('keyup', function(e){ key.pressed[e.keyCode] = false; if (e.key === 'ArrowLeft') key.pressed['left']=false; if (e.key === 'ArrowRight') key.pressed['right']=false; if (e.key === 'ArrowUp' || e.key === ' ') key.pressed['up']=false; });

  // Optional on-screen buttons
  ['left','up','right'].forEach(id=>{
    const btn = document.getElementById(id);
    if (!btn) return;
    const press = ()=> key.pressed[id] = true;
    const release = ()=> key.pressed[id] = false;
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('touchstart', press, {passive:true});
    btn.addEventListener('touchend', release);
  });

  // Legacy clickstart if exists
  const clickstart = document.getElementById('click');
  if (clickstart) {
    clickstart.addEventListener('click', function(){
      if (!running) {
        clickstart.innerText = 'Click to Pause';
        running = true;
        if (!cars.builded) cars.init();
        if (car) car.init();
        if (!roadEl.P0) roadEl.init();
        loop();
      } else {
        clickstart.innerText = 'Click to Start!';
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    });
  }

  // Game object and helpers
  const game = {};
  game.colors = [
    ['#228','#040',1],
    ['#93c','#440',0.5],
    ['#546','#111',0.2],
    ['#888','#aaa',0.2],
    ['#545','#111',0.2],
    ['#529','#230',0.3],
    ['#aaf','#eee',0.2]
  ];
  game.changeTime = function(){
    if (!running) return;
    game.time = (game.time || 0) + 1;
    if (game.time >= game.colors.length) game.time = 0;
    if (sky) sky.style.background = game.colors[game.time][0];
    if (terrain) terrain.style.background = game.colors[game.time][1];
    if (mountainsEl) mountainsEl.style.opacity = game.colors[game.time][2];
    if (game.time === 3 || game.time === 4) fogEl && fogEl.toggle && fogEl.toggle();
    if (game.time === 2 || game.time === 4) carsEl && carsEl.classList.add('night');
    else carsEl && carsEl.classList.remove('night');
    game.timeCount = setTimeout(game.changeTime, 30000);
  };

  game.init = function(){
    if (car.init) car.init();
    if (!cars.builded) cars.init();
    if (roadEl.init) roadEl.init();
    if (positionEl.init) positionEl.init();
    if (lapEl.init) lapEl.init();
    if (fogEl && fogEl.init) fogEl.init();
    if (cars.frame) cars.frame();
  };

  // API for gameControls.js
  window.startGame = function(){
    if (running) return;
    running = true;
    safeBlock();
    game.init();
    if (!rafId) loop();
  };

  window.pauseGame = function(){
    if (!running) return;
    running = false;
    safeUnblock();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  };

  window.restartGame = function(){
    running = false;
    safeUnblock();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    clearTimeout(game.curveCount); clearTimeout(game.timeCount);
    // remove dynamic nodes
    if (car.st && car.st.parentNode) car.st.parentNode.removeChild(car.st);
    // reset car values & dom
    car.init();
    // remove opponent nodes
    try { while (carsEl && carsEl.firstChild) carsEl.removeChild(carsEl.firstChild); } catch(e){}
    cars.builded = false;
    cars.init();
    roadEl.init();
    positionEl.init();
    lapEl.init();
    fogEl && fogEl.init && fogEl.init();
    if (mountainsEl) mountainsEl.style.left = '0px';
    // reset hud digits
    if (kmEl) {
      kmEl.querySelectorAll('span').forEach(s=> s.innerText='0');
    }
    safeBlock();
    running = true;
    if (!rafId) loop();
  };

  // final init
  game.init();

  // expose for debug
  window.__simpleRacingGame = { car, cars, roadEl, game };

})();
