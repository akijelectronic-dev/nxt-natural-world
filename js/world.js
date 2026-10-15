/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — World Module
   Author: AL-AMIN
   Part 5/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('world', {
  
  /* ═══════════════════════════════════════════════
     WORLD DATA
     ═══════════════════════════════════════════════ */
  data: {
    width: 0,
    height: 0,
    tileSize: 0,
    tiles: [],
    grid: [],
    
    // World elements
    buildings: [],
    roads: [],
    trees: [],
    rocks: [],
    flowers: [],
    water: [],
    
    // Stats
    stats: {
      totalTiles: 0,
      grassTiles: 0,
      waterTiles: 0,
      roadTiles: 0,
      buildingTiles: 0,
      treeCount: 0,
      rockCount: 0
    },
    
    // Position
    center: { x: 0, y: 0 },
    
    // Noise seed
    seed: Math.random() * 10000
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('world', '🌍 Initializing world...');
    
    var cfg = NXT.config.world;
    
    this.data.width = cfg.width;
    this.data.height = cfg.height;
    this.data.tileSize = cfg.tileSize;
    this.data.center.x = cfg.width / 2;
    this.data.center.y = cfg.height / 2;
    
    // Create empty grid
    this.createGrid();
    
    // Generate terrain (will be done by terrain module in Part 6)
    this.generateBaseTerrain();
    
    // Generate initial decorations
    this.generateDecorations();
    
    // Update stats
    this.updateStats();
    
    NXT.log('world', '✅ World initialized: ' + this.data.width + 'x' + this.data.height);
    NXT.log('world', '📊 Total tiles: ' + this.data.stats.totalTiles);
    
    // Emit ready event
    NXT.emit('world:ready', this.data);
  },
  
  /* ═══════════════════════════════════════════════
     GRID CREATION
     ═══════════════════════════════════════════════ */
  createGrid: function() {
    var w = this.data.width;
    var h = this.data.height;
    
    this.data.grid = [];
    this.data.tiles = [];
    
    for (var y = 0; y < h; y++) {
      var row = [];
      for (var x = 0; x < w; x++) {
        var tile = {
          x: x,
          y: y,
          type: TILE.GRASS,
          variant: Math.random(),
          moisture: Math.random(),
          height: 0.5,
          zone: null,
          building: null,
          walkable: true
        };
        row.push(tile);
        this.data.tiles.push(tile);
      }
      this.data.grid.push(row);
    }
  },
  
  /* ═══════════════════════════════════════════════
     BASE TERRAIN
     ═══════════════════════════════════════════════ */
  generateBaseTerrain: function() {
    // Basic grass-based terrain
    // Full terrain gen will be in terrain.js
    var w = this.data.width;
    var h = this.data.height;
    
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tile = this.data.grid[y][x];
        
        // Add some variation
        if (tile.variant > 0.9) {
          tile.type = TILE.GRASS_DARK;
        }
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     DECORATIONS (Trees, Rocks, Flowers)
     ═══════════════════════════════════════════════ */
  generateDecorations: function() {
    var w = this.data.width;
    var h = this.data.height;
    
    // Trees
    var treeCount = Math.floor(w * h * 0.02);
    for (var i = 0; i < treeCount; i++) {
      var x = NXT.utils.randomInt(2, w - 3);
      var y = NXT.utils.randomInt(2, h - 3);
      var tile = this.data.grid[y][x];
      
      if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK) {
        tile.type = TILE.FOREST;
        tile.walkable = false;
        this.data.trees.push({
          gx: x,
          gy: y,
          x: x * this.data.tileSize + this.data.tileSize / 2,
          y: y * this.data.tileSize + this.data.tileSize / 2,
          size: NXT.utils.random(14, 22),
          sway: Math.random() * Math.PI * 2,
          type: Math.floor(Math.random() * 3)
        });
      }
    }
    
    // Rocks
    var rockCount = Math.floor(w * h * 0.005);
    for (var j = 0; j < rockCount; j++) {
      var rx = NXT.utils.randomInt(2, w - 3);
      var ry = NXT.utils.randomInt(2, h - 3);
      var rtile = this.data.grid[ry][rx];
      
      if (rtile.type === TILE.GRASS || rtile.type === TILE.GRASS_DARK) {
        this.data.rocks.push({
          gx: rx,
          gy: ry,
          x: rx * this.data.tileSize + this.data.tileSize / 2,
          y: ry * this.data.tileSize + this.data.tileSize / 2,
          size: NXT.utils.random(10, 18),
          rotation: Math.random() * Math.PI * 2
        });
      }
    }
    
    // Flowers
    var flowerCount = Math.floor(w * h * 0.008);
    for (var k = 0; k < flowerCount; k++) {
      var fx = NXT.utils.randomInt(1, w - 2);
      var fy = NXT.utils.randomInt(1, h - 2);
      var ftile = this.data.grid[fy][fx];
      
      if (ftile.type === TILE.GRASS) {
        this.data.flowers.push({
          gx: fx,
          gy: fy,
          x: fx * this.data.tileSize + this.data.tileSize / 2,
          y: fy * this.data.tileSize + this.data.tileSize / 2,
          color: NXT.utils.randomChoice(['#ec4899', '#f59e0b', '#ef4444', '#a855f7', '#ffffff']),
          size: NXT.utils.random(2, 4),
          sway: Math.random() * Math.PI * 2
        });
      }
    }
    
    NXT.log('world', '🌳 Decorations: ' + this.data.trees.length + ' trees, ' + 
      this.data.rocks.length + ' rocks, ' + this.data.flowers.length + ' flowers');
  },
  
  /* ═══════════════════════════════════════════════
     STATS UPDATE
     ═══════════════════════════════════════════════ */
  updateStats: function() {
    var s = this.data.stats;
    s.totalTiles = this.data.width * this.data.height;
    s.grassTiles = 0;
    s.waterTiles = 0;
    s.roadTiles = 0;
    s.buildingTiles = 0;
    s.treeCount = this.data.trees.length;
    s.rockCount = this.data.rocks.length;
    
    for (var y = 0; y < this.data.height; y++) {
      for (var x = 0; x < this.data.width; x++) {
        var t = this.data.grid[y][x].type;
        if (t === TILE.GRASS || t === TILE.GRASS_DARK || t === TILE.FOREST) s.grassTiles++;
        else if (t === TILE.WATER || t === TILE.WATER_DEEP) s.waterTiles++;
        else if (t === TILE.ROAD || t === TILE.ROAD_CROSS || t === TILE.PATH) s.roadTiles++;
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     TILE ACCESS
     ═══════════════════════════════════════════════ */
  getTile: function(gx, gy) {
    if (gx < 0 || gy < 0 || gx >= this.data.width || gy >= this.data.height) return null;
    return this.data.grid[gy][gx];
  },
  
  getTileAtWorld: function(wx, wy) {
    var gx = Math.floor(wx / this.data.tileSize);
    var gy = Math.floor(wy / this.data.tileSize);
    return this.getTile(gx, gy);
  },
  
  setTile: function(gx, gy, type) {
    var tile = this.getTile(gx, gy);
    if (tile) {
      tile.type = type;
    }
  },
  
  isWalkable: function(gx, gy) {
    var tile = this.getTile(gx, gy);
    return tile ? tile.walkable : false;
  },
  
  /* ═══════════════════════════════════════════════
     BUILDINGS
     ═══════════════════════════════════════════════ */
  addBuilding: function(building) {
    this.data.buildings.push(building);
  },
  
  removeBuilding: function(building) {
    var idx = this.data.buildings.indexOf(building);
    if (idx > -1) this.data.buildings.splice(idx, 1);
  },
  
  getBuildingsInArea: function(x, y, radius) {
    var result = [];
    var r2 = radius * radius;
    for (var i = 0; i < this.data.buildings.length; i++) {
      var b = this.data.buildings[i];
      var bx = b.x + b.w / 2;
      var by = b.y + b.h / 2;
      var dx = bx - x;
      var dy = by - y;
      if (dx * dx + dy * dy <= r2) {
        result.push(b);
      }
    }
    return result;
  },
  
  /* ═══════════════════════════════════════════════
     ROADS
     ═══════════════════════════════════════════════ */
  addRoad: function(road) {
    this.data.roads.push(road);
  },
  
  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    if (!ctx || !this.data.grid.length) return;
    
    // This will be replaced by a proper world render module in Part 6
    // For now, just clear the canvas with a dark background
    if (NXT.camera) {
      var cam = NXT.camera.data;
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, cam.width, cam.height);
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Nothing to update yet
  }
});

console.log('%c🌍 World module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
