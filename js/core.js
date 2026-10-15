/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Core Engine
   Author: AL-AMIN
   Part 4/22
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   MAIN NXT OBJECT
   ═══════════════════════════════════════════════════════ */
window.NXT = {
  
  /* ─────────────────────────────────────────────
     VERSION
     ───────────────────────────────────────────── */
  version: '1.0.0',
  name: 'NXT NATURAL WORLD',
  author: 'AL-AMIN',
  buildDate: new Date().toISOString(),
  
  /* ─────────────────────────────────────────────
     MODULES REGISTRY
     ───────────────────────────────────────────── */
  modules: {},
  initQueue: [],
  updateQueue: [],
  renderQueue: [],
  readyModules: [],
  
  /* ─────────────────────────────────────────────
     GAME STATE
     ───────────────────────────────────────────── */
  state: {
    started: false,
    paused: false,
    booted: false,
    loopRunning: false,
    speed: 1,
    frame: 0,
    lastTime: 0,
    deltaTime: 0,
    fps: 60,
    fpsCounter: 0,
    fpsTimer: 0,
    deltaTimeAccum: 0
  },
  
  /* ─────────────────────────────────────────────
     EVENTS
     ───────────────────────────────────────────── */
  events: {},
  
  /* ─────────────────────────────────────────────
     CONFIG REFERENCE
     ───────────────────────────────────────────── */
  config: (typeof CONFIG !== 'undefined') ? CONFIG : {},
  
  /* ═══════════════════════════════════════════════
     MODULE SYSTEM
     ═══════════════════════════════════════════════ */
  
  register: function(name, module) {
    if (!name || typeof name !== 'string') {
      console.error('❌ NXT.register: Invalid module name');
      return;
    }
    
    if (this.modules[name]) {
      console.warn('⚠️ Module already registered: ' + name);
      return;
    }
    
    this.modules[name] = module;
    module.__name = name;
    module.__registeredAt = Date.now();
    
    if (typeof module.init === 'function') {
      this.initQueue.push(module);
    }
    if (typeof module.update === 'function') {
      this.updateQueue.push(module);
    }
    if (typeof module.render === 'function') {
      this.renderQueue.push(module);
    }
    
    if (this.config.ui && this.config.ui.showDebug) {
      console.log('✅ Module registered: ' + name);
    }
  },
  
  get: function(name) {
    return this.modules[name] || null;
  },
  
  has: function(name) {
    return !!this.modules[name];
  },
  
  remove: function(name) {
    if (this.modules[name]) {
      delete this.modules[name];
      this.initQueue = this.initQueue.filter(m => m.__name !== name);
      this.updateQueue = this.updateQueue.filter(m => m.__name !== name);
      this.renderQueue = this.renderQueue.filter(m => m.__name !== name);
      return true;
    }
    return false;
  },
  
  list: function() {
    return Object.keys(this.modules);
  },
  
  count: function() {
    return Object.keys(this.modules).length;
  },
  
  /* ═══════════════════════════════════════════════
     EVENT SYSTEM
     ═══════════════════════════════════════════════ */
  
  on: function(event, callback, once) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push({ callback: callback, once: !!once });
    return this;
  },
  
  once: function(event, callback) {
    return this.on(event, callback, true);
  },
  
  off: function(event, callback) {
    if (!this.events[event]) return this;
    if (!callback) {
      delete this.events[event];
    } else {
      this.events[event] = this.events[event].filter(e => e.callback !== callback);
    }
    return this;
  },
  
  emit: function(event, data) {
    if (!this.events[event]) return this;
    var listeners = this.events[event].slice();
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i].callback(data);
        if (listeners[i].once) {
          this.events[event] = this.events[event].filter(e => e !== listeners[i]);
        }
      } catch (err) {
        console.error('Event error [' + event + ']:', err);
      }
    }
    return this;
  },
  
  /* ═══════════════════════════════════════════════
     BOOT SEQUENCE
     ═══════════════════════════════════════════════ */
  
  boot: function() {
    console.log('%c🌍 Booting NXT NATURAL WORLD...', 
      'color:#00d4ff;font-family:monospace;font-size:14px;font-weight:bold');
    console.log('%c>> Registered modules: ' + this.count(), 
      'color:#22c55e;font-family:monospace');
    
    // Run all init
    var initSuccess = 0;
    var initFail = 0;
    
    for (var i = 0; i < this.initQueue.length; i++) {
      var mod = this.initQueue[i];
      try {
        if (typeof mod.init === 'function') {
          mod.init();
          this.readyModules.push(mod.__name);
          initSuccess++;
        }
      } catch (err) {
        console.error('❌ Init failed: ' + mod.__name, err);
        initFail++;
      }
    }
    
    this.state.booted = true;
    this.state.started = true;
    
    console.log('%c✅ Init complete: ' + initSuccess + ' success, ' + initFail + ' failed',
      'color:#22c55e;font-family:monospace;font-weight:bold');
    
    // Start game loop
    this.startLoop();
    
    // Emit ready event
    this.emit('nxt:ready', { modules: this.readyModules });
    
    console.log('%c🎮 NXT Natural World is LIVE!', 
      'color:#ffd700;font-family:monospace;font-size:16px;font-weight:bold');
  },
  
  /* ═══════════════════════════════════════════════
     GAME LOOP
     ═══════════════════════════════════════════════ */
  
  startLoop: function() {
    if (this.state.loopRunning) return;
    this.state.loopRunning = true;
    this.state.lastTime = performance.now();
    this._loop();
  },
  
  stopLoop: function() {
    this.state.loopRunning = false;
  },
  
  _loop: function() {
    if (!this.state.loopRunning) return;
    
    var now = performance.now();
    var dt = (now - this.state.lastTime) / 1000;
    this.state.lastTime = now;
    
    // Clamp dt (max 0.1s)
    if (dt > 0.1) dt = 0.1;
    
    this.state.deltaTime = dt;
    this.state.frame++;
    
    // FPS counter
    this.state.fpsCounter++;
    this.state.fpsTimer += dt;
    if (this.state.fpsTimer >= 1) {
      this.state.fps = Math.round(this.state.fpsCounter / this.state.fpsTimer);
      this.state.fpsCounter = 0;
      this.state.fpsTimer = 0;
      
      var fpsEl = document.getElementById('dbgFps');
      if (fpsEl) fpsEl.textContent = this.state.fps;
    }
    
    // Update (if not paused)
    if (!this.state.paused) {
      var speedMult = this.state.speed;
      for (var i = 0; i < this.updateQueue.length; i++) {
        try {
          this.updateQueue[i].update(dt * speedMult);
        } catch (err) {
          console.error('Update error [' + this.updateQueue[i].__name + ']:', err);
        }
      }
    }
    
    // Render
    var ctx = window.CITY_CTX || (document.getElementById('worldCanvas') && document.getElementById('worldCanvas').getContext('2d'));
    for (var j = 0; j < this.renderQueue.length; j++) {
      try {
        this.renderQueue[j].render(ctx, dt);
      } catch (err) {
        console.error('Render error [' + this.renderQueue[j].__name + ']:', err);
      }
    }
    
    // Update debug info
    var modEl = document.getElementById('dbgModules');
    if (modEl) modEl.textContent = this.count();
    
    requestAnimationFrame(this._loop.bind(this));
  },
  
  /* ═══════════════════════════════════════════════
     PAUSE / RESUME / SPEED
     ═══════════════════════════════════════════════ */
  
  pause: function() {
    this.state.paused = true;
    this.emit('nxt:pause');
  },
  
  resume: function() {
    this.state.paused = false;
    this.emit('nxt:resume');
  },
  
  togglePause: function() {
    if (this.state.paused) this.resume();
    else this.pause();
  },
  
  setSpeed: function(speed) {
    this.state.speed = Math.max(0, Math.min(20, speed));
    this.emit('nxt:speed', this.state.speed);
  },
  
  /* ═══════════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════════ */
  
  utils: {
    
    /* ─────────── RANDOM ─────────── */
    random: function(min, max) {
      return Math.random() * (max - min) + min;
    },
    
    randomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomChoice: function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    
    randomChance: function(probability) {
      return Math.random() < probability;
    },
    
    shuffle: function(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    },
    
    /* ─────────── MATH ─────────── */
    distance: function(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    
    distanceSq: function(x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return dx * dx + dy * dy;
    },
    
    clamp: function(val, min, max) {
      return Math.max(min, Math.min(max, val));
    },
    
    lerp: function(a, b, t) {
      return a + (b - a) * t;
    },
    
    smooth: function(current, target, factor) {
      return current + (target - current) * factor;
    },
    
    map: function(val, inMin, inMax, outMin, outMax) {
      return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    angle: function(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1);
    },
    
    normalizeAngle: function(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
    },
    
    /* ─────────── FORMAT ─────────── */
    formatNumber: function(n) {
      if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return Math.floor(n).toString();
    },
    
    formatTime: function(hours, minutes) {
      var h = Math.floor(hours).toString().padStart(2, '0');
      var m = Math.floor(minutes).toString().padStart(2, '0');
      return h + ':' + m;
    },
    
    formatDate: function(day, month, year) {
      return day + '/' + month + '/' + year;
    },
    
    /* ─────────── COLOR ─────────── */
    hexToRgb: function(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    },
    
    rgbToHex: function(r, g, b) {
      return '#' + [r, g, b].map(function(x) {
        var hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    },
    
    adjustBrightness: function(hex, percent) {
      var rgb = this.hexToRgb(hex);
      var r = Math.max(0, Math.min(255, rgb.r + (rgb.r * percent / 100)));
      var g = Math.max(0, Math.min(255, rgb.g + (rgb.g * percent / 100)));
      var b = Math.max(0, Math.min(255, rgb.b + (rgb.b * percent / 100)));
      return this.rgbToHex(Math.floor(r), Math.floor(g), Math.floor(b));
    },
    
    /* ─────────── ARRAY ─────────── */
    sum: function(arr) {
      return arr.reduce(function(a, b) { return a + b; }, 0);
    },
    
    avg: function(arr) {
      return arr.length ? this.sum(arr) / arr.length : 0;
    },
    
    min: function(arr) {
      return Math.min.apply(Math, arr);
    },
    
    max: function(arr) {
      return Math.max.apply(Math, arr);
    },
    
    /* ─────────── STRING ─────────── */
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    pad: function(num, length) {
      return num.toString().padStart(length, '0');
    },
    
    /* ─────────── DEBOUNCE / THROTTLE ─────────── */
    debounce: function(fn, delay) {
      var timer = null;
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
          fn.apply(context, args);
        }, delay);
      };
    },
    
    throttle: function(fn, delay) {
      var lastTime = 0;
      return function() {
        var now = Date.now();
        if (now - lastTime >= delay) {
          fn.apply(this, arguments);
          lastTime = now;
        }
      };
    }
  },
  
  /* ═══════════════════════════════════════════════
     STORAGE
     ═══════════════════════════════════════════════ */
  
  storage: {
    KEY: 'nxt_natural_world_save',
    
    save: function(key, data) {
      try {
        var fullKey = key ? this.KEY + '_' + key : this.KEY;
        localStorage.setItem(fullKey, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('Storage save failed:', e);
        return false;
      }
    },
    
    load: function(key) {
      try {
        var fullKey = key ? this.KEY + '_' + key : this.KEY;
        var raw = localStorage.getItem(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error('Storage load failed:', e);
        return null;
      }
    },
    
    remove: function(key) {
      try {
        var fullKey = key ? this.KEY + '_' + key : this.KEY;
        localStorage.removeItem(fullKey);
        return true;
      } catch (e) {
        return false;
      }
    },
    
    clear: function() {
      try {
        var keys = Object.keys(localStorage);
        keys.forEach(function(k) {
          if (k.startsWith('nxt_natural_world_save')) {
            localStorage.removeItem(k);
          }
        });
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     LOGGER
     ═══════════════════════════════════════════════ */
  
  log: function(module, message, data) {
    var prefix = '%c[' + module + ']';
    var style = 'color:#00d4ff;font-family:monospace;font-weight:bold';
    if (data !== undefined) {
      console.log(prefix, style, message, data);
    } else {
      console.log(prefix, style, message);
    }
  },
  
  warn: function(module, message, data) {
    var prefix = '%c[' + module + ']';
    var style = 'color:#f59e0b;font-family:monospace;font-weight:bold';
    if (data !== undefined) {
      console.warn(prefix, style, message, data);
    } else {
      console.warn(prefix, style, message);
    }
  },
  
  error: function(module, message, error) {
    var prefix = '%c[' + module + ']';
    var style = 'color:#ef4444;font-family:monospace;font-weight:bold';
    if (error !== undefined) {
      console.error(prefix, style, message, error);
    } else {
      console.error(prefix, style, message);
    }
  },
  
  /* ═══════════════════════════════════════════════
     MODULE STATUS
     ═══════════════════════════════════════════════ */
  
  status: function() {
    return {
      version: this.version,
      modules: this.count(),
      ready: this.readyModules.length,
      fps: this.state.fps,
      frame: this.state.frame,
      speed: this.state.speed,
      paused: this.state.paused,
      booted: this.state.booted
    };
  }
};

/* ═══════════════════════════════════════════════════════
   DOM READY — AUTO BOOT
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  console.log('%c🔧 DOM Ready', 'color:#22c55e;font-family:monospace');
  
  // Setup canvases
  var worldCanvas = document.getElementById('worldCanvas');
  if (worldCanvas) {
    function resizeCanvas() {
      worldCanvas.width = window.innerWidth;
      worldCanvas.height = window.innerHeight - 60 - 100;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.CITY_CANVAS = worldCanvas;
    window.CITY_CTX = worldCanvas.getContext('2d');
  }
  
  // Boot after a short delay to allow modules to register
  setTimeout(function() {
    if (NXT.count() > 0) {
      NXT.boot();
    } else {
      console.warn('⚠️ No modules registered yet');
    }
  }, 500);
});

/* ═══════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER
   ═══════════════════════════════════════════════════════ */

window.addEventListener('error', function(e) {
  console.error('%c❌ Global Error:', 'color:#ef4444;font-weight:bold', e.message);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('%c❌ Unhandled Promise:', 'color:#ef4444;font-weight:bold', e.reason);
});

/* ═══════════════════════════════════════════════════════
   CONSOLE BANNER
   ═══════════════════════════════════════════════════════ */

console.log('%c⚙️ NXT CORE ENGINE LOADED', 
  'color:#00d4ff;font-family:monospace;font-size:16px;font-weight:bold;text-shadow:0 0 10px #00d4ff');
console.log('%c>> Module system ready', 
  'color:#22c55e;font-family:monospace;font-size:12px');
console.log('%c>> Event system ready', 
  'color:#22c55e;font-family:monospace;font-size:12px');
console.log('%c>> Game loop ready', 
  'color:#22c55e;font-family:monospace;font-size:12px');
console.log('%c>> Utilities ready', 
  'color:#22c55e;font-family:monospace;font-size:12px');
console.log('%c>> Storage ready', 
  'color:#22c55e;font-family:monospace;font-size:12px');

/* ═══════════════════════════════════════════════════════
   END OF CORE
   ═══════════════════════════════════════════════════════ */
