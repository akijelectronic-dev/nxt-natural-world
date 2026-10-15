/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Buildings Module
   Author: AL-AMIN
   Part 7/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('buildings', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    targetCount: 200,
    minSpacing: 3,
    
    // Zone distribution (percentage)
    zones: {
      residential: 0.45,
      commercial: 0.20,
      education: 0.08,
      healthcare: 0.05,
      recreation: 0.10,
      industrial: 0.07,
      government: 0.05
    }
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('buildings', '🏢 Initializing buildings...');
    
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    if (!world || !terrain) {
      NXT.warn('buildings', 'Dependencies not ready');
      return;
    }
    
    var startTime = performance.now();
    
    // Generate villages
    this.generateVillages();
    
    // Generate main city
    this.generateCity();
    
    // Scatter buildings
    this.scatterBuildings();
    
    var elapsed = (performance.now() - startTime).toFixed(0);
    NXT.log('buildings', '✅ Buildings generated: ' + world.data.buildings.length + ' in ' + elapsed + 'ms');
    
    NXT.emit('buildings:ready');
  },
  
  /* ═══════════════════════════════════════════════
     VILLAGE GENERATION
     ═══════════════════════════════════════════════ */
  generateVillages: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var villageCount = NXT.utils.randomInt(3, 6);
    var villages = [];
    
    for (var i = 0; i < villageCount; i++) {
      var vx = NXT.utils.randomInt(15, w - 15);
      var vy = NXT.utils.randomInt(15, h - 15);
      
      // Check if on land
      var terrain = NXT.get('terrain');
      if (!terrain.isLand(vx, vy)) continue;
      
      var villageSize = NXT.utils.randomInt(4, 8);
      var placed = 0;
      
      for (var j = 0; j < villageSize * 3 && placed < villageSize; j++) {
        var bx = vx + NXT.utils.randomInt(-8, 8);
        var by = vy + NXT.utils.randomInt(-8, 8);
        
        if (this.canPlaceBuilding(bx, by, 1, 1)) {
          var building = this.createBuilding('house_small', bx, by, 'residential');
          if (building) {
            world.addBuilding(building);
            placed++;
          }
        }
      }
      
      villages.push({ x: vx, y: vy, size: placed });
    }
    
    NXT.log('buildings', '🏘️ Villages: ' + villages.length);
  },
  
  /* ═══════════════════════════════════════════════
     CITY GENERATION
     ═══════════════════════════════════════════════ */
  generateCity: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var terrain = NXT.get('terrain');
    
    // Find good city center
    var cx = Math.floor(w / 2);
    var cy = Math.floor(h / 2);
    
    // Find nearest land if center is water
    for (var r = 0; r < 30; r++) {
      if (terrain.isLand(cx, cy)) break;
      cx = w / 2 + NXT.utils.randomInt(-r, r);
      cy = h / 2 + NXT.utils.randomInt(-r, r);
    }
    
    var cityRadius = 25;
    var placed = 0;
    var maxBuildings = 100;
    
    // City building types by distance from center
    var cityBuildingOrder = [
      // Center — dense
      { maxDist: 5, types: ['market', 'bank', 'restaurant', 'shop', 'apartment'] },
      // Middle ring
      { maxDist: 12, types: ['shop', 'house_medium', 'house_large', 'clinic', 'school'] },
      // Outer ring
      { maxDist: 20, types: ['house_small', 'house_medium', 'garden', 'playground'] },
      // Suburbs
      { maxDist: 25, types: ['house_small', 'farmland'] }
    ];
    
    for (var attempt = 0; attempt < 500 && placed < maxBuildings; attempt++) {
      var bx = cx + NXT.utils.randomInt(-cityRadius, cityRadius);
      var by = cy + NXT.utils.randomInt(-cityRadius, cityRadius);
      
      if (bx < 5 || by < 5 || bx > w - 5 || by > h - 5) continue;
      
      var dist = Math.sqrt((bx - cx) * (bx - cx) + (by - cy) * (by - cy));
      
      // Find appropriate building types
      var types = null;
      for (var i = 0; i < cityBuildingOrder.length; i++) {
        if (dist <= cityBuildingOrder[i].maxDist) {
          types = cityBuildingOrder[i].types;
          break;
        }
      }
      
      if (!types) continue;
      
      var typeId = NXT.utils.randomChoice(types);
      var type = BUILDING_TYPES[typeId];
      if (!type) continue;
      
      if (this.canPlaceBuilding(bx, by, type.w, type.h)) {
        var building = this.createBuilding(typeId, bx, by, type.zone);
        if (building) {
          world.addBuilding(building);
          placed++;
        }
      }
    }
    
    // Add a mosque/temple at center
    if (this.canPlaceBuilding(cx, cy, 3, 3)) {
      var religiousType = NXT.utils.randomChoice(['mosque', 'temple', 'church']);
      var religious = this.createBuilding(religiousType, cx - 1, cy - 1, 'religion');
      if (religious) world.addBuilding(religious);
    }
    
    NXT.log('buildings', '🏙️ City generated: ' + placed + ' buildings at (' + cx + ',' + cy + ')');
  },
  
  /* ═══════════════════════════════════════════════
     SCATTER BUILDINGS
     ═══════════════════════════════════════════════ */
  scatterBuildings: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    var terrain = NXT.get('terrain');
    
    var remaining = this.config.targetCount - world.data.buildings.length;
    var placed = 0;
    
    var scatterTypes = [
      { id: 'house_small', weight: 20 },
      { id: 'house_medium', weight: 15 },
      { id: 'shop', weight: 10 },
      { id: 'warehouse', weight: 5 },
      { id: 'farmland', weight: 8 },
      { id: 'garden', weight: 10 },
      { id: 'park', weight: 5 },
      { id: 'playground', weight: 5 },
      { id: 'library', weight: 3 },
      { id: 'pharmacy', weight: 4 },
      { id: 'post_office', weight: 3 },
      { id: 'power_plant', weight: 2 },
      { id: 'warehouse', weight: 5 }
    ];
    
    for (var attempt = 0; attempt < remaining * 5 && placed < remaining; attempt++) {
      var bx = NXT.utils.randomInt(5, w - 5);
      var by = NXT.utils.randomInt(5, h - 5);
      
      if (!terrain.isLand(bx, by)) continue;
      
      var tile = world.getTile(bx, by);
      if (!tile || tile.type === TILE.FOREST || tile.type === TILE.MOUNTAIN) continue;
      
      // Weighted random choice
      var totalWeight = 0;
      scatterTypes.forEach(function(t) { totalWeight += t.weight; });
      var rand = Math.random() * totalWeight;
      var acc = 0;
      var chosen = scatterTypes[0];
      for (var i = 0; i < scatterTypes.length; i++) {
        acc += scatterTypes[i].weight;
        if (rand <= acc) {
          chosen = scatterTypes[i];
          break;
        }
      }
      
      var type = BUILDING_TYPES[chosen.id];
      if (!type) continue;
      
      if (this.canPlaceBuilding(bx, by, type.w, type.h)) {
        var building = this.createBuilding(chosen.id, bx, by, type.zone);
        if (building) {
          world.addBuilding(building);
          placed++;
        }
      }
    }
    
    NXT.log('buildings', '📦 Scattered: ' + placed);
  },
  
  /* ═══════════════════════════════════════════════
     CREATE BUILDING
     ═══════════════════════════════════════════════ */
  createBuilding: function(typeId, gx, gy, zone) {
    var type = BUILDING_TYPES[typeId];
    if (!type) return null;
    
    var world = NXT.get('world');
    var tileSize = world.data.tileSize;
    
    return {
      id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      type: typeId,
      icon: type.icon,
      zone: zone || type.zone,
      
      // Grid position
      gx: gx,
      gy: gy,
      
      // World position
      x: gx * tileSize,
      y: gy * tileSize,
      w: type.w * tileSize,
      h: type.h * tileSize,
      
      // Grid size
      gw: type.w,
      gh: type.h,
      
      // Metadata
      capacity: type.capacity || 0,
      jobs: type.jobs || 0,
      residents: [],
      workers: [],
      
      // Visual
      level: NXT.utils.randomInt(1, 3),
      variant: Math.random(),
      builtAt: Date.now(),
      
      // Collision
      solid: true,
      enterable: type.zone !== 'religion'
    };
  },
  
  /* ═══════════════════════════════════════════════
     PLACEMENT CHECK
     ═══════════════════════════════════════════════ */
  canPlaceBuilding: function(gx, gy, gw, gh) {
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    // Check bounds
    if (gx < 1 || gy < 1) return false;
    if (gx + gw > world.data.width - 1) return false;
    if (gy + gh > world.data.height - 1) return false;
    
    // Check each tile
    for (var y = gy; y < gy + gh; y++) {
      for (var x = gx; x < gx + gw; x++) {
        var tile = world.getTile(x, y);
        if (!tile) return false;
        
        // Must be on land
        if (tile.type === TILE.WATER || tile.type === TILE.WATER_DEEP) return false;
        if (tile.type === TILE.MOUNTAIN || tile.type === TILE.MOUNTAIN_SNOW) return false;
        if (tile.type === TILE.ROAD || tile.type === TILE.ROAD_CROSS) return false;
        
        // No existing building
        if (tile.building) return false;
        
        // Spacing check
        if (!this.checkSpacing(x, y)) return false;
      }
    }
    
    return true;
  },
  
  checkSpacing: function(gx, gy) {
    var world = NXT.get('world');
    var spacing = this.config.minSpacing;
    
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var tile = world.getTile(gx + dx, gy + dy);
        if (tile && tile.building) return false;
      }
    }
    return true;
  },
  
  /* ═══════════════════════════════════════════════
     MARK BUILDING ON TILES
     ═══════════════════════════════════════════════ */
  markTiles: function(building) {
    var world = NXT.get('world');
    
    for (var y = building.gy; y < building.gy + building.gh; y++) {
      for (var x = building.gx; x < building.gx + building.gw; x++) {
        var tile = world.getTile(x, y);
        if (tile) {
          tile.building = building;
          tile.walkable = false;
          tile.zone = building.zone;
        }
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     QUERIES
     ═══════════════════════════════════════════════ */
  getBuildingAt: function(gx, gy) {
    var world = NXT.get('world');
    var tile = world.getTile(gx, gy);
    return tile ? tile.building : null;
  },
  
  getBuildingsInArea: function(x, y, radius) {
    var world = NXT.get('world');
    var r2 = radius * radius;
    var result = [];
    
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
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
  
  countByZone: function() {
    var world = NXT.get('world');
    var counts = {};
    
    for (var i = 0; i < world.data.buildings.length; i++) {
      var zone = world.data.buildings[i].zone;
      counts[zone] = (counts[zone] || 0) + 1;
    }
    
    return counts;
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE & RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Building logic — will be added in later parts
  },
  
  render: function(ctx, dt) {
    // Rendering will be done by render module (Part 8)
  }
});

console.log('%c🏢 Buildings module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
