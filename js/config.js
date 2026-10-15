/* ═══════════════════════════════════════════════════════
   NXT NATURAL WORLD — Configuration
   Author: AL-AMIN
   Part 3/22
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   MAIN CONFIG
   ═══════════════════════════════════════════════════════ */
var CONFIG = {
  
  /* ─────────────────────────────────────────────
     WORLD
     ───────────────────────────────────────────── */
  world: {
    width: 1500,
    height: 1500,
    tileSize: 24,
    chunkSize: 10,
    
    terrain: {
      grass: 0.55,
      forest: 0.20,
      water: 0.08,
      mountain: 0.10,
      sand: 0.04,
      farmland: 0.03
    },
    
    startTime: {
      hour: 6,
      minute: 0,
      day: 1
    }
  },
  
  /* ─────────────────────────────────────────────
     CITIZENS
     ───────────────────────────────────────────── */
  citizens: {
    startCount: 50,
    maxCount: 5000,
    birthRate: 0.02,
    deathRate: 0.01,
    
    speeds: {
      walk: 1.2,
      run: 2.4,
      slow: 0.7
    },
    
    lifeSpan: {
      min: 60,
      max: 100,
      avg: 78
    }
  },
  
  /* ─────────────────────────────────────────────
     TIME
     ───────────────────────────────────────────── */
  time: {
    mode: 'real',           // real | fast | faster | fastest
    speeds: {
      real: 1,               // 1x — real world time
      fast: 2,               // 2x
      faster: 5,             // 5x
      fastest: 10            // 10x
    },
    
    dayLength: 24,           // 24 hours
    sunriseHour: 6,
    sunsetHour: 18
  },
  
  /* ─────────────────────────────────────────────
     WEATHER
     ───────────────────────────────────────────── */
  weather: {
    mode: 'natural',         // real | natural | sunny | rainy
    current: 'sunny',
    
    types: {
      sunny:    { icon: '☀️', happiness: +5,  chance: 30 },
      cloudy:   { icon: '☁️', happiness: 0,   chance: 25 },
      rainy:    { icon: '🌧️', happiness: -5,  chance: 20 },
      stormy:   { icon: '⛈️', happiness: -15, chance: 10 },
      foggy:    { icon: '🌫️', happiness: -8,  chance: 10 },
      snowy:    { icon: '❄️', happiness: 0,   chance: 5 }
    },
    
    changeInterval: 300      // seconds
  },
  
  /* ─────────────────────────────────────────────
     CAMERA
     ───────────────────────────────────────────── */
  camera: {
    zoom: 1,
    minZoom: 0.5,
    maxZoom: 3,
    smoothness: 0.15,
    followPlayer: true,
    
    shake: {
      enabled: true,
      intensity: 5,
      duration: 10
    }
  },
  
  /* ─────────────────────────────────────────────
     PLAYER
     ───────────────────────────────────────────── */
  player: {
    speed: 3,
    runMultiplier: 1.8,
    crouchMultiplier: 0.5,
    
    startX: 750,
    startY: 750
  },
  
  /* ─────────────────────────────────────────────
     RENDERING
     ───────────────────────────────────────────── */
  render: {
    quality: 'medium',       // low | medium | high | ultra
    
    qualities: {
      low:    { maxCitizens: 100,  particles: false, shadows: false, fps: 30 },
      medium: { maxCitizens: 500,  particles: true,  shadows: false, fps: 45 },
      high:   { maxCitizens: 1500, particles: true,  shadows: true,  fps: 60 },
      ultra:  { maxCitizens: 3000, particles: true,  shadows: true,  fps: 60 }
    },
    
    showGrid: false,
    showNames: false,
    showZones: true,
    showMinimap: true,
    
    colors: {
      grass: '#166534',
      grassDark: '#14532d',
      grassLight: '#22c55e',
      
      water: '#0369a1',
      waterLight: '#0ea5e9',
      
      sand: '#d4a574',
      mountain: '#64748b',
      mountainSnow: '#f1f5f9',
      
      road: '#52525b',
      roadLine: '#f1f5f9',
      
      buildingResidential: '#3b82f6',
      buildingCommercial: '#f59e0b',
      buildingIndustrial: '#6b7280',
      buildingEducation: '#8b5cf6',
      buildingHealthcare: '#ef4444',
      buildingRecreation: '#22c55e',
      
      player: '#00d4ff',
      citizen: '#ffd700',
      citizenHappy: '#22c55e',
      citizenSad: '#ef4444',
      
      tree: '#15803d',
      treeTrunk: '#78350f',
      rock: '#475569',
      flower: '#ec4899'
    }
  },
  
  /* ─────────────────────────────────────────────
     AUDIO
     ───────────────────────────────────────────── */
  audio: {
    enabled: true,
    masterVolume: 0.8,
    ambientVolume: 0.6,
    effectsVolume: 0.8,
    
    sounds: {
      footstep: true,
      birds: true,
      water: true,
      crowd: true,
      rain: true
    }
  },
  
  /* ─────────────────────────────────────────────
     RECORDING
     ───────────────────────────────────────────── */
  recording: {
    enabled: true,
    fps: 30,
    quality: 'high',
    format: 'webm',
    maxDuration: 600,        // 10 minutes
    resolution: {
      width: 1920,
      height: 1080
    }
  },
  
  /* ─────────────────────────────────────────────
     CINEMATIC MODE
     ───────────────────────────────────────────── */
  cinematic: {
    enabled: true,
    autoDetect: true,
    transitionSpeed: 0.5,
    defaultDuration: 10,
    
    shots: {
      wide: true,
      medium: true,
      close: true,
      tracking: true,
      drone: true,
      orbital: true
    },
    
    effects: {
      slowMotion: true,
      depthOfField: false,
      colorGrading: true,
      vignette: true
    }
  },
  
  /* ─────────────────────────────────────────────
     UI
     ───────────────────────────────────────────── */
  ui: {
    theme: 'dark',
    language: 'bn',
    showFPS: false,
    showDebug: false,
    animations: true
  },
  
  /* ─────────────────────────────────────────────
     SAVE SYSTEM
     ───────────────────────────────────────────── */
  save: {
    autoSave: true,
    autoSaveInterval: 60,
    storageKey: 'nxt_natural_world_save',
    maxSaves: 5
  }
};

