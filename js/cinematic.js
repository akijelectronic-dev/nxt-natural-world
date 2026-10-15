/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Cinematic Module
   Author: AL-AMIN
   Part 18/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('cinematic', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    enabled: false,
    autoDetect: true,
    
    defaultDuration: 12,     // seconds
    transitionDuration: 1.2,
    
    // Shot types
    shots: {
      wide:      { distance: 400, height: 0,   angle: 0,     duration: 5 },
      medium:    { distance: 200, height: 0,   angle: 0,     duration: 4 },
      close:     { distance: 100, height: -20, angle: 0,     duration: 3 },
      drone:     { distance: 500, height: -400, angle: 0,    duration: 8 },
      orbital:   { distance: 250, height: -50,  angle: 360,  duration: 10 },
      tracking:  { distance: 150, height: 0,   angle: 0,     duration: 6 },
      dolly:     { distance: 300, height: -30, angle: 0,     duration: 7 }
    },
    
    // Effects
    effects: {
      vignette: true,
      colorGrade: true,
      filmGrain: false,
      letterbox: true,
      depthOfField: false
    },
    
    // Color grades
    colorGrades: {
      none:      { r: 1.0, g: 1.0, b: 1.0, contrast: 1.0, saturation: 1.0 },
      warm:      { r: 1.15, g: 1.05, b: 0.9, contrast: 1.05, saturation: 1.1 },
      cool:      { r: 0.9, g: 1.0, b: 1.15, contrast: 1.05, saturation: 1.05 },
      vintage:   { r: 1.1, g: 1.0, b: 0.85, contrast: 0.9, saturation: 0.85 },
      dramatic:  { r: 1.05, g: 1.0, b: 1.05, contrast: 1.3, saturation: 0.9 },
      cinematic: { r: 1.05, g: 1.0, b: 0.95, contrast: 1.1, saturation: 1.05 }
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    active: false,
    shotIndex: 0,
    shotTimer: 0,
    currentShot: 'wide',
    currentGrade: 'cinematic',
    
    // Camera state for cinematic
    cameraOverride: {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0,
      targetX: 0,
      targetY: 0,
      targetZoom: 1,
      targetRotation: 0
    },
    
    // Transition
    transitioning: false,
    transitionProgress: 0,
    
    // Auto-detect cooldowns
    lastAutoDetect: 0,
    autoDetectCooldown: 30,
    
    // Duration
    startTime: 0,
    duration: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('cinematic', '🎬 Initializing cinematic mode...');
    
    // Listen to events for auto-detection
    NXT.on('citizen:birth', this.onSpecialEvent.bind(this));
    NXT.on('citizen:death', this.onSpecialEvent.bind(this));
    NXT.on('weather:change', this.onWeatherChange.bind(this));
    NXT.on('time:sunrise', this.onSunrise.bind(this));
    NXT.on('time:sunset', this.onSunset.bind(this));
    
    NXT.log('cinematic', '✅ Cinematic ready');
    
    NXT.emit('cinematic:ready');
  },
  
  /* ═══════════════════════════════════════════════
     ENTER CINEMATIC MODE
     ═══════════════════════════════════════════════ */
  enter: function() {
    if (this.data.active) {
      this.exit();
      return;
    }
    
    this.data.active = true;
    this.config.enabled = true;
    this.data.shotIndex = 0;
    this.data.shotTimer = 0;
    this.data.startTime = Date.now();
    this.data.duration = this.config.defaultDuration;
    
    // Set initial shot
    this.setShot('wide');
    
    // Add letterbox
    if (this.config.effects.letterbox) {
      this.addLetterbox();
    }
    
    // Update UI
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('🎬 Cinematic Mode ON', 'success');
    }
    
    NXT.log('cinematic', '🎬 Cinematic mode entered');
    NXT.emit('cinematic:enter');
  },
  
  exit: function() {
    this.data.active = false;
    this.config.enabled = false;
    
    // Remove letterbox
    this.removeLetterbox();
    
    // Restore camera
    var camera = NXT.get('camera');
    if (camera) {
      camera.data.mode = 'follow';
      camera.config.followPlayer = true;
      camera.data.targetZoom = 1;
      camera.data.targetRotation = 0;
    }
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('Cinematic Mode OFF');
    }
    
    NXT.log('cinematic', '🎬 Cinematic mode exited');
    NXT.emit('cinematic:exit');
  },
  
  /* ═══════════════════════════════════════════════
     SET SHOT
     ═══════════════════════════════════════════════ */
  setShot: function(shotName) {
    var shot = this.config.shots[shotName];
    if (!shot) shot = this.config.shots.wide;
    
    this.data.currentShot = shotName;
    this.data.shotTimer = 0;
    
    NXT.log('cinematic', '📽️ Shot: ' + shotName);
    NXT.emit('cinematic:shot', shotName);
  },
  
  cycleShot: function() {
    var shots = Object.keys(this.config.shots);
    var nextIdx = (shots.indexOf(this.data.currentShot) + 1) % shots.length;
    this.setShot(shots[nextIdx]);
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    if (!this.data.active) return;
    
    // Check total duration
    if (Date.now() - this.data.startTime > this.data.duration * 1000) {
      this.exit();
      return;
    }
    
    // Update shot timer
    this.data.shotTimer += dt;
    
    var shot = this.config.shots[this.data.currentShot];
    if (shot && this.data.shotTimer >= shot.duration) {
      // Auto-advance to next shot
      this.cycleShot();
    }
    
    // Update camera override based on shot
    this.updateCameraForShot(dt);
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE CAMERA FOR SHOT
     ═══════════════════════════════════════════════ */
  updateCameraForShot: function(dt) {
    var camera = NXT.get('camera');
    var player = NXT.get('player');
    
    if (!camera || !player) return;
    
    var shot = this.config.shots[this.data.currentShot];
    if (!shot) return;
    
    var px = player.data.x;
    var py = player.data.y;
    
    var time = this.data.shotTimer;
    var targetX, targetY, targetZoom, targetRotation;
    
    switch (this.data.currentShot) {
      case 'wide':
        // Far away, showing full context
        targetX = px - camera.data.width / 2 / 0.6;
        targetY = py - camera.data.height / 2 / 0.6;
        targetZoom = 0.6;
        targetRotation = 0;
        break;
        
      case 'medium':
        targetX = px - camera.data.width / 2 / 0.9;
        targetY = py - camera.data.height / 2 / 0.9;
        targetZoom = 0.9;
        targetRotation = 0;
        break;
        
      case 'close':
        targetX = px - camera.data.width / 2 / 1.5;
        targetY = py - camera.data.height / 2 / 1.5 - 20;
        targetZoom = 1.5;
        targetRotation = 0;
        break;
        
      case 'drone':
        // High above, looking down
        targetX = px - camera.data.width / 2 / 0.5;
        targetY = py - camera.data.height / 2 / 0.5;
        targetZoom = 0.5;
        targetRotation = 0;
        break;
        
      case 'orbital':
        // Orbiting around player
        var angle = (time / shot.duration) * Math.PI * 2;
        var radius = 250;
        targetX = px + Math.cos(angle) * radius - camera.data.width / 2 / 1.2;
        targetY = py + Math.sin(angle) * radius - camera.data.height / 2 / 1.2;
        targetZoom = 1.2;
        targetRotation = 0;
        break;
        
      case 'tracking':
        // Following from behind
        var px2 = player.data.x;
        var py2 = player.data.y;
        var aheadAngle = player.data.angle;
        targetX = px2 - Math.cos(aheadAngle) * 150 - camera.data.width / 2 / 1.1;
        targetY = py2 - Math.sin(aheadAngle) * 150 - camera.data.height / 2 / 1.1;
        targetZoom = 1.1;
        targetRotation = 0;
        break;
        
      case 'dolly':
        // Moving forward slowly
        var progress = time / shot.duration;
        targetX = px - camera.data.width / 2 / 0.85 - progress * 100;
        targetY = py - camera.data.height / 2 / 0.85;
        targetZoom = 0.85 + progress * 0.3;
        targetRotation = 0;
        break;
        
      default:
        targetX = px - camera.data.width / 2 / 1;
        targetY = py - camera.data.height / 2 / 1;
        targetZoom = 1;
        targetRotation = 0;
    }
    
    // Smooth camera transition
    var smooth = 0.05;
    camera.data.targetX = targetX;
    camera.data.targetY = targetY;
    camera.data.targetZoom = targetZoom;
    camera.data.targetRotation = targetRotation;
    
    // Override follow
    camera.config.followPlayer = false;
    camera.data.mode = 'cinematic';
  },
  
  /* ═══════════════════════════════════════════════
     LETTERBOX
     ═══════════════════════════════════════════════ */
  addLetterbox: function() {
    var existing = document.getElementById('cinematicLetterbox');
    if (existing) return;
    
    var container = document.getElementById('gameContainer');
    if (!container) return;
    
    var letterbox = document.createElement('div');
    letterbox.id = 'cinematicLetterbox';
    letterbox.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50';
    
    var barTop = document.createElement('div');
    barTop.style.cssText = 'position:absolute;top:0;left:0;right:0;height:12%;background:#000;transition:height 0.5s';
    
    var barBottom = document.createElement('div');
    barBottom.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:12%;background:#000;transition:height 0.5s';
    
    letterbox.appendChild(barTop);
    letterbox.appendChild(barBottom);
    container.appendChild(letterbox);
    
    // Animate in
    setTimeout(function() {
      barTop.style.height = '12%';
      barBottom.style.height = '12%';
    }, 10);
  },
  
  removeLetterbox: function() {
    var letterbox = document.getElementById('cinematicLetterbox');
    if (letterbox) {
      letterbox.remove();
    }
  },
  
  /* ═══════════════════════════════════════════════
     COLOR GRADING (Applied during render)
     ═══════════════════════════════════════════════ */
  applyColorGrade: function(ctx) {
    if (!this.config.effects.colorGrade) return;
    if (!this.data.active) return;
    
    var grade = this.config.colorGrades[this.data.currentGrade];
    if (!grade) return;
    
    // Apply via globalCompositeOperation
    // This is a simplified version — real grading would use shaders
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  },
  
  setColorGrade: function(name) {
    if (this.config.colorGrades[name]) {
      this.data.currentGrade = name;
      NXT.log('cinematic', '🎨 Color grade: ' + name);
    }
  },
  
  /* ═══════════════════════════════════════════════
     AUTO-DETECT SPECIAL MOMENTS
     ═══════════════════════════════════════════════ */
  onSpecialEvent: function(data) {
    if (!this.config.autoDetect) return;
    if (this.data.active) return;
    
    var now = Date.now();
    if (now - this.data.lastAutoDetect < this.data.autoDetectCooldown * 1000) return;
    
    this.data.lastAutoDetect = now;
    
    NXT.log('cinematic', '✨ Special moment detected');
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('🎬 Cinematic moment!', 'success');
    }
    
    // Auto-enter cinematic briefly
    this.enter();
  },
  
  onWeatherChange: function(data) {
    if (!this.config.autoDetect) return;
    
    // Dramatic weather changes
    if (data.to === 'stormy' || data.to === 'snowy') {
      this.onSpecialEvent(data);
    }
  },
  
  onSunrise: function() {
    if (!this.config.autoDetect) return;
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('🌅 Sunrise!', 'success');
    }
  },
  
  onSunset: function() {
    if (!this.config.autoDetect) return;
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('🌇 Sunset!', 'success');
    }
  },
  
  /* ═══════════════════════════════════════════════
     TOGGLE
     ═══════════════════════════════════════════════ */
  toggle: function() {
    if (this.data.active) {
      this.exit();
    } else {
      this.enter();
    }
  },
  
  isActive: function() {
    return this.data.active;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (called by main render)
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    if (!this.data.active) return;
    
    // Apply vignette
    if (this.config.effects.vignette) {
      var grad = ctx.createRadialGradient(
        ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.height * 0.3,
        ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.height * 0.8
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
});

console.log('%c🎬 Cinematic module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
