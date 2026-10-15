/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Terrain Module
   Author: AL-AMIN
   Part 6/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('terrain', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    seed: 12345,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    
    // Thresholds (0-1)
    waterLevel: 0.30,
    deepWaterLevel: 0.20,
    beachLevel: 0.34,
    grassLevel: 0.65,
    forestLevel: 0.72,
    mountainLevel: 0.82,
    snowLevel: 0.92,
    
    // Sizes
    riverWidth: 8,
    lakeSize: 15
  },
  
  /* ═══════════════════════════════════════════════
     NOISE
     ═══════════════════════════════════════════════ */
  noise: {
    seed: 0,
    
    // Simple pseudo-random noise
    random: function(x, y) {
      var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return n - Math.floor(n);
    },
    
    // Value noise with smooth interpolation
    value: function(x, y) {
      var ix = Math.floor(x);
      var iy = Math.floor(y);
      var fx = x - ix;
      var fy = y - iy;
      
      // Smooth
      fx = fx * fx * (3 - 2 * fx);
      fy = fy * fy * (3 - 2 * fy);
      
      var v00 = this.random(ix, iy);
      var v10 = this.random(ix + 1, iy);
      var v01 = this.random(ix, iy + 1);
      var v11 = this.random(ix + 1, iy + 1);
      
      var top = v00 * (1 - fx) + v10 * fx;
      var bot = v01 * (1 - fx) + v11 * fx;
      
      return top * (1 - fy) + bot * fy;
    },
    
    // Fractal Brownian Motion — multiple octaves
    fbm: function(x, y, octaves, persistence, lacunarity) {
      var total = 0;
      var amplitude = 1;
      var frequency = 1;
      var maxValue = 0;
      
      for (var i = 0; i < octaves; i++) {
        total += this.value(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      
      return total / maxValue;
    }
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('terrain', '🌱 Initializing terrain generation...');
    
    var world = NXT.get('world');
    if (!world || !world.data.grid.length) {
      NXT.warn('terrain', 'World not ready');
      return;
    }
    
    this.noise.seed = this.config.seed + Math.random() * 1000;
    
    var startTime = performance.now();
    
    // Generate heightmap
    this.generateHeightmap();
    
    // Apply terrain types based on height
    this.applyTerrainTypes();
    
    // Generate river
    this.generateRiver();
    
    // Generate lakes
    this.generateLakes();
    
    // Smooth edges
    this.smoothTerrain();
    
    var elapsed = (performance.now() - startTime).toFixed(0);
    NXT.log('terrain', '✅ Terrain generated in ' + elapsed + 'ms');
    
    // Update world stats
    if (world.updateStats) world.updateStats();
    
    // Emit event
    NXT.emit('terrain:ready');
  },
  
  /* ═══════════════════════════════════════════════
     HEIGHTMAP GENERATION
     ═══════════════════════════════════════════════ */
  generateHeightmap: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var cfg = this.config;
    
    var scale = 0.02;
    
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        // Get fractal noise value
        var height = this.noise.fbm(
          x * scale,
          y * scale,
          cfg.octaves,
          cfg.persistence,
          cfg.lacunarity
        );
        
        // Add island falloff (edges become water)
        var dx = (x / w) - 0.5;
        var dy = (y / h) - 0.5;
        var distFromCenter = Math.sqrt(dx * dx + dy * dy);
        var falloff = Math.max(0, 1 - distFromCenter * 1.8);
        
        height = height * 0.7 + falloff * 0.3;
        
        // Add slight variance
        height += (Math.random() - 0.5) * 0.05;
        
        // Clamp
        height = Math.max(0, Math.min(1, height));
        
        var tile = world.data.grid[y][x];
        tile.height = height;
        tile.moisture = this.noise.fbm(x * 0.05, y * 0.05, 3, 0.5, 2);
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     APPLY TERRAIN TYPES
     ═══════════════════════════════════════════════ */
  applyTerrainTypes: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var cfg = this.config;
    
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tile = world.data.grid[y][x];
        var height = tile.height;
        var moisture = tile.moisture;
        
        // Determine terrain type
        if (height < cfg.deepWaterLevel) {
          tile.type = TILE.WATER_DEEP;
          tile.walkable = false;
        } else if (height < cfg.waterLevel) {
          tile.type = TILE.WATER;
          tile.walkable = false;
        } else if (height < cfg.beachLevel) {
          tile.type = TILE.SAND;
          tile.walkable = true;
        } else if (height < cfg.grassLevel) {
          if (moisture > 0.6) {
            tile.type = TILE.FOREST;
            tile.walkable = false;
          } else if (moisture > 0.4) {
            tile.type = TILE.GRASS_DARK;
            tile.walkable = true;
          } else {
            tile.type = TILE.GRASS;
            tile.walkable = true;
          }
        } else if (height < cfg.forestLevel) {
          tile.type = TILE.FOREST;
          tile.walkable = false;
        } else if (height < cfg.mountainLevel) {
          tile.type = TILE.MOUNTAIN;
          tile.walkable = false;
        } else if (height < cfg.snowLevel) {
          tile.type = TILE.MOUNTAIN;
          tile.walkable = false;
        } else {
          tile.type = TILE.MOUNTAIN_SNOW;
          tile.walkable = false;
        }
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     RIVER GENERATION
     ═══════════════════════════════════════════════ */
  generateRiver: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var cfg = this.config;
    
    // Start from a random point on the map
    var startX = Math.floor(w * 0.1);
    var startY = NXT.utils.randomInt(0, h - 1);
    
    var currentX = startX;
    var currentY = startY;
    var targetX = Math.floor(w * 0.9);
    
    var maxSteps = w * 2;
    var step = 0;
    var direction = 1;
    
    while (currentX < targetX && step < maxSteps) {
      step++;
      
      // Draw river cross-section
      for (var dy = -cfg.riverWidth; dy <= cfg.riverWidth; dy++) {
        var ry = currentY + dy;
        if (ry < 0 || ry >= h) continue;
        
        var tile = world.data.grid[ry][currentX];
        var distFromCenter = Math.abs(dy);
        
        if (distFromCenter < 2) {
          tile.type = TILE.WATER_DEEP;
        } else if (distFromCenter < cfg.riverWidth) {
          tile.type = TILE.WATER;
        } else if (distFromCenter < cfg.riverWidth + 2) {
          if (tile.type !== TILE.WATER && tile.type !== TILE.WATER_DEEP) {
            tile.type = TILE.SAND;
          }
        }
        tile.walkable = (tile.type !== TILE.WATER && tile.type !== TILE.WATER_DEEP);
      }
      
      // Move right
      currentX++;
      
      // Random walk up/down
      if (Math.random() > 0.7) {
        direction = Math.random() > 0.5 ? 1 : -1;
      }
      currentY += direction;
      
      // Add small random shift
      if (Math.random() > 0.9) {
        currentY += Math.floor(Math.random() * 3) - 1;
      }
      
      // Clamp
      currentY = NXT.utils.clamp(currentY, 5, h - 5);
    }
    
    NXT.log('terrain', '🌊 River generated');
  },
  
  /* ═══════════════════════════════════════════════
     LAKE GENERATION
     ═══════════════════════════════════════════════ */
  generateLakes: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var lakeCount = NXT.utils.randomInt(2, 5);
    
    for (var i = 0; i < lakeCount; i++) {
      var cx = NXT.utils.randomInt(20, w - 20);
      var cy = NXT.utils.randomInt(20, h - 20);
      var radius = NXT.utils.random(8, 15);
      
      for (var y = cy - radius; y <= cy + radius; y++) {
        for (var x = cx - radius; x <= cx + radius; x++) {
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          
          var dx = x - cx;
          var dy = y - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          
          // Add noise to edge
          var edgeNoise = (this.noise.value(x * 0.3, y * 0.3) - 0.5) * 2;
          var adjustedRadius = radius + edgeNoise;
          
          if (dist < adjustedRadius) {
            var tile = world.data.grid[y][x];
            if (dist < adjustedRadius * 0.6) {
              tile.type = TILE.WATER_DEEP;
            } else {
              tile.type = TILE.WATER;
            }
            tile.walkable = false;
          } else if (dist < adjustedRadius + 1.5) {
            var edgeTile = world.data.grid[y][x];
            if (edgeTile.type !== TILE.WATER && edgeTile.type !== TILE.WATER_DEEP) {
              edgeTile.type = TILE.SAND;
            }
          }
        }
      }
    }
    
    NXT.log('terrain', '💧 Lakes generated: ' + lakeCount);
  },
  
  /* ═══════════════════════════════════════════════
     TERRAIN SMOOTHING
     ═══════════════════════════════════════════════ */
  smoothTerrain: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    // Remove single-tile water/land artifacts
    for (var pass = 0; pass < 1; pass++) {
      var newTypes = [];
      
      for (var y = 1; y < h - 1; y++) {
        var row = [];
        for (var x = 1; x < w - 1; x++) {
          row.push(world.data.grid[y][x].type);
        }
        newTypes.push(row);
      }
      
      for (var y2 = 1; y2 < h - 1; y2++) {
        for (var x2 = 1; x2 < w - 1; x2++) {
          var tile = world.data.grid[y2][x2];
          var neighbors = [
            world.data.grid[y2-1][x2].type,
            world.data.grid[y2+1][x2].type,
            world.data.grid[y2][x2-1].type,
            world.data.grid[y2][x2+1].type
          ];
          
          // Count similar neighbors
          var sameCount = 0;
          for (var n = 0; n < neighbors.length; n++) {
            if (neighbors[n] === tile.type) sameCount++;
          }
          
          // If isolated, change to most common neighbor
          if (sameCount === 0) {
            var counts = {};
            neighbors.forEach(function(t) { counts[t] = (counts[t] || 0) + 1; });
            var bestType = tile.type;
            var maxCount = 0;
            Object.keys(counts).forEach(function(t) {
              if (counts[t] > maxCount) {
                maxCount = counts[t];
                bestType = parseInt(t);
              }
            });
            tile.type = bestType;
          }
        }
      }
    }
    
    NXT.log('terrain', '✨ Terrain smoothed');
  },
  
  /* ═══════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════ */
  getHeightAt: function(gx, gy) {
    var world = NXT.get('world');
    var tile = world.getTile(gx, gy);
    return tile ? tile.height : 0;
  },
  
  getTypeAt: function(gx, gy) {
    var world = NXT.get('world');
    var tile = world.getTile(gx, gy);
    return tile ? tile.type : null;
  },
  
  isWater: function(gx, gy) {
    var t = this.getTypeAt(gx, gy);
    return t === TILE.WATER || t === TILE.WATER_DEEP;
  },
  
  isLand: function(gx, gy) {
    var t = this.getTypeAt(gx, gy);
    return t !== TILE.WATER && t !== TILE.WATER_DEEP;
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE & RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Terrain is static
  },
  
  render: function(ctx, dt) {
    // Rendering will be done in render module
  }
});

console.log('%c🌱 Terrain module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