/* ═══════════════════════════════════════════════════════
   WORLD CONSTANTS
   ═══════════════════════════════════════════════════════ */

/* Tile Types */
var TILE = {
  GRASS: 0,
  GRASS_DARK: 1,
  FOREST: 2,
  WATER: 3,
  WATER_DEEP: 4,
  SAND: 5,
  MOUNTAIN: 6,
  MOUNTAIN_SNOW: 7,
  FARMLAND: 8,
  ROAD: 9,
  ROAD_CROSS: 10,
  PATH: 11
};

/* Building Types */
var BUILDING_TYPES = {
  // Residential
  house_small:    { icon: '🏠', zone: 'residential', w: 1, h: 1, capacity: 4 },
  house_medium:   { icon: '🏡', zone: 'residential', w: 2, h: 1, capacity: 6 },
  house_large:    { icon: '🏘️', zone: 'residential', w: 2, h: 2, capacity: 10 },
  apartment:      { icon: '🏢', zone: 'residential', w: 3, h: 3, capacity: 30 },
  villa:          { icon: '🏰', zone: 'residential', w: 3, h: 2, capacity: 8 },
  
  // Commercial
  shop:           { icon: '🏪', zone: 'commercial', w: 1, h: 1, jobs: 3 },
  market:         { icon: '🏬', zone: 'commercial', w: 2, h: 2, jobs: 10 },
  bank:           { icon: '🏦', zone: 'commercial', w: 2, h: 2, jobs: 15 },
  restaurant:     { icon: '🍽️', zone: 'commercial', w: 2, h: 2, jobs: 8 },
  hotel:          { icon: '🏨', zone: 'commercial', w: 3, h: 3, jobs: 20 },
  
  // Education
  school:         { icon: '🏫', zone: 'education', w: 3, h: 2, jobs: 20, capacity: 200 },
  college:        { icon: '🎓', zone: 'education', w: 4, h: 3, jobs: 40, capacity: 500 },
  library:        { icon: '📚', zone: 'education', w: 2, h: 2, jobs: 8 },
  
  // Healthcare
  hospital:       { icon: '🏥', zone: 'healthcare', w: 4, h: 3, jobs: 60, capacity: 100 },
  clinic:         { icon: '🏨', zone: 'healthcare', w: 2, h: 2, jobs: 12, capacity: 30 },
  pharmacy:       { icon: '💊', zone: 'healthcare', w: 1, h: 1, jobs: 3 },
  
  // Government
  parliament:     { icon: '🏛️', zone: 'government', w: 4, h: 4, jobs: 50 },
  courthouse:     { icon: '⚖️', zone: 'government', w: 3, h: 3, jobs: 25 },
  police:         { icon: '🚔', zone: 'government', w: 2, h: 2, jobs: 15 },
  post_office:    { icon: '📮', zone: 'government', w: 1, h: 1, jobs: 4 },
  
  // Recreation
  park:           { icon: '🌳', zone: 'recreation', w: 3, h: 3 },
  stadium:        { icon: '🏟️', zone: 'recreation', w: 4, h: 4, jobs: 30 },
  cinema:         { icon: '🎬', zone: 'recreation', w: 2, h: 2, jobs: 12 },
  playground:     { icon: '🎠', zone: 'recreation', w: 2, h: 2 },
  garden:         { icon: '🌷', zone: 'recreation', w: 1, h: 1 },
  
  // Religious
  mosque:         { icon: '🕌', zone: 'religion', w: 3, h: 3 },
  temple:         { icon: '🛕', zone: 'religion', w: 3, h: 3 },
  church:         { icon: '⛪', zone: 'religion', w: 3, h: 3 },
  
  // Industrial
  factory:        { icon: '🏭', zone: 'industrial', w: 4, h: 4, jobs: 40 },
  warehouse:      { icon: '📦', zone: 'industrial', w: 3, h: 2, jobs: 15 },
  power_plant:    { icon: '⚡', zone: 'industrial', w: 3, h: 3, jobs: 20 }
};

