/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Gallery Module
   Author: AL-AMIN
   Part 20/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('gallery', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    maxVideos: 20,
    maxPhotos: 50,
    thumbnailSize: 200,
    
    filter: 'all',       // all | videos | photos
    sortBy: 'newest'     // newest | oldest | size
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    items: [],
    selectedItem: null,
    totalSize: 0,
    lastUpdated: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('gallery', '📸 Initializing gallery...');
    
    // Listen for new captures
    NXT.on('recording:saved', this.onNewVideo.bind(this));
    NXT.on('recording:photo', this.onNewPhoto.bind(this));
    
    NXT.log('gallery', '✅ Gallery ready');
    
    NXT.emit('gallery:ready');
  },
  
  /* ═══════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════ */
  onNewVideo: function(video) {
    this.addItem({
      type: 'video',
      id: video.id,
      url: video.url,
      blob: video.blob,
      size: video.size,
      duration: video.duration,
      name: video.name,
      createdAt: video.createdAt,
      thumbnail: null
    });
    
    NXT.log('gallery', '🎥 Video added: ' + video.name);
  },
  
  onNewPhoto: function(photo) {
    this.addItem({
      type: 'photo',
      id: photo.id,
      url: photo.dataUrl,
      dataUrl: photo.dataUrl,
      size: photo.dataUrl.length * 0.75, // Approx
      name: photo.name,
      createdAt: photo.createdAt,
      thumbnail: photo.dataUrl
    });
    
    NXT.log('gallery', '📸 Photo added: ' + photo.name);
  },
  
  addItem: function(item) {
    this.data.items.unshift(item);
    this.data.totalSize += item.size;
    this.data.lastUpdated = Date.now();
    
    // Limit
    var videos = this.data.items.filter(function(i) { return i.type === 'video'; });
    var photos = this.data.items.filter(function(i) { return i.type === 'photo'; });
    
    if (videos.length > this.config.maxVideos) {
      var removed = videos.pop();
      this.removeItem(removed.id);
    }
    
    if (photos.length > this.config.maxPhotos) {
      var removed2 = photos.pop();
      this.removeItem(removed2.id);
    }
    
    this.refresh();
  },
  
  removeItem: function(id) {
    var idx = -1;
    for (var i = 0; i < this.data.items.length; i++) {
      if (this.data.items[i].id === id) {
        idx = i;
        break;
      }
    }
    
    if (idx > -1) {
      var item = this.data.items[idx];
      this.data.totalSize -= item.size;
      
      if (item.type === 'video' && item.url) {
        URL.revokeObjectURL(item.url);
      }
      
      this.data.items.splice(idx, 1);
    }
  },
  
  /* ═══════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════ */
  getAll: function() {
    return this.data.items.slice();
  },
  
  getVideos: function() {
    return this.data.items.filter(function(i) { return i.type === 'video'; });
  },
  
  getPhotos: function() {
    return this.data.items.filter(function(i) { return i.type === 'photo'; });
  },
  
  getFiltered: function() {
    var filter = this.config.filter;
    var items = this.data.items;
    
    if (filter === 'videos') items = items.filter(function(i) { return i.type === 'video'; });
    else if (filter === 'photos') items = items.filter(function(i) { return i.type === 'photo'; });
    
    // Sort
    var sortBy = this.config.sortBy;
    items = items.slice();
    
    if (sortBy === 'newest') items.sort(function(a, b) { return b.createdAt - a.createdAt; });
    else if (sortBy === 'oldest') items.sort(function(a, b) { return a.createdAt - b.createdAt; });
    else if (sortBy === 'size') items.sort(function(a, b) { return b.size - a.size; });
    
    return items;
  },
  
  getStats: function() {
    var videos = this.getVideos();
    var photos = this.getPhotos();
    var totalDuration = 0;
    
    videos.forEach(function(v) {
      totalDuration += v.duration || 0;
    });
    
    return {
      videos: videos.length,
      photos: photos.length,
      total: this.data.items.length,
      totalSize: this.data.totalSize,
      totalDuration: totalDuration
    };
  },
  
  /* ═══════════════════════════════════════════════
     FILTERS
     ═══════════════════════════════════════════════ */
  setFilter: function(filter) {
    this.config.filter = filter;
    this.refresh();
  },
  
  setSort: function(sortBy) {
    this.config.sortBy = sortBy;
    this.refresh();
  },
  
  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  refresh: function() {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    var items = this.getFiltered();
    
    if (items.length === 0) {
      grid.innerHTML = 
        '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#7a8194">' +
          '<div style="font-size:64px;margin-bottom:16px;opacity:0.5">' +
            (this.config.filter === 'videos' ? '🎥' : this.config.filter === 'photos' ? '📸' : '📭') +
          '</div>' +
          '<div style="font-size:16px;color:#cbd5e1;margin-bottom:8px;font-weight:600">No ' + 
            (this.config.filter === 'all' ? 'media' : this.config.filter) + ' yet</div>' +
          '<div style="font-size:12px">' +
            (this.config.filter === 'videos' ? 'Record a video to see it here' :
             this.config.filter === 'photos' ? 'Take a photo to see it here' :
             'Take a photo or record a video to see it here') +
          '</div>' +
        '</div>';
      return;
    }
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var el = this.createGalleryItem(item);
      grid.appendChild(el);
    }
    
    NXT.log('gallery', '🎨 Gallery refreshed: ' + items.length + ' items');
  },
  
  createGalleryItem: function(item) {
    var el = document.createElement('div');
    el.className = 'gallery-item';
    el.dataset.id = item.id;
    el.dataset.type = item.type;
    
    // Thumbnail
    if (item.type === 'photo' && item.dataUrl) {
      el.style.backgroundImage = 'url(' + item.dataUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else if (item.type === 'video') {
      el.style.background = 'linear-gradient(135deg, #1a1f2e, #252b3d)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '48px';
      el.innerHTML = '🎥';
    }
    
    // Info overlay
    var info = document.createElement('div');
    info.className = 'item-info';
    
    var size = (item.size / 1024 / 1024).toFixed(1) + 'MB';
    var duration = item.duration ? ' · ' + item.duration + 's' : '';
    var date = new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    info.innerHTML = 
      '<div style="font-size:10px;font-weight:700;color:#fff">' + 
        (item.type === 'video' ? '🎥' : '📸') + ' ' + size + duration +
      '</div>' +
      '<div style="font-size:9px;color:#cbd5e1;margin-top:2px">' + date + '</div>';
    
    el.appendChild(info);
    
    // Click to view/download
    var self = this;
    el.onclick = function() {
      self.openItem(item);
    };
    
    return el;
  },
  
  /* ═══════════════════════════════════════════════
     OPEN ITEM
     ═══════════════════════════════════════════════ */
  openItem: function(item) {
    this.data.selectedItem = item;
    
    var content = '';
    
    if (item.type === 'photo') {
      content = 
        '<div style="text-align:center;padding:8px">' +
          '<img src="' + item.dataUrl + '" style="max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 0 30px rgba(0,212,255,0.3)">' +
          
          '<div style="margin-top:20px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">' +
            '<button class="save-btn" onclick="NXT.gallery.download(' + "'" + item.id + "'" + ')">' +
              '<i class="fas fa-download"></i> Download' +
            '</button>' +
            '<button class="save-btn danger" onclick="NXT.gallery.delete(' + "'" + item.id + "'" + ')">' +
              '<i class="fas fa-trash"></i> Delete' +
            '</button>' +
          '</div>' +
          
          '<div style="margin-top:16px;font-size:12px;color:#7a8194">' +
            '📸 ' + item.name + ' · ' + new Date(item.createdAt).toLocaleString('en-GB') +
          '</div>' +
        '</div>';
    } else if (item.type === 'video') {
      content = 
        '<div style="text-align:center;padding:8px">' +
          '<video src="' + item.url + '" controls style="max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 0 30px rgba(0,212,255,0.3)"></video>' +
          
          '<div style="margin-top:20px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">' +
            '<button class="save-btn" onclick="NXT.gallery.download(' + "'" + item.id + "'" + ')">' +
              '<i class="fas fa-download"></i> Download' +
            '</button>' +
            '<button class="save-btn danger" onclick="NXT.gallery.delete(' + "'" + item.id + "'" + ')">' +
              '<i class="fas fa-trash"></i> Delete' +
            '</button>' +
          '</div>' +
          
          '<div style="margin-top:16px;font-size:12px;color:#7a8194">' +
            '🎥 ' + item.name + ' · ' + item.duration + 's · ' + (item.size / 1024 / 1024).toFixed(2) + 'MB' +
          '</div>' +
        '</div>';
    }
    
    this.openModal(item.type === 'photo' ? '📸 Photo' : '🎥 Video', content);
  },
  
  openModal: function(title, content) {
    var overlay = document.getElementById('modalOverlay');
    var titleEl = document.getElementById('modalTitle');
    var bodyEl = document.getElementById('modalBody');
    
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = content;
    if (overlay) overlay.classList.add('show');
  },
  
  /* ═══════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════ */
  download: function(id) {
    var item = null;
    for (var i = 0; i < this.data.items.length; i++) {
      if (this.data.items[i].id === id) {
        item = this.data.items[i];
        break;
      }
    }
    
    if (!item) return;
    
    var a = document.createElement('a');
    a.href = item.type === 'photo' ? item.dataUrl : item.url;
    a.download = item.name + (item.type === 'photo' ? '.png' : '.webm');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('📥 Downloaded: ' + item.name, 'success');
    }
  },
  
  /* ═══════════════════════════════════════════════
     DELETE
     ═══════════════════════════════════════════════ */
  delete: function(id) {
    if (!confirm('Delete this item?')) return;
    
    this.removeItem(id);
    this.refresh();
    
    if (NXT.ui && NXT.ui.closeModal) NXT.ui.closeModal();
    if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('🗑️ Deleted', 'error');
  },
  
  deleteAll: function() {
    if (!confirm('Delete ALL photos and videos?')) return;
    
    for (var i = 0; i < this.data.items.length; i++) {
      if (this.data.items[i].type === 'video' && this.data.items[i].url) {
        URL.revokeObjectURL(this.data.items[i].url);
      }
    }
    
    this.data.items = [];
    this.data.totalSize = 0;
    this.refresh();
    
    if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('🗑️ All cleared', 'error');
  },
  
  /* ═══════════════════════════════════════════════
     SHARE
     ═══════════════════════════════════════════════ */
  share: function(id) {
    var item = null;
    for (var i = 0; i < this.data.items.length; i++) {
      if (this.data.items[i].id === id) {
        item = this.data.items[i];
        break;
      }
    }
    
    if (!item) return;
    
    if (navigator.share) {
      var shareData = {
        title: item.name,
        text: 'Check out this ' + item.type + ' from NXT Natural World!'
      };
      
      if (item.type === 'photo' && item.dataUrl) {
        fetch(item.dataUrl)
          .then(function(res) { return res.blob(); })
          .then(function(blob) {
            var file = new File([blob], item.name + '.png', { type: 'image/png' });
            shareData.files = [file];
            return navigator.share(shareData);
          })
          .catch(function() {});
      } else {
        navigator.share(shareData).catch(function() {});
      }
    } else {
      if (NXT.ui && NXT.ui.showToast) {
        NXT.ui.showToast('Share not supported — download instead');
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════ */
  exportAll: function() {
    var videos = this.getVideos();
    var photos = this.getPhotos();
    
    if (videos.length === 0 && photos.length === 0) {
      if (NXT.ui && NXT.ui.showToast) {
        NXT.ui.showToast('Nothing to export', 'error');
      }
      return;
    }
    
    // Export metadata
    var meta = {
      exportedAt: new Date().toISOString(),
      videos: videos.map(function(v) {
        return { name: v.name, size: v.size, duration: v.duration, createdAt: v.createdAt };
      }),
      photos: photos.map(function(p) {
        return { name: p.name, size: p.size, createdAt: p.createdAt };
      })
    };
    
    var blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'nxt_gallery_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('📤 Gallery metadata exported', 'success');
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Nothing to update
  },
  
  render: function(ctx, dt) {
    // No canvas rendering
  }
});

console.log('%c📸 Gallery module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
