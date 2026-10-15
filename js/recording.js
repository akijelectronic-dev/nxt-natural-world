/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Recording Module
   Author: AL-AMIN
   Part 17/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('recording', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    fps: 30,
    quality: 'high',
    
    videoBitsPerSecond: {
      low: 1000000,
      medium: 2500000,
      high: 5000000,
      ultra: 8000000
    },
    
    mimeType: 'video/webm',
    maxDuration: 600,   // 10 minutes
    
    // Auto-stop safety
    minDuration: 1      // at least 1 second
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    // State
    recording: false,
    paused: false,
    
    // MediaRecorder
    recorder: null,
    chunks: [],
    stream: null,
    
    // Timer
    startTime: 0,
    elapsed: 0,
    timerInterval: null,
    
    // Current file info
    fileName: '',
    
    // Photos
    photos: [],
    
    // Videos
    videos: []
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('recording', '🎥 Initializing recording system...');
    
    // Check browser support
    if (!this.isSupported()) {
      NXT.warn('recording', 'MediaRecorder not supported in this browser');
      return;
    }
    
    // Load saved gallery from storage
    this.loadGallery();
    
    NXT.log('recording', '✅ Recording ready');
    NXT.log('recording', '📹 Format: ' + this.config.mimeType);
    NXT.log('recording', '📊 Quality: ' + this.config.quality + ' (' + 
      (this.config.videoBitsPerSecond[this.config.quality] / 1000000) + ' Mbps)');
    
    NXT.emit('recording:ready');
  },
  
  /* ═══════════════════════════════════════════════
     SUPPORT CHECK
     ═══════════════════════════════════════════════ */
  isSupported: function() {
    return typeof MediaRecorder !== 'undefined' &&
           HTMLCanvasElement.prototype.captureStream !== undefined;
  },
  
  /* ═══════════════════════════════════════════════
     TOGGLE RECORDING
     ═══════════════════════════════════════════════ */
  toggle: function() {
    if (this.data.recording) {
      this.stop();
    } else {
      this.start();
    }
  },
  
  /* ═══════════════════════════════════════════════
     START RECORDING
     ═══════════════════════════════════════════════ */
  start: function() {
    if (this.data.recording) return;
    
    if (!this.isSupported()) {
      NXT.warn('recording', 'Not supported');
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('❌ Recording not supported', 'error');
      return;
    }
    
    var canvas = document.getElementById('worldCanvas');
    if (!canvas) {
      NXT.warn('recording', 'Canvas not found');
      return;
    }
    
    try {
      // Get canvas stream at target FPS
      this.data.stream = canvas.captureStream(this.config.fps);
      
      // Determine best mime type
      var mimeType = this.getBestMimeType();
      
      // Create recorder
      this.data.recorder = new MediaRecorder(this.data.stream, {
        mimeType: mimeType,
        videoBitsPerSecond: this.config.videoBitsPerSecond[this.config.quality]
      });
      
      this.data.chunks = [];
      var self = this;
      
      this.data.recorder.ondataavailable = function(e) {
        if (e.data && e.data.size > 0) {
          self.data.chunks.push(e.data);
        }
      };
      
      this.data.recorder.onstop = function() {
        self.onRecordingStop();
      };
      
      this.data.recorder.onerror = function(e) {
        NXT.error('recording', 'Recorder error', e);
        self.stop();
      };
      
      // Start recording
      this.data.recorder.start(100);
      this.data.recording = true;
      this.data.startTime = Date.now();
      this.data.elapsed = 0;
      
      // Show REC indicator
      var indicator = document.getElementById('recIndicator');
      if (indicator) indicator.classList.add('show');
      
      // Update record button
      var recBtn = document.getElementById('recBtn');
      if (recBtn) {
        recBtn.classList.add('active');
        var icon = recBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-stop';
        var span = recBtn.querySelector('span');
        if (span) span.textContent = 'Stop';
      }
      
      // Start timer
      this.startTimer();
      
      NXT.log('recording', '🔴 Recording started');
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('🔴 Recording started', 'error');
      
      NXT.emit('recording:start');
      
    } catch (err) {
      NXT.error('recording', 'Failed to start', err);
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('❌ Recording failed', 'error');
    }
  },
  
  /* ═══════════════════════════════════════════════
     STOP RECORDING
     ═══════════════════════════════════════════════ */
  stop: function() {
    if (!this.data.recording) return;
    
    var elapsed = Date.now() - this.data.startTime;
    
    // Too short?
    if (elapsed < this.config.minDuration * 1000) {
      NXT.warn('recording', 'Recording too short');
      this.data.recording = false;
      return;
    }
    
    try {
      this.data.recorder.stop();
    } catch (err) {
      NXT.error('recording', 'Stop failed', err);
      this.cleanup();
    }
    
    this.data.recording = false;
    
    // Stop timer
    this.stopTimer();
    
    // Hide REC indicator
    var indicator = document.getElementById('recIndicator');
    if (indicator) indicator.classList.remove('show');
    
    // Reset record button
    var recBtn = document.getElementById('recBtn');
    if (recBtn) {
      recBtn.classList.remove('active');
      var icon = recBtn.querySelector('i');
      if (icon) icon.className = 'fas fa-video';
      var span = recBtn.querySelector('span');
      if (span) span.textContent = 'Record';
    }
    
    NXT.log('recording', '⏹️ Recording stopped');
    NXT.emit('recording:stop');
  },
  
  /* ═══════════════════════════════════════════════
     ON RECORDING STOP
     ═══════════════════════════════════════════════ */
  onRecordingStop: function() {
    if (this.data.chunks.length === 0) {
      NXT.warn('recording', 'No data recorded');
      this.cleanup();
      return;
    }
    
    // Create blob
    var blob = new Blob(this.data.chunks, { type: this.config.mimeType });
    var duration = this.data.elapsed;
    
    // Create video entry
    var video = {
      id: 'v_' + Date.now(),
      blob: blob,
      url: URL.createObjectURL(blob),
      size: blob.size,
      duration: duration,
      createdAt: Date.now(),
      name: 'Recording_' + new Date().toLocaleString('en-GB').replace(/[\/:, ]/g, '_')
    };
    
    this.data.videos.unshift(video);
    
    // Limit stored videos
    if (this.data.videos.length > 20) {
      var old = this.data.videos.pop();
      URL.revokeObjectURL(old.url);
    }
    
    NXT.log('recording', '💾 Video saved: ' + (blob.size / 1024 / 1024).toFixed(2) + 'MB, ' + duration + 's');
    
    if (NXT.ui && NXT.ui.showToast) {
      NXT.ui.showToast('✅ Video saved (' + (blob.size / 1024 / 1024).toFixed(1) + 'MB)', 'success');
    }
    
    // Update gallery
    if (NXT.gallery && NXT.gallery.refresh) NXT.gallery.refresh();
    
    NXT.emit('recording:saved', video);
    
    this.cleanup();
  },
  
  /* ═══════════════════════════════════════════════
     CLEANUP
     ═══════════════════════════════════════════════ */
  cleanup: function() {
    if (this.data.stream) {
      this.data.stream.getTracks().forEach(function(t) { t.stop(); });
      this.data.stream = null;
    }
    
    this.data.recorder = null;
    this.data.chunks = [];
  },
  
  /* ═══════════════════════════════════════════════
     TIMER
     ═══════════════════════════════════════════════ */
  startTimer: function() {
    var self = this;
    this.stopTimer();
    
    this.data.timerInterval = setInterval(function() {
      self.data.elapsed = Math.floor((Date.now() - self.data.startTime) / 1000);
      
      // Update REC indicator timer
      var timerEl = document.getElementById('recTimer');
      if (timerEl) {
        var m = Math.floor(self.data.elapsed / 60);
        var s = self.data.elapsed % 60;
        timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      }
      
      // Auto-stop at max duration
      if (self.data.elapsed >= self.config.maxDuration) {
        self.stop();
      }
    }, 1000);
  },
  
  stopTimer: function() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.data.timerInterval = null;
    }
  },
  
  /* ═══════════════════════════════════════════════
     SCREENSHOT / PHOTO
     ═══════════════════════════════════════════════ */
  takePhoto: function() {
    var canvas = document.getElementById('worldCanvas');
    if (!canvas) return;
    
    try {
      var dataUrl = canvas.toDataURL('image/png');
      
      var photo = {
        id: 'p_' + Date.now(),
        dataUrl: dataUrl,
        createdAt: Date.now(),
        name: 'Photo_' + new Date().toLocaleString('en-GB').replace(/[\/:, ]/g, '_')
      };
      
      this.data.photos.unshift(photo);
      
      // Limit
      if (this.data.photos.length > 30) {
        this.data.photos.pop();
      }
      
      // Flash effect
      this.flashEffect();
      
      NXT.log('recording', '📸 Photo taken');
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('📸 Photo captured', 'success');
      
      NXT.emit('recording:photo', photo);
      
      // Update gallery
      if (NXT.gallery && NXT.gallery.refresh) NXT.gallery.refresh();
      
      return photo;
      
    } catch (err) {
      NXT.error('recording', 'Photo failed', err);
      if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('❌ Photo failed', 'error');
    }
  },
  
  flashEffect: function() {
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:99999;pointer-events:none;opacity:0.8;transition:opacity 0.3s';
    document.body.appendChild(flash);
    
    setTimeout(function() {
      flash.style.opacity = '0';
      setTimeout(function() {
        flash.remove();
      }, 300);
    }, 50);
  },
  
  /* ═══════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════ */
  downloadVideo: function(videoId) {
    var video = this.data.videos.find(function(v) { return v.id === videoId; });
    if (!video) return;
    
    var a = document.createElement('a');
    a.href = video.url;
    a.download = video.name + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    NXT.log('recording', '📥 Downloaded: ' + video.name);
    if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('📥 Downloading...', 'success');
  },
  
  downloadPhoto: function(photoId) {
    var photo = this.data.photos.find(function(p) { return p.id === photoId; });
    if (!photo) return;
    
    var a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = photo.name + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    NXT.log('recording', '📥 Downloaded photo: ' + photo.name);
    if (NXT.ui && NXT.ui.showToast) NXT.ui.showToast('📥 Downloading...', 'success');
  },
  
  /* ═══════════════════════════════════════════════
     GALLERY
     ═══════════════════════════════════════════════ */
  loadGallery: function() {
    try {
      // Note: blob URLs don't persist across sessions
      // For persistence, you'd need IndexedDB
      // For now, this is session-only
      var saved = NXT.storage.load('gallery_meta');
      if (saved) {
        NXT.log('recording', 'Gallery metadata loaded');
      }
    } catch (e) {
      // Ignore
    }
  },
  
  saveGallery: function() {
    try {
      // Save only metadata (blob URLs don't persist)
      var meta = {
        videosCount: this.data.videos.length,
        photosCount: this.data.photos.length,
        lastUpdated: Date.now()
      };
      NXT.storage.save('gallery_meta', meta);
    } catch (e) {
      // Ignore
    }
  },
  
  /* ═══════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════ */
  getBestMimeType: function() {
    var types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (var i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported(types[i])) {
        return types[i];
      }
    }
    
    return 'video/webm';
  },
  
  setQuality: function(quality) {
    if (this.config.videoBitsPerSecond[quality]) {
      this.config.quality = quality;
      NXT.log('recording', '📊 Quality set to: ' + quality);
    }
  },
  
  isRecording: function() {
    return this.data.recording;
  },
  
  getElapsed: function() {
    return this.data.elapsed;
  },
  
  getStats: function() {
    return {
      videos: this.data.videos.length,
      photos: this.data.photos.length,
      recording: this.data.recording,
      quality: this.config.quality,
      fps: this.config.fps
    };
  }
});

console.log('%c🎥 Recording module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
