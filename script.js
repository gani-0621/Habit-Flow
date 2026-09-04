/**
 * ============================================================================
 * HabitFlow — Modern Daily Habit Tracker, Streak Builder & Rewards Engine
 * Pure Vanilla JavaScript (ES6+)
 * 
 * Modular Architecture:
 * 1. Config & Constants (Sample Habits, Level Tiers, Achievement Badges)
 * 2. Date Utilities (Local Formatting, Past 7 Days, Monthly Matrix)
 * 3. Streak Engine (Consecutive Days, Yesterday Fallback, Longest Streak)
 * 4. Storage Manager (LocalStorage CRUD with v2 auto-cleanup)
 * 5. Gamification & Rewards Engine (XP, Levels, Badges, Floating XP)
 * 6. Motivational Engine (Contextual Encouragements, Status Badges)
 * 7. Confetti Particle System (Pure Canvas Celebration)
 * 8. UI Controller & Event Handlers (Rendering, Modals, Filtering, Calendar, Rewards)
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Configuration & Constants
     ========================================================================== */
  const STORAGE_KEY = 'habit_flow_data_v2';
  const THEME_KEY = 'habit_flow_theme_v1';
  const REWARDS_KEY = 'habit_flow_rewards_v1';

  // In-built default habit (ONLY water habit, as requested)
  const DEFAULT_SAMPLE_HABITS = [
    {
      id: 'habit_water',
      name: 'Drink 2.5L Water',
      emoji: '💧',
      category: 'Health',
      frequency: 'daily',
      color: '#0ea5e9',
      reminderEnabled: true,
      reminderTime: '10:00',
      reminderSound: 'chime',
      lastNotifiedDate: null,
      createdAt: getRelativeDateISO(-7),
      completedDates: generateConsecutiveDates(-3, 0) // 4-day sample streak including today
    }
  ];

  // Player Rank Levels & Progression
  const LEVEL_TIERS = [
    { level: 1, title: 'Novice Scout', emoji: '🌱', minXP: 0, nextXP: 100 },
    { level: 2, title: 'Streak Apprentice', emoji: '⚡', minXP: 100, nextXP: 250 },
    { level: 3, title: 'Routine Builder', emoji: '🔥', minXP: 250, nextXP: 500 },
    { level: 4, title: 'Habit Warrior', emoji: '⚔️', minXP: 500, nextXP: 900 },
    { level: 5, title: 'Consistency Master', emoji: '👑', minXP: 900, nextXP: 1500 },
    { level: 6, title: 'Grandmaster of Flow', emoji: '🏆', minXP: 1500, nextXP: Infinity }
  ];

  // 8 Unique Milestone Achievement Badges
  const ACHIEVEMENTS = [
    {
      id: 'badge_first',
      title: 'First Spark',
      emoji: '🌱',
      desc: 'Complete your very first habit check-in.',
      check: (habits, stats) => stats.totalCompletions >= 1,
      progress: (habits, stats) => ({ current: Math.min(1, stats.totalCompletions), target: 1 })
    },
    {
      id: 'badge_water',
      title: 'Hydration Hero',
      emoji: '💧',
      desc: 'Complete your water habit at least 5 times.',
      check: (habits) => {
        const water = habits.find(h => h.id === 'habit_water' || h.name.toLowerCase().includes('water'));
        return (water?.completedDates?.length || 0) >= 5;
      },
      progress: (habits) => {
        const water = habits.find(h => h.id === 'habit_water' || h.name.toLowerCase().includes('water'));
        const count = water?.completedDates?.length || 0;
        return { current: Math.min(5, count), target: 5 };
      }
    },
    {
      id: 'badge_streak_3',
      title: 'On Fire',
      emoji: '🔥',
      desc: 'Achieve a 3-day active streak on any habit.',
      check: (habits, stats) => stats.maxCurrentStreak >= 3,
      progress: (habits, stats) => ({ current: Math.min(3, stats.maxCurrentStreak), target: 3 })
    },
    {
      id: 'badge_streak_7',
      title: 'Unstoppable Flow',
      emoji: '⚡',
      desc: 'Build an incredible 7-day streak on any habit.',
      check: (habits, stats) => stats.maxCurrentStreak >= 7,
      progress: (habits, stats) => ({ current: Math.min(7, stats.maxCurrentStreak), target: 7 })
    },
    {
      id: 'badge_clean_sweep',
      title: 'Clean Sweep',
      emoji: '🎯',
      desc: 'Complete 100% of all habits in a single day.',
      check: (habits, stats) => stats.hasCleanSweep,
      progress: (habits, stats) => ({ current: stats.todayPercent === 100 && habits.length > 0 ? 1 : 0, target: 1 })
    },
    {
      id: 'badge_creator',
      title: 'Habit Architect',
      emoji: '💎',
      desc: 'Create at least 2 custom habits.',
      check: (habits) => habits.length >= 2,
      progress: (habits) => ({ current: Math.min(2, habits.length), target: 2 })
    },
    {
      id: 'badge_silver',
      title: 'Silver Check-in',
      emoji: '🌟',
      desc: 'Accumulate 15 total lifetime habit check-ins.',
      check: (habits, stats) => stats.totalCompletions >= 15,
      progress: (habits, stats) => ({ current: Math.min(15, stats.totalCompletions), target: 15 })
    },
    {
      id: 'badge_master',
      title: 'Elite Consistency',
      emoji: '👑',
      desc: 'Reach Level 3 in player ranking.',
      check: (habits, stats, level) => level >= 3,
      progress: (habits, stats, level) => ({ current: Math.min(3, level), target: 3 })
    }
  ];

  /* ==========================================================================
     2. Date Utilities
     ========================================================================== */
  
  function formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getTodayKey() {
    return formatDateKey(new Date());
  }

  function getRelativeDateISO(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatDateKey(d);
  }

  function generateConsecutiveDates(startOffset, endOffset) {
    const dates = [];
    for (let i = startOffset; i <= endOffset; i++) {
      dates.push(getRelativeDateISO(i));
    }
    return dates;
  }

  function formatHeaderDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  function formatMonthYear(year, monthIndex) {
    const d = new Date(year, monthIndex, 1);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(d);
  }

  function getPast7Days() {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateKey: formatDateKey(d),
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
        rawDate: d
      });
    }
    return days;
  }

  function getMonthMatrix(year, monthIndex) {
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isEmpty: true });
    }

    const todayKey = getTodayKey();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const cellDate = new Date(year, monthIndex, day);
      cellDate.setHours(0, 0, 0, 0);
      const dateKey = formatDateKey(cellDate);
      const isFuture = cellDate.getTime() > today.getTime();
      const isToday = dateKey === todayKey;

      cells.push({
        isEmpty: false,
        dayNumber: day,
        dateKey: dateKey,
        isFuture: isFuture,
        isToday: isToday
      });
    }

    return cells;
  }

  /* ==========================================================================
     3. Sound Synthesis Engine (Web Audio API)
     Zero external asset dependencies — plays instantly offline & across browsers
     ========================================================================== */
  const SoundEngine = {
    audioCtx: null,
    isUnlocked: false,

    SOUND_PROFILES: {
      chime: { label: 'Crystal Chime', emoji: '🔔' },
      zen: { label: 'Zen Singing Bowl', emoji: '🧘' },
      ping: { label: 'Digital Alert Ping', emoji: '⚡' },
      marimba: { label: 'Acoustic Marimba', emoji: '🎵' },
      sparkle: { label: 'Sparkle Flourish', emoji: '✨' },
      breeze: { label: 'Gentle Breeze', emoji: '🕊️' },
      bell: { label: 'Classic Alarm Bell', emoji: '⏰' }
    },

    getSoundInfo(soundKey) {
      return this.SOUND_PROFILES[soundKey] || this.SOUND_PROFILES.chime;
    },

    alarmIntervalId: null,
    alarmTimeoutId: null,
    countdownIntervalId: null,
    isAlarmRunning: false,

    startAlarm(soundKey = 'chime', durationMs = 60000, onTick = null, onEnd = null) {
      this.stopAlarm();
      this.isAlarmRunning = true;

      // Natural repeat intervals per sound profile
      const repeatDelays = {
        chime: 2400,
        zen: 3000,
        ping: 1800,
        marimba: 2200,
        sparkle: 2400,
        breeze: 2600,
        bell: 1800
      };
      const repeatMs = repeatDelays[soundKey] || 2400;

      // Play immediate first chime/melody
      this.play(soundKey);

      // Repeat loop every repeatMs
      this.alarmIntervalId = setInterval(() => {
        if (!this.isAlarmRunning) return;
        this.play(soundKey);
      }, repeatMs);

      // 1-second countdown ticker for UI
      let remainingSec = Math.round(durationMs / 1000);
      if (onTick) onTick(remainingSec);

      this.countdownIntervalId = setInterval(() => {
        remainingSec--;
        if (remainingSec < 0) remainingSec = 0;
        if (onTick) onTick(remainingSec);
        if (remainingSec <= 0) {
          clearInterval(this.countdownIntervalId);
          this.countdownIntervalId = null;
        }
      }, 1000);

      // Automatically stop after durationMs (1 minute)
      this.alarmTimeoutId = setTimeout(() => {
        this.stopAlarm();
        if (onEnd) onEnd();
      }, durationMs);
    },

    stopAlarm() {
      this.isAlarmRunning = false;
      if (this.alarmIntervalId) {
        clearInterval(this.alarmIntervalId);
        this.alarmIntervalId = null;
      }
      if (this.countdownIntervalId) {
        clearInterval(this.countdownIntervalId);
        this.countdownIntervalId = null;
      }
      if (this.alarmTimeoutId) {
        clearTimeout(this.alarmTimeoutId);
        this.alarmTimeoutId = null;
      }
    },

    init() {
      if (this.isUnlocked && this.audioCtx) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        this.isUnlocked = true;
      } catch (e) {
        console.warn('Web Audio API not supported or blocked:', e);
      }
    },

    play(soundKey = 'chime') {
      this.init();
      if (!this.audioCtx) return;

      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      switch (soundKey) {
        case 'zen':
          this.playZenBowl(ctx, now);
          break;
        case 'ping':
          this.playDigitalPing(ctx, now);
          break;
        case 'marimba':
          this.playMarimba(ctx, now);
          break;
        case 'sparkle':
          this.playSparkle(ctx, now);
          break;
        case 'breeze':
          this.playBreeze(ctx, now);
          break;
        case 'bell':
          this.playClassicBell(ctx, now);
          break;
        case 'chime':
        default:
          this.playCrystalChime(ctx, now);
          break;
      }
    },

    // 1. Crystal Chime: High shimmery harmonic bell chime
    playCrystalChime(ctx, now) {
      const freqs = [880, 1760, 2640];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.28 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 - (idx * 0.2));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.7);
      });
    },

    // 2. Zen Bowl: Deep resonant meditative gong (432Hz fundamental)
    playZenBowl(ctx, now) {
      const freqs = [432, 864, 1296];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const vol = idx === 0 ? 0.35 : 0.12;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
      });
    },

    // 3. Digital Ping: Modern high-tech double electronic chirp
    playDigitalPing(ctx, now) {
      [0, 0.14].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startFreq = idx === 0 ? 587.33 : 880;
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.3, now + offset + 0.12);

        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
    },

    // 4. Acoustic Marimba: 4-note ascending wooden chord (C5, E5, G5, C6)
    playMarimba(ctx, now) {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const noteStart = now + (idx * 0.09);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.32, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.6);
      });
    },

    // 5. Sparkle Flourish: Fast upward magical harp sparkle
    playSparkle(ctx, now) {
      const notes = [783.99, 987.77, 1174.66, 1567.98, 2093.00];
      notes.forEach((freq, idx) => {
        const noteStart = now + (idx * 0.06);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.24, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.75);
      });
    },

    // 6. Gentle Breeze: Soft ambient calming dual chime
    playBreeze(ctx, now) {
      [659.25, 987.77].forEach((freq, idx) => {
        const noteStart = now + (idx * 0.12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.0005, noteStart + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 2.1);
      });
    },

    // 7. Classic Alarm Bell: Crisp attention pulsed ring
    playClassicBell(ctx, now) {
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now + offset);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now + offset);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    }
  };

  /* ==========================================================================
     4. Streak Engine & Analytics
     ========================================================================== */
  const StreakEngine = {
    calculateCurrentStreak(habit) {
      if (!habit.completedDates || habit.completedDates.length === 0) return 0;

      const dateSet = new Set(habit.completedDates);
      const todayKey = getTodayKey();
      
      let streak = 0;
      let checkDate = new Date();

      if (dateSet.has(todayKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayKey = formatDateKey(checkDate);
        if (!dateSet.has(yesterdayKey)) {
          return 0;
        }
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const prevKey = formatDateKey(checkDate);
        if (dateSet.has(prevKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    },

    calculateLongestStreak(habit) {
      if (!habit.completedDates || habit.completedDates.length === 0) return 0;

      const sortedDates = Array.from(new Set(habit.completedDates)).sort();
      let maxStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);

        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }

      const currentActive = this.calculateCurrentStreak(habit);
      return Math.max(maxStreak, currentActive);
    },

    calculateCompletionRate(habit) {
      if (!habit.completedDates || habit.completedDates.length === 0) return 0;
      
      const created = new Date(habit.createdAt || getTodayKey());
      const now = new Date();
      const diffDays = Math.max(1, Math.round((now - created) / (1000 * 60 * 60 * 24)) + 1);

      return Math.min(100, Math.round((habit.completedDates.length / diffDays) * 100));
    },

    getConsistencyBadge(rate, streak) {
      if (streak >= 7 || rate >= 85) {
        return { text: '🔥 Unstoppable', className: 'badge-unstoppable' };
      } else if (streak >= 3 || rate >= 60) {
        return { text: '⭐ Consistent', className: 'badge-consistent' };
      } else if (streak >= 1 || rate >= 30) {
        return { text: '🌱 Building', className: 'badge-building' };
      }
      return { text: '🚀 Getting Started', className: 'badge-starting' };
    }
  };

  /* ==========================================================================
     4. Storage Manager (LocalStorage)
     ========================================================================== */
  const StorageManager = {
    getHabits() {
      try {
        if (localStorage.getItem('habit_flow_data_v1')) {
          localStorage.removeItem('habit_flow_data_v1');
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          this.saveHabits(DEFAULT_SAMPLE_HABITS);
          return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_HABITS));
        }
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to load habits:', err);
        return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_HABITS));
      }
    },

    saveHabits(habits) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      } catch (err) {
        console.error('Failed to save habits:', err);
      }
    },

    getTheme() {
      return localStorage.getItem(THEME_KEY) || 'light';
    },

    saveTheme(theme) {
      localStorage.setItem(THEME_KEY, theme);
    },

    getRewards() {
      try {
        const raw = localStorage.getItem(REWARDS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load rewards:', e);
      }
      return null;
    },

    saveRewards(rewards) {
      try {
        localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
      } catch (e) {
        console.error('Failed to save rewards:', e);
      }
    },

    resetToDemo() {
      this.saveHabits(DEFAULT_SAMPLE_HABITS);
      return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_HABITS));
    },

    clearAll() {
      this.saveHabits([]);
      return [];
    }
  };

  /* ==========================================================================
     5. Gamification & Rewards Engine
     ========================================================================== */
  const RewardsManager = {
    xp: 0,
    level: 1,
    unlockedBadges: {}, // { badgeId: unlockedDateISO }

    init(habits) {
      const saved = StorageManager.getRewards();
      if (saved && typeof saved.xp === 'number') {
        this.xp = saved.xp;
        this.level = this.calculateLevel(this.xp).level;
        this.unlockedBadges = saved.unlockedBadges || {};
      } else {
        this.recalculateInitialXP(habits);
      }
      this.checkBadges(habits, false);
    },

    recalculateInitialXP(habits) {
      let initialXP = 0;
      habits.forEach(h => {
        initialXP += (h.completedDates || []).length * 20;
        const streak = StreakEngine.calculateCurrentStreak(h);
        initialXP += streak * 5;
      });
      this.xp = Math.max(0, initialXP);
      this.level = this.calculateLevel(this.xp).level;
      this.unlockedBadges = {};
      this.save();
    },

    save() {
      StorageManager.saveRewards({
        xp: this.xp,
        level: this.level,
        unlockedBadges: this.unlockedBadges
      });
    },

    calculateLevel(xp) {
      for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_TIERS[i].minXP) {
          const tier = LEVEL_TIERS[i];
          const range = tier.nextXP === Infinity ? 1000 : (tier.nextXP - tier.minXP);
          const currentInRange = xp - tier.minXP;
          const progressPercent = tier.nextXP === Infinity ? 100 : Math.min(100, Math.round((currentInRange / range) * 100));
          return { ...tier, progressPercent, currentInRange, range };
        }
      }
      return { ...LEVEL_TIERS[0], progressPercent: 0, currentInRange: 0, range: 100 };
    },

    awardXP(amount, reason, originElement = null) {
      const previousLevel = this.level;
      this.xp += amount;
      const levelInfo = this.calculateLevel(this.xp);
      this.level = levelInfo.level;
      this.save();

      if (originElement) {
        this.spawnFloatingXP(amount, originElement);
      }

      if (this.level > previousLevel) {
        this.triggerLevelUpModal(levelInfo);
      }

      return amount;
    },

    deductXP(amount) {
      this.xp = Math.max(0, this.xp - amount);
      this.level = this.calculateLevel(this.xp).level;
      this.save();
    },

    spawnFloatingXP(amount, element) {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.className = 'floating-xp-tag';
      tag.textContent = `+${amount} XP`;
      tag.style.left = `${rect.left + rect.width / 2}px`;
      tag.style.top = `${rect.top}px`;
      document.body.appendChild(tag);

      setTimeout(() => tag.remove(), 1200);
    },

    triggerLevelUpModal(levelInfo) {
      ConfettiEngine.shoot();
      const modal = document.getElementById('levelup-modal');
      if (!modal) return;

      document.getElementById('levelup-modal-emoji').textContent = levelInfo.emoji;
      document.getElementById('levelup-modal-level').textContent = `Level ${levelInfo.level}`;
      document.getElementById('levelup-modal-title').textContent = `${levelInfo.title} ${levelInfo.emoji}`;
      modal.classList.remove('hidden');

      const closeBtn = document.getElementById('btn-close-levelup');
      const handleClose = () => {
        modal.classList.add('hidden');
        closeBtn.removeEventListener('click', handleClose);
      };
      closeBtn.addEventListener('click', handleClose);
    },

    checkBadges(habits, notify = true) {
      const todayKey = getTodayKey();
      let totalCompletions = 0;
      let maxCurrentStreak = 0;
      let completedToday = 0;

      habits.forEach(h => {
        totalCompletions += (h.completedDates || []).length;
        const s = StreakEngine.calculateCurrentStreak(h);
        if (s > maxCurrentStreak) maxCurrentStreak = s;
        if (h.completedDates?.includes(todayKey)) completedToday++;
      });

      const todayPercent = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
      const hasCleanSweep = todayPercent === 100 && habits.length > 0;

      const stats = {
        totalCompletions,
        maxCurrentStreak,
        todayPercent,
        hasCleanSweep
      };

      ACHIEVEMENTS.forEach(ach => {
        if (!this.unlockedBadges[ach.id]) {
          if (ach.check(habits, stats, this.level)) {
            this.unlockedBadges[ach.id] = new Date().toISOString();
            this.save();
            if (notify) {
              ConfettiEngine.shoot();
              App.showToast(`🏆 Badge Unlocked: ${ach.emoji} ${ach.title}! (+50 XP)`);
              this.awardXP(50, 'Achievement Unlocked');
            }
          }
        }
      });
    }
  };

  /* ==========================================================================
     6. Motivational Engine
     ========================================================================== */
  const MotivationalEngine = {
    getGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning, Champion! ☀️';
      if (hour < 18) return 'Good afternoon, Achiever! ⚡';
      return 'Good evening, Hero! ✨';
    },

    getMotivation(percentage, completedCount, totalCount, bestStreak) {
      if (totalCount === 0) {
        return {
          badge: '🌱 New Beginning',
          text: 'Add your first daily habit to start building life-changing streaks!'
        };
      }

      if (percentage === 100) {
        return {
          badge: '🎉 100% Completed!',
          text: `Incredible work! You crushed all ${totalCount} habits today. Keep this fire burning!`
        };
      }

      if (percentage >= 75) {
        return {
          badge: `🔥 ${percentage}% Done!`,
          text: `Almost at the finish line! Only ${totalCount - completedCount} more habit to go today.`
        };
      }

      if (percentage >= 50) {
        return {
          badge: '⚡ Halfway There!',
          text: `Great momentum! You've already conquered ${completedCount} of ${totalCount} habits.`
        };
      }

      if (percentage > 0) {
        return {
          badge: '💪 Strong Start',
          text: `You've checked off your first habit today. Keep going, consistency is key!`
        };
      }

      if (bestStreak >= 5) {
        return {
          badge: `🔥 ${bestStreak}-Day Streak Record`,
          text: `Protect your hard-earned streak! Complete your daily habits today.`
        };
      }

      return {
        badge: '🎯 Today is the Day',
        text: `Small daily wins lead to massive results. Check off your first habit!`
      };
    }
  };

  /* ==========================================================================
     7. Pure Canvas Confetti Particle System
     ========================================================================== */
  const ConfettiEngine = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      this.canvas = document.getElementById('confetti-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    shoot() {
      if (!this.canvas || !this.ctx) return;
      this.resize();
      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6'];

      for (let i = 0; i < 120; i++) {
        this.particles.push({
          x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 200,
          y: window.innerHeight * 0.4,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 1.5) * 16,
          size: Math.random() * 8 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          alpha: 1,
          gravity: 0.35,
          drag: 0.98
        });
      }

      if (!this.animationId) {
        this.render();
      }
    },

    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.render());
      } else {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  /* ==========================================================================
     8. Reminder & Notification Engine
     Clock scheduler, customizable per-habit audio alerts, snooze queue, system notifications
     ========================================================================== */
  const ReminderEngine = {
    timerId: null,
    snoozeQueue: {}, // { [habitId]: timestampMs }
    activeHabit: null,
    isChecking: false,

    init() {
      this.updatePermissionUI();
      this.bindModalEvents();
      this.bindHeaderNotifBtn();

      // Check every 5 seconds for timely clock matching
      if (this.timerId) clearInterval(this.timerId);
      this.timerId = setInterval(() => this.checkSchedules(), 5000);
      this.checkSchedules();
    },

    bindHeaderNotifBtn() {
      const btn = document.getElementById('notif-perm-btn');
      btn?.addEventListener('click', async () => {
        SoundEngine.init();

        if (!('Notification' in window)) {
          App.showToast('🔊 In-app sound alerts are active!');
          return;
        }

        if (Notification.permission === 'default') {
          try {
            const perm = await Notification.requestPermission();
            this.updatePermissionUI();
            if (perm === 'granted') {
              App.showToast('🔔 Desktop notifications & sound alerts enabled!');
            } else {
              App.showToast('ℹ️ In-app audio alerts will remain active.');
            }
          } catch (err) {
            console.warn('Error requesting notification permission:', err);
          }
        } else if (Notification.permission === 'granted') {
          App.showToast('✅ Desktop notifications and sound are active!');
        } else {
          App.showToast('⚠️ Desktop notifications are blocked in browser settings. In-app alerts remain active.');
        }
      });
    },

    updatePermissionUI() {
      const statusText = document.getElementById('notif-status-text');
      const dot = document.getElementById('notif-status-dot');
      if (!statusText || !dot) return;

      if (!('Notification' in window)) {
        statusText.textContent = 'Audio Alerts';
        dot.className = 'notif-status-dot active';
        return;
      }

      if (Notification.permission === 'granted') {
        statusText.textContent = 'Reminders Active';
        dot.className = 'notif-status-dot active';
      } else if (Notification.permission === 'denied') {
        statusText.textContent = 'In-App Only';
        dot.className = 'notif-status-dot blocked';
      } else {
        statusText.textContent = 'Enable Alerts';
        dot.className = 'notif-status-dot';
      }
    },

    bindModalEvents() {
      const modal = document.getElementById('reminder-modal');
      const doneBtn = document.getElementById('btn-reminder-done');
      const snoozeBtn = document.getElementById('btn-reminder-snooze');
      const dismissBtn = document.getElementById('btn-reminder-dismiss');
      const muteBtn = document.getElementById('btn-reminder-mute');

      doneBtn?.addEventListener('click', () => this.completeActiveHabit());
      snoozeBtn?.addEventListener('click', () => this.snoozeActiveHabit(5));
      dismissBtn?.addEventListener('click', () => this.closeReminderModal());

      muteBtn?.addEventListener('click', () => {
        SoundEngine.stopAlarm();
        if (muteBtn) {
          muteBtn.textContent = '🔇 Sound Muted';
          muteBtn.classList.add('muted');
        }
        const statusText = document.getElementById('ringing-status-text');
        if (statusText) statusText.textContent = 'Sound stopped';
      });

      modal?.addEventListener('click', (e) => {
        if (e.target === modal) this.closeReminderModal();
      });
    },

    checkSchedules() {
      if (this.isChecking) return;
      this.isChecking = true;

      try {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentClockTime = `${hours}:${minutes}`;
        const todayKey = getTodayKey();
        const nowMs = Date.now();

        // 1. Process Snoozed Habits first
        Object.keys(this.snoozeQueue).forEach(habitId => {
          if (nowMs >= this.snoozeQueue[habitId]) {
            delete this.snoozeQueue[habitId];
            const habit = App.habits.find(h => h.id === habitId);
            if (habit) {
              const isDone = habit.completedDates?.includes(todayKey);
              if (!isDone) {
                this.triggerReminder(habit, true);
              }
            }
          }
        });

        // 2. Process Scheduled Habits
        if (Array.isArray(App.habits)) {
          App.habits.forEach(habit => {
            if (!habit.reminderEnabled || !habit.reminderTime) return;

            if (habit.reminderTime === currentClockTime) {
              // Trigger once per day per habit
              if (habit.lastNotifiedDate !== todayKey) {
                const isDone = habit.completedDates?.includes(todayKey);
                if (!isDone) {
                  habit.lastNotifiedDate = todayKey;
                  StorageManager.saveHabits(App.habits);
                  this.triggerReminder(habit, false);
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error during reminder schedule check:', err);
      } finally {
        this.isChecking = false;
      }
    },

    triggerReminder(habit, isSnoozed = false) {
      if (!habit) return;
      this.activeHabit = habit;

      // Start 1-minute (60 seconds) continuous alarm sound loop!
      const soundKey = habit.reminderSound || 'chime';
      const muteBtn = document.getElementById('btn-reminder-mute');
      if (muteBtn) {
        muteBtn.textContent = '🔇 Stop Sound';
        muteBtn.classList.remove('muted');
      }

      SoundEngine.startAlarm(
        soundKey,
        60000, // Runs for 1 full minute (60,000 ms)
        (remainingSec) => {
          const statusText = document.getElementById('ringing-status-text');
          if (statusText) {
            statusText.innerHTML = `Playing for 1 min (<strong id="alarm-seconds-left">${remainingSec}s</strong>)`;
          }
        },
        () => {
          const statusText = document.getElementById('ringing-status-text');
          if (statusText) {
            statusText.textContent = 'Sound finished (1 min)';
          }
          if (muteBtn) {
            muteBtn.textContent = 'Sound Ended';
          }
        }
      );

      // Desktop system notification
      this.sendDesktopNotification(habit, isSnoozed);

      // In-app rich reminder modal
      this.showReminderModal(habit, isSnoozed);
    },

    sendDesktopNotification(habit, isSnoozed = false) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      try {
        const streak = StreakEngine.calculateCurrentStreak(habit);
        const soundInfo = SoundEngine.getSoundInfo(habit.reminderSound || 'chime');
        const title = `${habit.emoji} Habit Reminder: ${habit.name}`;
        const body = isSnoozed
          ? `⏰ Snooze reminder: Time to ${habit.name}! Current streak: 🔥 ${streak} day${streak === 1 ? '' : 's'}.`
          : `⏰ It's ${this.formatTime12h(habit.reminderTime)}! Time for ${habit.name}. Keep your streak alive! (${soundInfo.label})`;

        const notif = new Notification(title, {
          body: body,
          icon: 'assets/favicon.svg',
          tag: `habit-reminder-${habit.id}`,
          renotify: true
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('System notification error:', err);
      }
    },

    showReminderModal(habit, isSnoozed = false) {
      const modal = document.getElementById('reminder-modal');
      const card = document.getElementById('reminder-card-container');
      if (!modal || !card) return;

      const habitColor = habit.color || '#6366F1';
      card.style.setProperty('--reminder-accent', habitColor);
      card.style.setProperty('--reminder-accent-glow', `${habitColor}50`);
      card.style.setProperty('--reminder-accent-bg', `${habitColor}18`);

      document.getElementById('reminder-modal-emoji').textContent = habit.emoji || '✨';

      const soundInfo = SoundEngine.getSoundInfo(habit.reminderSound || 'chime');
      document.getElementById('reminder-sound-icon').textContent = soundInfo.emoji;
      document.getElementById('reminder-sound-label').textContent = soundInfo.label;

      const time12h = this.formatTime12h(habit.reminderTime || '09:00');
      document.getElementById('reminder-modal-time').textContent = `⏰ ${time12h} • ${isSnoozed ? 'Snooze Alert' : 'Daily Reminder'}`;
      document.getElementById('reminder-modal-title').textContent = habit.name;

      const streak = StreakEngine.calculateCurrentStreak(habit);
      const streakEl = document.getElementById('reminder-streak-text');
      if (streak > 0) {
        streakEl.textContent = `${streak}-day streak on the line! Keep the fire burning 🔥`;
      } else {
        streakEl.textContent = 'Day 1 of your new streak! Start strong today 🌱';
      }

      modal.classList.remove('hidden');
    },

    closeReminderModal() {
      // Stop the 1-minute audio immediately
      SoundEngine.stopAlarm();
      const modal = document.getElementById('reminder-modal');
      modal?.classList.add('hidden');
      this.activeHabit = null;
    },

    completeActiveHabit() {
      // Stop the 1-minute audio immediately
      SoundEngine.stopAlarm();
      if (!this.activeHabit) return;
      const habit = this.activeHabit;
      this.closeReminderModal();
      // Directly check in habit
      App.toggleHabitCompletion(habit.id);
    },

    snoozeActiveHabit(minutes = 5) {
      // Stop the 1-minute audio immediately
      SoundEngine.stopAlarm();
      if (!this.activeHabit) return;
      const habit = this.activeHabit;
      const triggerTime = Date.now() + (minutes * 60 * 1000);
      this.snoozeQueue[habit.id] = triggerTime;
      this.closeReminderModal();
      App.showToast(`⏰ Snoozed "${habit.name}" for ${minutes} minutes`);
    },

    formatTime12h(timeStr) {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1] || '00';
      if (isNaN(h)) return timeStr;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    }
  };

  /* ==========================================================================
     9. Main Application State & UI Controller
     ========================================================================== */
  const App = {
    habits: [],
    currentTab: 'dashboard',
    searchQuery: '',
    frequencyFilter: 'all',
    categoryFilter: 'all',
    
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    calendarHabitId: null,

    habitIdToDelete: null,
    editingHabitId: null,
    selectedFormEmoji: '💧',
    selectedFormColor: '#6366F1',

    init() {
      this.initTheme();

      this.habits = StorageManager.getHabits();
      if (this.habits.length > 0) {
        this.calendarHabitId = this.habits[0].id;
      }

      // Initialize Sound Synthesis & Reminder Scheduler
      SoundEngine.init();
      ReminderEngine.init();

      // Initialize Rewards & Gamification
      RewardsManager.init(this.habits);

      ConfettiEngine.init();
      this.bindEvents();

      this.updateHeaderDate();
      this.render();
    },

    initTheme() {
      const savedTheme = StorageManager.getTheme();
      document.documentElement.setAttribute('data-theme', savedTheme);
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      StorageManager.saveTheme(next);
      this.showToast(next === 'dark' ? '🌙 Switched to Dark Theme' : '☀️ Switched to Light Theme');
    },

    updateHeaderDate() {
      const dateTextEl = document.getElementById('header-date-text');
      if (dateTextEl) {
        dateTextEl.textContent = formatHeaderDate(new Date());
      }
    },

    bindEvents() {
      // Header Level Chip Click -> Switch to Rewards Tab
      document.getElementById('user-level-chip')?.addEventListener('click', () => {
        this.switchTab('rewards');
      });

      document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

      document.getElementById('btn-add-habit-top')?.addEventListener('click', () => this.openAddHabitModal());
      document.getElementById('btn-add-habit-inline')?.addEventListener('click', () => this.openAddHabitModal());
      document.getElementById('btn-empty-add')?.addEventListener('click', () => this.openAddHabitModal());

      const dataMenuBtn = document.getElementById('data-menu-btn');
      const dataDropdown = document.getElementById('data-dropdown');
      dataMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dataDropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        dataDropdown?.classList.remove('show');
      });

      document.getElementById('menu-export-btn')?.addEventListener('click', () => this.exportBackup());
      document.getElementById('menu-import-btn')?.addEventListener('click', () => this.openImportModal());
      document.getElementById('menu-seed-btn')?.addEventListener('click', () => this.reloadDemoHabits());
      document.getElementById('menu-reset-btn')?.addEventListener('click', () => this.clearAllHabitsPrompt());
      document.getElementById('footer-demo-btn')?.addEventListener('click', () => this.reloadDemoHabits());

      // Tab Navigation
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.id.replace('tab-', '');
          this.switchTab(tabId);
        });
      });

      // Search & Filters
      const searchInput = document.getElementById('habit-search-input');
      const clearSearchBtn = document.getElementById('btn-clear-search');
      searchInput?.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        clearSearchBtn.classList.toggle('hidden', this.searchQuery.length === 0);
        this.renderHabitsList();
      });

      clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        this.renderHabitsList();
      });

      document.querySelectorAll('.pill-group .pill-btn').forEach(pill => {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.pill-group .pill-btn').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.frequencyFilter = pill.getAttribute('data-freq');
          this.renderHabitsList();
        });
      });

      document.getElementById('category-filter-select')?.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.renderHabitsList();
      });

      document.getElementById('calendar-habit-picker')?.addEventListener('change', (e) => {
        this.calendarHabitId = e.target.value;
        this.renderCalendar();
      });

      document.getElementById('btn-cal-prev-month')?.addEventListener('click', () => {
        this.calendarMonth--;
        if (this.calendarMonth < 0) {
          this.calendarMonth = 11;
          this.calendarYear--;
        }
        this.renderCalendar();
      });

      document.getElementById('btn-cal-next-month')?.addEventListener('click', () => {
        this.calendarMonth++;
        if (this.calendarMonth > 11) {
          this.calendarMonth = 0;
          this.calendarYear++;
        }
        this.renderCalendar();
      });

      document.getElementById('btn-cal-today')?.addEventListener('click', () => {
        this.calendarYear = new Date().getFullYear();
        this.calendarMonth = new Date().getMonth();
        this.renderCalendar();
      });

      this.bindHabitModalEvents();
      this.bindDeleteModalEvents();
      this.bindImportModalEvents();
    },

    bindHabitModalEvents() {
      const modal = document.getElementById('habit-modal');
      const form = document.getElementById('habit-form');
      const closeBtn = document.getElementById('modal-close-btn');
      const cancelBtn = document.getElementById('btn-modal-cancel');
      const nameInput = document.getElementById('habit-name-input');
      const charCount = document.getElementById('name-char-count');
      const customEmojiInput = document.getElementById('custom-emoji-input');

      closeBtn?.addEventListener('click', () => this.closeHabitModal());
      cancelBtn?.addEventListener('click', () => this.closeHabitModal());
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) this.closeHabitModal();
      });

      nameInput?.addEventListener('input', (e) => {
        const len = e.target.value.length;
        charCount.textContent = `${len}/60`;
        nameInput.classList.remove('error');
        document.getElementById('name-error-msg').classList.add('hidden');
      });

      document.querySelectorAll('.emoji-choice').forEach(choice => {
        choice.addEventListener('click', () => {
          document.querySelectorAll('.emoji-choice').forEach(c => c.classList.remove('active'));
          choice.classList.add('active');
          this.selectedFormEmoji = choice.getAttribute('data-emoji');
          document.getElementById('emoji-preview').textContent = this.selectedFormEmoji;
          if (customEmojiInput) customEmojiInput.value = '';
        });
      });

      customEmojiInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          document.querySelectorAll('.emoji-choice').forEach(c => c.classList.remove('active'));
          this.selectedFormEmoji = val;
          document.getElementById('emoji-preview').textContent = val;
        }
      });

      document.querySelectorAll('.color-choice').forEach(choice => {
        choice.addEventListener('click', () => {
          document.querySelectorAll('.color-choice').forEach(c => c.classList.remove('active'));
          choice.classList.add('active');
          this.selectedFormColor = choice.getAttribute('data-color');
        });
      });

      // Reminder Toggle & Audio Preview Listeners
      const reminderToggle = document.getElementById('habit-reminder-toggle');
      const reminderFields = document.getElementById('reminder-fields');
      const reminderSoundSelect = document.getElementById('habit-reminder-sound');
      const previewSoundBtn = document.getElementById('btn-preview-sound');
      const testReminderBtn = document.getElementById('btn-test-reminder');

      reminderToggle?.addEventListener('change', () => {
        reminderFields?.classList.toggle('disabled', !reminderToggle.checked);
      });

      previewSoundBtn?.addEventListener('click', () => {
        const soundKey = reminderSoundSelect?.value || 'chime';
        previewSoundBtn.classList.add('playing');
        SoundEngine.play(soundKey);
        setTimeout(() => previewSoundBtn.classList.remove('playing'), 500);
      });

      testReminderBtn?.addEventListener('click', () => {
        const nameInputVal = document.getElementById('habit-name-input')?.value.trim() || 'Sample Habit';
        const timeVal = document.getElementById('habit-reminder-time')?.value || '09:00';
        const soundVal = reminderSoundSelect?.value || 'chime';

        const mockHabit = {
          id: this.editingHabitId || 'temp_test',
          name: nameInputVal,
          emoji: this.selectedFormEmoji || '💧',
          color: this.selectedFormColor || '#6366F1',
          reminderTime: timeVal,
          reminderSound: soundVal,
          completedDates: []
        };

        ReminderEngine.triggerReminder(mockHabit, false);
      });

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleHabitFormSubmit();
      });
    },

    bindDeleteModalEvents() {
      const modal = document.getElementById('delete-modal');
      const cancelBtn = document.getElementById('btn-cancel-delete');
      const confirmBtn = document.getElementById('btn-confirm-delete');

      cancelBtn?.addEventListener('click', () => this.closeDeleteModal());
      confirmBtn?.addEventListener('click', () => this.confirmDeleteHabit());
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) this.closeDeleteModal();
      });
    },

    bindImportModalEvents() {
      const modal = document.getElementById('import-modal');
      const closeBtn = document.getElementById('import-close-btn');
      const cancelBtn = document.getElementById('btn-import-cancel');
      const confirmBtn = document.getElementById('btn-import-confirm');
      const fileInput = document.getElementById('import-file-input');
      const jsonTextarea = document.getElementById('import-json-textarea');

      closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
      cancelBtn?.addEventListener('click', () => modal.classList.add('hidden'));
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          jsonTextarea.value = event.target.result;
        };
        reader.readAsText(file);
      });

      confirmBtn?.addEventListener('click', () => {
        const text = jsonTextarea.value.trim();
        if (!text) return;
        try {
          const parsed = JSON.parse(text);
          const habitsToImport = Array.isArray(parsed) ? parsed : parsed.habits;
          if (!Array.isArray(habitsToImport)) {
            throw new Error('JSON is not an array of habits');
          }
          this.habits = habitsToImport;
          StorageManager.saveHabits(this.habits);
          RewardsManager.recalculateInitialXP(this.habits);
          RewardsManager.checkBadges(this.habits, false);
          modal.classList.add('hidden');
          this.showToast('✅ Habits restored successfully!');
          this.render();
        } catch (err) {
          document.getElementById('import-error-msg').classList.remove('hidden');
        }
      });
    },

    switchTab(tabId) {
      this.currentTab = tabId;

      document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.id === `tab-${tabId}`;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
      });

      document.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.toggle('active', panel.id === `view-${tabId}`);
      });

      if (tabId === 'calendar') {
        this.renderCalendar();
      } else if (tabId === 'stats') {
        this.renderStats();
      } else if (tabId === 'rewards') {
        this.renderRewards();
      }
    },

    toggleHabitCompletion(habitId, targetDateKey = null, originElement = null) {
      const dateKey = targetDateKey || getTodayKey();
      const habit = this.habits.find(h => h.id === habitId);
      if (!habit) return;

      if (!habit.completedDates) habit.completedDates = [];
      const index = habit.completedDates.indexOf(dateKey);

      let isNowCompleted = false;
      if (index > -1) {
        habit.completedDates.splice(index, 1);
        isNowCompleted = false;
        RewardsManager.deductXP(20);
      } else {
        habit.completedDates.push(dateKey);
        isNowCompleted = true;

        // Calculate XP Reward: Base 20 XP + (Streak * 5 XP)
        const streak = StreakEngine.calculateCurrentStreak(habit);
        const xpEarned = 20 + (streak * 5);
        RewardsManager.awardXP(xpEarned, 'Habit Check-in', originElement);
      }

      StorageManager.saveHabits(this.habits);

      if (isNowCompleted && dateKey === getTodayKey()) {
        const todayKey = getTodayKey();
        const totalHabits = this.habits.length;
        const totalCompletedToday = this.habits.filter(h => h.completedDates?.includes(todayKey)).length;

        // Clean Sweep Bonus
        if (totalHabits > 0 && totalCompletedToday === totalHabits) {
          ConfettiEngine.shoot();
          RewardsManager.awardXP(50, 'Clean Sweep');
          this.showToast('🎉 Clean Sweep! 100% complete today! (+50 XP)');
        } else {
          const streak = StreakEngine.calculateCurrentStreak(habit);
          this.showToast(`✨ ${habit.name} checked! 🔥 ${streak} day streak`);
        }
      } else if (!isNowCompleted) {
        this.showToast(`↩️ ${habit.name} unchecked`);
      }

      // Check Badges & Achievements
      RewardsManager.checkBadges(this.habits, true);

      this.render();
    },

    openAddHabitModal() {
      this.editingHabitId = null;
      document.getElementById('modal-title').textContent = 'Add New Habit';
      document.getElementById('habit-id-input').value = '';
      
      const nameInput = document.getElementById('habit-name-input');
      nameInput.value = '';
      nameInput.classList.remove('error');
      document.getElementById('name-char-count').textContent = '0/60';
      document.getElementById('name-error-msg').classList.add('hidden');

      this.selectedFormEmoji = '💧';
      this.selectedFormColor = '#6366F1';
      document.getElementById('emoji-preview').textContent = this.selectedFormEmoji;
      document.getElementById('custom-emoji-input').value = '';
      document.getElementById('habit-frequency-select').value = 'daily';
      document.getElementById('habit-category-select').value = 'Health';

      // Reset reminder fields
      const reminderToggle = document.getElementById('habit-reminder-toggle');
      const reminderTimeInput = document.getElementById('habit-reminder-time');
      const reminderSoundSelect = document.getElementById('habit-reminder-sound');
      const reminderFields = document.getElementById('reminder-fields');

      if (reminderToggle) reminderToggle.checked = true;
      if (reminderTimeInput) reminderTimeInput.value = '09:00';
      if (reminderSoundSelect) reminderSoundSelect.value = 'chime';
      if (reminderFields) reminderFields.classList.remove('disabled');

      document.querySelectorAll('.emoji-choice').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-emoji') === '💧');
      });

      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === '#6366F1');
      });

      document.getElementById('habit-modal').classList.remove('hidden');
      nameInput.focus();
    },

    openEditHabitModal(habitId) {
      const habit = this.habits.find(h => h.id === habitId);
      if (!habit) return;

      this.editingHabitId = habit.id;
      document.getElementById('modal-title').textContent = 'Edit Habit';
      document.getElementById('habit-id-input').value = habit.id;

      const nameInput = document.getElementById('habit-name-input');
      nameInput.value = habit.name;
      nameInput.classList.remove('error');
      document.getElementById('name-char-count').textContent = `${habit.name.length}/60`;
      document.getElementById('name-error-msg').classList.add('hidden');

      this.selectedFormEmoji = habit.emoji || '✨';
      this.selectedFormColor = habit.color || '#6366F1';
      document.getElementById('emoji-preview').textContent = this.selectedFormEmoji;
      document.getElementById('custom-emoji-input').value = '';
      document.getElementById('habit-frequency-select').value = habit.frequency || 'daily';
      document.getElementById('habit-category-select').value = habit.category || 'Health';

      // Populate reminder fields
      const reminderToggle = document.getElementById('habit-reminder-toggle');
      const reminderTimeInput = document.getElementById('habit-reminder-time');
      const reminderSoundSelect = document.getElementById('habit-reminder-sound');
      const reminderFields = document.getElementById('reminder-fields');

      const isReminderOn = habit.reminderEnabled !== undefined ? habit.reminderEnabled : true;
      if (reminderToggle) reminderToggle.checked = isReminderOn;
      if (reminderTimeInput) reminderTimeInput.value = habit.reminderTime || '09:00';
      if (reminderSoundSelect) reminderSoundSelect.value = habit.reminderSound || 'chime';
      if (reminderFields) reminderFields.classList.toggle('disabled', !isReminderOn);

      document.querySelectorAll('.emoji-choice').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-emoji') === this.selectedFormEmoji);
      });

      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === this.selectedFormColor);
      });

      document.getElementById('habit-modal').classList.remove('hidden');
      nameInput.focus();
    },

    closeHabitModal() {
      document.getElementById('habit-modal').classList.add('hidden');
    },

    handleHabitFormSubmit() {
      const nameInput = document.getElementById('habit-name-input');
      const name = nameInput.value.trim();
      const errorMsg = document.getElementById('name-error-msg');

      if (!name) {
        nameInput.classList.add('error');
        errorMsg.textContent = 'Please enter a habit name.';
        errorMsg.classList.remove('hidden');
        nameInput.focus();
        return;
      }

      const isDuplicate = this.habits.some(h => {
        if (this.editingHabitId && h.id === this.editingHabitId) return false;
        return h.name.trim().toLowerCase() === name.toLowerCase();
      });

      if (isDuplicate) {
        nameInput.classList.add('error');
        errorMsg.textContent = 'A habit with this name already exists.';
        errorMsg.classList.remove('hidden');
        nameInput.focus();
        return;
      }

      const frequency = document.getElementById('habit-frequency-select').value;
      const category = document.getElementById('habit-category-select').value;

      const reminderToggle = document.getElementById('habit-reminder-toggle');
      const reminderTimeInput = document.getElementById('habit-reminder-time');
      const reminderSoundSelect = document.getElementById('habit-reminder-sound');

      const reminderEnabled = reminderToggle ? reminderToggle.checked : true;
      const reminderTime = (reminderTimeInput && reminderTimeInput.value) ? reminderTimeInput.value : '09:00';
      const reminderSound = (reminderSoundSelect && reminderSoundSelect.value) ? reminderSoundSelect.value : 'chime';

      if (this.editingHabitId) {
        const habit = this.habits.find(h => h.id === this.editingHabitId);
        if (habit) {
          habit.name = name;
          habit.emoji = this.selectedFormEmoji;
          habit.color = this.selectedFormColor;
          habit.frequency = frequency;
          habit.category = category;
          habit.reminderEnabled = reminderEnabled;
          habit.reminderTime = reminderTime;
          habit.reminderSound = reminderSound;
          this.showToast(`✏️ Updated "${habit.name}"`);
        }
      } else {
        const newHabit = {
          id: 'habit_' + Date.now(),
          name: name,
          emoji: this.selectedFormEmoji,
          category: category,
          frequency: frequency,
          color: this.selectedFormColor,
          reminderEnabled: reminderEnabled,
          reminderTime: reminderTime,
          reminderSound: reminderSound,
          lastNotifiedDate: null,
          createdAt: getTodayKey(),
          completedDates: []
        };
        this.habits.unshift(newHabit);
        if (!this.calendarHabitId) {
          this.calendarHabitId = newHabit.id;
        }
        
        // Award XP for Habit Architect
        RewardsManager.awardXP(15, 'Created New Habit');
        this.showToast(`✨ Created "${newHabit.name}" (+15 XP)`);
      }

      StorageManager.saveHabits(this.habits);
      RewardsManager.checkBadges(this.habits, true);
      this.closeHabitModal();
      this.render();
    },

    openDeleteModal(habitId) {
      const habit = this.habits.find(h => h.id === habitId);
      if (!habit) return;

      this.habitIdToDelete = habit.id;
      document.getElementById('delete-habit-name').textContent = `"${habit.name}"`;
      document.getElementById('delete-modal').classList.remove('hidden');
    },

    closeDeleteModal() {
      this.habitIdToDelete = null;
      document.getElementById('delete-modal').classList.add('hidden');
    },

    confirmDeleteHabit() {
      if (!this.habitIdToDelete) return;
      const habit = this.habits.find(h => h.id === this.habitIdToDelete);
      const name = habit ? habit.name : 'Habit';

      this.habits = this.habits.filter(h => h.id !== this.habitIdToDelete);
      StorageManager.saveHabits(this.habits);

      if (this.calendarHabitId === this.habitIdToDelete) {
        this.calendarHabitId = this.habits.length > 0 ? this.habits[0].id : null;
      }

      this.closeDeleteModal();
      this.showToast(`🗑️ Deleted "${name}"`);
      this.render();
    },

    reloadDemoHabits() {
      this.habits = StorageManager.resetToDemo();
      this.calendarHabitId = this.habits.length > 0 ? this.habits[0].id : null;
      RewardsManager.recalculateInitialXP(this.habits);
      RewardsManager.checkBadges(this.habits, false);
      this.showToast('💧 Reset to default Water habit!');
      this.render();
    },

    clearAllHabitsPrompt() {
      if (confirm('Are you sure you want to clear ALL habits and streaks? This cannot be undone.')) {
        this.habits = StorageManager.clearAll();
        this.calendarHabitId = null;
        RewardsManager.xp = 0;
        RewardsManager.level = 1;
        RewardsManager.unlockedBadges = {};
        RewardsManager.save();
        this.showToast('🧹 All habits and rewards reset.');
        this.render();
      }
    },

    exportBackup() {
      const dataStr = JSON.stringify({
        exportedAt: new Date().toISOString(),
        version: '2.0',
        habits: this.habits,
        rewards: {
          xp: RewardsManager.xp,
          level: RewardsManager.level,
          unlockedBadges: RewardsManager.unlockedBadges
        }
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habitflow_backup_${getTodayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('📥 Backup exported successfully!');
    },

    openImportModal() {
      const modal = document.getElementById('import-modal');
      document.getElementById('import-file-input').value = '';
      document.getElementById('import-json-textarea').value = '';
      document.getElementById('import-error-msg').classList.add('hidden');
      modal.classList.remove('hidden');
    },

    showToast(message) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span class="toast-message">${message}</span>`;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    },

    render() {
      this.renderHeaderLevel();
      this.renderHeroBanner();
      this.renderMetricsSummary();
      this.renderHabitsList();
      
      if (this.currentTab === 'calendar') {
        this.renderCalendar();
      } else if (this.currentTab === 'stats') {
        this.renderStats();
      } else if (this.currentTab === 'rewards') {
        this.renderRewards();
      }
    },

    renderHeaderLevel() {
      const levelInfo = RewardsManager.calculateLevel(RewardsManager.xp);
      const levelBadge = document.getElementById('header-level-badge');
      const xpBar = document.getElementById('header-xp-bar');
      const xpText = document.getElementById('header-xp-text');
      const tabBadgeCount = document.getElementById('tab-unlocked-badge-count');

      if (levelBadge) levelBadge.textContent = `Lv. ${levelInfo.level} ${levelInfo.emoji}`;
      if (xpBar) xpBar.style.width = `${levelInfo.progressPercent}%`;
      if (xpText) xpText.textContent = `${levelInfo.currentInRange}/${levelInfo.range} XP`;

      const unlockedCount = Object.keys(RewardsManager.unlockedBadges).length;
      if (tabBadgeCount) tabBadgeCount.textContent = `${unlockedCount}/${ACHIEVEMENTS.length}`;
    },

    renderHeroBanner() {
      const todayKey = getTodayKey();
      const totalCount = this.habits.length;
      const completedCount = this.habits.filter(h => h.completedDates?.includes(todayKey)).length;
      const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

      let bestActiveStreak = 0;
      this.habits.forEach(h => {
        const streak = StreakEngine.calculateCurrentStreak(h);
        if (streak > bestActiveStreak) bestActiveStreak = streak;
      });

      document.getElementById('hero-greeting').textContent = MotivationalEngine.getGreeting();

      const motivation = MotivationalEngine.getMotivation(percentage, completedCount, totalCount, bestActiveStreak);
      document.getElementById('motivation-badge').textContent = motivation.badge;
      document.getElementById('motivation-text').textContent = motivation.text;

      const circle = document.getElementById('hero-progress-circle');
      const percentEl = document.getElementById('hero-progress-percent');
      const countsEl = document.getElementById('hero-progress-counts');
      const chipEl = document.getElementById('hero-status-chip');

      const radius = 48;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      if (circle) {
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${offset}`;
        circle.style.stroke = percentage === 100 ? 'var(--color-success)' : 'var(--color-primary)';
      }

      if (percentEl) percentEl.textContent = `${percentage}%`;
      if (countsEl) countsEl.textContent = `${completedCount} of ${totalCount} habits`;

      if (chipEl) {
        if (percentage === 100 && totalCount > 0) {
          chipEl.textContent = 'All Done!';
          chipEl.classList.add('completed');
        } else if (completedCount > 0) {
          chipEl.textContent = 'In Progress';
          chipEl.classList.remove('completed');
        } else {
          chipEl.textContent = 'Pending';
          chipEl.classList.remove('completed');
        }
      }
    },

    renderMetricsSummary() {
      const todayKey = getTodayKey();
      const totalHabits = this.habits.length;
      const completedToday = this.habits.filter(h => h.completedDates?.includes(todayKey)).length;
      const percentage = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

      let bestEverStreak = 0;
      let totalAllTimeCompletions = 0;

      this.habits.forEach(h => {
        const longest = StreakEngine.calculateLongestStreak(h);
        if (longest > bestEverStreak) bestEverStreak = longest;
        totalAllTimeCompletions += (h.completedDates || []).length;
      });

      document.getElementById('metric-today-percent').textContent = `${percentage}%`;
      document.getElementById('metric-today-ratio').textContent = `${completedToday}/${totalHabits} done`;
      document.getElementById('metric-best-streak').textContent = `${bestEverStreak} days`;
      document.getElementById('metric-active-count').textContent = `${totalHabits}`;
      document.getElementById('metric-total-completions').textContent = `${totalAllTimeCompletions}`;
    },

    renderHabitsList() {
      const listContainer = document.getElementById('habits-list');
      const emptyState = document.getElementById('empty-state');
      const visibleCountEl = document.getElementById('visible-habits-count');
      if (!listContainer) return;

      const todayKey = getTodayKey();
      const past7Days = getPast7Days();

      const filtered = this.habits.filter(habit => {
        if (this.searchQuery) {
          const matchName = habit.name.toLowerCase().includes(this.searchQuery);
          const matchCategory = (habit.category || '').toLowerCase().includes(this.searchQuery);
          if (!matchName && !matchCategory) return false;
        }

        if (this.frequencyFilter !== 'all') {
          if (habit.frequency !== this.frequencyFilter) return false;
        }

        if (this.categoryFilter !== 'all') {
          if (habit.category !== this.categoryFilter) return false;
        }

        return true;
      });

      visibleCountEl.textContent = `${filtered.length} habit${filtered.length === 1 ? '' : 's'}`;

      if (filtered.length === 0) {
        listContainer.innerHTML = '';
        emptyState.classList.remove('hidden');

        if (this.habits.length === 0) {
          document.getElementById('empty-state-title').textContent = 'No habits yet';
          document.getElementById('empty-state-desc').textContent = 'Start building your daily routine. Add your first habit above!';
        } else {
          document.getElementById('empty-state-title').textContent = 'No matching habits';
          document.getElementById('empty-state-desc').textContent = 'Try adjusting your search query or filter pills to see other habits.';
        }
        return;
      }

      emptyState.classList.add('hidden');

      let html = '';
      filtered.forEach(habit => {
        const isCompletedToday = habit.completedDates?.includes(todayKey);
        const currentStreak = StreakEngine.calculateCurrentStreak(habit);
        const habitColor = habit.color || '#6366F1';

        let miniTrackerHtml = '';
        past7Days.forEach(day => {
          const isDone = habit.completedDates?.includes(day.dateKey);
          miniTrackerHtml += `
            <button 
              type="button" 
              class="mini-day-pill ${isDone ? 'completed' : ''} ${day.isToday ? 'is-today' : ''}" 
              data-habit-id="${habit.id}" 
              data-date-key="${day.dateKey}"
              title="${day.dayName}, ${day.dayNum}: ${isDone ? 'Completed' : 'Missed'} (Click to toggle)"
              aria-label="Toggle ${habit.name} for ${day.dayName}"
            >
              <span class="mini-day-name">${day.dayName[0]}</span>
              <span class="mini-day-dot"></span>
            </button>
          `;
        });

        html += `
          <div class="habit-card ${isCompletedToday ? 'completed-today' : ''}" style="--habit-color: ${habitColor};">
            <div class="habit-card-left">
              <div class="habit-emoji-badge" style="background-color: ${habitColor}20;">
                ${habit.emoji || '✨'}
              </div>
              <div class="habit-details">
                <div class="habit-name">
                  <span>${this.escapeHTML(habit.name)}</span>
                </div>
                <div class="habit-meta-row">
                  <span class="habit-category-tag">${habit.category || 'General'}</span>
                  <span class="habit-frequency-tag">${habit.frequency === 'weekly' ? 'Weekly Target' : 'Daily'}</span>
                  ${(habit.reminderEnabled && habit.reminderTime) ? `
                    <span class="habit-reminder-chip sound-${habit.reminderSound || 'chime'}" title="Daily Reminder at ${ReminderEngine.formatTime12h(habit.reminderTime)} with ${SoundEngine.getSoundInfo(habit.reminderSound || 'chime').label}">
                      <span>⏰</span>
                      <span>${ReminderEngine.formatTime12h(habit.reminderTime)}</span>
                      <span>•</span>
                      <span>${SoundEngine.getSoundInfo(habit.reminderSound || 'chime').emoji} ${SoundEngine.getSoundInfo(habit.reminderSound || 'chime').label}</span>
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>

            <div class="habit-card-center">
              <div class="streak-pill ${currentStreak > 0 ? 'active-streak' : ''}" title="Current Streak">
                <span class="flame-icon">🔥</span>
                <span>${currentStreak} day${currentStreak === 1 ? '' : 's'}</span>
              </div>
              <div class="mini-week-tracker" aria-label="Last 7 days history">
                ${miniTrackerHtml}
              </div>
            </div>

            <div class="habit-card-right">
              <button 
                type="button" 
                class="btn-toggle-check ${isCompletedToday ? 'checked' : ''}" 
                data-action="toggle-today" 
                data-habit-id="${habit.id}"
                aria-label="Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'completed'} today"
                title="${isCompletedToday ? 'Click to mark incomplete' : 'Click to mark complete for today (+XP)'}"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>

              <button 
                type="button" 
                class="habit-action-menu-btn" 
                data-action="edit-habit" 
                data-habit-id="${habit.id}"
                title="Edit Habit"
                aria-label="Edit ${habit.name}"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <button 
                type="button" 
                class="habit-action-menu-btn text-danger" 
                data-action="delete-habit" 
                data-habit-id="${habit.id}"
                title="Delete Habit"
                aria-label="Delete ${habit.name}"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;

      listContainer.querySelectorAll('[data-action="toggle-today"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-habit-id');
          this.toggleHabitCompletion(id, null, btn);
        });
      });

      listContainer.querySelectorAll('[data-action="edit-habit"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-habit-id');
          this.openEditHabitModal(id);
        });
      });

      listContainer.querySelectorAll('[data-action="delete-habit"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-habit-id');
          this.openDeleteModal(id);
        });
      });

      listContainer.querySelectorAll('.mini-day-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const id = pill.getAttribute('data-habit-id');
          const dateKey = pill.getAttribute('data-date-key');
          this.toggleHabitCompletion(id, dateKey, pill);
        });
      });
    },

    renderCalendar() {
      const picker = document.getElementById('calendar-habit-picker');
      const grid = document.getElementById('calendar-days-grid');
      const monthYearEl = document.getElementById('calendar-month-year');
      if (!grid) return;

      monthYearEl.textContent = formatMonthYear(this.calendarYear, this.calendarMonth);

      if (picker) {
        if (this.habits.length === 0) {
          picker.innerHTML = '<option value="">No habits available</option>';
          this.calendarHabitId = null;
        } else {
          picker.innerHTML = this.habits.map(h => `
            <option value="${h.id}" ${h.id === this.calendarHabitId ? 'selected' : ''}>
              ${h.emoji} ${this.escapeHTML(h.name)}
            </option>
          `).join('');

          if (!this.calendarHabitId || !this.habits.some(h => h.id === this.calendarHabitId)) {
            this.calendarHabitId = this.habits[0].id;
            picker.value = this.calendarHabitId;
          }
        }
      }

      const activeHabit = this.habits.find(h => h.id === this.calendarHabitId);
      const infoStrip = document.getElementById('calendar-info-strip');
      if (!activeHabit) {
        infoStrip.classList.add('hidden');
        grid.innerHTML = '<div style="grid-column: span 7; text-align: center; padding: 2rem; color: var(--text-muted);">Please add a habit to view its monthly calendar.</div>';
        return;
      }

      infoStrip.classList.remove('hidden');
      document.getElementById('cal-info-emoji').textContent = activeHabit.emoji || '✨';
      document.getElementById('cal-info-name').textContent = activeHabit.name;
      
      const streak = StreakEngine.calculateCurrentStreak(activeHabit);
      document.getElementById('cal-info-meta').textContent = `${activeHabit.frequency === 'weekly' ? 'Weekly' : 'Daily'} • 🔥 ${streak} day streak`;

      const monthPrefix = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}`;
      const monthCompletionsCount = (activeHabit.completedDates || []).filter(d => d.startsWith(monthPrefix)).length;
      document.getElementById('cal-info-month-done').textContent = monthCompletionsCount;

      const matrix = getMonthMatrix(this.calendarYear, this.calendarMonth);
      const habitColor = activeHabit.color || '#6366F1';

      let gridHtml = '';
      matrix.forEach(cell => {
        if (cell.isEmpty) {
          gridHtml += '<div class="calendar-day-cell empty"></div>';
          return;
        }

        const isCompleted = activeHabit.completedDates?.includes(cell.dateKey);
        const cellClasses = [
          'calendar-day-cell',
          cell.isFuture ? 'future' : '',
          cell.isToday ? 'is-today' : '',
          isCompleted ? 'completed' : (cell.isFuture ? '' : 'missed')
        ].filter(Boolean).join(' ');

        gridHtml += `
          <div 
            class="${cellClasses}" 
            data-date-key="${cell.dateKey}"
            style="--cal-completed-border: ${habitColor}; --cal-completed-bg: ${habitColor}18; --cal-completed-text: ${habitColor};"
            title="${cell.dateKey}: ${isCompleted ? 'Completed' : (cell.isFuture ? 'Future' : 'Missed')} (Click to toggle)"
          >
            <span class="day-number">${cell.dayNumber}</span>
            <div class="day-status-indicator">
              ${isCompleted ? '<span class="day-check-icon">✓</span>' : ''}
            </div>
          </div>
        `;
      });

      grid.innerHTML = gridHtml;

      grid.querySelectorAll('.calendar-day-cell:not(.empty):not(.future)').forEach(cell => {
        cell.addEventListener('click', () => {
          const dateKey = cell.getAttribute('data-date-key');
          if (activeHabit && dateKey) {
            this.toggleHabitCompletion(activeHabit.id, dateKey, cell);
          }
        });
      });
    },

    renderStats() {
      const chartContainer = document.getElementById('weekly-bar-chart');
      const tableContainer = document.getElementById('stats-habit-breakdown');
      const avgBadge = document.getElementById('weekly-avg-badge');
      if (!chartContainer || !tableContainer) return;

      const past7Days = getPast7Days();
      const totalHabits = this.habits.length;

      let sumPercentages = 0;
      let chartHtml = '';

      past7Days.forEach(day => {
        const completedOnDay = this.habits.filter(h => h.completedDates?.includes(day.dateKey)).length;
        const percentage = totalHabits === 0 ? 0 : Math.round((completedOnDay / totalHabits) * 100);
        sumPercentages += percentage;

        const isFull = percentage === 100 && totalHabits > 0;

        chartHtml += `
          <div class="chart-bar-column">
            <span class="chart-bar-value">${percentage}%</span>
            <div 
              class="chart-bar-fill ${isFull ? 'full' : ''}" 
              style="height: ${Math.max(8, (percentage / 100) * 160)}px;"
              title="${day.dayName}, ${day.dayNum}: ${completedOnDay}/${totalHabits} completed (${percentage}%)"
            ></div>
            <div class="chart-bar-label">
              <span class="chart-day-name">${day.dayName}</span>
              <span class="chart-day-date">${day.dayNum}</span>
            </div>
          </div>
        `;
      });

      chartContainer.innerHTML = chartHtml;
      const weeklyAverage = Math.round(sumPercentages / 7);
      avgBadge.textContent = `7-Day Avg: ${weeklyAverage}%`;

      if (this.habits.length === 0) {
        tableContainer.innerHTML = '<p class="text-sm text-muted text-center" style="padding: 1.5rem;">No habits found to analyze.</p>';
        return;
      }

      const sortedHabits = [...this.habits].sort((a, b) => {
        return StreakEngine.calculateCurrentStreak(b) - StreakEngine.calculateCurrentStreak(a);
      });

      let breakdownHtml = '';
      sortedHabits.forEach(habit => {
        const currentStreak = StreakEngine.calculateCurrentStreak(habit);
        const longestStreak = StreakEngine.calculateLongestStreak(habit);
        const completionRate = StreakEngine.calculateCompletionRate(habit);
        const totalDone = (habit.completedDates || []).length;
        const badge = StreakEngine.getConsistencyBadge(completionRate, currentStreak);

        breakdownHtml += `
          <div class="stat-habit-row">
            <div class="stat-habit-info">
              <span style="font-size: 1.4rem;">${habit.emoji}</span>
              <div>
                <div class="stat-habit-name">${this.escapeHTML(habit.name)}</div>
                <span class="text-xs text-muted">${habit.category} • ${habit.frequency}</span>
              </div>
            </div>

            <div class="stat-metrics-group">
              <div class="stat-mini-metric">
                <span class="stat-mini-value text-warning">🔥 ${currentStreak}</span>
                <span class="stat-mini-label">Current Streak</span>
              </div>
              <div class="stat-mini-metric">
                <span class="stat-mini-value">${longestStreak}</span>
                <span class="stat-mini-label">Best Streak</span>
              </div>
              <div class="stat-mini-metric">
                <span class="stat-mini-value text-success">${totalDone}</span>
                <span class="stat-mini-label">Total Days</span>
              </div>
              <div class="stat-mini-metric">
                <span class="stat-mini-value">${completionRate}%</span>
                <span class="stat-mini-label">Success Rate</span>
              </div>
              <span class="consistency-badge ${badge.className}">${badge.text}</span>
            </div>
          </div>
        `;
      });

      tableContainer.innerHTML = breakdownHtml;
    },

    renderRewards() {
      const levelInfo = RewardsManager.calculateLevel(RewardsManager.xp);

      const avatarEl = document.getElementById('rewards-rank-avatar');
      const levelEl = document.getElementById('rewards-rank-level');
      const titleEl = document.getElementById('rewards-rank-title');
      const descEl = document.getElementById('rewards-rank-desc');
      const counterEl = document.getElementById('rewards-xp-counter');
      const barEl = document.getElementById('rewards-xp-bar');
      const totalXpEl = document.getElementById('rewards-total-xp');
      const ratioEl = document.getElementById('rewards-badge-ratio');
      const gridEl = document.getElementById('badges-grid');

      if (avatarEl) avatarEl.textContent = levelInfo.emoji;
      if (levelEl) levelEl.textContent = `Level ${levelInfo.level}`;
      if (titleEl) titleEl.textContent = levelInfo.title;
      if (descEl) {
        if (levelInfo.nextXP === Infinity) {
          descEl.textContent = "You've attained the highest rank! Consistency Grandmaster.";
        } else {
          descEl.textContent = `Earn ${levelInfo.range - levelInfo.currentInRange} more XP to reach Level ${levelInfo.level + 1}!`;
        }
      }

      if (counterEl) {
        counterEl.textContent = levelInfo.nextXP === Infinity ? 'MAX LEVEL' : `${levelInfo.currentInRange} / ${levelInfo.range} XP`;
      }
      if (barEl) barEl.style.width = `${levelInfo.progressPercent}%`;
      if (totalXpEl) totalXpEl.textContent = `Total Earned: ${RewardsManager.xp} XP`;

      const unlockedCount = Object.keys(RewardsManager.unlockedBadges).length;
      if (ratioEl) ratioEl.textContent = `${unlockedCount}/${ACHIEVEMENTS.length} Unlocked`;

      if (!gridEl) return;

      const todayKey = getTodayKey();
      let totalCompletions = 0;
      let maxCurrentStreak = 0;
      let completedToday = 0;

      this.habits.forEach(h => {
        totalCompletions += (h.completedDates || []).length;
        const s = StreakEngine.calculateCurrentStreak(h);
        if (s > maxCurrentStreak) maxCurrentStreak = s;
        if (h.completedDates?.includes(todayKey)) completedToday++;
      });

      const todayPercent = this.habits.length > 0 ? Math.round((completedToday / this.habits.length) * 100) : 0;
      const hasCleanSweep = todayPercent === 100 && this.habits.length > 0;

      const stats = { totalCompletions, maxCurrentStreak, todayPercent, hasCleanSweep };

      let badgesHtml = '';
      ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = Boolean(RewardsManager.unlockedBadges[ach.id]);
        const prog = ach.progress(this.habits, stats, RewardsManager.level);
        const progPercent = Math.min(100, Math.round((prog.current / prog.target) * 100));

        badgesHtml += `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-card-top">
              <div class="badge-icon-box">
                ${ach.emoji}
              </div>
              <span class="badge-status-pill ${isUnlocked ? 'unlocked' : 'locked'}">
                ${isUnlocked ? 'Unlocked ✓' : 'Locked 🔒'}
              </span>
            </div>

            <div>
              <h4 class="badge-title">${ach.title}</h4>
              <p class="badge-desc">${ach.desc}</p>
            </div>

            <div class="badge-progress-wrap">
              <div class="badge-progress-text">
                <span>Progress</span>
                <span>${isUnlocked ? 'Completed' : `${prog.current}/${prog.target}`}</span>
              </div>
              <div class="badge-progress-track">
                <div class="badge-progress-fill" style="width: ${isUnlocked ? '100%' : `${progPercent}%`};"></div>
              </div>
            </div>
          </div>
        `;
      });

      gridEl.innerHTML = badgesHtml;
    },

    escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  /* ==========================================================================
     Bootstrap App
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    App.init();

    // Auto-unlock Web Audio API on first user interaction anywhere
    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => SoundEngine.init(), { once: true, passive: true });
    });
  });

})();
