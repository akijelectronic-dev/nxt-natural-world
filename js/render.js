/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Render Module
   Author: AL-AMIN
   Part 21/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('render', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    showGrid: false,
    showZones: false,
    showNames: false,
    
    lighting: {
      enabled: true,
      ambient: 0.3,
      dayColor: 'rgba(255, 240, 200, 0)',
      nightColor: 'rgba(20, 30, 70, 0.55)',
      sunsetColor: 'rgba(255, 120, 60, 0.25)'
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    time: 0,
    lastFrameTime: 0,
    renderedTiles: 0,
    renderedBuildings: 0,
    renderedCitizens: 0,
    renderedNature: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('render', '🎨 Initializing renderer...');
    
    this.data.lastFrameTime = performance.now();
    
    NXT.log('render', '✅ Renderer ready');
    
    NXT.emit('render:ready');
  },
  
  /* ═══════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    if (!ctx) return;
    
    var canvas = ctx.canvas;
    var camera = NXT.get('camera');
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    if (!camera || !world || !terrain) return;
    
    this.data.time += dt;
    this.data.renderedTiles = 0;
    this.data.renderedBuildings = 0;
    this.data.renderedCitizens = 0;
    this.data.renderedNature = 0;
    
    var view = camera.getView();
    var tileSize = world.data.tileSize;
    var zoom = view.zoom;
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear background (sky/water base)
    this.renderBackground(ctx, camera);
    
    // Apply camera transform
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-view.x, -view.y);
    
    // Calculate visible range
    var startX = Math.max(0, Math.floor(view.x / tileSize) - 1);
    var startY = Math.max(0, Math.floor(view.y / tileSize) - 1);
    var endX = Math.min(world.data.width, Math.ceil((view.x + view.width) / tileSize) + 1);
    var endY = Math.min(world.data.height, Math.ceil((view.y + view.height) / tileSize) + 1);
    
    // Render layers (bottom to top)
    this.renderTerrain(ctx, startX, startY, endX, endY, tileSize);
    this.renderRoads(ctx, startX, startY, endX, endY, tileSize);
    this.renderBuildings(ctx, view, world);
    this.renderNature(ctx, view, world);
    this.renderCitizens(ctx, view);
    this.renderPlayer(ctx, view);
    
    ctx.restore();
    
    // Post-processing (no camera transform)
    this.renderLighting(ctx, camera);
    this.renderWeather(ctx, camera);
    this.renderMinimap(ctx);
    
    // UI overlays
    this.renderDebugInfo(ctx);
    
    this.data.lastFrameTime = performance.now();
  },
  
  /* ═══════════════════════════════════════════════
     BACKGROUND (Sky)
     ═══════════════════════════════════════════════ */
  renderBackground: function(ctx, camera) {
    var time = NXT.get('time');
    
    if (time && time.getSkyColor) {
      ctx.fillStyle = time.getSkyColor();
    } else {
      ctx.fillStyle = '#0a0e1a';
    }
    
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
  
  /* ═══════════════════════════════════════════════
     TERRAIN
     ═══════════════════════════════════════════════ */
  renderTerrain: function(ctx, startX, startY, endX, endY, tileSize) {
    var world = NXT.get('world');
    
    for (var y = startY; y < endY; y++) {
      for (var x = startX; x < endX; x++) {
        var tile = world.data.grid[y] && world.data.grid[y][x];
        if (!tile) continue;
        
        var px = x * tileSize;
        var py = y * tileSize;
        
        this.drawTile(ctx, tile, px, py, tileSize);
        this.data.renderedTiles++;
      }
    }
  },
  
  drawTile: function(ctx, tile, px, py, size) {
    var type = tile.type;
    
    // Base terrain color
    var colors = {
      [TILE.GRASS]: '#166534',
      [TILE.GRASS_DARK]: '#15803d',
      [TILE.FOREST]: '#14532d',
      [TILE.WATER]: '#0369a1',
      [TILE.WATER_DEEP]: '#075985',
      [TILE.SAND]: '#d4a574',
      [TILE.MOUNTAIN]: '#64748b',
      [TILE.MOUNTAIN_SNOW]: '#e2e8f0',
      [TILE.FARMLAND]: '#a3a380',
      [TILE.ROAD]: '#52525b',
      [TILE.ROAD_CROSS]: '#404040',
      [TILE.PATH]: '#7c7c7c'
    };
    
    var color = colors[type] || '#166534';
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size + 1, size + 1);
    
    // Grass variation
    if (type === TILE.GRASS && tile.variant > 0.85) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
    }
    
    // Water waves
    if (type === TILE.WATER || type === TILE.WATER_DEEP) {
      var wave = Math.sin(this.data.time * 2 + tile.x * 0.3 + tile.y * 0.3) * 2;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.15)';
      ctx.fillRect(px + 2, py + 5 + wave, size - 4, 2);
    }
    
    // Mountain snow cap
    if (type === TILE.MOUNTAIN_SNOW) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(px, py, size, 4);
    }
    
    // Road markings
    if (type === TILE.ROAD) {
      // Check neighbors for direction
      var world = NXT.get('world');
      var nL = world.getTile(tile.x - 1, tile.y);
      var nR = world.getTile(tile.x + 1, tile.y);
      var nU = world.getTile(tile.x, tile.y - 1);
      var nD = world.getTile(tile.x, tile.y + 1);
      
      ctx.fillStyle = '#fbbf24';
      
      var horiz = (nL && this.isRoadTile(nL)) || (nR && this.isRoadTile(nR));
      var vert = (nU && this.isRoadTile(nU)) || (nD && this.isRoadTile(nD));
      
      if (horiz) {
        ctx.fillRect(px + size * 0.4, py + size * 0.4, size * 0.6, size * 0.15);
      }
      if (vert) {
        ctx.fillRect(px + size * 0.4, py + size * 0.4, size * 0.15, size * 0.6);
      }
    }
    
    // Sand texture
    if (type === TILE.SAND && tile.variant > 0.7) {
      ctx.fillStyle = 'rgba(180, 140, 100, 0.3)';
      ctx.fillRect(px + 3, py + 3, 2, 2);
    }
  },
  
  isRoadTile: function(tile) {
    return tile.type === TILE.ROAD || 
           tile.type === TILE.ROAD_CROSS || 
           tile.type === TILE.PATH;
  },
  
  /* ═══════════════════════════════════════════════
     ROADS (Extra decorations)
     ═══════════════════════════════════════════════ */
  renderRoads: function(ctx, startX, startY, endX, endY, tileSize) {
    // Roads are already drawn as tiles
    // Add any special road decorations here
  },
  
  /* ═══════════════════════════════════════════════
     BUILDINGS
     ═══════════════════════════════════════════════ */
  renderBuildings: function(ctx, view, world) {
    var buildings = world.data.buildings;
    var margin = 100;
    
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      
      // Culling
      if (b.x + b.w < view.x - margin || b.x > view.x + view.width + margin) continue;
      if (b.y + b.h < view.y - margin || b.y > view.y + view.height + margin) continue;
      
      this.drawBuilding(ctx, b);
      this.data.renderedBuildings++;
    }
  },
  
  drawBuilding: function(ctx, b) {
    var zoneColors = {
      residential: { wall: '#78350f', roof: '#5c2a0a' },
      commercial: { wall: '#b45309', roof: '#78350f' },
      industrial: { wall: '#525252', roof: '#404040' },
      education: { wall: '#7c3aed', roof: '#5b21b6' },
      healthcare: { wall: '#dc2626', roof: '#991b1b' },
      recreation: { wall: '#16a34a', roof: '#15803d' },
      government: { wall: '#1e40af', roof: '#1e3a8a' },
      religion: { wall: '#7c2d12', roof: '#5c2a0a' }
    };
    
    var colors = zoneColors[b.zone] || zoneColors.residential;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h);
    
    // Wall
    ctx.fillStyle = colors.wall;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    
    // Roof
    ctx.fillStyle = colors.roof;
    ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
    
    // Door
    ctx.fillStyle = '#1a1a1a';
    var doorW = Math.min(b.w * 0.2, 20);
    ctx.fillRect(b.x + b.w / 2 - doorW / 2, b.y + b.h - doorW, doorW, doorW);
    
    // Windows
    ctx.fillStyle = 'rgba(255, 240, 150, 0.8)';
    var cols = Math.max(2, Math.floor(b.w / 20));
    var rows = Math.max(2, Math.floor(b.h / 20));
    var wSize = 4;
    var paddingX = b.w / (cols + 1);
    var paddingY = b.h / (rows + 1);
    
    for (var wy = 1; wy <= rows; wy++) {
      for (var wx = 1; wx <= cols; wx++) {
        ctx.fillRect(
          b.x + paddingX * wx - wSize / 2,
          b.y + paddingY * wy - wSize / 2,
          wSize, wSize
        );
      }
    }
    
    // Icon (if zoomed in enough)
    if (NXT.get('camera').data.zoom > 0.9) {
      ctx.font = 'bold ' + Math.min(b.w * 0.5, 22) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, b.x + b.w / 2, b.y + b.h / 2);
    }
    
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  },
  
  /* ═══════════════════════════════════════════════
     NATURE
     ═══════════════════════════════════════════════ */
  renderNature: function(ctx, view, world) {
    var nature = NXT.get('nature');
    if (!nature) return;
    
    var margin = 50;
    var t = this.data.time;
    
    // Trees
    for (var i = 0; i < nature.data.trees.length; i++) {
      var tree = nature.data.trees[i];
      if (tree.x < view.x - margin || tree.x > view.x + view.width + margin) continue;
      if (tree.y < view.y - margin || tree.y > view.y + view.height + margin) continue;
      
      var sway = Math.sin(t + tree.swayOffset) * tree.swayAmount;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(tree.x + 3, tree.y + tree.size * 0.4, tree.size * 0.5, tree.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tree.x - 2, tree.y + tree.size * 0.1, 4, tree.size * 0.4);
      
      // Foliage (varies by type)
      if (tree.type === 'pine') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(tree.x + sway, tree.y - tree.size * 0.6);
        ctx.lineTo(tree.x - tree.size * 0.5 + sway, tree.y + tree.size * 0.1);
        ctx.lineTo(tree.x + tree.size * 0.5 + sway, tree.y + tree.size * 0.1);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(tree.x + sway, tree.y, tree.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(tree.x + sway - 2, tree.y - 2, tree.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      this.data.renderedNature++;
    }
    
    // Rocks
    for (var j = 0; j < nature.data.rocks.length; j++) {
      var rock = nature.data.rocks[j];
      if (rock.x < view.x - margin || rock.x > view.x + view.width + margin) continue;
      if (rock.y < view.y - margin || rock.y > view.y + view.height + margin) continue;
      
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(rock.x - 1, rock.y - 1, rock.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      this.data.renderedNature++;
    }
    
    // Flowers
    for (var k = 0; k < nature.data.flowers.length; k++) {
      var f = nature.data.flowers[k];
      if (f.x < view.x - 20 || f.x > view.x + view.width + 20) continue;
      if (f.y < view.y - 20 || f.y > view.y + view.height + 20) continue;
      
      var fSway = Math.sin(t * 2 + f.swayOffset) * 1.5;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x + fSway, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      this.data.renderedNature++;
    }
    
    // Bushes
    for (var m = 0; m < nature.data.bushes.length; m++) {
      var b = nature.data.bushes[m];
      if (b.x < view.x - 30 || b.x > view.x + view.width + 30) continue;
      if (b.y < view.y - 30 || b.y > view.y + view.height + 30) continue;
      
      var bSway = Math.sin(t * 1.5 + b.swayOffset) * 1;
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(b.x + bSway, b.y, b.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(b.x + bSway - 2, b.y - 2, b.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Animals
    this.renderAnimals(ctx, view, nature);
    
    // Birds (always visible above everything)
    this.renderBirds(ctx, view, nature);
  },
  
  renderAnimals: function(ctx, view, nature) {
    var margin = 50;
    
    for (var i = 0; i < nature.data.animals.length; i++) {
      var a = nature.data.animals[i];
      if (a.x < view.x - margin || a.x > view.x + view.width + margin) continue;
      if (a.y < view.y - margin || a.y > view.y + view.height + margin) continue;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(a.x, a.y + 4, a.size * 0.4, a.size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      ctx.font = a.size + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.icon, a.x, a.y);
    }
  },
  
  renderBirds: function(ctx, view, nature) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    
    for (var i = 0; i < nature.data.birds.length; i++) {
      var b = nature.data.birds[i];
      if (b.x < view.x - 100 || b.x > view.x + view.width + 100) continue;
      if (b.y < view.y - 100 || b.y > view.y + view.height + 100) continue;
      
      var wing = Math.sin(b.wingPhase) * 3;
      
      ctx.beginPath();
      ctx.moveTo(b.x - b.size, b.y + wing);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(b.x + b.size, b.y + wing);
      ctx.stroke();
    }
  },
  
  /* ═══════════════════════════════════════════════
     CITIZENS
     ═══════════════════════════════════════════════ */
  renderCitizens: function(ctx, view) {
    var citizens = NXT.get('citizen');
    if (!citizens) return;
    
    var margin = 50;
    var list = citizens.data.citizens;
    
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      
      // Culling
      if (c.x < view.x - margin || c.x > view.x + view.width + margin) continue;
      if (c.y < view.y - margin || c.y > view.y + view.height + margin) continue;
      
      this.drawCitizen(ctx, c);
      this.data.renderedCitizens++;
    }
  },
  
  drawCitizen: function(ctx, c) {
    var bodyHeight = c.height || 16;
    var bodyWidth = bodyHeight * 0.55;
    
    var bobY = c.state === 'walking' ? Math.sin(c.walkFrame * Math.PI / 2) * 1.5 : 0;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + bodyHeight / 2 + 2, bodyWidth / 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs
    ctx.fillStyle = c.pantsColor || '#1e293b';
    var legOffset = c.state === 'walking' ? Math.sin(c.walkFrame * Math.PI / 2) * 2 : 0;
    ctx.fillRect(c.x - bodyWidth * 0.4, c.y + 2 + bobY, bodyWidth * 0.35, bodyHeight * 0.5 + legOffset);
    ctx.fillRect(c.x + bodyWidth * 0.05, c.y + 2 + bobY, bodyWidth * 0.35, bodyHeight * 0.5 - legOffset);
    
    // Body
    ctx.fillStyle = c.shirtColor || '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(c.x - bodyWidth / 2, c.y - bodyHeight * 0.15 + bobY, bodyWidth, bodyHeight * 0.6, 2);
    ctx.fill();
    
    // Head
    ctx.fillStyle = c.bodyColor || '#f4d5b3';
    ctx.beginPath();
    ctx.arc(c.x, c.y - bodyHeight * 0.4 + bobY, bodyWidth * 0.45, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair
    ctx.fillStyle = c.hairColor || '#1a1a1a';
    ctx.beginPath();
    ctx.arc(c.x, c.y - bodyHeight * 0.48 + bobY, bodyWidth * 0.45, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Emotion indicator (if not neutral)
    if (c.emotion && c.emotion !== 'neutral') {
      var emotions = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        tired: '😴'
      };
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.fillText(emotions[c.emotion] || '', c.x + 8, c.y - bodyHeight * 0.7 + bobY);
    }
    
    // Name (if zoomed in)
    var camera = NXT.get('camera');
    if (this.config.showNames && camera && camera.data.zoom > 1.3) {
      ctx.font = 'bold 8px Inter';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(c.firstName, c.x, c.y - bodyHeight * 0.9);
    }
  },
  
  /* ═══════════════════════════════════════════════
     PLAYER
     ═══════════════════════════════════════════════ */
  renderPlayer: function(ctx, view) {
    var player = NXT.get('player');
    if (!player) return;
    
    var c = player.data;
    var bodyHeight = 30;
    var bodyWidth = 16;
    
    var bobY = c.moving ? Math.sin(c.walkFrame * Math.PI / 2) * 2 : 0;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + bodyHeight / 2, bodyWidth / 2 + 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs
    ctx.fillStyle = c.appearance.pantsColor;
    var legOffset = c.moving ? Math.sin(c.walkFrame * Math.PI / 2) * 3 : 0;
    ctx.fillRect(c.x - 6, c.y + bodyHeight / 2 - 10 + bobY, 5, 12 + legOffset);
    ctx.fillRect(c.x + 1, c.y + bodyHeight / 2 - 10 + bobY, 5, 12 - legOffset);
    
    // Body
    ctx.fillStyle = c.appearance.shirtColor;
    ctx.beginPath();
    ctx.roundRect(c.x - bodyWidth / 2, c.y - 5 + bobY, bodyWidth, bodyHeight - 15, 3);
    ctx.fill();
    
    // Head
    ctx.fillStyle = c.appearance.bodyColor;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 12 + bobY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair
    ctx.fillStyle = c.appearance.hairColor;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 14 + bobY, 8, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Direction indicator
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 12 + bobY, 12, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
    
    // Ring indicator
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    
    // "YOU" label
    ctx.fillStyle = 'rgba(0, 212, 255, 0.95)';
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', c.x, c.y - 32);
  },
  
  /* ═══════════════════════════════════════════════
     LIGHTING
     ═══════════════════════════════════════════════ */
  renderLighting: function(ctx, camera) {
    if (!this.config.lighting.enabled) return;
    
    var time = NXT.get('time');
    if (!time) return;
    
    var h = time.data.hour;
    var w = ctx.canvas.width;
    var hh = ctx.canvas.height;
    
    // Night lighting
    if (h < 6 || h >= 20) {
      ctx.fillStyle = this.config.lighting.nightColor;
      ctx.fillRect(0, 0, w, hh);
    }
    // Sunset lighting
    else if (h >= 17 && h < 20) {
      var intensity = (h - 17) / 3;
      ctx.fillStyle = 'rgba(255, 120, 60, ' + (intensity * 0.3) + ')';
      ctx.fillRect(0, 0, w, hh);
    }
    // Dawn lighting
    else if (h >= 5 && h < 7) {
      var intensity2 = 1 - (h - 5) / 2;
      ctx.fillStyle = 'rgba(255, 150, 100, ' + (intensity2 * 0.25) + ')';
      ctx.fillRect(0, 0, w, hh);
    }
  },
  
  /* ═══════════════════════════════════════════════
     WEATHER OVERLAY
     ═══════════════════════════════════════════════ */
  renderWeather: function(ctx, camera) {
    var weather = NXT.get('weather');
    if (!weather) return;
    
    // Weather overlay
    if (weather.renderOverlay) {
      weather.renderOverlay(ctx);
    }
    
    // Particles
    if (weather.renderParticles) {
      weather.renderParticles(ctx);
    }
  },
  
  /* ═══════════════════════════════════════════════
     MINIMAP
     ═══════════════════════════════════════════════ */
  renderMinimap: function(ctx) {
    var minimapCanvas = document.getElementById('minimapCanvas');
    if (!minimapCanvas) return;
    
    var mmCtx = minimapCanvas.getContext('2d');
    var world = NXT.get('world');
    if (!world) return;
    
    var mmW = minimapCanvas.width;
    var mmH = minimapCanvas.height;
    var scale = mmW / world.data.width;
    
    // Clear
    mmCtx.fillStyle = '#0a0e1a';
    mmCtx.fillRect(0, 0, mmW, mmH);
    
    // Draw tiles (sampled)
    for (var y = 0; y < world.data.height; y += 3) {
      for (var x = 0; x < world.data.width; x += 3) {
        var tile = world.data.grid[y] && world.data.grid[y][x];
        if (!tile) continue;
        
        var color = this.getMiniTileColor(tile.type);
        if (!color) continue;
        
        mmCtx.fillStyle = color;
        mmCtx.fillRect(x * scale, y * scale, scale * 3, scale * 3);
      }
    }
    
    // Draw buildings
    mmCtx.fillStyle = 'rgba(245, 158, 11, 0.7)';
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
      mmCtx.fillRect(b.gx * scale, b.gy * scale, b.gw * scale, b.gh * scale);
    }
    
    // Draw player
    var player = NXT.get('player');
    if (player) {
      var pgx = player.data.x / world.data.tileSize;
      var pgy = player.data.y / world.data.tileSize;
      
      mmCtx.fillStyle = '#00d4ff';
      mmCtx.shadowColor = '#00d4ff';
      mmCtx.shadowBlur = 8;
      mmCtx.beginPath();
      mmCtx.arc(pgx * scale, pgy * scale, 3.5, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.shadowBlur = 0;
      
      // Direction
      mmCtx.strokeStyle = '#00d4ff';
      mmCtx.lineWidth = 1.5;
      mmCtx.beginPath();
      mmCtx.moveTo(pgx * scale, pgy * scale);
      mmCtx.lineTo(
        pgx * scale + Math.cos(player.data.angle) * 10,
        pgy * scale + Math.sin(player.data.angle) * 10
      );
      mmCtx.stroke();
    }
  },
  
  getMiniTileColor: function(type) {
    var colors = {
      [TILE.GRASS]: '#166534',
      [TILE.GRASS_DARK]: '#15803d',
      [TILE.FOREST]: '#14532d',
      [TILE.WATER]: '#0369a1',
      [TILE.WATER_DEEP]: '#075985',
      [TILE.SAND]: '#d4a574',
      [TILE.MOUNTAIN]: '#64748b',
      [TILE.MOUNTAIN_SNOW]: '#e2e8f0',
      [TILE.FARMLAND]: '#a3a380',
      [TILE.ROAD]: '#52525b',
      [TILE.ROAD_CROSS]: '#404040',
      [TILE.PATH]: '#7c7c7c'
    };
    return colors[type];
  },
  
  /* ═══════════════════════════════════════════════
     DEBUG INFO
     ═══════════════════════════════════════════════ */
  renderDebugInfo: function(ctx) {
    // Debug info is shown in HTML divs
    var debugEl = document.getElementById('debugInfo');
    if (!debugEl || !debugEl.classList.contains('show')) return;
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // No data updates needed
  }
});

console.log('%c🎨 Render module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
