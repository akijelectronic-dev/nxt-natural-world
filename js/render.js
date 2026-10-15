/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Render Module (Fixed)
   Author: AL-AMIN
   Part 21/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('render', {
  
  config: {
    showGrid: false,
    showZones: false,
    showNames: false,
    lighting: { enabled: true }
  },
  
  data: {
    time: 0,
    initialized: false
  },
  
  init: function() {
    NXT.log('render', '🎨 Renderer initializing...');
    this.data.initialized = true;
    NXT.log('render', '✅ Renderer ready');
  },
  
  render: function(ctx, dt) {
    if (!ctx || !ctx.canvas) return;
    
    var canvas = ctx.canvas;
    var camera = NXT.get('camera');
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    this.data.time += dt;
    
    // ═══ FALLBACK: No world yet ═══
    if (!world || !world.data || !world.data.grid || !world.data.grid.length) {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 18px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Generating world...', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // ═══ FALLBACK: No camera ═══
    if (!camera || !camera.getView) {
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Camera loading...', canvas.width / 2, canvas.height / 2);
      
      // Fallback: draw world from top-left
      this.renderWorldSimple(ctx, world);
      return;
    }
    
    var view = camera.getView();
    var tileSize = world.data.tileSize;
    
    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save and apply camera transform
    ctx.save();
    ctx.scale(view.zoom, view.zoom);
    ctx.translate(-view.x, -view.y);
    
    // Calculate visible range
    var startX = Math.max(0, Math.floor(view.x / tileSize) - 1);
    var startY = Math.max(0, Math.floor(view.y / tileSize) - 1);
    var endX = Math.min(world.data.width, Math.ceil((view.x + view.width) / tileSize) + 1);
    var endY = Math.min(world.data.height, Math.ceil((view.y + view.height) / tileSize) + 1);
    
    // ═══ RENDER TERRAIN ═══
    this.renderTerrain(ctx, world, startX, startY, endX, endY, tileSize);
    
    // ═══ RENDER BUILDINGS ═══
    this.renderBuildings(ctx, world, view);
    
    // ═══ RENDER NATURE ═══
    this.renderNature(ctx, view);
    
    // ═══ RENDER CITIZENS ═══
    this.renderCitizens(ctx, view);
    
    // ═══ RENDER PLAYER ═══
    this.renderPlayer(ctx, view);
    
    ctx.restore();
    
    // ═══ LIGHTING ═══
    this.renderLighting(ctx, view);
    
    // ═══ WEATHER ═══
    this.renderWeather(ctx);
    
    // ═══ MINIMAP ═══
    this.renderMinimap();
  },
  
  renderWorldSimple: function(ctx, world) {
    // Simple fallback rendering — draw first 30x30 tiles
    var tileSize = 20;
    var maxTiles = 30;
    
    for (var y = 0; y < Math.min(world.data.height, maxTiles); y++) {
      for (var x = 0; x < Math.min(world.data.width, maxTiles); x++) {
        var tile = world.data.grid[y][x];
        if (!tile) continue;
        
        var colors = {
          0: '#166534', 1: '#15803d', 2: '#14532d',
          3: '#0369a1', 4: '#075985', 5: '#d4a574',
          6: '#64748b', 7: '#e2e8f0', 8: '#a3a380',
          9: '#52525b', 10: '#404040', 11: '#7c7c7c'
        };
        
        ctx.fillStyle = colors[tile.type] || '#166534';
        ctx.fillRect(x * tileSize, y * tileSize + 100, tileSize, tileSize);
      }
    }
  },
  
  renderTerrain: function(ctx, world, startX, startY, endX, endY, tileSize) {
    for (var y = startY; y < endY; y++) {
      var row = world.data.grid[y];
      if (!row) continue;
      
      for (var x = startX; x < endX; x++) {
        var tile = row[x];
        if (!tile) continue;
        
        var px = x * tileSize;
        var py = y * tileSize;
        
        var colors = {
          0: '#166534', 1: '#15803d', 2: '#14532d',
          3: '#0369a1', 4: '#075985', 5: '#d4a574',
          6: '#64748b', 7: '#e2e8f0', 8: '#a3a380',
          9: '#52525b', 10: '#404040', 11: '#7c7c7c'
        };
        
        ctx.fillStyle = colors[tile.type] || '#166534';
        ctx.fillRect(px, py, tileSize + 1, tileSize + 1);
        
        // Water waves
        if (tile.type === 3 || tile.type === 4) {
          var wave = Math.sin(this.data.time * 2 + x * 0.3 + y * 0.3) * 2;
          ctx.fillStyle = 'rgba(125, 211, 252, 0.15)';
          ctx.fillRect(px + 2, py + 5 + wave, tileSize - 4, 2);
        }
      }
    }
  },
  
  renderBuildings: function(ctx, world, view) {
    var buildings = world.data.buildings;
    var margin = 100;
    
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      
      if (b.x + b.w < view.x - margin) continue;
      if (b.x > view.x + view.width + margin) continue;
      if (b.y + b.h < view.y - margin) continue;
      if (b.y > view.y + view.height + margin) continue;
      
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
      
      // Windows
      ctx.fillStyle = 'rgba(255, 240, 150, 0.7)';
      var windowCount = Math.floor(b.w / 20) * Math.floor(b.h / 20);
      for (var w = 0; w < Math.min(windowCount, 6); w++) {
        var wx = b.x + 10 + (w % 3) * 20;
        var wy = b.y + 10 + Math.floor(w / 3) * 20;
        if (wx < b.x + b.w - 10 && wy < b.y + b.h - 10) {
          ctx.fillRect(wx, wy, 5, 5);
        }
      }
      
      // Icon
      ctx.font = 'bold ' + Math.min(b.w * 0.5, 20) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, b.x + b.w / 2, b.y + b.h / 2);
    }
  },
  
  renderNature: function(ctx, view) {
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
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(tree.x + 3, tree.y + tree.size * 0.4, tree.size * 0.5, tree.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tree.x - 2, tree.y + tree.size * 0.1, 4, tree.size * 0.4);
      
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(tree.x + sway, tree.y, tree.size * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(tree.x + sway - 2, tree.y - 2, tree.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
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
    }
    
    // Animals
    for (var m = 0; m < nature.data.animals.length; m++) {
      var a = nature.data.animals[m];
      if (a.x < view.x - margin || a.x > view.x + view.width + margin) continue;
      if (a.y < view.y - margin || a.y > view.y + view.height + margin) continue;
      
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(a.x, a.y + 4, a.size * 0.4, a.size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = a.size + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.icon, a.x, a.y);
    }
  },
  
  renderCitizens: function(ctx, view) {
    var citizens = NXT.get('citizen');
    if (!citizens) return;
    
    var margin = 50;
    var list = citizens.data.citizens;
    
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.x < view.x - margin || c.x > view.x + view.width + margin) continue;
      if (c.y < view.y - margin || c.y > view.y + view.height + margin) continue;
      
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
      ctx.fillRect(c.x - bodyWidth * 0.4, c.y + 2 + bobY, bodyWidth * 0.35, bodyHeight * 0.5);
      ctx.fillRect(c.x + bodyWidth * 0.05, c.y + 2 + bobY, bodyWidth * 0.35, bodyHeight * 0.5);
      
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
    }
  },
  
  renderPlayer: function(ctx, view) {
    var player = NXT.get('player');
    if (!player || !player.data) return;
    
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
    ctx.fillRect(c.x - 6, c.y + bodyHeight / 2 - 10 + bobY, 5, 12);
    ctx.fillRect(c.x + 1, c.y + bodyHeight / 2 - 10 + bobY, 5, 12);
    
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
    
    // Ring
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    
    // YOU label
    ctx.fillStyle = 'rgba(0, 212, 255, 0.95)';
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', c.x, c.y - 32);
  },
  
  renderLighting: function(ctx, view) {
    var time = NXT.get('time');
    if (!time) return;
    
    var h = time.data.hour;
    var w = ctx.canvas.width;
    var hh = ctx.canvas.height;
    
    if (h < 6 || h >= 20) {
      ctx.fillStyle = 'rgba(20, 30, 70, 0.5)';
      ctx.fillRect(0, 0, w, hh);
    } else if (h >= 17 && h < 20) {
      var intensity = (h - 17) / 3;
      ctx.fillStyle = 'rgba(255, 120, 60, ' + (intensity * 0.3) + ')';
      ctx.fillRect(0, 0, w, hh);
    }
  },
  
  renderWeather: function(ctx) {
    var weather = NXT.get('weather');
    if (!weather) return;
    
    if (weather.renderOverlay) weather.renderOverlay(ctx);
    if (weather.renderParticles) weather.renderParticles(ctx);
  },
  
  renderMinimap: function() {
    var mmCanvas = document.getElementById('minimapCanvas');
    if (!mmCanvas) return;
    
    var mmCtx = mmCanvas.getContext('2d');
    var world = NXT.get('world');
    if (!world || !world.data.grid.length) return;
    
    var mmW = mmCanvas.width;
    var scale = mmW / world.data.width;
    
    mmCtx.fillStyle = '#0a0e1a';
    mmCtx.fillRect(0, 0, mmW, mmW);
    
    for (var y = 0; y < world.data.height; y += 3) {
      for (var x = 0; x < world.data.width; x += 3) {
        var tile = world.data.grid[y] && world.data.grid[y][x];
        if (!tile) continue;
        
        var colors = {
          0: '#166534', 1: '#15803d', 2: '#14532d',
          3: '#0369a1', 4: '#075985', 5: '#d4a574',
          6: '#64748b', 7: '#e2e8f0', 8: '#a3a380',
          9: '#52525b', 10: '#404040', 11: '#7c7c7c'
        };
        
        mmCtx.fillStyle = colors[tile.type] || '#166534';
        mmCtx.fillRect(x * scale, y * scale, scale * 3, scale * 3);
      }
    }
    
    // Buildings
    mmCtx.fillStyle = 'rgba(245, 158, 11, 0.7)';
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
      mmCtx.fillRect(b.gx * scale, b.gy * scale, b.gw * scale, b.gh * scale);
    }
    
    // Player
    var player = NXT.get('player');
    if (player && player.data) {
      var pgx = player.data.x / world.data.tileSize;
      var pgy = player.data.y / world.data.tileSize;
      
      mmCtx.fillStyle = '#00d4ff';
      mmCtx.shadowColor = '#00d4ff';
      mmCtx.shadowBlur = 8;
      mmCtx.beginPath();
      mmCtx.arc(pgx * scale, pgy * scale, 3.5, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.shadowBlur = 0;
    }
  },
  
  update: function(dt) {
    this.data.time += dt;
  }
});

console.log('%c🎨 Render module registered (fixed)', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
