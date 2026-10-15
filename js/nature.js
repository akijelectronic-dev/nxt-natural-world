/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Nature Module
   Author: AL-AMIN
   Part 9/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('nature', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    trees: 400,
    flowers: 800,
    bushes: 300,
    rocks: 150,
    animals: 60,
    birds: 40,
    butterflies: 80,
    fireflies: 40,
    
    treeSwaySpeed: 0.8,
    flowerSwaySpeed: 1.4,
    animalSpeed: 1.2,
    birdSpeed: 2.5,
    butterflySpeed: 1.8
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    trees: [],
    flowers: [],
    bushes: [],
    rocks: [],
    animals: [],
    birds: [],
    butterflies: [],
    fireflies: [],
    
    time: 0,
    lastAnimalSpawn: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('nature', '🌳 Initializing nature...');
    
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    if (!world || !terrain) {
      NXT.warn('nature', 'Dependencies not ready');
      return;
    }
    
    var startTime = performance.now();
    
    // Clear old decorations
    world.data.trees = [];
    world.data.rocks = [];
    world.data.flowers = [];
    
    // Generate nature
    this.generateTrees();
    this.generateFlowers();
    this.generateBushes();
    this.generateRocks();
    this.generateAnimals();
    this.generateBirds();
    this.generateButterflies();
    this.generateFireflies();
    
    var elapsed = (performance.now() - startTime).toFixed(0);
    NXT.log('nature', '✅ Nature generated in ' + elapsed + 'ms');
    NXT.log('nature', '🌲 Trees: ' + this.data.trees.length);
    NXT.log('nature', '🌸 Flowers: ' + this.data.flowers.length);
    NXT.log('nature', '🦌 Animals: ' + this.data.animals.length);
    NXT.log('nature', '🐦 Birds: ' + this.data.birds.length);
    
    NXT.emit('nature:ready');
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE TREES
     ═══════════════════════════════════════════════ */
  generateTrees: function() {
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    var maxAttempts = this.config.trees * 5;
    
    for (var i = 0; i < maxAttempts && count < this.config.trees; i++) {
      var x = NXT.utils.randomInt(2, w - 3);
      var y = NXT.utils.randomInt(2, h - 3);
      
      var tile = world.getTile(x, y);
      if (!tile || tile.building) continue;
      
      // Trees on grass or forest
      if (tile.type !== TILE.GRASS && tile.type !== TILE.GRASS_DARK && 
          tile.type !== TILE.FOREST && tile.type !== TILE.SAND) continue;
      
      // Check spacing
      var tooClose = false;
      for (var t = 0; t < this.data.trees.length; t++) {
        var tree = this.data.trees[t];
        if (Math.abs(tree.gx - x) < 2 && Math.abs(tree.gy - y) < 2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      
      var treeType = NXT.utils.randomChoice(['oak', 'pine', 'bush', 'palm']);
      
      this.data.trees.push({
        gx: x,
        gy: y,
        x: x * world.data.tileSize + world.data.tileSize / 2,
        y: y * world.data.tileSize + world.data.tileSize / 2,
        type: treeType,
        size: NXT.utils.random(18, 30),
        swayOffset: Math.random() * Math.PI * 2,
        swayAmount: NXT.utils.random(1, 3),
        health: 100,
        age: 0
      });
      count++;
    }
    
    // Also add to world.data
    world.data.trees = this.data.trees;
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE FLOWERS
     ═══════════════════════════════════════════════ */
  generateFlowers: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    var maxAttempts = this.config.flowers * 3;
    
    var colors = ['#ec4899', '#f59e0b', '#ef4444', '#a855f7', '#22c55e', '#ffffff', '#06b6d4'];
    
    for (var i = 0; i < maxAttempts && count < this.config.flowers; i++) {
      var x = NXT.utils.randomInt(2, w - 3);
      var y = NXT.utils.randomInt(2, h - 3);
      
      var tile = world.getTile(x, y);
      if (!tile || tile.building) continue;
      
      if (tile.type !== TILE.GRASS && tile.type !== TILE.GRASS_DARK) continue;
      
      this.data.flowers.push({
        gx: x,
        gy: y,
        x: x * world.data.tileSize + world.data.tileSize / 2 + NXT.utils.random(-8, 8),
        y: y * world.data.tileSize + world.data.tileSize / 2 + NXT.utils.random(-8, 8),
        color: NXT.utils.randomChoice(colors),
        size: NXT.utils.random(2, 4),
        petals: NXT.utils.randomInt(4, 6),
        swayOffset: Math.random() * Math.PI * 2
      });
      count++;
    }
    
    world.data.flowers = this.data.flowers;
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE BUSHES
     ═══════════════════════════════════════════════ */
  generateBushes: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    var maxAttempts = this.config.bushes * 3;
    
    for (var i = 0; i < maxAttempts && count < this.config.bushes; i++) {
      var x = NXT.utils.randomInt(2, w - 3);
      var y = NXT.utils.randomInt(2, h - 3);
      
      var tile = world.getTile(x, y);
      if (!tile || tile.building) continue;
      
      if (tile.type !== TILE.GRASS && tile.type !== TILE.GRASS_DARK && 
          tile.type !== TILE.FOREST) continue;
      
      this.data.bushes.push({
        gx: x,
        gy: y,
        x: x * world.data.tileSize + world.data.tileSize / 2,
        y: y * world.data.tileSize + world.data.tileSize / 2,
        size: NXT.utils.random(10, 18),
        swayOffset: Math.random() * Math.PI * 2,
        variant: Math.random()
      });
      count++;
    }
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE ROCKS
     ═══════════════════════════════════════════════ */
  generateRocks: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    
    for (var i = 0; i < this.config.rocks * 3 && count < this.config.rocks; i++) {
      var x = NXT.utils.randomInt(2, w - 3);
      var y = NXT.utils.randomInt(2, h - 3);
      
      var tile = world.getTile(x, y);
      if (!tile || tile.building) continue;
      
      if (tile.type === TILE.WATER || tile.type === TILE.WATER_DEEP) continue;
      
      this.data.rocks.push({
        gx: x,
        gy: y,
        x: x * world.data.tileSize + world.data.tileSize / 2,
        y: y * world.data.tileSize + world.data.tileSize / 2,
        size: NXT.utils.random(8, 16),
        rotation: Math.random() * Math.PI * 2,
        variant: Math.random()
      });
      count++;
    }
    
    world.data.rocks = this.data.rocks;
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE ANIMALS
     ═══════════════════════════════════════════════ */
  generateAnimals: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    
    var animalTypes = ['deer', 'rabbit', 'fox', 'cow', 'goat', 'dog'];
    var animalIcons = { deer: '🦌', rabbit: '🐰', fox: '🦊', cow: '🐄', goat: '🐐', dog: '🐕' };
    
    for (var i = 0; i < this.config.animals * 3 && count < this.config.animals; i++) {
      var x = NXT.utils.randomInt(5, w - 5);
      var y = NXT.utils.randomInt(5, h - 5);
      
      var tile = world.getTile(x, y);
      if (!tile) continue;
      
      if (tile.type !== TILE.GRASS && tile.type !== TILE.GRASS_DARK && 
          tile.type !== TILE.FOREST) continue;
      
      var animalType = NXT.utils.randomChoice(animalTypes);
      
      this.data.animals.push({
        gx: x,
        gy: y,
        x: x * world.data.tileSize + world.data.tileSize / 2,
        y: y * world.data.tileSize + world.data.tileSize / 2,
        type: animalType,
        icon: animalIcons[animalType],
        state: 'idle',
        targetX: x,
        targetY: y,
        speed: this.config.animalSpeed * NXT.utils.random(0.7, 1.3),
        stateTimer: 0,
        direction: Math.random() * Math.PI * 2,
        size: NXT.utils.random(10, 16)
      });
      count++;
    }
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE BIRDS
     ═══════════════════════════════════════════════ */
  generateBirds: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    for (var i = 0; i < this.config.birds; i++) {
      var x = NXT.utils.randomInt(0, w - 1);
      var y = NXT.utils.randomInt(0, h - 1);
      
      this.data.birds.push({
        x: x * world.data.tileSize,
        y: y * world.data.tileSize,
        vx: NXT.utils.random(-1, 1) * this.config.birdSpeed,
        vy: NXT.utils.random(-1, 1) * this.config.birdSpeed,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: NXT.utils.random(6, 10),
        size: NXT.utils.random(6, 12),
        color: NXT.utils.randomChoice(['#1a1a1a', '#8b4513', '#ffffff', '#f59e0b'])
      });
    }
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE BUTTERFLIES
     ═══════════════════════════════════════════════ */
  generateButterflies: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var count = 0;
    
    for (var i = 0; i < this.config.butterflies * 2 && count < this.config.butterflies; i++) {
      var x = NXT.utils.randomInt(5, w - 5);
      var y = NXT.utils.randomInt(5, h - 5);
      
      var tile = world.getTile(x, y);
      if (!tile) continue;
      if (tile.type !== TILE.GRASS && tile.type !== TILE.GRASS_DARK) continue;
      
      this.data.butterflies.push({
        x: x * world.data.tileSize,
        y: y * world.data.tileSize,
        homeX: x * world.data.tileSize,
        homeY: y * world.data.tileSize,
        phase: Math.random() * Math.PI * 2,
        wingPhase: 0,
        color: NXT.utils.randomChoice(['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']),
        size: NXT.utils.random(5, 9)
      });
      count++;
    }
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE FIREFLIES (Night Only)
     ═══════════════════════════════════════════════ */
  generateFireflies: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    for (var i = 0; i < this.config.fireflies; i++) {
      var x = NXT.utils.randomInt(0, w - 1);
      var y = NXT.utils.randomInt(0, h - 1);
      
      this.data.fireflies.push({
        x: x * world.data.tileSize,
        y: y * world.data.tileSize,
        homeX: x * world.data.tileSize,
        homeY: y * world.data.tileSize,
        phase: Math.random() * Math.PI * 2,
        speed: NXT.utils.random(0.3, 0.8),
        size: NXT.utils.random(2, 4),
        glow: Math.random()
      });
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    this.data.time += dt;
    
    // Update animals
    this.updateAnimals(dt);
    
    // Update birds
    this.updateBirds(dt);
    
    // Update butterflies
    this.updateButterflies(dt);
    
    // Update fireflies
    this.updateFireflies(dt);
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE ANIMALS
     ═══════════════════════════════════════════════ */
  updateAnimals: function(dt) {
    var world = NXT.get('world');
    var w = world.data.width * world.data.tileSize;
    var h = world.data.height * world.data.tileSize;
    
    for (var i = 0; i < this.data.animals.length; i++) {
      var a = this.data.animals[i];
      
      a.stateTimer -= dt;
      
      if (a.state === 'idle') {
        if (a.stateTimer <= 0) {
          // Pick new direction
          a.direction = Math.random() * Math.PI * 2;
          a.state = 'walking';
          a.stateTimer = NXT.utils.random(2, 6);
        }
      } else if (a.state === 'walking') {
        // Move
        a.x += Math.cos(a.direction) * a.speed * dt * 60;
        a.y += Math.sin(a.direction) * a.speed * dt * 60;
        
        // Bounds
        if (a.x < 0 || a.x > w || a.y < 0 || a.y > h) {
          a.direction += Math.PI;
        }
        a.x = NXT.utils.clamp(a.x, 20, w - 20);
        a.y = NXT.utils.clamp(a.y, 20, h - 20);
        
        if (a.stateTimer <= 0) {
          a.state = 'idle';
          a.stateTimer = NXT.utils.random(1, 3);
        }
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE BIRDS
     ═══════════════════════════════════════════════ */
  updateBirds: function(dt) {
    var world = NXT.get('world');
    var w = world.data.width * world.data.tileSize;
    var h = world.data.height * world.data.tileSize;
    
    for (var i = 0; i < this.data.birds.length; i++) {
      var b = this.data.birds[i];
      
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
      b.wingPhase += b.wingSpeed * dt;
      
      // Wrap around
      if (b.x < -50) b.x = w + 50;
      if (b.x > w + 50) b.x = -50;
      if (b.y < -50) b.y = h + 50;
      if (b.y > h + 50) b.y = -50;
      
      // Random direction change
      if (Math.random() < 0.005) {
        b.vx = NXT.utils.random(-1, 1) * this.config.birdSpeed;
        b.vy = NXT.utils.random(-1, 1) * this.config.birdSpeed;
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE BUTTERFLIES
     ═══════════════════════════════════════════════ */
  updateButterflies: function(dt) {
    for (var i = 0; i < this.data.butterflies.length; i++) {
      var b = this.data.butterflies[i];
      
      b.phase += dt * this.config.butterflySpeed;
      
      // Circular motion around home
      var radius = 40;
      b.x = b.homeX + Math.cos(b.phase) * radius;
      b.y = b.homeY + Math.sin(b.phase * 1.3) * radius * 0.7;
      
      b.wingPhase += dt * 12;
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE FIREFLIES
     ═══════════════════════════════════════════════ */
  updateFireflies: function(dt) {
    for (var i = 0; i < this.data.fireflies.length; i++) {
      var f = this.data.fireflies[i];
      
      f.phase += dt * f.speed;
      
      // Circular motion
      var radius = 50;
      f.x = f.homeX + Math.cos(f.phase) * radius;
      f.y = f.homeY + Math.sin(f.phase * 0.7) * radius;
      
      // Glow animation
      f.glow = (Math.sin(f.phase * 3) + 1) / 2;
    }
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (Basic)
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    // Full rendering will be handled by render module (Part 12)
    // This will be called by world renderer
  },
  
  /* ═══════════════════════════════════════════════
     QUERIES
     ═══════════════════════════════════════════════ */
  getStats: function() {
    return {
      trees: this.data.trees.length,
      flowers: this.data.flowers.length,
      bushes: this.data.bushes.length,
      rocks: this.data.rocks.length,
      animals: this.data.animals.length,
      birds: this.data.birds.length,
      butterflies: this.data.butterflies.length,
      fireflies: this.data.fireflies.length
    };
  }
});

console.log('%c🌳 Nature module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