/* Job Types */
var JOB_TYPES = [
  { title: 'Teacher', icon: '👨‍🏫', salary: 800, workplace: 'school' },
  { title: 'Doctor', icon: '👨‍⚕️', salary: 2500, workplace: 'hospital' },
  { title: 'Nurse', icon: '👩‍⚕️', salary: 1200, workplace: 'hospital' },
  { title: 'Engineer', icon: '👷', salary: 2000, workplace: 'factory' },
  { title: 'Farmer', icon: '👨‍🌾', salary: 600, workplace: 'farmland' },
  { title: 'Shopkeeper', icon: '🛒', salary: 900, workplace: 'shop' },
  { title: 'Driver', icon: '🚕', salary: 700, workplace: 'road' },
  { title: 'Police Officer', icon: '👮', salary: 1400, workplace: 'police' },
  { title: 'Banker', icon: '💰', salary: 2200, workplace: 'bank' },
  { title: 'Chef', icon: '👨‍🍳', salary: 900, workplace: 'restaurant' },
  { title: 'Programmer', icon: '💻', salary: 2400, workplace: 'office' },
  { title: 'Barber', icon: '💈', salary: 600, workplace: 'shop' },
  { title: 'Tailor', icon: '🧵', salary: 550, workplace: 'shop' },
  { title: 'Student', icon: '🎓', salary: 0, workplace: 'school' },
  { title: 'Retired', icon: '👴', salary: 400, workplace: 'home' },
  { title: 'Child', icon: '👶', salary: 0, workplace: 'home' }
];

/* Personalities */
var PERSONALITIES = [
  { id: 'friendly',    name: 'Friendly',    emoji: '😊', traits: { social: 1.2, work: 1.0, happiness: 1.1 } },
  { id: 'hardworking', name: 'Hardworking', emoji: '💪', traits: { social: 0.8, work: 1.4, happiness: 1.0 } },
  { id: 'lazy',        name: 'Lazy',        emoji: '😴', traits: { social: 0.9, work: 0.6, happiness: 1.2 } },
  { id: 'social',      name: 'Social',      emoji: '🎉', traits: { social: 1.5, work: 0.9, happiness: 1.1 } },
  { id: 'shy',         name: 'Shy',         emoji: '😳', traits: { social: 0.5, work: 1.1, happiness: 0.9 } },
  { id: 'ambitious',   name: 'Ambitious',   emoji: '🚀', traits: { social: 1.0, work: 1.3, happiness: 0.95 } },
  { id: 'kind',        name: 'Kind',        emoji: '😇', traits: { social: 1.3, work: 1.0, happiness: 1.15 } },
  { id: 'grumpy',      name: 'Grumpy',      emoji: '😠', traits: { social: 0.7, work: 1.0, happiness: 0.8 } }
];

