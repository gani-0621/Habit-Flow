# HabitFlow — Modern Daily Habit Tracker & Streak Builder ✨

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modern%20Design%20Tokens-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![HTML5](https://img.shields.io/badge/HTML5-Semantic%20%26%20Accessible-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Storage](https://img.shields.io/badge/Data-Client--Side%20LocalStorage-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

> A clean, modern, beginner-friendly habit-tracking web application designed for personal productivity and a standout GitHub portfolio project. Track daily habits, build unbreakable streaks, visualize consistency on interactive monthly calendars, and celebrate milestones with smooth animations.

---

## 🌟 Live Demo & Preview

Run the application instantly without any build tools or external installations:
- **Zero build dependencies**: Works directly in any modern browser by double-clicking `index.html`.
- **GitHub Pages Ready**: Can be deployed to GitHub Pages with a single click.

```text
habit-tracker/
├── index.html        # Semantic HTML5 layout, accessible modals & tabs
├── style.css         # Modern CSS design system, CSS variables & Light/Dark themes
├── script.js         # Modular Vanilla ES6+ architecture (StreakEngine, Calendar, Confetti)
├── README.md         # Professional documentation & portfolio showcase
└── assets/
    └── favicon.svg   # Custom SVG checkmark & flame branding icon
```

---

## 🎯 Key Features

### 1. 📊 Interactive Dashboard
- **Real-Time Progress Ring**: Animated SVG circular gauge showing today's completion percentage.
- **Summary Metrics**: Instant overview of Today's Progress (`%` and `x/y done`), Active Habits count, Best Streak, and Total Lifetime Check-ins.
- **Dynamic Greeting**: Time-aware personalized greetings (*Good morning / afternoon / evening*).
- **Today's Habits Checklist**: Large tactile buttons with ripple and checkmark animations to easily complete daily goals.
- **7-Day Mini Trackers**: Each habit card displays an interactive 7-day pill timeline (Sun–Sat) showing daily completion states; clicking any pill toggles completion for that day.

### 2. ➕ Habit Management (CRUD)
- **Create New Habit**:
  - Habit title with character counter and duplicate prevention validation.
  - Interactive emoji avatar grid (24 popular habit icons) or custom emoji input.
  - Frequency selection (`Daily` or `Weekly`).
  - Category classification (`Health`, `Mindfulness`, `Productivity`, `Fitness`, `Learning`, `Lifestyle`).
  - Color accent theme picker (Indigo, Emerald, Amber, Rose, Cyan, Purple).
- **Edit Habit**: Update title, icon, category, frequency, or color at any time.
- **Delete Habit**: Safe deletion with confirmation modal to prevent accidental loss.
- **Smart Filtering & Search**: Instant real-time search and filter by frequency (`Daily` / `Weekly`) or category.

### 3. 📅 Interactive Monthly Calendar
- **Habit-Specific Monthly View**: Select any habit to inspect full monthly consistency.
- **Interactive Day Cells**: Click any past or present date cell to toggle completion for that specific date.
- **Visual State System**:
  - Colored indicator & checkmark for completed days.
  - Distinct styling for missed days.
  - Glowing highlight ring for the current day.
  - Inactive/disabled state for future days.
- **Month Navigation**: Easily step through past and future months or jump back to `Today`.

### 4. 📈 Analytics & Weekly Progress
- **7-Day Progress Bar Chart**: Visual bar chart showing daily completion percentages across all active habits with hover tooltips and 7-day running average.
- **Habit Performance Leaderboard**: Ranks habits by current streak and provides:
  - Current streak (`🔥 X days`)
  - All-time best streak record
  - Total completed days
  - Success rate percentage
  - Consistency badges (*Unstoppable*, *Consistent*, *Building*, *Getting Started*)

### 5. 🔥 Dynamic Motivation & Celebrations
- **Contextual Motivational Messages**: Adapts messages dynamically based on progress (*"🔥 7 day streak!"*, *"Great job! Keep going!"*, *"You're 80% complete today!"*).
- **Celebration Confetti**: Pure Canvas-based particle explosion triggered whenever 100% of today's habits are checked off.
- **Subtle Toast Feedback**: Non-intrusive notification toasts for actions like adding, completing, or editing habits.

### 6. 🏆 Gamification & Rewards System
- **Experience Points (XP) & Levels**:
  - Earn **+20 XP** for each habit checked off.
  - Earn **+5 XP bonus** per day of active streak.
  - Earn **+50 XP Clean Sweep bonus** for completing 100% of all habits in a day.
  - Earn **+15 XP** for creating new habits.
- **Level Progression**: Advance through ranks from *Novice Scout 🌱* to *Grandmaster of Flow 🏆*.
- **Floating `+XP` Animation**: Sleek particle badge floating upward from the checkbox upon completion.
- **8 Unlockable Milestone Badges**:
  - 💧 **Hydration Hero** (Complete water habit 5 times)
  - 🌱 **First Spark** (Complete your very first habit)
  - 🔥 **On Fire** (Reach a 3-day streak)
  - ⚡ **Unstoppable Flow** (Reach a 7-day streak)
  - 🎯 **Clean Sweep** (100% daily completion)
  - 💎 **Habit Architect** (Create 2 custom habits)
  - 🌟 **Silver Check-in** (15 total lifetime check-ins)
  - 👑 **Elite Consistency** (Reach Level 3)
- **Level-Up Celebration Modal**: Interactive celebration with custom avatar flare and confetti burst upon reaching new ranks.

### 7. ⏰ Scheduled Habit Reminders & Custom Sound Alerts (Web Audio API)
- **Per-Habit Time Scheduling**: Set custom reminder times (e.g., `07:30 AM`, `14:00`, `21:30`) for each habit independently.
- **Custom Sound Synthesizer**: 7 distinct audio profiles generated via standard browser Web Audio API:
  - 🔔 **Crystal Chime**: Shimmering bell harmonic chime (880Hz + 1760Hz).
  - 🧘 **Zen Singing Bowl**: Deep meditative resonance (432Hz fundamental with slow acoustic decay).
  - ⚡ **Digital Alert Ping**: High-tech modern double chirp.
  - 🎵 **Acoustic Marimba**: 4-note ascending wooden chord arpeggio.
  - ✨ **Sparkle Flourish**: Uplifting harp flourish.
  - 🕊️ **Gentle Breeze**: Soothing dual-tone ambient chime.
  - ⏰ **Classic Alarm Bell**: Crisp attention-grabbing pulsed bell.
- **Zero External Dependencies**: Synthesized in real time — 100% offline-ready, no broken `.mp3` links or network lag.
- **Multi-Channel Notification**:
  - **In-App Reminder Modal**: Tactile dialog with habit accent glow, streak status, and direct **✓ Mark as Done (+XP)** or **⏰ Snooze 5m** buttons.
  - **Desktop Web Notifications**: System-level notifications that alert you even when working in another tab or application.
  - **Card Indicator Badge**: Habit cards display their scheduled time and sound icon (e.g. `⏰ 10:00 AM • 🔔 Crystal Chime`).
- **Sound Preview & Instant Test**: Audition sounds with one click and test the full reminder experience directly from the habit modal.

### 8. 🎨 Modern Design & Theming
- **Curated Color System**: High-contrast, elegant typography (`Plus Jakarta Sans`) and tailored slate/indigo palette.
- **Light & Dark Mode**: Seamless toggle that saves user preference in `localStorage`.
- **Fully Responsive**: Optimized for mobile devices (375px+), tablets, and widescreen desktop monitors.

### 8. 💾 Data Persistence & Portability
- **LocalStorage Powered**: Data persists reliably across browser refreshes and browser restarts.
- **Default In-Built Habit**: Pre-loaded with a single essential habit ("Drink 2.5L Water" 💧) so you start with a clean slate to add your own personal habits.
- **JSON Export / Import**: Export full JSON backups of habits, streaks, and XP rewards, or restore backups anytime.
- **Demo Reset / Clear Options**: Easy one-click reset to demo data or clear state.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure, accessible dialogs, ARIA roles, responsive layout |
| **CSS3** | CSS custom properties (design tokens), flexbox, grid, keyframe animations |
| **JavaScript (ES6+)** | Pure Vanilla JS with clean modular separation of concerns |
| **HTML5 Canvas** | Custom lightweight confetti celebration particle engine |
| **LocalStorage API** | Reliable offline client-side data persistence |
| **Google Fonts** | Modern typography using *Plus Jakarta Sans* |

---

## 🚀 Getting Started & Local Setup

### Option 1: Direct Browser Launch (Easiest)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/habit-tracker.git
   cd habit-tracker
   ```
2. Double-click `index.html` or drag it into any web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Using VS Code Live Server
1. Open the `habit-tracker` folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and select **"Open with Live Server"**.

### Option 3: Using a Quick Local Server
```bash
# Using Node (npx serve)
npx serve .

# Or using Python 3
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## 🧠 Streak Calculation Algorithm

The streak engine uses an intuitive algorithm:

```javascript
/**
 * Streak Calculation Rules:
 * 1. If completed today:
 *    - Streak starts at 1, then counts backwards day-by-day.
 * 2. If NOT completed today:
 *    - Checks yesterday. If yesterday was completed, the streak remains ALIVE!
 *    - If yesterday was also missed, current streak is 0.
 * 3. Longest Streak:
 *    - Sorts all unique completion dates chronologically and tracks the
 *      maximum consecutive sequence of days.
 */
```

---

## 🔮 Future Roadmap (Scaling to Full-Stack)

The modular design of `script.js` separates data management from UI rendering, making it straightforward to scale:

1. **User Authentication**: Add Firebase Auth, Supabase, or Clerk for multi-device logins.
2. **Cloud Database**: Swap `StorageManager` calls with PostgreSQL, MongoDB, or Firestore APIs.
3. **AI Habit Coach**: Integrate an LLM endpoint (e.g. Gemini or OpenAI) to analyze consistency and suggest personalized routines.
4. **Push Notifications & Reminders**: Implement Web Push API or Service Workers for daily reminder alerts.
5. **Progressive Web App (PWA)**: Add `manifest.json` and service worker caching for offline app installation on iOS & Android.
6. **Social & Accountability**: Share streak milestones and join community habit challenges.

---

## 👨‍💻 Author & Contributions

Created with care as a showcase portfolio project.

- **Developer**: Portfolio Project
- **License**: [MIT License](LICENSE)
- **Feedback**: Contributions, issues, and feature suggestions are welcome!
