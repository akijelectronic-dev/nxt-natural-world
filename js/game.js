/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Final Boot (Fixed)
   Author: AL-AMIN
   Part 22/22
   ═══════════════════════════════════════════════════════ */

'use strict';

(function() {
  
  console.log('%c🚀 game.js loading...', 
    'color:#00d4ff;font-family:monospace;font-weight:bold');
  
  /* ═══════════════════════════════════════════════
     BOOT SEQUENCE
     ═══════════════════════════════════════════════ */
  function boot() {
    console.log('%c🚀 NXT NATURAL WORLD — Final Boot', 
      'color:#00d4ff;font-family:monospace;font-size:18px;font-weight:bold');
    
    var bootBar = document.getElementById('bootBar');
    var bootText = document.getElementById('bootText');
    var splash = document.getElementById('splash');
    
    if (!splash) {
      console.log('%c⚠️ Splash not found, starting directly...', 
        'color:#f59e0b;font-family:monospace');
      startWorld();
      return;
    }
    
    var steps = [
      { pct: 10, text: 'Initializing engine...' },
      { pct: 20, text: 'Loading configuration...' },
      { pct: 30, text: 'Generating terrain...' },
      { pct: 45, text: 'Placing buildings...' },
      { pct: 55, text: 'Building roads...' },
      { pct: 65, text: 'Planting nature...' },
      { pct: 75, text: 'Spawning citizens...' },
      { pct: 85, text: 'Starting weather...' },
      { pct: 95, text: 'Preparing world...' },
      { pct: 100, text: 'Welcome, AL-AMIN!' }
    ];
    
    var stepIndex = 0;
    
    function nextStep() {
      if (stepIndex >= steps.length) {
        setTimeout(hideSplash, 400);
        return;
      }
      
      var step = steps[stepIndex];
      
      if (bootBar) bootBar.style.width = step.pct + '%';
      if (bootText) bootText.textContent = step.text.toUpperCase();
      
      stepIndex++;
      setTimeout(nextStep, 220);
    }
    
    setTimeout(nextStep, 300);
  }
  
  /* ═══════════════════════════════════════════════
     HIDE SPLASH
     ═══════════════════════════════════════════════ */
  function hideSplash() {
    var splash = document.getElementById('splash');
    if (!splash) return;
    
    splash.classList.add('hide');
    
    setTimeout(function() {
      splash.style.display = 'none';
      
      // Boot the world AFTER splash hides
      startWorld();
      
      // Welcome message
      setTimeout(function() {
        if (NXT.ui && NXT.ui.showToast) {
          NXT.ui.showToast('🌍 Welcome to NXT Natural World, AL-AMIN!', 'success');
        }
      }, 800);
      
    }, 800);
  }
  
  /* ═══════════════════════════════════════════════
     START WORLD
     ═══════════════════════════════════════════════ */
  function startWorld() {
    console.log('%c🌍 Starting world...', 
      'color:#22c55e;font-family:monospace;font-size:14px;font-weight:bold');
    
    // Wait a moment for modules to register
    setTimeout(function() {
      var count = NXT.count();
      console.log('%c>> Modules registered: ' + count, 
        'color:#ffd700;font-family:monospace');
      
      if (count === 0) {
        console.error('%c❌ NO MODULES REGISTERED! Check script loading order.', 
          'color:#ef4444;font-family:monospace;font-size:14px;font-weight:bold');
        return;
      }
      
      // Boot all modules
      try {
        NXT.boot();
      } catch (err) {
        console.error('%c❌ Boot failed:', 'color:#ef4444;font-weight:bold', err);
      }
      
      // Add final ready event
      NXT.on('nxt:ready', onWorldReady);
      
      console.log('%c🎮 NXT NATURAL WORLD is LIVE!', 
        'color:#00d4ff;font-family:monospace;font-size:16px;font-weight:bold;text-shadow:0 0 10px #00d4ff');
      
    }, 100);
  }
  
  /* ═══════════════════════════════════════════════
     ON WORLD READY
     ═══════════════════════════════════════════════ */
  function onWorldReady() {
    console.log('%c✨ Everything ready!', 
      'color:#22c55e;font-family:monospace;font-size:14px;font-weight:bold');
    
    var world = NXT.get('world');
    var citizens = NXT.get('citizen');
    var buildings = NXT.get('buildings');
    var nature = NXT.get('nature');
    var terrain = NXT.get('terrain');
    
    if (world) console.log('%c>> World: ' + world.data.width + 'x' + world.data.height, 
      'color:#00d4ff;font-family:monospace');
    if (terrain) console.log('%c>> Terrain ready', 
      'color:#22c55e;font-family:monospace');
    if (buildings) console.log('%c>> Buildings: ' + world.data.buildings.length, 
      'color:#f59e0b;font-family:monospace');
    if (citizens) console.log('%c>> Citizens: ' + citizens.data.citizens.length, 
      'color:#22c55e;font-family:monospace');
    if (nature) console.log('%c>> Trees: ' + nature.data.trees.length, 
      'color:#4ade80;font-family:monospace');
    
    // Force canvas redraw
    forceCanvasRedraw();
    
    console.log('%c📸 Take photos with the camera button!', 
      'color:#a855f7;font-family:monospace');
    console.log('%c🎥 Record videos with the record button!', 
      'color:#ef4444;font-family:monospace');
    console.log('%c🎬 Enter cinematic mode for awesome shots!', 
      'color:#ffd700;font-family:monospace');
  }
  
  /* ═══════════════════════════════════════════════
     FORCE CANVAS REDRAW
     ═══════════════════════════════════════════════ */
  function forceCanvasRedraw() {
    var canvas = document.getElementById('worldCanvas');
    var container = document.getElementById('gameContainer');
    
    if (!canvas) {
      console.error('%c❌ Canvas not found!', 'color:#ef4444;font-family:monospace');
      return;
    }
    
    // Size canvas
    var w = container ? container.clientWidth : window.innerWidth;
    var h = container ? container.clientHeight : (window.innerHeight - 160);
    
    canvas.width = w;
    canvas.height = h;
    
    // Store context
    window.CITY_CANVAS = canvas;
    window.CITY_CTX = canvas.getContext('2d');
    
    console.log('%c>> Canvas redraw: ' + w + 'x' + h, 
      'color:#00d4ff;font-family:monospace');
    
    // Immediately render one frame
    var ctx = window.CITY_CTX;
    if (ctx) {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('World Loading...', w / 2, h / 2);
    }
  }
  
  /* ═══════════════════════════════════════════════
     AUTO-SAVE
     ═══════════════════════════════════════════════ */
  setInterval(function() {
    if (!NXT.state.booted) return;
    
    var world = NXT.get('world');
    var citizens = NXT.get('citizen');
    var time = NXT.get('time');
    
    if (world && citizens && time) {
      var saveData = {
        timestamp: Date.now(),
        time: {
          day: time.data.day,
          hour: time.data.hour,
          minute: time.data.minute,
          season: time.data.season
        },
        population: citizens.data.citizens.length,
        totalBorn: citizens.data.totalBorn,
        totalDied: citizens.data.totalDied
      };
      
      try {
        NXT.storage.save('autosave', saveData);
      } catch (e) {
        // Ignore
      }
    }
  }, 60000);
  
  /* ═══════════════════════════════════════════════
     VISIBILITY HANDLING
     ═══════════════════════════════════════════════ */
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      NXT.pause();
    } else {
      NXT.resume();
    }
  });
  
  /* ═══════════════════════════════════════════════
     START ON DOM READY
     ═══════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  
  /* ═══════════════════════════════════════════════
     GLOBAL HELPERS
     ═══════════════════════════════════════════════ */
  window.NXTGame = {
    boot: boot,
    startWorld: startWorld,
    hideSplash: hideSplash,
    forceRedraw: forceCanvasRedraw,
    status: function() {
      return {
        booted: NXT.state.booted,
        modules: NXT.count(),
        fps: NXT.state.fps,
        frame: NXT.state.frame,
        paused: NXT.state.paused,
        speed: NXT.state.speed
      };
    },
    restart: function() {
      location.reload();
    }
  };
  
  console.log('%c✅ game.js loaded', 
    'color:#22c55e;font-family:monospace;font-weight:bold');
  
})();