/* Bengali Names */
var NAMES = {
  male: [
    'Karim', 'Rahim', 'Jamal', 'Kamal', 'Rafiq', 'Shafiq', 'Habib', 'Anis',
    'Ashraf', 'Bashir', 'Rashid', 'Nasir', 'Farid', 'Majid', 'Sajid', 'Wahid',
    'Rahman', 'Ibrahim', 'Yusuf', 'Ismail', 'Harun', 'Maruf', 'Mahmud', 'Masud',
    'Nayan', 'Sujon', 'Robin', 'Nazmul', 'Sabbir', 'Tamim', 'Sakib', 'Rakib',
    'Hasan', 'Hossain', 'Shahin', 'Shamim', 'Selim', 'Salim', 'Rony', 'Shuvo'
  ],
  female: [
    'Fatima', 'Ayesha', 'Khadija', 'Zainab', 'Maryam', 'Sumaiya', 'Nusrat', 'Jannat',
    'Tasnim', 'Sanjida', 'Mim', 'Rima', 'Dipa', 'Mitu', 'Jui', 'Tania',
    'Shorna', 'Lima', 'Nadia', 'Sabina', 'Rehana', 'Rahima', 'Karima', 'Halima',
    'Salma', 'Shilpi', 'Sathi', 'Shathi', 'Mousumi', 'Rupali', 'Popy', 'Lipi',
    'Taslima', 'Nasima', 'Hasina', 'Selina', 'Rabeya', 'Sharmin', 'Nargis', 'Bilkis'
  ],
  last: [
    'Ahmed', 'Khan', 'Islam', 'Hossain', 'Rahman', 'Chowdhury', 'Sheikh', 'Mia',
    'Sarker', 'Mollah', 'Bhuiyan', 'Talukder', 'Howlader', 'Siddique', 'Alam', 'Haider'
  ]
};

/* ═══════════════════════════════════════════════════════
   TIME CONSTANTS
   ═══════════════════════════════════════════════════════ */
var TIME_CONST = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MINUTES_PER_DAY: 1440,
  SECONDS_PER_DAY: 86400,
  
  DAYS: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  DAYS_BN: ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  MONTHS_BN: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
  
  SEASONS: {
    spring: { name: 'Spring', nameBn: 'বসন্ত', months: [2, 3, 4], icon: '🌸' },
    summer: { name: 'Summer', nameBn: 'গ্রীষ্ম', months: [5, 6, 7], icon: '☀️' },
    monsoon: { name: 'Monsoon', nameBn: 'বর্ষা', months: [8, 9, 10], icon: '🌧️' },
    winter: { name: 'Winter', nameBn: 'শীত', months: [11, 0, 1], icon: '❄️' }
  }
};

/* ═══════════════════════════════════════════════════════
   CONSOLE BANNER
   ═══════════════════════════════════════════════════════ */
console.log('%c🌍 NXT NATURAL WORLD', 
  'color:#00d4ff;font-family:monospace;font-size:20px;font-weight:bold;text-shadow:0 0 10px #00d4ff');
console.log('%cConfig loaded successfully', 
  'color:#22c55e;font-family:monospace;font-size:12px');
console.log('%c>> Buildings: ' + Object.keys(BUILDING_TYPES).length, 
  'color:#ffd700;font-family:monospace');
console.log('%c>> Jobs: ' + JOB_TYPES.length, 
  'color:#f59e0b;font-family:monospace');
console.log('%c>> Personalities: ' + PERSONALITIES.length, 
  'color:#8b5cf6;font-family:monospace');
console.log('%c>> Names: ' + (NAMES.male.length + NAMES.female.length) + ' first names', 
  'color:#ec4899;font-family:monospace');

/* ═══════════════════════════════════════════════════════
   END OF CONFIG
   ═══════════════════════════════════════════════════════ */
