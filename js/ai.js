/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — AI Module
   Author: AL-AMIN
   Part 11/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('ai', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    thinkInterval: 1.5,
    socialRadius: 100,
    socialChance: 0.02,
    
    pathfindMaxNodes: 500,
    pathfindGrid: 24,
    
    emotions: {
      happy: { color: '#22c55e', icon: '😊' },
      neutral: { color: '#f1f5f9', icon: '😐' },
      sad: { color: '#3b82f6', icon: '😢' },
      angry: { color: '#ef4444', icon: '😠' },
      tired: { color: '#a855f7', icon: '😴' }
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    decisionsThisTick: 0,
    pathfindCalls: 0,
    socialEvents: 0,
    lastStatsUpdate: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('ai', '🧠 Initializing AI brain...');
    
    var citizens = NXT.get('citizen');
    if (!citizens || citizens.data.citizens.length === 0) {
      NXT.warn('ai', 'No citizens to manage');
      return;
    }
    
    // Give each citizen a "think" timer
    for (var i = 0; i < citizens.data.citizens.length; i++) {
      var c = citizens.data.citizens[i];
      c.thinkTimer = Math.random() * this.config.thinkInterval;
      c.emotion = 'neutral';
      c.emotionTimer = 0;
    }
    
    NXT.log('ai', '✅ AI brain ready for ' + citizens.data.citizens.length + ' citizens');
    
    NXT.emit('ai:ready');
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    var citizens = NXT.get('citizen');
    if (!citizens || !citizens.data.citizens.length) return;
    
    var list = citizens.data.citizens;
    this.data.decisionsThisTick = 0;
    
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      
      // Update emotion timer
      c.emotionTimer -= dt;
      if (c.emotionTimer <= 0) {
        this.updateEmotion(c);
        c.emotionTimer = NXT.utils.random(5, 15);
      }
      
      // Think periodically
      c.thinkTimer -= dt;
      if (c.thinkTimer <= 0) {
        this.think(c);
        c.thinkTimer = this.config.thinkInterval + NXT.utils.random(-0.3, 0.3);
        this.data.decisionsThisTick++;
      }
    }
    
    // Update UI stats
    var now = Date.now();
    if (now - this.data.lastStatsUpdate > 1000) {
      this.data.lastStatsUpdate = now;
      this.updateUIStats();
    }
  },
  
  /* ═══════════════════════════════════════════════
     THINK — Main AI Decision
     ═══════════════════════════════════════════════ */
  think: function(citizen) {
    // Priority-based decision making
    
    // 1. HIGH PRIORITY: Health
    if (citizen.health < 30) {
      this.seekHelp(citizen);
      return;
    }
    
    // 2. Energy low → go home / rest
    if (citizen.energy < 20) {
      this.goHome(citizen);
      return;
    }
    
    // 3. Schedule-based action
    var hour = this.getHour();
    
    // 4. Random task
    var roll = Math.random();
    
    if (roll < 0.15) {
      // Social interaction
      this.socialize(citizen);
    } else if (roll < 0.30) {
      // Random walk
      this.wander(citizen);
    } else if (roll < 0.45 && citizen.workId) {
      // Go to work
      this.goToWork(citizen);
    } else if (roll < 0.55 && citizen.homeId) {
      // Go home
      this.goHome(citizen);
    } else if (roll < 0.70) {
      // Idle
      this.idle(citizen);
    } else {
      // Wander
      this.wander(citizen);
    }
  },
  
  /* ═══════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════ */
  
  goHome: function(citizen) {
    if (!citizen.homeId) {
      this.wander(citizen);
      return;
    }
    
    var buildings = NXT.get('buildings');
    var home = buildings ? this.findBuildingById(citizen.homeId) : null;
    if (!home) {
      this.wander(citizen);
      return;
    }
    
    citizen.target = {
      x: home.x + home.w / 2,
      y: home.y + home.h / 2
    };
    citizen.state = 'walking';
    citizen.currentTask = 'going_home';
    citizen.energy = Math.min(100, citizen.energy + 5);
  },
  
  goToWork: function(citizen) {
    if (!citizen.workId) {
      this.wander(citizen);
      return;
    }
    
    var buildings = NXT.get('buildings');
    var work = buildings ? this.findBuildingById(citizen.workId) : null;
    if (!work) {
      this.wander(citizen);
      return;
    }
    
    citizen.target = {
      x: work.x + work.w / 2,
      y: work.y + work.h / 2
    };
    citizen.state = 'walking';
    citizen.currentTask = 'going_work';
  },
  
  wander: function(citizen) {
    var world = NXT.get('world');
    var maxX = world.data.width * world.data.tileSize;
    var maxY = world.data.height * world.data.tileSize;
    
    var range = 200;
    var tx = NXT.utils.clamp(citizen.x + NXT.utils.random(-range, range), 40, maxX - 40);
    var ty = NXT.utils.clamp(citizen.y + NXT.utils.random(-range, range), 40, maxY - 40);
    
    citizen.target = { x: tx, y: ty };
    citizen.state = 'walking';
    citizen.currentTask = 'wandering';
  },
  
  idle: function(citizen) {
    citizen.state = 'idle';
    citizen.currentTask = 'idle';
    citizen.target = null;
    citizen.idleTime = 0;
  },
  
  socialize: function(citizen) {
    var citizens = NXT.get('citizen');
    if (!citizens) return;
    
    // Find nearby citizen
    var nearest = null;
    var minDist = this.config.socialRadius;
    
    for (var i = 0; i < citizens.data.citizens.length; i++) {
      var other = citizens.data.citizens[i];
      if (other.id === citizen.id) continue;
      
      var d = NXT.utils.distance(citizen.x, citizen.y, other.x, other.y);
      if (d < minDist) {
        minDist = d;
        nearest = other;
      }
    }
    
    if (nearest) {
      // Walk toward them
      citizen.target = { x: nearest.x, y: nearest.y };
      citizen.state = 'walking';
      citizen.currentTask = 'socializing';
      citizen.socialTarget = nearest.id;
      
      // Boost happiness
      citizen.happiness = Math.min(100, citizen.happiness + 1);
      
      this.data.socialEvents++;
    } else {
      this.wander(citizen);
    }
  },
  
  seekHelp: function(citizen) {
    // Find nearest hospital or clinic
    var buildings = NXT.get('buildings');
    if (!buildings) {
      this.idle(citizen);
      return;
    }
    
    var hospitals = buildings.data ? [] : (NXT.get('world').data.buildings || []);
    var nearest = null;
    var minDist = Infinity;
    
    for (var i = 0; i < NXT.get('world').data.buildings.length; i++) {
      var b = NXT.get('world').data.buildings[i];
      if (b.zone === 'healthcare') {
        var d = NXT.utils.distance(citizen.x, citizen.y, b.x, b.y);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }
    
    if (nearest) {
      citizen.target = { x: nearest.x + nearest.w / 2, y: nearest.y + nearest.h / 2 };
      citizen.state = 'walking';
      citizen.currentTask = 'seeking_help';
    } else {
      citizen.health = Math.min(100, citizen.health + 1);
      this.idle(citizen);
    }
  },
  
  /* ═══════════════════════════════════════════════
     EMOTIONS
     ═══════════════════════════════════════════════ */
  updateEmotion: function(citizen) {
    var h = citizen.happiness;
    var e = citizen.energy;
    
    var oldEmotion = citizen.emotion;
    
    if (h > 80 && e > 60) citizen.emotion = 'happy';
    else if (h < 30) citizen.emotion = 'sad';
    else if (h < 50 && e < 30) citizen.emotion = 'tired';
    else if (h < 20) citizen.emotion = 'angry';
    else citizen.emotion = 'neutral';
    
    if (oldEmotion !== citizen.emotion) {
      NXT.emit('citizen:emotion', { citizen: citizen, emotion: citizen.emotion });
    }
  },
  
  /* ═══════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════ */
  findBuildingById: function(id) {
    var world = NXT.get('world');
    if (!world) return null;
    
    for (var i = 0; i < world.data.buildings.length; i++) {
      if (world.data.buildings[i].id === id) return world.data.buildings[i];
    }
    return null;
  },
  
  getHour: function() {
    var time = NXT.get('time');
    if (time && time.data) return time.data.hour || 12;
    return new Date().getHours();
  },
  
  /* ═══════════════════════════════════════════════
     UI STATS
     ═══════════════════════════════════════════════ */
  updateUIStats: function() {
    var citizens = NXT.get('citizen');
    if (!citizens) return;
    
    var el = document.getElementById('dbgCitizens');
    if (el) el.textContent = citizens.data.citizens.length;
    
    // Update top bar population
    var popEl = document.getElementById('topPop');
    if (popEl) popEl.textContent = citizens.data.citizens.length;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    // Rendering in Part 12
  }
});

console.log('%c🧠 AI module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
