/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Schedule Module
   Author: AL-AMIN
   Part 12/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('schedule', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    updateInterval: 5,
    
    // Schedule templates by age group
    templates: {
      child: [
        { start: 6, end: 8, task: 'wake_up', location: 'home' },
        { start: 8, end: 12, task: 'play', location: 'playground' },
        { start: 12, end: 13, task: 'eat', location: 'home' },
        { start: 13, end: 17, task: 'play', location: 'park' },
        { start: 17, end: 20, task: 'family_time', location: 'home' },
        { start: 20, end: 21, task: 'eat', location: 'home' },
        { start: 21, end: 6, task: 'sleep', location: 'home' }
      ],
      student: [
        { start: 6, end: 8, task: 'wake_up', location: 'home' },
        { start: 8, end: 15, task: 'school', location: 'school' },
        { start: 15, end: 17, task: 'study', location: 'home' },
        { start: 17, end: 19, task: 'play', location: 'anywhere' },
        { start: 19, end: 21, task: 'family_time', location: 'home' },
        { start: 21, end: 23, task: 'study', location: 'home' },
        { start: 23, end: 6, task: 'sleep', location: 'home' }
      ],
      worker: [
        { start: 6, end: 7, task: 'wake_up', location: 'home' },
        { start: 7, end: 8, task: 'breakfast', location: 'home' },
        { start: 8, end: 9, task: 'commute', location: 'road' },
        { start: 9, end: 13, task: 'work', location: 'work' },
        { start: 13, end: 14, task: 'lunch', location: 'restaurant' },
        { start: 14, end: 18, task: 'work', location: 'work' },
        { start: 18, end: 19, task: 'commute', location: 'road' },
        { start: 19, end: 21, task: 'family_time', location: 'home' },
        { start: 21, end: 22, task: 'dinner', location: 'home' },
        { start: 22, end: 23, task: 'relax', location: 'home' },
        { start: 23, end: 6, task: 'sleep', location: 'home' }
      ],
      retired: [
        { start: 6, end: 8, task: 'wake_up', location: 'home' },
        { start: 8, end: 10, task: 'morning_walk', location: 'park' },
        { start: 10, end: 12, task: 'socialize', location: 'anywhere' },
        { start: 12, end: 14, task: 'eat', location: 'home' },
        { start: 14, end: 16, task: 'rest', location: 'home' },
        { start: 16, end: 18, task: 'socialize', location: 'park' },
        { start: 18, end: 21, task: 'family_time', location: 'home' },
        { start: 21, end: 6, task: 'sleep', location: 'home' }
      ]
    },
    
    // Weekend override (tasks changed on weekends)
    weekend: {
      worker: [
        { start: 8, end: 10, task: 'sleep_in', location: 'home' },
        { start: 10, end: 12, task: 'family_time', location: 'home' },
        { start: 12, end: 14, task: 'lunch', location: 'restaurant' },
        { start: 14, end: 18, task: 'recreation', location: 'anywhere' },
        { start: 18, end: 22, task: 'socialize', location: 'anywhere' },
        { start: 22, end: 8, task: 'sleep', location: 'home' }
      ],
      student: [
        { start: 8, end: 10, task: 'sleep_in', location: 'home' },
        { start: 10, end: 12, task: 'study', location: 'home' },
        { start: 12, end: 14, task: 'lunch', location: 'home' },
        { start: 14, end: 18, task: 'play', location: 'anywhere' },
        { start: 18, end: 22, task: 'recreation', location: 'anywhere' },
        { start: 22, end: 8, task: 'sleep', location: 'home' }
      ]
    }
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    lastUpdate: 0,
    currentHour: 0,
    currentDay: 0,
    isWeekend: false,
    tasksAssigned: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('schedule', '📅 Initializing schedule system...');
    
    var citizens = NXT.get('citizen');
    if (!citizens) {
      NXT.warn('schedule', 'Citizens not ready');
      return;
    }
    
    // Assign initial tasks
    for (var i = 0; i < citizens.data.citizens.length; i++) {
      var c = citizens.data.citizens[i];
      c.scheduleGroup = this.getScheduleGroup(c);
      c.dailyTask = null;
    }
    
    this.data.lastUpdate = Date.now();
    
    NXT.log('schedule', '✅ Schedule system ready');
    
    NXT.emit('schedule:ready');
  },
  
  /* ═══════════════════════════════════════════════
     GET SCHEDULE GROUP
     ═══════════════════════════════════════════════ */
  getScheduleGroup: function(citizen) {
    if (citizen.age < 6) return 'child';
    if (citizen.age < 18) return 'student';
    if (citizen.age < 65) return 'worker';
    return 'retired';
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    var now = Date.now();
    if (now - this.data.lastUpdate < this.config.updateInterval * 1000) return;
    
    this.data.lastUpdate = now;
    
    var time = NXT.get('time');
    if (!time || !time.data) return;
    
    var hour = time.data.hour;
    var dayOfWeek = time.data.dayOfWeek || 0;
    
    // Saturday (0) and Friday (5) considered weekend
    this.data.isWeekend = (dayOfWeek === 0 || dayOfWeek === 5);
    this.data.currentHour = hour;
    this.data.currentDay = time.data.day;
    
    // Update each citizen
    var citizens = NXT.get('citizen');
    if (!citizens) return;
    
    for (var i = 0; i < citizens.data.citizens.length; i++) {
      this.updateCitizenSchedule(citizens.data.citizens[i], hour);
    }
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE CITIZEN SCHEDULE
     ═══════════════════════════════════════════════ */
  updateCitizenSchedule: function(citizen, hour) {
    var group = citizen.scheduleGroup || this.getScheduleGroup(citizen);
    
    // Get current task from template
    var task = this.getTaskForHour(group, hour, citizen);
    
    if (!task) return;
    
    // Check if task changed
    if (citizen.dailyTask && citizen.dailyTask.task === task.task) return;
    
    citizen.dailyTask = task;
    citizen.currentTask = task.task;
    
    this.data.tasksAssigned++;
    
    // Execute task based on type
    this.executeTask(citizen, task);
  },
  
  /* ═══════════════════════════════════════════════
     GET TASK FOR HOUR
     ═══════════════════════════════════════════════ */
  getTaskForHour: function(group, hour, citizen) {
    // Check weekend override first
    if (this.data.isWeekend && this.config.weekend[group]) {
      var weekendTasks = this.config.weekend[group];
      for (var w = 0; w < weekendTasks.length; w++) {
        var wt = weekendTasks[w];
        if (this.isHourInRange(hour, wt.start, wt.end)) {
          return wt;
        }
      }
      return null;
    }
    
    // Regular template
    var template = this.config.templates[group];
    if (!template) return null;
    
    for (var i = 0; i < template.length; i++) {
      var task = template[i];
      if (this.isHourInRange(hour, task.start, task.end)) {
        return task;
      }
    }
    
    return null;
  },
  
  /* ═══════════════════════════════════════════════
     HOUR RANGE CHECK
     ═══════════════════════════════════════════════ */
  isHourInRange: function(hour, start, end) {
    if (start < end) {
      // Normal range (e.g., 8-15)
      return hour >= start && hour < end;
    } else {
      // Wraps around midnight (e.g., 23-6)
      return hour >= start || hour < end;
    }
  },
  
  /* ═══════════════════════════════════════════════
     EXECUTE TASK
     ═══════════════════════════════════════════════ */
  executeTask: function(citizen, task) {
    var world = NXT.get('world');
    if (!world) return;
    
    // Define task actions
    var taskActions = {
      wake_up: { target: 'home', duration: 1, energyChange: +20 },
      breakfast: { target: 'home', duration: 1, energyChange: +10, hungerChange: +30 },
      eat: { target: 'home', duration: 1, energyChange: +15, hungerChange: +40 },
      lunch: { target: 'restaurant', duration: 1, energyChange: +10, hungerChange: +30 },
      dinner: { target: 'home', duration: 1, energyChange: +5, hungerChange: +30 },
      
      school: { target: 'school', duration: 7, happinessChange: -2 },
      work: { target: 'work', duration: 8, energyChange: -20, moneyChange: +50 },
      study: { target: 'home', duration: 2, energyChange: -10 },
      
      commute: { target: 'road', duration: 1 },
      
      play: { target: 'anywhere', duration: 2, happinessChange: +15, energyChange: -10 },
      socialize: { target: 'anywhere', duration: 2, happinessChange: +10 },
      recreation: { target: 'anywhere', duration: 3, happinessChange: +20 },
      family_time: { target: 'home', duration: 2, happinessChange: +10 },
      morning_walk: { target: 'park', duration: 1, happinessChange: +5, energyChange: +10 },
      
      rest: { target: 'home', duration: 2, energyChange: +15 },
      relax: { target: 'home', duration: 1, happinessChange: +5 },
      sleep: { target: 'home', duration: 8, energyChange: +100, happinessChange: +10 },
      sleep_in: { target: 'home', duration: 2, energyChange: +20 }
    };
    
    var action = taskActions[task.task];
    if (!action) return;
    
    // Set target position based on location
    this.setTargetLocation(citizen, action.target);
    
    // Apply effects
    if (action.energyChange) {
      citizen.energy = NXT.utils.clamp(citizen.energy + action.energyChange, 0, 100);
    }
    if (action.happinessChange) {
      citizen.happiness = NXT.utils.clamp(citizen.happiness + action.happinessChange, 0, 100);
    }
    if (action.hungerChange && citizen.hunger !== undefined) {
      citizen.hunger = NXT.utils.clamp(citizen.hunger + action.hungerChange, 0, 100);
    }
    if (action.moneyChange) {
      citizen.money = (citizen.money || 0) + action.moneyChange;
    }
    
    // Update state
    if (task.task === 'sleep') {
      citizen.state = 'sleeping';
    } else if (task.task === 'wake_up' || task.task === 'breakfast' || 
               task.task === 'eat' || task.task === 'lunch' || task.task === 'dinner') {
      citizen.state = 'eating';
    } else if (task.task === 'work' || task.task === 'school' || task.task === 'study') {
      citizen.state = 'working';
    } else {
      citizen.state = 'walking';
    }
  },
  
  /* ═══════════════════════════════════════════════
     SET TARGET LOCATION
     ═══════════════════════════════════════════════ */
  setTargetLocation: function(citizen, locationType) {
    var target = null;
    
    switch (locationType) {
      case 'home':
        if (citizen.homeId) {
          target = this.getBuildingPos(citizen.homeId);
        }
        break;
        
      case 'work':
        if (citizen.workId) {
          target = this.getBuildingPos(citizen.workId);
        }
        break;
        
      case 'school':
        target = this.findNearestBuilding(citizen, 'education');
        break;
        
      case 'park':
        target = this.findNearestBuilding(citizen, 'recreation');
        break;
        
      case 'restaurant':
        target = this.findNearestBuilding(citizen, 'commercial');
        break;
        
      case 'playground':
        target = this.findNearestBuilding(citizen, 'recreation');
        break;
        
      case 'road':
      case 'anywhere':
        // Random nearby location
        target = {
          x: citizen.x + NXT.utils.random(-150, 150),
          y: citizen.y + NXT.utils.random(-150, 150)
        };
        break;
    }
    
    if (!target && citizen.homeId) {
      target = this.getBuildingPos(citizen.homeId);
    }
    
    if (target) {
      citizen.target = target;
    }
  },
  
  /* ═══════════════════════════════════════════════
     GET BUILDING POS
     ═══════════════════════════════════════════════ */
  getBuildingPos: function(buildingId) {
    var world = NXT.get('world');
    if (!world) return null;
    
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
      if (b.id === buildingId) {
        return {
          x: b.x + b.w / 2,
          y: b.y + b.h / 2
        };
      }
    }
    return null;
  },
  
  /* ═══════════════════════════════════════════════
     FIND NEAREST BUILDING
     ═══════════════════════════════════════════════ */
  findNearestBuilding: function(citizen, zone) {
    var world = NXT.get('world');
    if (!world) return null;
    
    var nearest = null;
    var minDist = Infinity;
    
    for (var i = 0; i < world.data.buildings.length; i++) {
      var b = world.data.buildings[i];
      if (b.zone !== zone) continue;
      
      var bx = b.x + b.w / 2;
      var by = b.y + b.h / 2;
      var d = NXT.utils.distance(citizen.x, citizen.y, bx, by);
      
      if (d < minDist) {
        minDist = d;
        nearest = { x: bx, y: by };
      }
    }
    
    return nearest;
  },
  
  /* ═══════════════════════════════════════════════
     GET CURRENT TASK NAME (Bengali)
     ═══════════════════════════════════════════════ */
  getTaskNameBn: function(task) {
    var names = {
      wake_up: 'ঘুম থেকে উঠা',
      breakfast: 'সকালের নাস্তা',
      lunch: 'দুপুরের খাবার',
      dinner: 'রাতের খাবার',
      eat: 'খাওয়া',
      school: 'স্কুল',
      work: 'কাজ',
      study: 'পড়াশোনা',
      commute: 'যাতায়াত',
      play: 'খেলা',
      socialize: 'আড্ডা',
      recreation: 'বিনোদন',
      family_time: 'পরিবারের সময়',
      morning_walk: 'সকালের হাঁটা',
      rest: 'বিশ্রাম',
      relax: 'আরাম',
      sleep: 'ঘুম',
      sleep_in: 'দেরিতে ঘুম',
      wander: 'ঘোরা',
      idle: 'অলস'
    };
    return names[task] || task;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    // Rendering in future part
  }
});

console.log('%c📅 Schedule module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
