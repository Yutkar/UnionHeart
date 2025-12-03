// simpleRacing.js
import { saveScore } from "../../scores.js";

// ======== Simple Racing (refactored) ========
(function () {
  // ---------- DOM ----------
  const carEl = document.getElementById('car');
  const carsEl = document.getElementById('cars');
  const roadEl = document.getElementById('road');
  const mountains = document.getElementById('mountains');
  const kmEl = document.getElementById('km');
  const positionEl = document.getElementById('position');
  const lapEl = document.getElementById('lap');
  const fogEl = document.getElementById('fog');
  const gameEl = document.getElementById('game');
  const sky = document.getElementById('sky');
  const terrain = document.getElementById('terrain');

  if (!carEl || !carsEl || !roadEl || !kmEl || !positionEl || !lapEl || !fogEl || !gameEl) {
    console.warn('simpleRacing: some DOM elements are missing — ensure HTML contains required elements.');
  }

  // ---------- Utility scroll helpers ----------
  function safeBlock() { window.scrollBlock?.block(); }
  function safeUnblock() { window.scrollBlock?.unblock(); }

  // ---------- Car ----------
  const car = carEl || {};
  car.init = function () {
    car.speed = 0.2;
    car.turn = 0;
    car.x = (car.offsetLeft !== undefined) ? car.offsetLeft : 120;
    car.y = 0;
    car.width = (car.offsetWidth !== undefined) ? car.offsetWidth : 60;
    car.height = (car.offsetHeight !== undefined) ? car.offsetHeight : 30;
    car.maxSpeed = 5.0;
    car.km = 0;
    car.motor = 1;
    car.crashed = false;
    car.acc = 0.025;
    car.break = 0.02;
    car.sx = 0;
    car.position = 200;
  };
  car.frame = function () {
    // flip sprite motor for visual effect
    car.motor *= -1;
    if (carEl) {
      carEl.style.left = parseInt(car.x) + 'px';
      carEl.style.transform = 'scaleX(' + car.motor + ')';
    }
    car.steer && car.steer();
  };
  car.steer = function () {
    car.x += car.sx;
    if (roadEl && roadEl.P0) roadEl.P0.x -= car.sx / 4;
  };
  car.crash = function (d) {
    if (!car.crashed) {
      car.crashed = true;
      car.speed = 0.2;
      car.sx = d ? d : 0;
      if (game.audio && game.audio.oscillator) {
        try { game.audio.oscillator.frequency.value = 15; } catch (e) {}
      }
      // save score ONCE per crash
      try {
        saveScore("simpleracing", Math.floor(car.km));
      } catch (e) {
        console.warn("saveScore failed", e);
      }
      safeUnblock();
      setTimeout(function () {
        try { if (game.audio && game.audio.oscillator) game.audio.oscillator.frequency.value = 60; } catch (e) {}
        car.crashed = false;
        car.sx = 0;
      }, 800);
    }
  };

  // ---------- Cars (opponents) ----------
  const cars = carsEl || { oponts: [] };
  cars.init = function () {
    cars.n = 32;
    cars.x = 0;
    cars.speed = 1;
    cars.interval = 500;
    cars.oponents = [];
    cars.easy = 0.2;
    for (let j = 0; j < cars.n; j++) {
      cars.oponents[j] = [];
      for (let i = 0; i < 3; i++) {
        cars.oponents[j][i] = cars.create(i, j);
      }
    }
    // style placeholder: used originally for dynamic transform
    car.st = document.createElement('style');
    document.body.appendChild(car.st);
    cars.builded = true;
  };
  cars.frame = function () {
    const relative = cars.speed - car.speed;
    for (let j = 0; j < cars.n; j++) {
      for (let i = 0; i < 3; i++) {
        const c = cars.oponents[j][i];
        if (!c) continue;
        const d = road.width * 0.42 || 100;
        const w = (road.width || 300) - d - car.width;
        c.x = (road.P0.x - road.height - 40) * (c.y * c.y * 0.00001) +
          (d / 2) + (i * (w / 2));
        c.y += relative;
        const h = cars.n * car.height * 3;
        if (!c.classList.contains('hidden') && c.y < car.height - 5 && c.y > 0) {
          // collision by lane
          if (car.x < 115 && i === 0) car.crash(0.1);
          if (car.x > 100 && car.x < 175 && i === 1) car.crash();
          if (car.x > 165 && i === 2) car.crash(-0.1);
        }
        if (c.y > h) {
          // back to bottom
          cars.color(c);
          c.classList.remove('hidden');
          if (car.x < 115 && i === 0) c.classList.add('hidden');
          if (car.x > 100 && car.x < 175 && i === 1) c.classList.add('hidden');
          if (car.x > 165 && i === 2) c.classList.add('hidden');
          if (Math.random() > cars.easy) c.classList.add('hidden');
          if (!c.classList.contains('hidden')) car.position++;
          c.y = 0;
        } else if (c.y < 0) {
          // passing
          if (!c.classList.contains('hidden')) car.position--;
          cars.color(c);
          c.classList.remove('hidden');
          if (Math.random() > cars.easy) c.classList.add('hidden');
          c.y = h;
          cars.color(c);
        }
        c.style.left = parseInt(c.x) + 'px';
        c.style.bottom = parseInt(c.y) + 'px';
        const o = 1 / (c.y * (fog.value || 0.02));
        c.style.opacity = Math.min(o, 1);
      }
      if (!cars.oponents[j][0].classList.contains('hidden') &&
        !cars.oponents[j][1].classList.contains('hidden') &&
        !cars.oponents[j][2].classList.contains('hidden')) {
        cars.oponents[j][parseInt(Math.random() * 3)].classList.add('hidden');
      }
    }
    if (car.st) car.st.innerHTML = '#cars .car {transform: rotateX(-56deg) scaleX(' + car.motor + ') }';
    if (carEl) carEl.style.left = parseInt(car.x) + 'px';
  };
  cars.create = function (i, j) {
    const c = document.createElement('div');
    c.className = 'car';
    cars.color(c);
    const d = (road.width || 300) * 0.42,
      w = (road.width || 300) - d - car.width;
    c.x = (d / 2) + (i * (w / 2));
    c.y = -car.height + (j * car.height * 3);
    carsEl && carsEl.appendChild(c);
    if (Math.random() > 0.1) c.classList.add('hidden');
    if ((i === 1 && j === 0) || (i === 1 && j === 1)) c.classList.add('hidden');
    return c;
  };
  cars.color = function (c) {
    const randomColor = Math.random() * 360;
    const randomLight = 2.5 + (Math.random() * 2);
    c.style.filter = 'hue-rotate(' + randomColor + 'deg) brightness(' + randomLight + ')';
  };

  // ---------- Road ----------
  roadEl.init = function () {
    roadEl.ctx = roadEl.getContext('2d');
    roadEl.width = roadEl.offsetWidth;
    roadEl.height = roadEl.offsetHeight;
    roadEl.state = 0;
    roadEl.x = 0;
    roadEl.offset = 40;
    roadEl.lineWidth = 2.5;
    roadEl.lineColor = 'rgba(255,255,255,0.7)';
    roadEl.lineDashOffset = 0;
    roadEl.P0 = { x: parseInt(roadEl.width / 2), y: 0, xs: 0 };
    roadEl.P1 = { x: roadEl.offset, y: roadEl.height };
    roadEl.P2 = { x: roadEl.width - roadEl.offset, y: roadEl.height };
    roadEl.Pc = { x1: roadEl.P1.x + 86, x2: roadEl.P2.x - 86 };
  };
  roadEl.frame = function () {
    roadEl.P0.x += roadEl.P0.xs / 2;
    roadEl.Pc.x1 -= roadEl.P0.xs / 3;
    roadEl.Pc.x2 -= roadEl.P0.xs / 3;
    roadEl.lineDashOffset -= car.speed;

    if (!roadEl.ctx) return;
    roadEl.ctx.clearRect(0, 0, roadEl.width, roadEl.height);
    roadEl.ctx.beginPath();

    roadEl.ctx.moveTo(roadEl.P1.x, roadEl.P1.y);
    roadEl.ctx.bezierCurveTo(roadEl.Pc.x1, roadEl.P1.y - (roadEl.height * 0.7),
      roadEl.P0.x, roadEl.P0.y,
      roadEl.P0.x, roadEl.P0.y);

    roadEl.ctx.moveTo(roadEl.P2.x, roadEl.P2.y);
    roadEl.ctx.bezierCurveTo(roadEl.Pc.x2, roadEl.P2.y - (roadEl.height * 0.7),
      roadEl.P0.x, roadEl.P0.y,
      roadEl.P0.x, roadEl.P0.y);

    roadEl.ctx.strokeStyle = roadEl.lineColor;
    roadEl.ctx.lineWidth = roadEl.lineWidth;
    roadEl.ctx.setLineDash([roadEl.lineWidth, roadEl.lineWidth]);
    roadEl.ctx.lineDashOffset = roadEl.lineDashOffset * -0.5;
    roadEl.ctx.stroke();
  };
  roadEl.curve = function (side) {
    if (!(roadEl.state == -1 && side == 'left') &&
      !(roadEl.state == 1 && side == 'right')) {
      if (roadEl.state == 1 && side == 'left') roadEl.state = 0;
      else if (roadEl.state == -1 && side == 'right') roadEl.state = 0;
      else if (roadEl.state == 0 && side == 'left') roadEl.state = -1;
      else if (roadEl.state == 0 && side == 'right') roadEl.state = 1;
      roadEl.P0.xs = 1.5 * ((side == 'left') ? -1 : 1);
    }
    roadEl.randomCurve();
    setTimeout(function () {
      roadEl.P0.xs = 0;
    }, 1000);
  };
  roadEl.randomCurve = function () {
    game.curveCount = setTimeout(function () {
      roadEl.curve(Math.random() > 0.5 ? 'left' : 'right');
    }, 2000);
  };

  // ---------- Mountains ----------
  mountains.frame = function () {
    if (!mountains) return;
    const curve = (roadEl.P0.x - (roadEl.width / 2)) / 100;
    let left = mountains.offsetLeft;
    if (left < -4.5 * roadEl.width) left = 1.5 * roadEl.width;
    if (left > 1.5 * roadEl.width) left = -4.5 * roadEl.width;
    const d = curve + ((car.speed) * curve * 0.5);
    mountains.style.left = parseInt(left - d) + 'px';
  };

  // ---------- UI (km, position, lap) ----------
  kmEl.frame = function () {
    car.km += (car.speed / 1000);
    let value = parseInt(car.km * 10).toString();
    while (value.length < kmEl.childNodes.length) value = '0' + value;
    for (let i = 1; i < kmEl.childNodes.length; i++) {
      const a = kmEl.childNodes[i];
      a.innerText = value[i - 1];
    }
  };
  positionEl.init = function () {
    cars.total = 200;
    car.position = cars.total;
  };
  positionEl.frame = function () {
    const value = parseInt(car.position).toString();
    for (let i = 0; i < positionEl.childNodes.length - 1; i++) {
      const a = positionEl.childNodes[i + 1];
      a.innerText = value[i];
    }
  };
  lapEl.init = function () {
    lapEl.value = 1;
  };
  lapEl.frame = function () {
    if (car.position <= 0) {
      lapEl.value++;
      car.easy += 0.5;
      car.position = 200;
    }
    if (lapEl.value > 9) {
      // game win condition
      alert("GAME OVER\n YOU WIN!!!");
    }
    lapEl.innerText = lapEl.value;
  };

  // ---------- Frame loop (single loop using requestAnimationFrame) ----------
  let rafId = null;
  let running = false;
  function loop() {
    if (!running) return;
    // update per-frame components
    try { key.frame(); } catch (e) {}
    try { car.frame(); } catch (e) {}
    try { cars.frame(); } catch (e) {}
    try { mountains.frame(); } catch (e) {}
    try { roadEl.frame(); } catch (e) {}
    try { kmEl.frame(); } catch (e) {}
    try { positionEl.frame(); } catch (e) {}
    try { lapEl.frame(); } catch (e) {}
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Keyboard handling ----------
  const key = {
    pressed: {},
    frame: function () {
      if (!car.crashed) {
        car.sx = 0;
        if (car.x > (roadEl.width * 0.15)) {
          if (key.pressed['left'] || key.pressed[37] || key.pressed[65]) {
            car.sx = -2.5;
          }
        } else {
          car.crash(0.2);
        }
        if (car.x < ((roadEl.width * 0.85) - car.width)) {
          if (key.pressed['right'] || key.pressed[39] || key.pressed[68]) {
            car.sx = 2.5;
          }
        } else {
          car.crash(-0.2);
        }
        if (key.pressed['up'] || key.pressed[32] || key.pressed[38] || key.pressed[87]) {
          if (car.speed < car.maxSpeed) {
            car.speed += car.acc;
            if (game.audio && game.audio.oscillator) {
              try { game.audio.oscillator.frequency.value += car.acc * 10; } catch (e) {}
            }
          }
        } else {
          if (car.speed > 0.2) {
            car.speed -= car.break;
            if (game.audio && game.audio.oscillator) {
              try { game.audio.oscillator.frequency.value -= car.break * 10; } catch (e) {}
            }
          }
        }
      }
    }
  };

  window.addEventListener('keydown', function (event) {
    key.pressed[event.keyCode] = true;
    // also map some id names like 'left','right','up'
    if (event.key === 'ArrowLeft') key.pressed['left'] = true;
    if (event.key === 'ArrowRight') key.pressed['right'] = true;
    if (event.key === 'ArrowUp') key.pressed['up'] = true;
    if (event.key === ' ') key.pressed['up'] = true;
  });
  window.addEventListener('keyup', function (event) {
    key.pressed[event.keyCode] = false;
    if (event.key === 'ArrowLeft') key.pressed['left'] = false;
    if (event.key === 'ArrowRight') key.pressed['right'] = false;
    if (event.key === 'ArrowUp') key.pressed['up'] = false;
  });

  // ---------- Buttons (touch on-screen) ----------
  ['left', 'up', 'right'].forEach(function (id) {
    const button = document.getElementById(id);
    if (!button) return;
    const press = function () {
      key.pressed[id] = true;
    };
    const release = function () {
      key.pressed[id] = false;
    };
    button.addEventListener('mousedown', press);
    button.addEventListener('mouseup', release);
    button.addEventListener('touchstart', press, { passive: true });
    button.addEventListener('touchend', release);
  });

  // ---------- Click to start/pause (legacy UI) ----------
  const clickstart = document.getElementById('click');
  if (clickstart) {
    clickstart.addEventListener('click', function () {
      if (!running) {
        clickstart.innerText = 'Click to Pause';
        running = true;
        if (!cars.builded) cars.init();
        if (!carEl) car.init();
        if (!roadEl.P0) roadEl.init();
        if (!game.audio || !game.audio.oscillator) game.audio && game.audio();
        // start the loop
        loop();
      } else {
        clickstart.innerText = 'Click to Start!';
        running = false;
        if (game.audio && game.audio.oscillator) {
          try { game.audio.oscillator.stop(); } catch (e) {}
        }
      }
    });
  }

  // ---------- Audio ----------
  const game = gameEl || {};
  game.audio = function () {
    try {
      if (game.audio.oscillator) {
        try {
          game.audio.oscillator.stop(game.audio.context.currentTime);
          game.audio.oscillator.disconnect(game.audio.volume);
        } catch (e) {}
        delete game.audio.oscillator;
      }
      game.audio.context = new (window.AudioContext || window.webkitAudioContext)();
      game.audio.volume = game.audio.context.createGain();
      game.audio.volume.gain.value = 0.1;
      game.audio.volume.connect(game.audio.context.destination);
      const o = game.audio.context.createOscillator();
      o.frequency.value = 0;
      o.detune.value = 0;
      o.type = 'sawtooth';
      o.connect(game.audio.volume);
      o.frequency.value = 60;
      game.audio.oscillator = o;
      game.audio.oscillator.start(0);
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  };

  // ---------- Colors / time ----------
  game.colors = [
    ['#228', '#040', 1],
    ['#93c', '#440', 0.5],
    ['#546', '#111', 0.2],
    ['#888', '#aaa', 0.2],
    ['#545', '#111', 0.2],
    ['#529', '#230', 0.3],
    ['#aaf', '#eee', 0.2],
  ];
  game.changeTime = function () {
    if (!running) return;
    game.time = (game.time || 0) + 1;
    if (game.time >= game.colors.length) game.time = 0;
    if (sky) sky.style.background = game.colors[game.time][0];
    if (terrain) terrain.style.background = game.colors[game.time][1];
    if (mountains) mountains.style.opacity = game.colors[game.time][2];
    if (game.time === 3 || game.time === 4) fog.toggle();
    if (game.time === 2 || game.time === 4) carsEl && carsEl.classList.add('night');
    else carsEl && carsEl.classList.remove('night');
    game.timeCount = setTimeout(game.changeTime, 30000);
  };

  // ---------- Fog ----------
  fogEl.init = function () {
    fogEl.value = 0.02;
    fogEl.status = false;
  };
  fogEl.toggle = function () {
    fogEl.classList.toggle('hidden');
    fogEl.status = !fogEl.status;
    fogEl.value = fogEl.status ? 0.1 : 0.02;
  };

  // ---------- Init game (one-time) ----------
  game.init = function () {
    game.time = 0;
    if (car.init) car.init();
    if (cars.init && !cars.builded) cars.init();
    if (roadEl.init) roadEl.init();
    if (positionEl.init) positionEl.init();
    if (lapEl.init) lapEl.init();
    if (fogEl.init) fogEl.init();
    if (cars.frame) cars.frame();
  };

  // ---------- Controls for gameControls.js ----------
  window.startGame = function () {
    if (running && !gamePaused) return;
    running = true;
    gamePaused = false;
    safeBlock();
    // ensure initial setup
    if (!cars.builded) cars.init();
    if (!roadEl.P0) roadEl.init();
    if (!car.km) car.init();
    if (!game.audio || !game.audio.oscillator) game.audio();
    // start loop (if not already)
    if (!rafId) loop();
  };

  window.pauseGame = function () {
    if (!running) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
      running = false;
      safeUnblock();
      if (game.audio && game.audio.oscillator) {
        try { game.audio.oscillator.stop(); } catch (e) {}
      }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      // resume
      running = true;
      safeBlock();
      if (!game.audio || !game.audio.oscillator) game.audio();
      loop();
    }
  };

  window.restartGame = function () {
    // fully reset the state and re-init game
    running = false;
    gamePaused = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    clearTimeout(game.curveCount);
    clearTimeout(game.timeCount);
    // reset DOM elements created dynamically
    if (car.st && car.st.parentNode) car.st.parentNode.removeChild(car.st);
    // reset values
    car.init();
    if (cars.oponents) {
      // remove existing opponent DOM nodes
      try {
        while (carsEl && carsEl.firstChild) carsEl.removeChild(carsEl.firstChild);
      } catch (e) {}
    }
    cars.builded = false;
    if (cars.init) cars.init();
    if (roadEl.init) roadEl.init();
    if (positionEl.init) positionEl.init();
    if (lapEl.init) lapEl.init();
    if (fogEl.init) fogEl.init();
    // reset visuals
    if (mountains) mountains.style.left = '0px';
    if (kmEl && kmEl.childNodes) {
      for (let i = 1; i < kmEl.childNodes.length; i++) {
        kmEl.childNodes[i].innerText = '0';
      }
    }
    safeUnblock();
    // start fresh
    if (!game.audio || !game.audio.oscillator) game.audio();
    running = true;
    safeBlock();
    loop();
  };

  // initialize once
  game.init();

  // expose game object for debug
  window.__simpleRacingGame = game;

})();
