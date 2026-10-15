/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Time Module
   Author: AL-AMIN
   Part 13/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('time', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    mode: 'real',       // real | fast | faster | fastest
    speed: 1,
    
    startHour: 6,
    startMinute: 0,
    
    // Game minutes pass per real second
    // real = 1 sec real = 1 sec game (kept as real time)
    minutesPerSecond: {
      real: 1/60,        // 1 real sec = 1 game sec
      fast: 2/60,
      faster: 5/60,
      fastest: 10/60
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    hour: 6,
    minute: 0,
    second: 0,
    day: 1,
    month: 1,
    year: 1,
    dayOfWeek: 0,
    
    totalMinutes: 0,
    totalDays: 0,
    
    // Time of day: dawn, morning, noon, afternoon, evening, night, midnight
    timeOfDay: 'morning',
    
    // Season: spring, summer, monsoon, winter
    season: 'spring',
    
    // Speed multiplier
    speedMultiplier: 1,
    
    // Is it night?
    isNight: false,
    
    // Progress through day (0-1)
    dayProgress: 0.25
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('time', '⏰ Initializing time system...');
    
    // Set starting time
    this.data.hour = this.config.startHour;
    this.data.minute = this.config.startMinute;
    this.data.speedMultiplier = this.config.minutesPerSecond[this.config.mode] || (1/60);
    
    // Sync with real time
    if (this.config.mode === 'real') {
      var realNow = new Date();
      this.data.hour = realNow.getHours();
      this.data.minute = realNow.getMinutes();
      this.data.second = realNow.getSeconds();
    }
    
    this.updateTimeOfDay();
    this.updateSeason();
    this.updateTopBar();
    
    NXT.log('time', '✅ Time initialized: ' + this.formatTime());
    
    NXT.emit('time:ready');
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Advance time based on mode
    var minutesPerSecond = this.data.speedMultiplier;
    var minutesPassed = dt * minutesPerSecond;
    
    this.data.totalMinutes += minutesPassed;
    this.data.minute += minutesPassed;
    
    // Handle minute overflow
    while (this.data.minute >= 60) {
      this.data.minute -= 60;
      this.data.hour++;
      
      this.emitHourChange();
      
      // Handle hour overflow
      if (this.data.hour >= 24) {
        this.data.hour = 0;
        this.data.day++;
        this.data.totalDays++;
        this.data.dayOfWeek = (this.data.dayOfWeek + 1) % 7;
        
        this.emitDayChange();
        
        // Handle month
        if (this.data.day > 30) {
          this.data.day = 1;
          this.data.month++;
          
          // Handle year
          if (this.data.month > 12) {
            this.data.month = 1;
            this.data.year++;
            this.emitYearChange();
          }
          
          this.updateSeason();
          this.emitMonthChange();
        }
      }
    }
    
    // Update time of day
    this.updateTimeOfDay();
    
    // Update UI
    this.updateTopBar();
  },
  
  /* ═══════════════════════════════════════════════
     TIME OF DAY
     ═══════════════════════════════════════════════ */
  updateTimeOfDay: function() {
    var h = this.data.hour;
    var prev = this.data.timeOfDay;
    var prevNight = this.data.isNight;
    
    if (h >= 5 && h < 7) this.data.timeOfDay = 'dawn';
    else if (h >= 7 && h < 12) this.data.timeOfDay = 'morning';
    else if (h >= 12 && h < 14) this.data.timeOfDay = 'noon';
    else if (h >= 14 && h < 17) this.data.timeOfDay = 'afternoon';
    else if (h >= 17 && h < 19) this.data.timeOfDay = 'sunset';
    else if (h >= 19 && h < 21) this.data.timeOfDay = 'evening';
    else if (h >= 21 || h < 5) this.data.timeOfDay = 'night';
    
    this.data.isNight = (h >= 19 || h < 6);
    this.data.dayProgress = h / 24;
    
    if (prev !== this.data.timeOfDay) {
      NXT.emit('time:daytime', this.data.timeOfDay);
    }
    if (prevNight !== this.data.isNight) {
      NXT.emit('time:night', this.data.isNight);
    }
  },
  
  /* ═══════════════════════════════════════════════
     SEASONS
     ═══════════════════════════════════════════════ */
  updateSeason: function() {
    var m = this.data.month;
    var prev = this.data.season;
    
    // Bangladesh-style seasons
    if (m >= 3 && m <= 5) this.data.season = 'summer';       // গ্রীষ্ম
    else if (m >= 6 && m <= 9) this.data.season = 'monsoon'; // বর্ষা
    else if (m >= 10 && m <= 11) this.data.season = 'autumn'; // শরৎ
    else if (m === 12 || m <= 2) this.data.season = 'winter'; // শীত
    
    if (prev !== this.data.season) {
      NXT.emit('time:season', this.data.season);
    }
  },
  
  /* ═══════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════ */
  emitHourChange: function() {
    NXT.emit('time:hour', this.data.hour);
    
    // Special hour events
    if (this.data.hour === 6) NXT.emit('time:sunrise');
    if (this.data.hour === 12) NXT.emit('time:noon');
    if (this.data.hour === 18) NXT.emit('time:sunset');
    if (this.data.hour === 0) NXT.emit('time:midnight');
  },
  
  emitDayChange: function() {
    NXT.log('time', '📅 New day: Day ' + this.data.day);
    NXT.emit('time:newday', { day: this.data.day, month: this.data.month, year: this.data.year });
  },
  
  emitMonthChange: function() {
    NXT.log('time', '📆 New month: ' + TIME_CONST.MONTHS[this.data.month - 1]);
    NXT.emit('time:newmonth', this.data.month);
  },
  
  emitYearChange: function() {
    NXT.log('time', '🎉 New year: ' + this.data.year);
    NXT.emit('time:newyear', this.data.year);
  },
  
  /* ═══════════════════════════════════════════════
     UI UPDATE
     ═══════════════════════════════════════════════ */
  updateTopBar: function() {
    // Clock
    var clockEl = document.getElementById('topClock');
    if (clockEl) {
      var hh = Math.floor(this.data.hour).toString().padStart(2, '0');
      var mm = Math.floor(this.data.minute).toString().padStart(2, '0');
      clockEl.textContent = hh + ':' + mm;
    }
    
    // Date
    var dateEl = document.getElementById('topDate');
    if (dateEl) {
      var dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      var dayName = dayNames[this.data.dayOfWeek] || '';
      dateEl.textContent = dayName + ' ' + this.data.day;
    }
  },
  
  /* ═══════════════════════════════════════════════
     SPEED CONTROL
     ═══════════════════════════════════════════════ */
  toggleMode: function() {
    var modes = ['real', 'fast', 'faster', 'fastest'];
    var labels = { real: 'Real', fast: '2x', faster: '5x', fastest: '10x' };
    
    var currentIdx = modes.indexOf(this.config.mode);
    var nextIdx = (currentIdx + 1) % modes.length;
    var nextMode = modes[nextIdx];
    
    this.setMode(nextMode);
    
    // Update button label
    var btn = document.getElementById('timeBtn');
    if (btn) {
      btn.querySelector('span').textContent = labels[nextMode];
    }
  },
  
  setMode: function(mode) {
    if (!this.config.minutesPerSecond[mode]) mode = 'real';
    
    this.config.mode = mode;
    this.data.speedMultiplier = this.config.minutesPerSecond[mode];
    
    NXT.log('time', '⏩ Speed mode: ' + mode);
    NXT.emit('time:mode', mode);
  },
  
  /* ═══════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════ */
  getHour: function() {
    return this.data.hour;
  },
  
  getMinute: function() {
    return this.data.minute;
  },
  
  getDay: function() {
    return this.data.day;
  },
  
  getSeason: function() {
    return this.data.season;
  },
  
  getTimeOfDay: function() {
    return this.data.timeOfDay;
  },
  
  isNightTime: function() {
    return this.data.isNight;
  },
  
  formatTime: function() {
    var hh = Math.floor(this.data.hour).toString().padStart(2, '0');
    var mm = Math.floor(this.data.minute).toString().padStart(2, '0');
    return hh + ':' + mm;
  },
  
  formatDate: function() {
    return TIME_CONST.DAYS[this.data.dayOfWeek] + ', Day ' + this.data.day + ' ' + 
      TIME_CONST.MONTHS[this.data.month - 1] + ' Year ' + this.data.year;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER — Sky color (used by world render)
     ═══════════════════════════════════════════════ */
  getSkyColor: function() {
    var h = this.data.hour;
    
    // Define key frame colors
    var skyColors = {
      0: '#0a0e1a',   // midnight
      5: '#1a1f3a',   // pre-dawn
      6: '#ff9966',   // dawn
      8: '#66b3ff',   // morning
      12: '#4db8ff',  // noon
      15: '#66b3ff',  // afternoon
      18: '#ff7744',  // sunset
      20: '#1a1f3a',  // evening
      22: '#0a0e1a',  // night
      24: '#0a0e1a'   // midnight
    };
    
    // Find nearest key frames
    var keys = Object.keys(skyColors).map(Number).sort(function(a,b){return a-b;});
    var prevKey = 0;
    var nextKey = 24;
    
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] <= h) prevKey = keys[i];
      if (keys[i] >= h) { nextKey = keys[i]; break; }
    }
    
    // Interpolate between colors
    var t = (nextKey === prevKey) ? 0 : (h - prevKey) / (nextKey - prevKey);
    return this.lerpColor(skyColors[prevKey], skyColors[nextKey], t);
  },
  
  lerpColor: function(c1, c2, t) {
    var r1 = parseInt(c1.slice(1, 3), 16);
    var g1 = parseInt(c1.slice(3, 5), 16);
    var b1 = parseInt(c1.slice(5, 7), 16);
    
    var r2 = parseInt(c2.slice(1, 3), 16);
    var g2 = parseInt(c2.slice(3, 5), 16);
    var b2 = parseInt(c2.slice(5, 7), 16);
    
    var r = Math.floor(r1 + (r2 - r1) * t);
    var g = Math.floor(g1 + (g2 - g1) * t);
    var b = Math.floor(b1 + (b2 - b1) * t);
    
    return '#' + [r, g, b].map(function(x) {
      var hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },
  
  getLightLevel: function() {
    // 0 = dark, 1 = bright
    var h = this.data.hour;
    
    if (h >= 6 && h < 8) return 0.5 + (h - 6) / 4;      // dawn
    if (h >= 8 && h < 17) return 1.0;                    // day
    if (h >= 17 && h < 20) return 1.0 - (h - 17) / 6;   // sunset
    return 0.2;                                          // night
  },
  
  render: function(ctx, dt) {
    // Rendering handled by world render module
  }
});

console.log('%c⏰ Time module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
