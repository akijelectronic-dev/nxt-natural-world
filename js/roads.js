/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Roads Module
   Author: AL-AMIN
   Part 8/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('roads', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    mainRoadWidth: 2,        // tiles
    sideRoadWidth: 1,
    pathWidth: 1,
    
    highwayCount: 4,
    bridgeMinLength: 3,
    
    // Cost adjustments
    roadCost: 100,
    bridgeCost: 500
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    roads: [],
    intersections: [],
    bridges: []
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('roads', '🛣️ Initializing roads...');
    
    var world = NXT.get('world');
    if (!world || !world.data.grid.length) {
      NXT.warn('roads', 'World not ready');
      return;
    }
    
    var startTime = performance.now();
    
    // Step 1: Generate main highways
    this.generateHighways();
    
    // Step 2: Generate city roads
    this.generateCityRoads();
    
    // Step 3: Generate village paths
    this.generateVillagePaths();
    
    // Step 4: Generate bridges over water
    this.generateBridges();
    
    // Step 5: Find intersections
    this.findIntersections();
    
    var elapsed = (performance.now() - startTime).toFixed(0);
    NXT.log('roads', '✅ Roads generated: ' + this.data.roads.length + ' segments in ' + elapsed + 'ms');
    
    NXT.emit('roads:ready');
  },
  
  /* ═══════════════════════════════════════════════
     HIGHWAYS
     ═══════════════════════════════════════════════ */
  generateHighways: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var highways = [];
    
    // Horizontal highways
    for (var i = 0; i < 2; i++) {
      var y = Math.floor(h * (i + 1) / 3);
      var road = {
        type: 'highway',
        orientation: 'horizontal',
        startX: 0,
        startY: y,
        endX: w,
        endY: y,
        width: this.config.mainRoadWidth,
        y: y,
        x: 0,
        length: w
      };
      highways.push(road);
      this.buildRoadSegment(road);
    }
    
    // Vertical highways
    for (var j = 0; j < 2; j++) {
      var x = Math.floor(w * (j + 1) / 3);
      var roadV = {
        type: 'highway',
        orientation: 'vertical',
        startX: x,
        startY: 0,
        endX: x,
        endY: h,
        width: this.config.mainRoadWidth,
        x: x,
        y: 0,
        length: h
      };
      highways.push(roadV);
      this.buildRoadSegment(roadV);
    }
    
    NXT.log('roads', '🛣️ Highways: ' + highways.length);
  },
  
  /* ═══════════════════════════════════════════════
     CITY ROADS
     ═══════════════════════════════════════════════ */
  generateCityRoads: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    // Find city center (where most buildings are)
    var buildings = world.data.buildings;
    if (buildings.length === 0) return;
    
    var cx = w / 2;
    var cy = h / 2;
    
    // Create grid-like roads around center
    var gridSpacing = 8;
    var gridRadius = 30;
    
    var cityRoads = [];
    
    for (var i = -gridRadius; i <= gridRadius; i += gridSpacing) {
      // Horizontal
      var hRoad = {
        type: 'city',
        orientation: 'horizontal',
        x: Math.max(0, cx + i),
        y: Math.max(0, cy - gridRadius),
        length: Math.min(w, gridRadius * 2),
        width: this.config.sideRoadWidth
      };
      if (hRoad.x >= 0 && hRoad.x < w) {
        cityRoads.push(hRoad);
        this.buildRoadSegment(hRoad);
      }
      
      // Vertical
      var vRoad = {
        type: 'city',
        orientation: 'vertical',
        x: Math.max(0, cx - gridRadius),
        y: Math.max(0, cy + i),
        length: Math.min(h, gridRadius * 2),
        width: this.config.sideRoadWidth
      };
      if (vRoad.y >= 0 && vRoad.y < h) {
        cityRoads.push(vRoad);
        this.buildRoadSegment(vRoad);
      }
    }
    
    NXT.log('roads', '🏙️ City roads: ' + cityRoads.length);
  },
  
  /* ═══════════════════════════════════════════════
     VILLAGE PATHS
     ═══════════════════════════════════════════════ */
  generateVillagePaths: function() {
    var world = NXT.get('world');
    var buildings = world.data.buildings;
    
    // Group buildings by cluster (villages)
    var clusters = this.findClusters(buildings, 15);
    
    var pathCount = 0;
    
    clusters.forEach(function(cluster) {
      if (cluster.length < 2) return;
      
      // Connect each building to nearest neighbor
      for (var i = 0; i < cluster.length; i++) {
        var from = cluster[i];
        var nearest = null;
        var minDist = Infinity;
        
        for (var j = 0; j < cluster.length; j++) {
          if (i === j) continue;
          var to = cluster[j];
          var d = NXT.utils.distance(from.gx, from.gy, to.gx, to.gy);
          if (d < minDist) {
            minDist = d;
            nearest = to;
          }
        }
        
        if (nearest && minDist < 15) {
          // Draw path
          pathCount += this.drawPath(from.gx, from.gy, nearest.gx, nearest.gy);
        }
      }
    });
    
    NXT.log('roads', '🏘️ Village paths: ' + pathCount);
  },
  
  /* ═══════════════════════════════════════════════
     BUILD ROAD SEGMENT
     ═══════════════════════════════════════════════ */
  buildRoadSegment: function(road) {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var placed = 0;
    
    if (road.orientation === 'horizontal') {
      var yStart = road.y !== undefined ? road.y : road.startY;
      var xStart = road.x !== undefined ? road.x : road.startX;
      var length = road.length || w;
      
      for (var dy = 0; dy < road.width; dy++) {
        for (var x = xStart; x < Math.min(w, xStart + length); x++) {
          var y = yStart + dy;
          if (y < 0 || y >= h) continue;
          
          var tile = world.data.grid[y][x];
          if (!tile) continue;
          
          // Don't override buildings
          if (tile.building) continue;
          
          // Water → bridge (later)
          if (tile.type === TILE.WATER || tile.type === TILE.WATER_DEEP) {
            continue;
          }
          
          // Convert mountain edges
          if (tile.type === TILE.MOUNTAIN) continue;
          
          // Set road
          if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK ||
              tile.type === TILE.SAND || tile.type === TILE.FOREST) {
            tile.type = road.width > 1 ? TILE.ROAD : TILE.PATH;
            tile.walkable = true;
            placed++;
          }
        }
      }
    } else if (road.orientation === 'vertical') {
      var xV = road.x !== undefined ? road.x : road.startX;
      var yV = road.y !== undefined ? road.y : road.startY;
      var lengthV = road.length || h;
      
      for (var dx = 0; dx < road.width; dx++) {
        for (var yV2 = yV; yV2 < Math.min(h, yV + lengthV); yV2++) {
          var xV2 = xV + dx;
          if (xV2 < 0 || xV2 >= w) continue;
          
          var tileV = world.data.grid[yV2][xV2];
          if (!tileV) continue;
          if (tileV.building) continue;
          if (tileV.type === TILE.WATER || tileV.type === TILE.WATER_DEEP) continue;
          if (tileV.type === TILE.MOUNTAIN) continue;
          
          if (tileV.type === TILE.GRASS || tileV.type === TILE.GRASS_DARK ||
              tileV.type === TILE.SAND || tileV.type === TILE.FOREST) {
            tileV.type = road.width > 1 ? TILE.ROAD : TILE.PATH;
            tileV.walkable = true;
            placed++;
          }
        }
      }
    }
    
    road.tilesPlaced = placed;
    this.data.roads.push(road);
    return placed;
  },
  
  /* ═══════════════════════════════════════════════
     DRAW PATH (Line between two points)
     ═══════════════════════════════════════════════ */
  drawPath: function(x1, y1, x2, y2) {
    var world = NXT.get('world');
    var placed = 0;
    
    // Bresenham's line algorithm
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var sx = x1 < x2 ? 1 : -1;
    var sy = y1 < y2 ? 1 : -1;
    var err = dx - dy;
    
    var cx = x1;
    var cy = y1;
    
    var steps = 0;
    while (steps < 100) {
      steps++;
      
      var tile = world.getTile(cx, cy);
      if (tile && !tile.building &&
          tile.type !== TILE.WATER && tile.type !== TILE.WATER_DEEP &&
          tile.type !== TILE.MOUNTAIN && tile.type !== TILE.MOUNTAIN_SNOW &&
          (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK ||
           tile.type === TILE.SAND || tile.type === TILE.FOREST)) {
        tile.type = TILE.PATH;
        tile.walkable = true;
        placed++;
      }
      
      if (cx === x2 && cy === y2) break;
      
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
    
    return placed;
  },
  
  /* ═══════════════════════════════════════════════
     BRIDGES
     ═══════════════════════════════════════════════ */
  generateBridges: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var bridges = [];
    
    // Scan for road-water crossings
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var tile = world.data.grid[y][x];
        
        if (tile.type !== TILE.WATER && tile.type !== TILE.WATER_DEEP) continue;
        
        // Check if road on both sides
        var left = world.getTile(x - 2, y);
        var right = world.getTile(x + 2, y);
        var top = world.getTile(x, y - 2);
        var bottom = world.getTile(x, y + 2);
        
        var leftIsRoad = left && (left.type === TILE.ROAD || left.type === TILE.PATH);
        var rightIsRoad = right && (right.type === TILE.ROAD || right.type === TILE.PATH);
        var topIsRoad = top && (top.type === TILE.ROAD || top.type === TILE.PATH);
        var bottomIsRoad = bottom && (bottom.type === TILE.ROAD || bottom.type === TILE.PATH);
        
        if ((leftIsRoad && rightIsRoad) || (topIsRoad && bottomIsRoad)) {
          tile.type = TILE.PATH; // Bridge as walkable path
          tile.walkable = true;
          tile.isBridge = true;
          bridges.push({ x: x, y: y });
        }
      }
    }
    
    this.data.bridges = bridges;
    
    if (bridges.length > 0) {
      NXT.log('roads', '🌉 Bridges: ' + bridges.length);
    }
  },
  
  /* ═══════════════════════════════════════════════
     FIND INTERSECTIONS
     ═══════════════════════════════════════════════ */
  findIntersections: function() {
    var world = NXT.get('world');
    var w = world.data.width;
    var h = world.data.height;
    
    var intersections = [];
    
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var tile = world.data.grid[y][x];
        
        if (tile.type !== TILE.ROAD && tile.type !== TILE.PATH) continue;
        
        // Count road neighbors
        var roadNeighbors = 0;
        if (this.isRoad(x - 1, y)) roadNeighbors++;
        if (this.isRoad(x + 1, y)) roadNeighbors++;
        if (this.isRoad(x, y - 1)) roadNeighbors++;
        if (this.isRoad(x, y + 1)) roadNeighbors++;
        
        if (roadNeighbors >= 3) {
          tile.type = TILE.ROAD_CROSS;
          intersections.push({ x: x, y: y });
        }
      }
    }
    
    this.data.intersections = intersections;
  },
  
  isRoad: function(x, y) {
    var world = NXT.get('world');
    var tile = world.getTile(x, y);
    if (!tile) return false;
    return tile.type === TILE.ROAD || tile.type === TILE.PATH || tile.type === TILE.ROAD_CROSS;
  },
  
  /* ═══════════════════════════════════════════════
     CLUSTERING (Simple)
     ═══════════════════════════════════════════════ */
  findClusters: function(items, radius) {
    var clusters = [];
    var visited = new Array(items.length).fill(false);
    var r2 = radius * radius;
    
    for (var i = 0; i < items.length; i++) {
      if (visited[i]) continue;
      
      var cluster = [items[i]];
      visited[i] = true;
      var queue = [i];
      
      while (queue.length > 0) {
        var current = queue.shift();
        var item = items[current];
        
        for (var j = 0; j < items.length; j++) {
          if (visited[j]) continue;
          var other = items[j];
          var dx = other.gx - item.gx;
          var dy = other.gy - item.gy;
          
          if (dx * dx + dy * dy <= r2) {
            cluster.push(other);
            visited[j] = true;
            queue.push(j);
          }
        }
      }
      
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  },
  
  /* ═══════════════════════════════════════════════
     QUERIES
     ═══════════════════════════════════════════════ */
  isRoadTile: function(gx, gy) {
    return this.isRoad(gx, gy);
  },
  
  getStats: function() {
    var world = NXT.get('world');
    var stats = {
      roadTiles: 0,
      pathTiles: 0,
      intersections: this.data.intersections.length,
      bridges: this.data.bridges.length,
      highways: 0,
      cityRoads: 0
    };
    
    for (var y = 0; y < world.data.height; y++) {
      for (var x = 0; x < world.data.width; x++) {
        var t = world.data.grid[y][x].type;
        if (t === TILE.ROAD || t === TILE.ROAD_CROSS) stats.roadTiles++;
        else if (t === TILE.PATH) stats.pathTiles++;
      }
    }
    
    this.data.roads.forEach(function(r) {
      if (r.type === 'highway') stats.highways++;
      else if (r.type === 'city') stats.cityRoads++;
    });
    
    return stats;
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE & RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Roads are static
  },
  
  render: function(ctx, dt) {
    // Rendering will be done by render module (Part 12)
  }
});

console.log('%c🛣️ Roads module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
