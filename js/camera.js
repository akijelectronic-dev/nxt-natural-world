/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Camera Module
   Author: AL-AMIN
   Part 16/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('camera', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    smoothness: 0.12,
    zoom: 1.0,
    minZoom: 0.4,
    maxZoom: 3.0,
    zoomSpeed: 0.15,
    
    rotation: 0,
    targetRotation: 0,
    rotateSpeed: 0.08,
    
    // Follow player
    followPlayer: true,
    lookAhead: 0.3,
    
    // Screen shake
    shake: {
      enabled: true,
      intensity: 0,
      duration: 0,
      x: 0,
      y: 0
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    // View dimensions
    width: 0,
    height: 0,
    
    // Position (top-left of view in world coords)
    x: 0,
    y: 0,
    
    // Target position
    targetX: 0,
    targetY: 0,
    
    // Center (world coords)
    centerX: 0,
    centerY: 0,
    
    // Zoom
    zoom: 1.0,
    targetZoom: 1.0,
    
    // Rotation
    rotation: 0,
    targetRotation: 0,
    
    // Mode
    mode: 'follow',       // follow | free | cinematic | photo
    photoMode: false,
    
    // Bounds
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('camera', '📷 Initializing camera...');
    
    this.resize();
    
    // Bind zoom controls
    this.bindZoom();
    
    // Bind pan controls (free mode)
    this.bindPan();
    
    // Listen to player
    NXT.on('player:move', this.onPlayerMove.bind(this));
    
    // Listen to world resize
    window.addEventListener('resize', this.resize.bind(this));
    
    NXT.log('camera', '✅ Camera ready: ' + this.data.width + 'x' + this.data.height);
    
    NXT.emit('camera:ready');
  },
  
  /* ═══════════════════════════════════════════════
     RESIZE
     ═══════════════════════════════════════════════ */
  resize: function() {
    var canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    
    var container = document.getElementById('gameContainer');
    if (container) {
      this.data.width = container.clientWidth;
      this.data.height = container.clientHeight;
    } else {
      this.data.width = window.innerWidth;
      this.data.height = window.innerHeight - 160;
    }
    
    // Update world bounds
    var world = NXT.get('world');
    if (world) {
      this.data.minX = 0;
      this.data.minY = 0;
      this.data.maxX = world.data.width * world.data.tileSize - this.data.width;
      this.data.maxY = world.data.height * world.data.tileSize - this.data.height;
    }
  },
  
  /* ═══════════════════════════════════════════════
     PLAYER FOLLOW
     ═══════════════════════════════════════════════ */
  onPlayerMove: function(pos) {
    if (!this.config.followPlayer) return;
    if (this.data.mode !== 'follow' && this.data.mode !== 'cinematic') return;
    
    // Look ahead in direction of movement
    var player = NXT.get('player');
    var aheadX = 0;
    var aheadY = 0;
    
    if (player && player.data.moving) {
      aheadX = player.data.vx * this.config.lookAhead;
      aheadY = player.data.vy * this.config.lookAhead;
    }
    
    this.data.targetX = pos.x + aheadX - this.data.width / 2 / this.data.zoom;
    this.data.targetY = pos.y + aheadY - this.data.height / 2 / this.data.zoom;
  },
  
  /* ═══════════════════════════════════════════════
     ZOOM CONTROLS
     ═══════════════════════════════════════════════ */
  bindZoom: function() {
    var self = this;
    
    // Mouse wheel
    document.addEventListener('wheel', function(e) {
      if (self.data.photoMode) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? -1 : 1;
        self.setZoom(self.data.targetZoom + delta * self.config.zoomSpeed);
      } else {
        var delta2 = e.deltaY > 0 ? -1 : 1;
        self.setZoom(self.data.targetZoom + delta2 * self.config.zoomSpeed);
      }
    }, { passive: false });
    
    // Pinch zoom (mobile)
    var lastDist = 0;
    var canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    
    canvas.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        var delta = (dist - lastDist) / 100;
        self.setZoom(self.data.targetZoom + delta);
        
        lastDist = dist;
      }
    }, { passive: false });
  },
  
  zoomIn: function() {
    this.setZoom(this.data.targetZoom * 1.2);
  },
  
  zoomOut: function() {
    this.setZoom(this.data.targetZoom / 1.2);
  },
  
  setZoom: function(zoom) {
    this.data.targetZoom = NXT.utils.clamp(zoom, this.config.minZoom, this.config.maxZoom);
  },
  
  resetZoom: function() {
    this.data.targetZoom = 1.0;
  },
  
  /* ═══════════════════════════════════════════════
     PAN CONTROLS (Free mode)
     ═══════════════════════════════════════════════ */
  bindPan: function() {
    var self = this;
    var canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    
    function startDrag(e) {
      if (self.data.mode === 'follow') return;
      dragging = true;
      var touch = e.touches ? e.touches[0] : e;
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
    
    function drag(e) {
      if (!dragging) return;
      var touch = e.touches ? e.touches[0] : e;
      var dx = touch.clientX - lastX;
      var dy = touch.clientY - lastY;
      
      self.data.targetX -= dx / self.data.zoom;
      self.data.targetY -= dy / self.data.zoom;
      
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
    
    function endDrag() {
      dragging = false;
    }
    
    canvas.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    canvas.addEventListener('touchstart', startDrag, { passive: true });
    canvas.addEventListener('touchmove', drag, { passive: true });
    canvas.addEventListener('touchend', endDrag);
  },
  
  /* ═══════════════════════════════════════════════
     ROTATION
     ═══════════════════════════════════════════════ */
  rotate: function(amount) {
    this.data.targetRotation += amount;
  },
  
  setRotation: function(angle) {
    this.data.targetRotation = angle;
  },
  
  resetRotation: function() {
    this.data.targetRotation = 0;
  },
  
  /* ═══════════════════════════════════════════════
     SCREEN SHAKE
     ═══════════════════════════════════════════════ */
  shake: function(intensity, duration) {
    if (!this.config.shake.enabled) return;
    this.config.shake.intensity = intensity || 5;
    this.config.shake.duration = duration || 10;
  },
  
  updateShake: function() {
    var s = this.config.shake;
    
    if (s.duration > 0) {
      s.x = (Math.random() - 0.5) * s.intensity;
      s.y = (Math.random() - 0.5) * s.intensity;
      s.duration--;
      s.intensity *= 0.95;
    } else {
      s.x = 0;
      s.y = 0;
    }
  },
  
  /* ═══════════════════════════════════════════════
     PHOTO MODE
     ═══════════════════════════════════════════════ */
  togglePhotoMode: function() {
    this.data.photoMode = !this.data.photoMode;
    
    if (this.data.photoMode) {
      this.data.mode = 'photo';
      this.config.followPlayer = false;
      
      // Show crosshair
      var crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.classList.add('show');
      
      NXT.log('camera', '📸 Photo mode ON');
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('📸 Photo Mode', 'success');
    } else {
      this.data.mode = 'follow';
      this.config.followPlayer = true;
      
      var crosshair2 = document.getElementById('crosshair');
      if (crosshair2) crosshair2.classList.remove('show');
      
      NXT.log('camera', '📸 Photo mode OFF');
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('Photo Mode OFF');
    }
  },
  
  /* ═══════════════════════════════════════════════
     MODE CONTROL
     ═══════════════════════════════════════════════ */
  setMode: function(mode) {
    this.data.mode = mode;
    
    if (mode === 'follow' || mode === 'cinematic') {
      this.config.followPlayer = true;
    } else {
      this.config.followPlayer = false;
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Smooth zoom
    this.data.zoom = NXT.utils.smooth(this.data.zoom, this.data.targetZoom, this.config.smoothness);
    
    // Smooth rotation
    this.data.rotation = NXT.utils.smooth(this.data.rotation, this.data.targetRotation, this.config.rotateSpeed);
    
    // Smooth follow
    if (this.config.followPlayer) {
      this.data.x = NXT.utils.smooth(this.data.x, this.data.targetX, this.config.smoothness);
      this.data.y = NXT.utils.smooth(this.data.y, this.data.targetY, this.config.smoothness);
    } else {
      // Free mode — still smooth
      this.data.x = NXT.utils.smooth(this.data.x, this.data.targetX, this.config.smoothness);
      this.data.y = NXT.utils.smooth(this.data.y, this.data.targetY, this.config.smoothness);
    }
    
    // Clamp to bounds
    var world = NXT.get('world');
    if (world) {
      var maxX = world.data.width * world.data.tileSize - this.data.width / this.data.zoom;
      var maxY = world.data.height * world.data.tileSize - this.data.height / this.data.zoom;
      
      this.data.x = NXT.utils.clamp(this.data.x, 0, Math.max(0, maxX));
      this.data.y = NXT.utils.clamp(this.data.y, 0, Math.max(0, maxY));
    }
    
    // Update shake
    this.updateShake();
    
    // Update center
    this.data.centerX = this.data.x + this.data.width / 2 / this.data.zoom;
    this.data.centerY = this.data.y + this.data.height / 2 / this.data.zoom;
  },
  
  /* ═══════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════ */
  getView: function() {
    return {
      x: this.data.x + this.config.shake.x,
      y: this.data.y + this.config.shake.y,
      width: this.data.width / this.data.zoom,
      height: this.data.height / this.data.zoom,
      zoom: this.data.zoom,
      rotation: this.data.rotation
    };
  },
  
  worldToScreen: function(wx, wy) {
    var view = this.getView();
    return {
      x: (wx - view.x) * view.zoom,
      y: (wy - view.y) * view.zoom
    };
  },
  
  screenToWorld: function(sx, sy) {
    var view = this.getView();
    return {
      x: sx / view.zoom + view.x,
      y: sy / view.zoom + view.y
    };
  },
  
  isVisible: function(wx, wy, margin) {
    margin = margin || 50;
    var view = this.getView();
    return wx >= view.x - margin &&
           wx <= view.x + view.width + margin &&
           wy >= view.y - margin &&
           wy <= view.y + view.height + margin;
  },
  
  /* ═══════════════════════════════════════════════
     APPLY TRANSFORM
     ═══════════════════════════════════════════════ */
  applyTransform: function(ctx) {
    var view = this.getView();
    
    ctx.save();
    
    // Apply zoom
    ctx.scale(view.zoom, view.zoom);
    
    // Apply rotation around center
    if (view.rotation !== 0) {
      ctx.translate(this.data.width / 2, this.data.height / 2);
      ctx.rotate(view.rotation);
      ctx.translate(-this.data.width / 2, -this.data.height / 2);
    }
    
    // Translate camera
    ctx.translate(-view.x, -view.y);
  },
  
  resetTransform: function(ctx) {
    ctx.restore();
  },
  
  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    // Camera doesn't render itself
  }
});

console.log('%c📷 Camera module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
