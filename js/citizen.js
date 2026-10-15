/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Citizen Module
   Author: AL-AMIN
   Part 10/22
   ═══════════════════════════════════════════════════════ */

'use strict';

NXT.register('citizen', {
  
  /* ═══════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════ */
  config: {
    startingPopulation: 50,
    maxPopulation: 500,
    
    walkSpeed: 1.2,
    runSpeed: 2.4,
    slowSpeed: 0.7,
    
    detectionRadius: 3,
    socialChance: 0.05,
    
    growthRate: 0.02,
    birthChance: 0.001,
    deathCheckChance: 0.0005
  },
  
  /* ═══════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════ */
  data: {
    citizens: [],
    families: [],
    
    nextId: 1,
    totalBorn: 0,
    totalDied: 0
  },
  
  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */
  init: function() {
    NXT.log('citizen', '👥 Initializing citizens...');
    
    var world = NXT.get('world');
    var buildings = NXT.get('buildings');
    
    if (!world || !world.data.buildings.length) {
      NXT.warn('citizen', 'World not ready');
      return;
    }
    
    var startTime = performance.now();
    
    // Spawn initial population
    this.spawnInitialPopulation();
    
    // Create families
    this.createFamilies();
    
    // Assign homes and jobs
    this.assignHomesAndJobs();
    
    var elapsed = (performance.now() - startTime).toFixed(0);
    NXT.log('citizen', '✅ Citizens generated: ' + this.data.citizens.length + ' in ' + elapsed + 'ms');
    
    // Update UI
    var popEl = document.getElementById('topPop');
    if (popEl) popEl.textContent = this.data.citizens.length;
    
    NXT.emit('citizen:ready');
  },
  
  /* ═══════════════════════════════════════════════
     SPAWN INITIAL POPULATION
     ═══════════════════════════════════════════════ */
  spawnInitialPopulation: function() {
    var count = this.config.startingPopulation;
    
    for (var i = 0; i < count; i++) {
      var citizen = this.createCitizen();
      if (citizen) {
        this.data.citizens.push(citizen);
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     CREATE CITIZEN
     ═══════════════════════════════════════════════ */
  createCitizen: function(options) {
    options = options || {};
    
    var world = NXT.get('world');
    var terrain = NXT.get('terrain');
    
    // Find spawn location
    var spawnX, spawnY;
    if (options.x !== undefined && options.y !== undefined) {
      spawnX = options.x;
      spawnY = options.y;
    } else {
      var found = false;
      var attempts = 0;
      while (!found && attempts < 50) {
        spawnX = NXT.utils.randomInt(20, world.data.width - 20);
        spawnY = NXT.utils.randomInt(20, world.data.height - 20);
        if (terrain.isLand(spawnX, spawnY)) {
          found = true;
        }
        attempts++;
      }
      if (!found) return null;
    }
    
    // Gender
    var gender = options.gender || (Math.random() > 0.5 ? 'male' : 'female');
    
    // Name
    var firstName = gender === 'male' 
      ? NXT.utils.randomChoice(NAMES.male)
      : NXT.utils.randomChoice(NAMES.female);
    var lastName = NXT.utils.randomChoice(NAMES.last);
    var fullName = firstName + ' ' + lastName;
    
    // Age
    var age = options.age !== undefined ? options.age : NXT.utils.randomInt(18, 60);
    
    // Personality
    var personality = options.personality || NXT.utils.randomChoice(PERSONALITIES);
    
    // Appearance
    var bodyColor = options.bodyColor || NXT.utils.randomChoice([
      '#f4d5b3', '#e0a87a', '#c68a5c', '#8b5a3c',
      '#5c3a1a', '#3a2510', '#d4a373', '#a67c52'
    ]);
    
    var shirtColor = options.shirtColor || NXT.utils.randomChoice([
      '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
      '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6',
      '#f97316', '#a855f7', '#64748b', '#dc2626'
    ]);
    
    var pantsColor = options.pantsColor || NXT.utils.randomChoice([
      '#1e293b', '#0f172a', '#334155', '#374151',
      '#1e40af', '#7c2d12', '#166534'
    ]);
    
    // Create citizen object
    var citizen = {
      id: 'c_' + (this.data.nextId++),
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      age: age,
      birthday: options.birthday || Date.now(),
      
      // Position
      gx: spawnX,
      gy: spawnY,
      x: spawnX * world.data.tileSize + world.data.tileSize / 2,
      y: spawnY * world.data.tileSize + world.data.tileSize / 2,
      
      // Movement
      vx: 0,
      vy: 0,
      targetX: spawnX,
      targetY: spawnY,
      speed: this.config.walkSpeed,
      direction: 'down',
      facingAngle: 0,
      
      // Appearance
      bodyColor: bodyColor,
      shirtColor: shirtColor,
      pantsColor: pantsColor,
      hairColor: NXT.utils.randomChoice(['#1a1a1a', '#3a2510', '#5c3a1a', '#8b4513']),
      height: NXT.utils.random(14, 18),
      
      // Personal
      personality: personality,
      mood: 'neutral',
      happiness: 70,
      energy: 100,
      health: 100,
      
      // Social
      familyId: options.familyId || null,
      fatherId: options.fatherId || null,
      motherId: options.motherId || null,
      spouseId: options.spouseId || null,
      childrenIds: options.childrenIds || [],
      friends: [],
      
      // Home & Work
      homeId: null,
      workId: null,
      job: null,
      salary: 0,
      money: NXT.utils.randomInt(100, 1000),
      
      // Schedule
      state: 'idle',
      target: null,
      currentTask: 'waiting',
      schedule: this.generateSchedule(age),
      
      // Stats
      bornAt: Date.now(),
      energyTimer: 0,
      
      // Rendering
      walkFrame: 0,
      walkTimer: 0,
      idleTime: 0
    };
    
    this.data.totalBorn++;
    
    return citizen;
  },
  
  /* ═══════════════════════════════════════════════
     GENERATE SCHEDULE
     ═══════════════════════════════════════════════ */
  generateSchedule: function(age) {
    if (age < 6) return 'child';
    if (age < 18) return 'student';
    if (age < 65) return 'worker';
    return 'retired';
  },
  
  /* ═══════════════════════════════════════════════
     CREATE FAMILIES
     ═══════════════════════════════════════════════ */
  createFamilies: function() {
    var citizens = this.data.citizens;
    var used = {};
    
    // Pair up males and females
    var males = citizens.filter(function(c) { return c.gender === 'male' && c.age >= 22 && c.age <= 45; });
    var females = citizens.filter(function(c) { return c.gender === 'female' && c.age >= 20 && c.age <= 40; });
    
    var couples = Math.min(males.length, females.length);
    couples = Math.min(couples, 15);
    
    for (var i = 0; i < couples; i++) {
      var husband = males[i];
      var wife = females[i];
      
      if (used[husband.id] || used[wifi.id]) continue;
      
      var familyId = 'f_' + (i + 1);
      
      husband.spouseId = wife.id;
      wife.spouseId = husband.id;
      husband.familyId = familyId;
      wife.familyId = familyId;
      
      used[husband.id] = true;
      used[wifi.id] = true;
      
      this.data.families.push({
        id: familyId,
        husbandId: husband.id,
        wifeId: wife.id,
        childrenIds: [],
        homeId: null,
        createdAt: Date.now()
      });
    }
    
    NXT.log('citizen', '👨‍👩‍👧 Families created: ' + this.data.families.length);
  },
  
  /* ═══════════════════════════════════════════════
     ASSIGN HOMES AND JOBS
     ═══════════════════════════════════════════════ */
  assignHomesAndJobs: function() {
    var world = NXT.get('world');
    var buildings = world.data.buildings;
    
    // Get residential buildings
    var homes = buildings.filter(function(b) {
      return b.zone === 'residential';
    });
    
    var workplaces = buildings.filter(function(b) {
      return b.jobs > 0;
    });
    
    // Assign homes
    var homeIndex = 0;
    for (var i = 0; i < this.data.citizens.length; i++) {
      var c = this.data.citizens[i];
      
      if (homes.length === 0) break;
      
      // Prefer family home
      if (c.spouseId) {
        var spouse = this.getCitizen(c.spouseId);
        if (spouse && spouse.homeId) {
          c.homeId = spouse.homeId;
          continue;
        }
      }
      
      var home = homes[homeIndex % homes.length];
      c.homeId = home.id;
      
      if (home.residents.length < (home.capacity || 4)) {
        home.residents.push(c.id);
      }
      
      homeIndex++;
    }
    
    // Assign jobs
    var workIndex = 0;
    for (var j = 0; j < this.data.citizens.length; j++) {
      var ct = this.data.citizens[j];
      
      if (ct.age < 18 || ct.age > 65) continue;
      if (workplaces.length === 0) break;
      
      var workplace = workplaces[workIndex % workplaces.length];
      
      if (workplace.workers.length < workplace.jobs) {
        ct.workId = workplace.id;
        
        // Assign job from config
        var possibleJobs = JOB_TYPES.filter(function(j2) {
          return !j2.workplace || j2.workplace === workplace.type || j2.workplace === workplace.zone;
        });
        
        if (possibleJobs.length > 0) {
          var job = NXT.utils.randomChoice(possibleJobs);
          ct.job = job.title;
          ct.salary = job.salary;
        }
        
        workplace.workers.push(ct.id);
        workIndex++;
      }
    }
    
    NXT.log('citizen', '🏠 Homes assigned: ' + homes.length);
    NXT.log('citizen', '💼 Jobs assigned: ' + workplaces.length);
  },
  
  /* ═══════════════════════════════════════════════
     GET CITIZEN
     ═══════════════════════════════════════════════ */
  getCitizen: function(id) {
    for (var i = 0; i < this.data.citizens.length; i++) {
      if (this.data.citizens[i].id === id) return this.data.citizens[i];
    }
    return null;
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════ */
  update: function(dt) {
    // Update each citizen
    for (var i = 0; i < this.data.citizens.length; i++) {
      this.updateCitizen(this.data.citizens[i], dt);
    }
    
    // Population growth/decline
    this.updatePopulation(dt);
  },
  
  /* ═══════════════════════════════════════════════
     UPDATE CITIZEN
     ═══════════════════════════════════════════════ */
  updateCitizen: function(c, dt) {
    // Age
    c.age += dt * 0.001;
    
    // Walk animation
    if (c.state === 'walking') {
      c.walkTimer += dt;
      if (c.walkTimer > 0.15) {
        c.walkTimer = 0;
        c.walkFrame = (c.walkFrame + 1) % 4;
      }
    } else {
      c.idleTime += dt;
    }
    
    // Simple movement toward target
    if (c.state === 'walking' && c.target) {
      var dx = c.target.x - c.x;
      var dy = c.target.y - c.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        c.state = 'idle';
        c.target = null;
        c.idleTime = 0;
      } else {
        var speed = c.speed * dt * 60;
        c.x += (dx / dist) * speed;
        c.y += (dy / dist) * speed;
        c.facingAngle = Math.atan2(dy, dx);
        
        if (Math.abs(dx) > Math.abs(dy)) {
          c.direction = dx > 0 ? 'right' : 'left';
        } else {
          c.direction = dy > 0 ? 'down' : 'up';
        }
      }
    }
    
    // Auto-action when idle
    if (c.state === 'idle' && c.idleTime > 3) {
      this.giveRandomTask(c);
      c.idleTime = 0;
    }
  },
  
  /* ═══════════════════════════════════════════════
     GIVE RANDOM TASK
     ═══════════════════════════════════════════════ */
  giveRandomTask: function(c) {
    var world = NXT.get('world');
    var tx, ty;
    
    var rand = Math.random();
    
    if (rand < 0.3 && c.homeId) {
      // Go home
      var home = this.getBuildingById(c.homeId);
      if (home) {
        tx = home.x + NXT.utils.random(0, home.w);
        ty = home.y + NXT.utils.random(0, home.h);
      }
    } else if (rand < 0.6 && c.workId) {
      // Go to work
      var work = this.getBuildingById(c.workId);
      if (work) {
        tx = work.x + NXT.utils.random(0, work.w);
        ty = work.y + NXT.utils.random(0, work.h);
      }
    }
    
    // Random walk
    if (tx === undefined) {
      tx = c.x + NXT.utils.random(-200, 200);
      ty = c.y + NXT.utils.random(-200, 200);
      
      // Clamp to world
      tx = NXT.utils.clamp(tx, 40, world.data.width * world.data.tileSize - 40);
      ty = NXT.utils.clamp(ty, 40, world.data.height * world.data.tileSize - 40);
    }
    
    c.target = { x: tx, y: ty };
    c.state = 'walking';
  },
  
  /* ═══════════════════════════════════════════════
     GET BUILDING BY ID
     ═══════════════════════════════════════════════ */
  getBuildingById: function(id) {
    var world = NXT.get('world');
    for (var i = 0; i < world.data.buildings.length; i++) {
      if (world.data.buildings[i].id === id) return world.data.buildings[i];
    }
    return null;
  },
  
  /* ═══════════════════════════════════════════════
     POPULATION UPDATE
     ═══════════════════════════════════════════════ */
  updatePopulation: function(dt) {
    // Births
    if (Math.random() < this.config.birthChance * dt * this.data.citizens.length) {
      if (this.data.citizens.length < this.config.maxPopulation) {
        this.birthEvent();
      }
    }
    
    // Deaths (old age)
    for (var i = this.data.citizens.length - 1; i >= 0; i--) {
      var c = this.data.citizens[i];
      if (c.age > 80 && Math.random() < 0.0001 * dt * 60) {
        this.deathEvent(c);
      }
    }
  },
  
  /* ═══════════════════════════════════════════════
     BIRTH
     ═══════════════════════════════════════════════ */
  birthEvent: function() {
    // Find a couple
    var couples = this.data.citizens.filter(function(c) {
      return c.spouseId && c.age >= 20 && c.age <= 45 && c.gender === 'female';
    });
    
    if (couples.length === 0) return;
    
    var mother = NXT.utils.randomChoice(couples);
    var father = this.getCitizen(mother.spouseId);
    if (!father) return;
    
    // Create child
    var child = this.createCitizen({
      age: 0,
      x: Math.floor(mother.x / NXT.get('world').data.tileSize),
      y: Math.floor(mother.y / NXT.get('world').data.tileSize),
      gender: Math.random() > 0.5 ? 'male' : 'female',
      fatherId: father.id,
      motherId: mother.id,
      familyId: mother.familyId
    });
    
    if (child) {
      this.data.citizens.push(child);
      
      // Update parents
      mother.childrenIds.push(child.id);
      father.childrenIds.push(child.id);
      
      // Update family
      for (var i = 0; i < this.data.families.length; i++) {
        if (this.data.families[i].id === mother.familyId) {
          this.data.families[i].childrenIds.push(child.id);
          break;
        }
      }
      
      NXT.log('citizen', '👶 New birth: ' + child.name);
      
      NXT.emit('citizen:birth', child);
    }
  },
  
  /* ═══════════════════════════════════════════════
     DEATH
     ═══════════════════════════════════════════════ */
  deathEvent: function(citizen) {
    var idx = this.data.citizens.indexOf(citizen);
    if (idx > -1) {
      this.data.citizens.splice(idx, 1);
      this.data.totalDied++;
      
      NXT.log('citizen', '💀 Death: ' + citizen.name + ' (age ' + Math.floor(citizen.age) + ')');
      
      NXT.emit('citizen:death', citizen);
    }
  },
  
  /* ═══════════════════════════════════════════════
     QUERIES
     ═══════════════════════════════════════════════ */
  getStats: function() {
    var stats = {
      total: this.data.citizens.length,
      males: 0,
      females: 0,
      children: 0,
      adults: 0,
      elders: 0,
      families: this.data.families.length,
      employed: 0,
      unemployed: 0
    };
    
    for (var i = 0; i < this.data.citizens.length; i++) {
      var c = this.data.citizens[i];
      if (c.gender === 'male') stats.males++;
      else stats.females++;
      
      if (c.age < 18) stats.children++;
      else if (c.age < 65) stats.adults++;
      else stats.elders++;
      
      if (c.job && c.job !== 'Student' && c.job !== 'Child' && c.job !== 'Retired') {
        stats.employed++;
      } else if (c.age >= 18 && c.age < 65) {
        stats.unemployed++;
      }
    }
    
    return stats;
  },
  
  /* ═══════════════════════════════════════════════
     RENDER (Placeholder)
     ═══════════════════════════════════════════════ */
  render: function(ctx, dt) {
    // Rendering in Part 12
  }
});

console.log('%c👥 Citizen module registered', 
  'color:#22c55e;font-family:monospace;font-weight:bold');
