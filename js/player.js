/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Player Module
   Author: AL-AMIN
   Part 15/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('player', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    walkSpeed: 3.0,
    runSpeed: 6.0,
    crouchSpeed: 1.5,
    
    acceleration: 0.15,
    friction: 0.85,
    
    rotateSpeed: 0.15,
    
    playerRadius: 10
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    // Position
    x: 0,
    y: 0,
    
    // Velocity
    vx: 0,
    vy: 0,
    
    // Direction (angle in radians)
    angle: 0,
    
    // State
    mode: 'walk',     // walk | run | crouch
    moving: false,
    
    // Input
    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    },
    
    // Mobile joystick
    joystick: {
      active: false,
      baseX: 0,
      baseY: 0,
      knobX: 0,
      knobY: 0,
      dx: 0,
      dy: 0
    },
    
    // Looking
    lookX: 0,
    lookY: 0,
    
    // Animation
    walkFrame: 0,
    walkTimer: 0,
    
    // Appearance
    appearance: {
      bodyColor: '#00d4ff',
      shirtColor: '#1e40af',
      pantsColor: '#0f172a',
      hairColor: '#1a1a1a',
      backpack: true
    }
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('player', '🚶 Initializing player...');
    
    var world = NXT.get('world');
    if (!world) {
      NXT.warn('player', 'World not ready');
      return;
    }
    
    // Start position (near city center)
    var buildings = world.data.buildings;
    if (buildings.length > 0) {
      // Find an empty spot near buildings
      var tries = 0;
      while (tries < 20) {
        var b = buildings[Math.floor(Math.random() * buildings.length)];
        var px = b.x + b.w + NXT.utils.random(50, 150);
        var py = b.y + b.h + NXT.utils.random(50, 150);
        
        var terrain = NXT.get('terrain');
        if (terrain.isLand(
          Math.floor(px / world.data.tileSize),
          Math.floor(py / world.data.tileSize)
        )) {
          this.data.x = px;
          this.data.y = py;
          break;
        }
        tries++;
      }
    }
    
    // Fallback: world center
    if (this.data.x === 0) {
      this.data.x = world.data.width * world.data.tileSize / 2;
      this.data.y = world.data.height * world.data.tileSize / 2;
    }
    
    // Bind keyboard
    this.bindKeyboard();
    
    // Bind mobile joystick
    this.bindMobileJoystick();
    
    // Bind look area (mobile)
    this.bindLookArea();
    
    // Update speed indicator
    this.updateSpeedIndicator();
    
    // Track session start
    this.sessionStartTime = Date.now();
    
    NXT.log('player', '✅ Player ready at (' + Math.floor(this.data.x) + ', ' + Math.floor(this.data.y) + ')');
    
    NXT.emit('player:ready');
  },
  
  /* ═══════════════════════════════════════════════
     KEYBOARD INPUT
     ═══════════════════════════════════════════════ */
  bindKeyboard: function() {
    var self = this;
    
    document.addEventListener('keydown', function(e) {
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          self.data.keys.up = true;
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          self.data.keys.down = true;
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          self.data.keys.left = true;
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          self.data.keys.right = true;
          e.preventDefault();
          break;
        case 'shift':
          self.setMode('run');
          break;
        case 'control':
        case 'c':
          self.setMode('crouch');
          break;
      }
    });
    
    document.addEventListener('keyup', function(e) {
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          self.data.keys.up = false;
          break;
        case 's':
        case 'arrowdown':
          self.data.keys.down = false;
          break;
        case 'a':
        case 'arrowleft':
          self.data.keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          self.data.keys.right = false;
          break;
        case 'shift':
        case 'control':
        case 'c':
          self.setMode('walk');
          break;
      }
    });
  },
  
  /* ═══════════════════════════════════════════════
     MOBILE JOYSTICK
     ═══════════════════════════════════════════════ */
  bindMobileJoystick: function() {
    var self = this;
    var joystick = document.getElementById('moveJoystick');
    if (!joystick) return;
    
    var knob = joystick.querySelector('.joystick-knob');
    var base = joystick.querySelector('.joystick-base');
    if (!knob || !base) return;
    
    var maxDist = 45;
    
    function startMove(e) {
      e.preventDefault();
      var touch = e.touches ? e.touches[0] : e;
      var rect = base.getBoundingClientRect();
      
      self.data.joystick.active = true;
      self.data.joystick.baseX = rect.left + rect.width / 2;
      self.data.joystick.baseY = rect.top + rect.height / 2;
      
      updateKnob(touch.clientX, touch.clientY);
    }
    
    function moveJoystick(e) {
      if (!self.data.joystick.active) return;
      e.preventDefault();
      var touch = e.touches ? e.touches[0] : e;
      updateKnob(touch.clientX, touch.clientY);
    }
    
    function endMove(e) {
      self.data.joystick.active = false;
      self.data.joystick.dx = 0;
      self.data.joystick.dy = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    }
    
    function updateKnob(cx, cy) {
      var dx = cx - self.data.joystick.baseX;
      var dy = cy - self.data.joystick.baseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
        dist = maxDist;
      }
      
      self.data.joystick.dx = dx / maxDist;
      self.data.joystick.dy = dy / maxDist;
      
      knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }
    
    joystick.addEventListener('touchstart', startMove, { passive: false });
    joystick.addEventListener('touchmove', moveJoystick, { passive: false });
    joystick.addEventListener('touchend', endMove);
    joystick.addEventListener('touchcancel', endMove);
    
    joystick.addEventListener('mousedown', startMove);
    document.addEventListener('mousemove', moveJoystick);
    document.addEventListener('mouseup', endMove);
  },
  
  /* ═══════════════════════════════════════════════
     LOOK AREA (Mobile)
     ═══════════════════════════════════════════════ */
  bindLookArea: function() {
    var self = this;
    var area = document.getElementById('lookArea');
    if (!area) return;
    
    var lastX = 0;
    var lastY = 0;
    var tracking = false;
    
    area.addEventListener('touchstart', function(e) {
      var touch = e.touches[0];
      lastX = touch.clientX;
      lastY = touch.clientY;
      tracking = true;
    }, { passive: true });
    
    area.addEventListener('touchmove', function(e) {
      if (!tracking) return;
      var touch = e.touches[0];
      var dx = touch.clientX - lastX;
      var dy = touch.clientY - lastY;
      
      // Rotate camera by dragging
      if (NXT.camera && NXT.camera.rotate) {
        NXT.camera.rotate(dx * 0.01);
      }
      
      lastX = touch.clientX;
      lastY = touch.clientY;
    }, { passive: true });
    
    area.addEventListener('touchend', function() {
      tracking = false;
    });
  },
  
  /* ═══════════════════════════════════════════════
     SET MODE
     ═══════════════════════════════════════════════ */
  setMode: function(mode) {
    if (this.data.mode === mode) return;
    this.data.mode = mode;
    this.updateSpeedIndicator();
  },
  
  toggleWalk: function() {
    var modes = ['walk', 'run', 'crouch'];
    var idx = modes.indexOf(this.data.mode);
    var next = modes[(idx + 1) % modes.length];
    this.setMode(next);
    NXT.emit('player:mode', next);
  },
  
  updateSpeedIndicator: function() {
    var el = document.getElementById('speedIndicator');
    if (!el) return;
    
    var icons = {
      walk: 'fa-walking',
      run: 'fa-running',
      crouch: 'fa-angle-down'
    };
    var labels = {
      walk: 'Walking',
      run: 'Running',
      crouch: 'Crouching'
    };
    
    el.innerHTML = '<i class="fas ' + icons[this.data.mode] + '"></i><span>' + labels[this.data.mode] + '</span>';
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    var world = NXT.get('world');
    if (!world) return;
    
    // Get input direction
    var inputX = 0;
    var inputY = 0;
    
    // Keyboard input
    if (this.data.keys.up) inputY -= 1;
    if (this.data.keys.down) inputY += 1;
    if (this.data.keys.left) inputX -= 1;
    if (this.data.keys.right) inputX += 1;
    
    // Mobile joystick input
    if (this.data.joystick.active) {
      inputX += this.data.joystick.dx;
      inputY += this.data.joystick.dy;
    }
    
    // Normalize
    var inputMag = Math.sqrt(inputX * inputX + inputY * inputY);
    if (inputMag > 1) {
      inputX /= inputMag;
      inputY /= inputMag;
    }
    
    // Determine target velocity
    var targetSpeed = this.config.walkSpeed;
    if (this.data.mode === 'run') targetSpeed = this.config.runSpeed;
    if (this.data.mode === 'crouch') targetSpeed = this.config.crouchSpeed;
    
    var targetVX = inputX * targetSpeed * 60;
    var targetVY = inputY * targetSpeed * 60;
    
    // Accelerate
    this.data.vx += (targetVX - this.data.vx) * this.config.acceleration;
    this.data.vy += (targetVY - this.data.vy) * this.config.acceleration;
    
    // Apply friction when no input
    if (Math.abs(inputX) < 0.1 && Math.abs(inputY) < 0.1) {
      this.data.vx *= this.config.friction;
      this.data.vy *= this.config.friction;
    }
    
    // Determine moving state
    this.data.moving = Math.abs(this.data.vx) > 5 || Math.abs(this.data.vy) > 5;
    
    // Move
    var newX = this.data.x + this.data.vx * dt;
    var newY = this.data.y + this.data.vy * dt;
    
    // Collision check (simple)
    var tileSize = world.data.tileSize;
    var newGx = Math.floor(newX / tileSize);
    var newGy = Math.floor(newY / tileSize);
    
    var terrain = NXT.get('terrain');
    if (terrain && terrain.isLand(newGx, newGy)) {
      var tile = world.getTile(newGx, newGy);
      if (tile && tile.walkable !== false) {
        this.data.x = newX;
        this.data.y = newY;
      } else {
        // Try sliding
        var tileGx = Math.floor(this.data.x / tileSize);
        var tileGy = Math.floor(this.data.y / tileSize);
        
        var canMoveX = terrain.isLand(newGx, tileGy) && world.getTile(newGx, tileGy).walkable !== false;
        var canMoveY = terrain.isLand(tileGx, newGy) && world.getTile(tileGx, newGy).walkable !== false;
        
        if (canMoveX) this.data.x = newX;
        if (canMoveY) this.data.y = newY;
      }
    }
    
    // Update facing angle
    if (this.data.moving) {
      this.data.angle = Math.atan2(this.data.vy, this.data.vx);
      
      // Walk animation
      this.data.walkTimer += dt;
      if (this.data.walkTimer > 0.15) {
        this.data.walkTimer = 0;
        this.data.walkFrame = (this.data.walkFrame + 1) % 4;
      }
    } else {
      this.data.walkFrame = 0;
    }
    
    // Emit move event
    NXT.emit('player:move', { x: this.data.x, y: this.data.y });
  },
  
  /* ═══════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════ */
  getPosition: function() {
    return { x: this.data.x, y: this.data.y };
  },
  
  getTilePosition: function() {
    var world = NXT.get('world');
    return {
      gx: Math.floor(this.data.x / world.data.tileSize),
      gy: Math.floor(this.data.y / world.data.tileSize)
    };
  },
  
  getDirection: function() {
    // Returns: up | down | left | right
    var a = this.data.angle;
    if (a > -Math.PI/4 && a <= Math.PI/4) return 'right';
    if (a > Math.PI/4 && a <= 3*Math.PI/4) return 'down';
    if (a > -3*Math.PI/4 && a <= -Math.PI/4) return 'up';
    return 'left';
  },
  
  getAppearance: function() {
    return this.data.appearance;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (called by world render)
     ═══════════════════════════════════════════════ */
  render: function(ctx, camera) {
    if (!ctx || !camera) return;
    
    var screenX = this.data.x - camera.x;
    var screenY = this.data.y - camera.y;
    
    // Skip if off-screen
    if (screenX < -50 || screenX > camera.width + 50) return;
    if (screenY < -50 || screenY > camera.height + 50) return;
    
    var appearance = this.data.appearance;
    var bodyHeight = 30;
    var bodyWidth = 16;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + bodyHeight / 2, bodyWidth / 2 + 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Walk bob
    var bobY = this.data.moving ? Math.sin(this.data.walkFrame * Math.PI / 2) * 2 : 0;
    
    // Legs
    ctx.fillStyle = appearance.pantsColor;
    var legOffset = this.data.moving ? Math.sin(this.data.walkFrame * Math.PI / 2) * 3 : 0;
    ctx.fillRect(screenX - 6, screenY + bodyHeight / 2 - 10 + bobY, 5, 12 + legOffset);
    ctx.fillRect(screenX + 1, screenY + bodyHeight / 2 - 10 + bobY, 5, 12 - legOffset);
    
    // Body
    ctx.fillStyle = appearance.shirtColor;
    ctx.beginPath();
    ctx.roundRect(screenX - bodyWidth / 2, screenY - 5 + bobY, bodyWidth, bodyHeight - 15, 3);
    ctx.fill();
    
    // Head
    ctx.fillStyle = appearance.bodyColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 12 + bobY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair
    ctx.fillStyle = appearance.hairColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 14 + bobY, 8, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Player indicator ring
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 24, 0, Math.PI * 2);
    ctx.stroke();
    
    // "YOU" label
    ctx.fillStyle = 'rgba(0, 212, 255, 0.9)';
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', screenX, screenY - 32);
  }
});

console.log('%c🚶 Player module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
