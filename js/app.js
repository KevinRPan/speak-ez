/**
 * Speak-EZ — App Entry Point
 * Handles routing, navigation, and app initialization
 */

import { renderHome } from './screens/home.js';
import { renderWorkouts, renderWorkoutDetail } from './screens/workouts.js';
import { renderActiveWorkout, cleanupActiveWorkout } from './screens/active-workout.js';
import { renderWorkoutComplete } from './screens/workout-complete.js';
import { renderHistory } from './screens/history.js';
import { renderExercises } from './screens/exercises.js';
import { renderProfile } from './screens/profile.js';
import { loadAll, getUser } from './utils/storage.js';
import { getLevelInfo, checkStreak } from './utils/xp.js';

// Screen registry
const screens = {
  'home': renderHome,
  'workouts': renderWorkouts,
  'workout-detail': renderWorkoutDetail,
  'active-workout': renderActiveWorkout,
  'workout-complete': renderWorkoutComplete,
  'history': renderHistory,
  'exercises': renderExercises,
  'profile': renderProfile,
};

// Nav tab to screen mapping
const navTabs = {
  'home': 'home',
  'history': 'history',
  'exercises': 'exercises',
  'profile': 'profile',
};

let currentScreen = 'home';

function init() {
  // Initialize storage
  loadAll();

  // Listen for navigation events from screens
  document.addEventListener('navigate', (e) => {
    const { screen, data } = e.detail;
    navigateTo(screen, data);
  });

  // Set up bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (navTabs[tab]) {
        navigateTo(navTabs[tab]);
      }
    });
  });

  // Initial render
  navigateTo('home');
}

function navigateTo(screen, data = {}) {
  const renderFn = screens[screen];
  if (!renderFn) {
    console.error(`Unknown screen: ${screen}`);
    return;
  }

  // Cleanup previous screen if needed
  if (currentScreen === 'active-workout' && screen !== 'active-workout') {
    cleanupActiveWorkout();
  }

  currentScreen = screen;

  // Get the container and clear it for the new screen
  const container = document.querySelector('.screen-container');
  container.scrollTop = 0;
  container.innerHTML = '';
  container.onclick = null;

  // Render the screen
  renderFn(container, data);

  // Update header
  updateHeader();

  // Update nav active state
  updateNav(screen);

  // Show/hide nav and header based on screen
  const hideAll = ['active-workout', 'workout-complete'].includes(screen);
  const hideHeader = hideAll || screen === 'home'; // Home has its own hero
  document.querySelector('.header').style.display = hideHeader ? 'none' : '';
  document.querySelector('.bottom-nav').style.display = hideAll ? 'none' : '';
}

function updateHeader() {
  const user = getUser();
  const level = getLevelInfo(user.xp);
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);

  const streakEl = document.getElementById('header-streak');
  const xpEl = document.getElementById('header-xp');
  const levelEl = document.getElementById('header-level');

  if (streakEl) streakEl.textContent = streakInfo.streak;
  if (xpEl) xpEl.textContent = `${user.xp} XP`;
  if (levelEl) levelEl.textContent = `LVL ${level.level}`;
}

function updateNav(screen) {
  // Map screens to their parent nav tab
  const screenToTab = {
    'home': 'home',
    'workouts': 'home',
    'workout-detail': 'home',
    'active-workout': null,
    'workout-complete': null,
    'history': 'history',
    'exercises': 'exercises',
    'profile': 'profile',
  };

  const activeTab = screenToTab[screen] || 'home';

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === activeTab);
  });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
