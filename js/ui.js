/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — UI Module
   Author: AL-AMIN
   Part 19/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('ui', {
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    sidePanelOpen: false,
    modalOpen: false,
    currentTab: 'graphics',
    
    locationTimer: 0,
    lastLocation: '',
    
    toastTimeout: null
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('ui', '🎛️ Initializing UI...');
    
    this.bindSettingsInputs();
    this.bindKeyboard();
    this.updateLocation();
    
    NXT.log('ui', '✅ UI ready');
    
    NXT.emit('ui:ready');
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    this.data.locationTimer += dt;
    
    if (this.data.locationTimer > 1) {
      this.data.locationTimer = 0;
      this.updateLocation();
    }
  },
  
  /* ═══════════════════════════════════════════════
     LOCATION
     ═══════════════════════════════════════════════ */
  updateLocation: function() {
    var player = NXT.get('player');
    var world = NXT.get('world');
    if (!player || !world) return;
    
    var gx = Math.floor(player.data.x / world.data.tileSize);
    var gy = Math.floor(player.data.y / world.data.tileSize);
    
    // Determine zone name
    var zoneName = this.getZoneName(gx, gy);
    var regionName = this.getRegionName(gx, gy);
    
    var nameEl = document.getElementById('locName');
    var subEl = document.getElementById('locSub');
    
    if (nameEl && nameEl.textContent !== zoneName) {
      nameEl.textContent = zoneName;
    }
    if (subEl && subEl.textContent !== regionName) {
      subEl.textContent = regionName;
    }
  },
  
  getZoneName: function(gx, gy) {
    var world = NXT.get('world');
    var tile = world.getTile(gx, gy);
    
    if (!tile) return 'Unknown';
    
    // Check for building
    if (tile.building) {
      return tile.building.type.replace(/_/g, ' ').replace(/\b\w/g, function(l) {
        return l.toUpperCase();
      });
    }
    
    var names = {
      [TILE.GRASS]: 'Grassland',
      [TILE.GRASS_DARK]: 'Meadow',
      [TILE.FOREST]: 'Forest',
      [TILE.WATER]: 'Water',
      [TILE.WATER_DEEP]: 'Deep Water',
      [TILE.SAND]: 'Beach',
      [TILE.MOUNTAIN]: 'Mountain',
      [TILE.MOUNTAIN_SNOW]: 'Snowy Peak',
      [TILE.FARMLAND]: 'Farmland',
      [TILE.ROAD]: 'Street',
      [TILE.ROAD_CROSS]: 'Intersection',
      [TILE.PATH]: 'Path'
    };
    
    return names[tile.type] || 'Unknown';
  },
  
  getRegionName: function(gx, gy) {
    var world = NXT.get('world');
    var cx = world.data.width / 2;
    var cy = world.data.height / 2;
    
    var dx = gx - cx;
    var dy = gy - cy;
    
    var dirH = dx > 0 ? 'East' : 'West';
    var dirV = dy > 0 ? 'South' : 'North';
    
    var dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 20) return 'City Center';
    if (dist < 50) return dirH + ' District';
    if (dist < 100) return dirV + ' ' + dirH + ' Region';
    return 'Wilderness';
  },
  
  /* ═══════════════════════════════════════════════
     SIDE PANEL
     ═══════════════════════════════════════════════ */
  openSidePanel: function(title, content) {
    var panel = document.getElementById('sidePanel');
    var titleEl = document.getElementById('sidePanelTitle');
    var bodyEl = document.getElementById('sidePanelBody');
    
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = content;
    if (panel) panel.classList.add('open');
    
    this.data.sidePanelOpen = true;
  },
  
  closeSidePanel: function() {
    var panel = document.getElementById('sidePanel');
    if (panel) panel.classList.remove('open');
    this.data.sidePanelOpen = false;
  },
  
  openMenu: function() {
    var citizens = NXT.get('citizen');
    var pop = citizens ? citizens.data.citizens.length : 0;
    var buildings = NXT.get('world') ? NXT.get('world').data.buildings.length : 0;
    var time = NXT.get('time');
    
    var content = 
      '<div style="padding:8px">' +
        '<div style="text-align:center;margin-bottom:24px">' +
          '<div style="font-size:64px;margin-bottom:12px">🌍</div>' +
          '<h2 style="color:#00d4ff;font-family:Orbitron;letter-spacing:2px;margin-bottom:4px">NXT NATURAL WORLD</h2>' +
          '<p style="color:#7a8194;font-size:11px;letter-spacing:3px">A LIVING DIGITAL REALITY</p>' +
        '</div>' +
        
        '<div style="background:rgba(0,212,255,.06);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid rgba(0,212,255,.2)">' +
          '<div style="font-size:11px;color:#7a8194;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Visitor</div>' +
          '<div style="font-size:20px;font-weight:800;color:#00d4ff;font-family:Orbitron">AL-AMIN</div>' +
        '</div>' +
        
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">' +
          '<div style="background:rgba(34,197,94,.1);padding:12px;border-radius:8px;text-align:center">' +
            '<div style="font-size:22px;font-weight:800;color:#22c55e;font-family:Orbitron">' + pop + '</div>' +
            '<div style="font-size:10px;color:#7a8194;letter-spacing:1px">CITIZENS</div>' +
          '</div>' +
          '<div style="background:rgba(255,215,0,.1);padding:12px;border-radius:8px;text-align:center">' +
            '<div style="font-size:22px;font-weight:800;color:#ffd700;font-family:Orbitron">' + buildings + '</div>' +
            '<div style="font-size:10px;color:#7a8194;letter-spacing:1px">BUILDINGS</div>' +
          '</div>' +
        '</div>' +
        
        (time ? 
          '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:8px;margin-bottom:16px;text-align:center">' +
            '<div style="font-size:14px;color:#cbd5e1">' + time.formatDate() + '</div>' +
            '<div style="font-size:11px;color:#8b5cf6;letter-spacing:1px;margin-top:4px">' + time.formatTime() + ' • ' + time.data.season.toUpperCase() + '</div>' +
          '</div>' : '') +
        
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
          '<button class="save-btn" onclick="NXT.ui.openGallery()"><i class="fas fa-images"></i> Gallery</button>' +
          '<button class="save-btn" onclick="NXT.ui.openStats()"><i class="fas fa-chart-bar"></i> Stats</button>' +
          '<button class="save-btn" onclick="NXT.ui.toggleSettings()"><i class="fas fa-cog"></i> Settings</button>' +
          '<button class="save-btn" onclick="NXT.ui.showHelp()"><i class="fas fa-question"></i> Help</button>' +
        '</div>' +
      '</div>';
    
    this.openSidePanel('🌍 Menu', content);
  },
  
  /* ═══════════════════════════════════════════════
     INFO PANEL
     ═══════════════════════════════════════════════ */
  toggleInfo: function() {
    var player = NXT.get('player');
    var time = NXT.get('time');
    var weather = NXT.get('weather');
    var world = NXT.get('world');
    var citizens = NXT.get('citizen');
    
    if (!player) return;
    
    var gx = Math.floor(player.data.x / world.data.tileSize);
    var gy = Math.floor(player.data.y / world.data.tileSize);
    
    var content = 
      '<div style="padding:8px">' +
        '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:16px">📍 CURRENT LOCATION</h3>' +
        
        '<div style="background:rgba(0,212,255,.06);border-radius:10px;padding:12px;margin-bottom:16px">' +
          '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Position: <b>' + gx + ', ' + gy + '</b></div>' +
          '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Zone: <b>' + this.getZoneName(gx, gy) + '</b></div>' +
          '<div style="font-size:12px;color:#cbd5e1">Region: <b>' + this.getRegionName(gx, gy) + '</b></div>' +
        '</div>' +
        
        (time ? 
          '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:12px;margin-top:20px">⏰ TIME</h3>' +
          '<div style="background:rgba(139,92,246,.06);border-radius:10px;padding:12px;margin-bottom:16px">' +
            '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Time: <b>' + time.formatTime() + '</b></div>' +
            '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Day: <b>' + time.data.day + '</b></div>' +
            '<div style="font-size:12px;color:#cbd5e1">Season: <b>' + time.data.season + '</b></div>' +
          '</div>' : '') +
        
        (weather ? 
          '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:12px;margin-top:20px">🌦️ WEATHER</h3>' +
          '<div style="background:rgba(34,197,94,.06);border-radius:10px;padding:12px;margin-bottom:16px">' +
            '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Condition: <b>' + weather.getWeather() + '</b></div>' +
            '<div style="font-size:12px;color:#cbd5e1">Temperature: <b>' + weather.getTemperature() + '°C</b></div>' +
          '</div>' : '') +
        
        '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:12px;margin-top:20px">🌍 WORLD</h3>' +
        '<div style="background:rgba(255,215,0,.06);border-radius:10px;padding:12px">' +
          '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Size: <b>' + world.data.width + ' x ' + world.data.height + '</b></div>' +
          '<div style="font-size:12px;color:#cbd5e1;margin-bottom:6px">Buildings: <b>' + world.data.buildings.length + '</b></div>' +
          '<div style="font-size:12px;color:#cbd5e1">Citizens: <b>' + (citizens ? citizens.data.citizens.length : 0) + '</b></div>' +
        '</div>' +
      '</div>';
    
    this.openSidePanel('ℹ️ Info', content);
  },
  
  openStats: function() {
    var citizens = NXT.get('citizen');
    var stats = citizens ? citizens.getStats() : {};
    
    var content = 
      '<div style="padding:8px">' +
        '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:16px">👥 POPULATION</h3>' +
        
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">' +
          '<div style="background:rgba(0,212,255,.1);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:24px;font-weight:800;color:#00d4ff;font-family:Orbitron">' + (stats.total || 0) + '</div>' +
            '<div style="font-size:10px;color:#7a8194;letter-spacing:1px">TOTAL</div>' +
          '</div>' +
          '<div style="background:rgba(139,92,246,.1);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:24px;font-weight:800;color:#8b5cf6;font-family:Orbitron">' + (stats.families || 0) + '</div>' +
            '<div style="font-size:10px;color:#7a8194;letter-spacing:1px">FAMILIES</div>' +
          '</div>' +
        '</div>' +
        
        '<div style="background:rgba(0,0,0,.3);padding:16px;border-radius:10px;margin-bottom:16px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">👨 Male</span>' +
            '<b style="color:#3b82f6">' + (stats.males || 0) + '</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">👩 Female</span>' +
            '<b style="color:#ec4899">' + (stats.females || 0) + '</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">👶 Children</span>' +
            '<b style="color:#22c55e">' + (stats.children || 0) + '</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">👨 Adults</span>' +
            '<b style="color:#f59e0b">' + (stats.adults || 0) + '</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px">' +
            '<span style="color:#7a8194">👴 Elders</span>' +
            '<b style="color:#a855f7">' + (stats.elders || 0) + '</b>' +
          '</div>' +
        '</div>' +
        
        '<div style="background:rgba(34,197,94,.1);padding:12px;border-radius:10px;text-align:center">' +
          '<div style="font-size:20px;font-weight:800;color:#22c55e;font-family:Orbitron">' + (stats.employed || 0) + '</div>' +
          '<div style="font-size:10px;color:#7a8194;letter-spacing:1px">EMPLOYED</div>' +
        '</div>' +
      '</div>';
    
    this.openSidePanel('📊 Statistics', content);
  },
  
  showHelp: function() {
    var content = 
      '<div style="padding:8px">' +
        '<h3 style="color:#00d4ff;font-family:Orbitron;font-size:13px;letter-spacing:2px;margin-bottom:16px">🎮 CONTROLS</h3>' +
        
        '<div style="background:rgba(0,212,255,.06);border-radius:10px;padding:16px;margin-bottom:12px">' +
          '<div style="font-size:11px;color:#00d4ff;letter-spacing:1px;margin-bottom:12px">KEYBOARD</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">W A S D</span><b>Move</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">Arrow Keys</span><b>Move</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">' +
            '<span style="color:#7a8194">Shift</span><b>Run</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px">' +
            '<span style="color:#7a8194">Ctrl / C</span><b>Crouch</b>' +
          '</div>' +
        '</div>' +
        
        '<div style="background:rgba(34,197,94,.06);border-radius:10px;padding:16px;margin-bottom:12px">' +
          '<div style="font-size:11px;color:#22c55e;letter-spacing:1px;margin-bottom:12px">MOBILE</div>' +
          '<div style="font-size:12px;color:#cbd5e1;line-height:1.7">' +
            '• Left joystick → Move<br>' +
            '• Right area drag → Look<br>' +
            '• Double tap → Record<br>' +
            '• Pinch → Zoom' +
          '</div>' +
        '</div>' +
        
        '<div style="background:rgba(255,215,0,.06);border-radius:10px;padding:16px">' +
          '<div style="font-size:11px;color:#ffd700;letter-spacing:1px;margin-bottom:12px">FEATURES</div>' +
          '<div style="font-size:12px;color:#cbd5e1;line-height:1.7">' +
            '🎥 Record videos<br>' +
            '📸 Take photos<br>' +
            '🎬 Cinematic mode<br>' +
            '🗺️ View map<br>' +
            '📊 Live statistics' +
          '</div>' +
        '</div>' +
      '</div>';
    
    this.openSidePanel('❓ Help', content);
  },
  
  /* ═══════════════════════════════════════════════
     MODALS
     ═══════════════════════════════════════════════ */
  openModal: function(title, content) {
    var overlay = document.getElementById('modalOverlay');
    var titleEl = document.getElementById('modalTitle');
    var bodyEl = document.getElementById('modalBody');
    
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = content;
    if (overlay) overlay.classList.add('show');
    
    this.data.modalOpen = true;
  },
  
  closeModal: function(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-header button')) return;
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('show');
    this.data.modalOpen = false;
  },
  
  /* ═══════════════════════════════════════════════
     SETTINGS
     ═══════════════════════════════════════════════ */
  toggleSettings: function() {
    var modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    if (modal.classList.contains('show')) {
      modal.classList.remove('show');
    } else {
      modal.classList.add('show');
    }
  },
  
  closeSettings: function(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-header button')) return;
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('show');
  },
  
  switchTab: function(tab) {
    document.querySelectorAll('.settings-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.settings-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === 'tab-' + tab);
    });
    this.data.currentTab = tab;
  },
  
  bindSettingsInputs: function() {
    var self = this;
    
    // Quality
    var qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', function() {
        if (NXT.config && NXT.config.world) {
          NXT.config.render.quality = this.value;
          self.showToast('Quality: ' + this.value.toUpperCase());
        }
      });
    }
    
    // Time mode
    var timeModeSelect = document.getElementById('timeModeSelect');
    if (timeModeSelect) {
      timeModeSelect.addEventListener('change', function() {
        var time = NXT.get('time');
        if (time) time.setMode(this.value);
      });
    }
    
    // Weather mode
    var weatherModeSelect = document.getElementById('weatherModeSelect');
    if (weatherModeSelect) {
      weatherModeSelect.addEventListener('change', function() {
        var weather = NXT.get('weather');
        if (weather) weather.setMode(this.value);
      });
    }
  },
  
  /* ═══════════════════════════════════════════════
     MAP
     ═══════════════════════════════════════════════ */
  toggleMap: function() {
    var modal = document.getElementById('mapModal');
    if (!modal) return;
    
    if (modal.classList.contains('show')) {
      modal.classList.remove('show');
    } else {
      modal.classList.add('show');
      this.renderFullMap();
    }
  },
  
  closeMap: function(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-header button')) return;
    var modal = document.getElementById('mapModal');
    if (modal) modal.classList.remove('show');
  },
  
  renderFullMap: function() {
    var canvas = document.getElementById('fullMapCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    
    var world = NXT.get('world');
    if (!world) return;
    
    var size = canvas.width;
    var scale = size / world.data.width;
    
    // Background (grass)
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, size, size);
    
    // Draw tiles
    for (var y = 0; y < world.data.height; y += 2) {
      for (var x = 0; x < world.data.width; x += 2) {
        var tile = world.data.grid[y] && world.data.grid[y][x];
        if (!tile) continue;
        
        var color = this.getTileColor(tile.type);
        if (!color) continue;
        
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale * 2, scale * 2);
      }
    }
    
    // Draw buildings
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(b.gx * scale, b.gy * scale, b.gw * scale, b.gh * scale);
    }
    
    // Draw player
    var player = NXT.get('player');
    if (player) {
      var pgx = player.data.x / world.data.tileSize;
      var pgy = player.data.y / world.data.tileSize;
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pgx * scale, pgy * scale, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },
  
  getTileColor: function(type) {
    var colors = {
      [TILE.GRASS]: '#166534',
      [TILE.GRASS_DARK]: '#15803d',
      [TILE.FOREST]: '#14532d',
      [TILE.WATER]: '#0369a1',
      [TILE.WATER_DEEP]: '#075985',
      [TILE.SAND]: '#d4a574',
      [TILE.MOUNTAIN]: '#64748b',
      [TILE.MOUNTAIN_SNOW]: '#f1f5f9',
      [TILE.FARMLAND]: '#a3a380',
      [TILE.ROAD]: '#52525b',
      [TILE.ROAD_CROSS]: '#404040',
      [TILE.PATH]: '#7c7c7c'
    };
    return colors[type];
  },
  
  /* ═══════════════════════════════════════════════
     GALLERY
     ═══════════════════════════════════════════════ */
  openGallery: function() {
    var modal = document.getElementById('galleryModal');
    if (!modal) return;
    
    modal.classList.add('show');
    this.refreshGallery();
  },
  
  closeGallery: function(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-header button')) return;
    var modal = document.getElementById('galleryModal');
    if (modal) modal.classList.remove('show');
  },
  
  refreshGallery: function() {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    var recording = NXT.get('recording');
    if (!recording) return;
    
    grid.innerHTML = '';
    
    // Videos
    recording.data.videos.forEach(function(v) {
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = '🎥<div class="item-info">' + (v.size / 1024 / 1024).toFixed(1) + 'MB · ' + v.duration + 's</div>';
      item.onclick = function() {
        if (NXT.recording) NXT.recording.downloadVideo(v.id);
      };
      grid.appendChild(item);
    });
    
    // Photos
    recording.data.photos.forEach(function(p) {
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.backgroundImage = 'url(' + p.dataUrl + ')';
      item.style.backgroundSize = 'cover';
      item.innerHTML = '<div class="item-info">📸 Photo</div>';
      item.onclick = function() {
        if (NXT.recording) NXT.recording.downloadPhoto(p.id);
      };
      grid.appendChild(item);
    });
    
    if (recording.data.videos.length === 0 && recording.data.photos.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#7a8194">' +
        '<div style="font-size:48px;margin-bottom:12px">📭</div>' +
        '<div>No photos or videos yet</div>' +
        '<div style="font-size:11px;margin-top:8px">Take a photo or record a video to see it here</div>' +
        '</div>';
    }
  },
  
  /* ═══════════════════════════════════════════════
     TOAST
     ═══════════════════════════════════════════════ */
  showToast: function(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast';
    if (type) toast.classList.add(type);
    
    setTimeout(function() {
      toast.classList.add('show');
    }, 10);
    
    clearTimeout(this.data.toastTimeout);
    this.data.toastTimeout = setTimeout(function() {
      toast.classList.remove('show');
    }, 2500);
  },
  
  /* ═══════════════════════════════════════════════
     KEYBOARD
     ═══════════════════════════════════════════════ */
  bindKeyboard: function() {
    var self = this;
    
    document.addEventListener('keydown', function(e) {
      // Escape closes things
      if (e.key === 'Escape') {
        self.closeModal();
        self.closeSettings();
        self.closeMap();
        self.closeGallery();
        self.closeSidePanel();
        return;
      }
      
      // M for map
      if (e.key === 'm' || e.key === 'M') {
        if (!e.target.matches('input, textarea')) {
          self.toggleMap();
        }
      }
      
      // I for info
      if (e.key === 'i' || e.key === 'I') {
        if (!e.target.matches('input, textarea')) {
          self.toggleInfo();
        }
      }
      
      // Tab for menu
      if (e.key === 'Tab') {
        e.preventDefault();
        self.openMenu();
      }
    });
  },
  
  render: function(ctx, dt) {
    // UI doesn't render to canvas
  }
});

console.log('%c🎛️ UI module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
