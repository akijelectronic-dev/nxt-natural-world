/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Weather Module
   Author: AL-AMIN
   Part 14/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('weather', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    mode: 'natural',      // real | natural | sunny | rainy
    changeInterval: 300,  // 5 minutes per weather change
    
    // Season-based weather chance weights
    seasonChances: {
      summer:  { sunny: 60, cloudy: 25, rainy: 10, stormy: 3,  foggy: 2,  snowy: 0 },
      monsoon: { sunny: 15, cloudy: 20, rainy: 40, stormy: 20, foggy: 5,  snowy: 0 },
      autumn:  { sunny: 40, cloudy: 30, rainy: 20, stormy: 5,  foggy: 5,  snowy: 0 },
      winter:  { sunny: 30, cloudy: 25, rainy: 5,  stormy: 0,  foggy: 35, snowy: 5 }
    },
    
    particles: {
      rain: 200,
      snow: 150,
      leaves: 40
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    current: 'sunny',
    prev: 'sunny',
    next: 'sunny',
    
    changeTimer: 0,
    intensity: 1,        // 0-1
    
    temperature: 25,
    
    // Particles
    rainDrops: [],
    snowFlakes: [],
    leaves: [],
    
    // Wind
    wind: { x: 0.3, y: 0, speed: 0.5 },
    
    // Lightning
    lightning: {
      active: false,
      timer: 0,
      flash: 0
    },
    
    // Rainbow
    rainbow: { active: false, timer: 0 }
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('weather', '🌦️ Initializing weather system...');
    
    // Initial weather based on season
    var season = this.getSeason();
    this.data.current = this.pickRandomWeather(season);
    this.data.prev = this.data.current;
    this.data.changeTimer = this.config.changeInterval;
    
    // Update UI
    this.updateUI();
    
    // Update temperature
    this.updateTemperature();
    
    NXT.log('weather', '✅ Weather ready: ' + this.data.current);
    
    NXT.emit('weather:ready', this.data.current);
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Weather change timer
    this.data.changeTimer -= dt;
    if (this.data.changeTimer <= 0) {
      this.changeWeather();
      this.data.changeTimer = this.config.changeInterval + NXT.utils.random(-60, 60);
    }
    
    // Update particles based on current weather
    this.updateParticles(dt);
    
    // Update lightning
    this.updateLightning(dt);
    
    // Update rainbow
    this.updateRainbow(dt);
    
    // Update temperature
    this.updateTemperature();
  },
  
  /* ═══════════════════════════════════════════════
     CHANGE WEATHER
     ═══════════════════════════════════════════════ */
  changeWeather: function() {
    if (this.config.mode !== 'natural') return;
    
    var season = this.getSeason();
    var prevWeather = this.data.current;
    var newWeather = this.pickRandomWeather(season);
    
    if (newWeather === prevWeather) return;
    
    this.data.prev = prevWeather;
    this.data.current = newWeather;
    
    NXT.log('weather', '☁️ Weather changed: ' + prevWeather + ' → ' + newWeather);
    
    // Update UI
    this.updateUI();
    
    // Emit event
    NXT.emit('weather:change', { from: prevWeather, to: newWeather });
    
    // Clear particles when weather changes
    if (newWeather !== 'rainy' && newWeather !== 'stormy') {
      this.data.rainDrops = [];
    }
    if (newWeather !== 'snowy') {
      this.data.snowFlakes = [];
    }
  },
  
  /* ═══════════════════════════════════════════════
     PICK RANDOM WEATHER
     ═══════════════════════════════════════════════ */
  pickRandomWeather: function(season) {
    var chances = this.config.seasonChances[season] || this.config.seasonChances.summer;
    
    var total = 0;
    Object.keys(chances).forEach(function(k) { total += chances[k]; });
    
    var rand = Math.random() * total;
    var acc = 0;
    
    for (var weather in chances) {
      acc += chances[weather];
      if (rand <= acc) return weather;
    }
    
    return 'sunny';
  },
  
  /* ═══════════════════════════════════════════════
     SET WEATHER
     ═══════════════════════════════════════════════ */
  setWeather: function(weather) {
    this.data.prev = this.data.current;
    this.data.current = weather;
    this.updateUI();
    NXT.emit('weather:change', { from: this.data.prev, to: weather });
  },
  
  setMode: function(mode) {
    this.config.mode = mode;
    NXT.log('weather', '🌦️ Weather mode: ' + mode);
    
    if (mode === 'sunny') this.setWeather('sunny');
    else if (mode === 'rainy') this.setWeather('rainy');
    else if (mode === 'real') this.syncWithRealWeather();
  },
  
  /* ═══════════════════════════════════════════════
     REAL WEATHER SYNC (Using free API)
     ═══════════════════════════════════════════════ */
  syncWithRealWeather: function() {
    // Optional: Use browser location + weather API
    // For simplicity, we use time-based weather
    var hour = this.getHour();
    if (hour < 6 || hour > 20) {
      this.setWeather('cloudy');
    } else {
      this.setWeather('sunny');
    }
  },
  
  /* ═══════════════════════════════════════════════
     PARTICLES
     ═══════════════════════════════════════════════ */
  updateParticles: function(dt) {
    var weather = this.data.current;
    
    // Rain
    if (weather === 'rainy' || weather === 'stormy') {
      this.updateRain(dt);
    } else {
      this.data.rainDrops = [];
    }
    
    // Snow
    if (weather === 'snowy') {
      this.updateSnow(dt);
    } else {
      this.data.snowFlakes = [];
    }
    
    // Leaves (autumn)
    if (this.getSeason() === 'autumn') {
      this.updateLeaves(dt);
    } else {
      this.data.leaves = [];
    }
  },
  
  updateRain: function(dt) {
    var drops = this.data.rainDrops;
    var count = this.config.particles.rain;
    
    // Add new drops
    while (drops.length < count) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vy: NXT.utils.random(6, 12),
        vx: this.data.wind.x * 2,
        length: NXT.utils.random(10, 20),
        opacity: NXT.utils.random(0.4, 0.8)
      });
    }
    
    // Update drops
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.y += d.vy * dt * 60;
      d.x += d.vx * dt * 60;
      
      // Remove if off screen
      if (d.y > window.innerHeight + 20) {
        drops.splice(i, 1);
      }
    }
  },
  
  updateSnow: function(dt) {
    var flakes = this.data.snowFlakes;
    var count = this.config.particles.snow;
    
    while (flakes.length < count) {
      flakes.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vy: NXT.utils.random(1, 3),
        vx: NXT.utils.random(-1, 1),
        size: NXT.utils.random(2, 5),
        phase: Math.random() * Math.PI * 2,
        opacity: NXT.utils.random(0.6, 1)
      });
    }
    
    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];
      f.y += f.vy * dt * 60;
      f.phase += dt * 2;
      f.x += (f.vx + Math.sin(f.phase) * 0.5) * dt * 60;
      
      if (f.y > window.innerHeight + 20) {
        flakes.splice(i, 1);
      }
    }
  },
  
  updateLeaves: function(dt) {
    var leaves = this.data.leaves;
    var count = this.config.particles.leaves;
    
    while (leaves.length < count) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        vy: NXT.utils.random(1, 3),
        vx: NXT.utils.random(-2, 2),
        size: NXT.utils.random(4, 8),
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: NXT.utils.random(-0.05, 0.05),
        color: NXT.utils.randomChoice(['#f59e0b', '#ef4444', '#a16207', '#dc2626'])
      });
    }
    
    for (var i = leaves.length - 1; i >= 0; i--) {
      var l = leaves[i];
      l.y += l.vy * dt * 60;
      l.phase += dt * 1.5;
      l.x += (l.vx + Math.sin(l.phase) * 1.5) * dt * 60;
      l.rotation += l.rotationSpeed;
      
      if (l.y > window.innerHeight + 20) {
        leaves.splice(i, 1);
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     LIGHTNING
     ═══════════════════════════════════════════════ */
  updateLightning: function(dt) {
    if (this.data.current !== 'stormy') {
      this.data.lightning.active = false;
      this.data.lightning.flash = 0;
      return;
    }
    
    // Random lightning strike
    if (!this.data.lightning.active && Math.random() < 0.005 * dt * 60) {
      this.data.lightning.active = true;
      this.data.lightning.timer = 0.2;
      this.data.lightning.flash = 1;
      
      // Thunder sound (if audio exists)
      NXT.emit('weather:lightning');
    }
    
    if (this.data.lightning.active) {
      this.data.lightning.timer -= dt;
      this.data.lightning.flash = Math.max(0, this.data.lightning.flash - dt * 3);
      
      if (this.data.lightning.timer <= 0) {
        this.data.lightning.active = false;
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     RAINBOW
     ═══════════════════════════════════════════════ */
  updateRainbow: function(dt) {
    // Show rainbow after rain if sunny
    if (this.data.prev === 'rainy' && this.data.current === 'sunny' && !this.data.rainbow.active) {
      this.data.rainbow.active = true;
      this.data.rainbow.timer = 30;
      NXT.log('weather', '🌈 Rainbow appeared!');
    }
    
    if (this.data.rainbow.active) {
      this.data.rainbow.timer -= dt;
      if (this.data.rainbow.timer <= 0) {
        this.data.rainbow.active = false;
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     TEMPERATURE
     ═══════════════════════════════════════════════ */
  updateTemperature: function() {
    var season = this.getSeason();
    var hour = this.getHour();
    
    // Base temperature by season
    var baseTemps = {
      summer: 32,
      monsoon: 28,
      autumn: 26,
      winter: 18
    };
    
    var base = baseTemps[season] || 25;
    
    // Time of day variation
    var timeVariation = Math.sin((hour - 6) / 24 * Math.PI * 2) * 5;
    
    // Weather variation
    var weatherVariation = 0;
    if (this.data.current === 'rainy' || this.data.current === 'stormy') weatherVariation = -3;
    if (this.data.current === 'snowy') weatherVariation = -8;
    if (this.data.current === 'sunny' && hour > 8 && hour < 17) weatherVariation = 3;
    
    this.data.temperature = Math.round(base + timeVariation + weatherVariation);
  },
  
  /* ═══════════════════════════════════════════════
     UI UPDATE
     ═══════════════════════════════════════════════ */
  updateUI: function() {
    var el = document.getElementById('topWeather');
    if (!el) return;
    
    var icons = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️',
      foggy: '🌫️',
      snowy: '❄️'
    };
    
    var names = {
      sunny: 'Sunny',
      cloudy: 'Cloudy',
      rainy: 'Rainy',
      stormy: 'Stormy',
      foggy: 'Foggy',
      snowy: 'Snowy'
    };
    
    el.textContent = icons[this.data.current] + ' ' + names[this.data.current];
  },
  
  /* ═══════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════ */
  getSeason: function() {
    var time = NXT.get('time');
    return time ? time.data.season : 'summer';
  },
  
  getHour: function() {
    var time = NXT.get('time');
    return time ? time.data.hour : 12;
  },
  
  getWeather: function() {
    return this.data.current;
  },
  
  isRaining: function() {
    return this.data.current === 'rainy' || this.data.current === 'stormy';
  },
  
  isSunny: function() {
    return this.data.current === 'sunny';
  },
  
  isNight: function() {
    var time = NXT.get('time');
    return time ? time.data.isNight : false;
  },
  
  getTemperature: function() {
    return this.data.temperature;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (Called by world render module)
     ═══════════════════════════════════════════════ */
  renderParticles: function(ctx) {
    if (!ctx) return;
    
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    
    // Rain
    if (this.data.current === 'rainy' || this.data.current === 'stormy') {
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      for (var i = 0; i < this.data.rainDrops.length; i++) {
        var d = this.data.rainDrops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + this.data.wind.x * 3, d.y + d.length);
        ctx.stroke();
      }
    }
    
    // Snow
    if (this.data.current === 'snowy') {
      for (var j = 0; j < this.data.snowFlakes.length; j++) {
        var f = this.data.snowFlakes[j];
        ctx.fillStyle = 'rgba(255, 255, 255, ' + f.opacity + ')';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Leaves
    if (this.getSeason() === 'autumn') {
      for (var k = 0; k < this.data.leaves.length; k++) {
        var l = this.data.leaves[k];
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rotation);
        ctx.fillStyle = l.color;
        ctx.fillRect(-l.size/2, -l.size/2, l.size, l.size);
        ctx.restore();
      }
    }
  },
  
  renderOverlay: function(ctx) {
    if (!ctx) return;
    
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    
    // Weather overlay tint
    if (this.data.current === 'rainy') {
      ctx.fillStyle = 'rgba(50, 70, 100, 0.15)';
      ctx.fillRect(0, 0, w, h);
    } else if (this.data.current === 'stormy') {
      ctx.fillStyle = 'rgba(30, 30, 60, 0.3)';
      ctx.fillRect(0, 0, w, h);
    } else if (this.data.current === 'foggy') {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
      ctx.fillRect(0, 0, w, h);
    } else if (this.data.current === 'snowy') {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.15)';
      ctx.fillRect(0, 0, w, h);
    }
    
    // Lightning flash
    if (this.data.lightning.flash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + this.data.lightning.flash * 0.6 + ')';
      ctx.fillRect(0, 0, w, h);
    }
    
    // Rainbow
    if (this.data.rainbow.active) {
      var opacity = Math.min(1, this.data.rainbow.timer / 5);
      var cx = w / 2;
      var cy = h + 100;
      var radius = 300;
      
      var colors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0088ff', '#4400ff', '#8800ff'];
      for (var i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.globalAlpha = opacity * 0.4;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - i * 8, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  },
  
  render: function(ctx, dt) {
    // Called from main render loop
  }
});

console.log('%c🌦️ Weather module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
