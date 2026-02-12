/**
 * Speak-EZ — App Entry Point
 * Registers screens with the router and boots the app.
 */

import { initRouter, navigateTo } from './lib/router.js';
import { renderHome } from './screens/home.js';
import { renderWorkouts, renderWorkoutDetail } from './screens/workouts.js';
import { renderActiveWorkout, cleanupActiveWorkout } from './screens/active-workout.js';
import { renderWorkoutComplete } from './screens/workout-complete.js';
import { renderHistory } from './screens/history.js';
import { renderExercises } from './screens/exercises.js';
import { renderProfile } from './screens/profile.js';
import { loadAll, getUser, pullAndMerge } from './utils/storage.js';
import { getLevelInfo, checkStreak } from './utils/xp.js';
import { checkSession, isAuthenticated } from './utils/auth.js';

function init() {
  loadAll();

  initRouter({
    screenMap: {
      'home': renderHome,
      'workouts': renderWorkouts,
      'workout-detail': renderWorkoutDetail,
      'active-workout': renderActiveWorkout,
      'workout-complete': renderWorkoutComplete,
      'history': renderHistory,
      'exercises': renderExercises,
      'profile': renderProfile,
    },
    cleanups: {
      'active-workout': cleanupActiveWorkout,
    },
    onHeaderUpdate: updateHeader,
  });

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      const tabMap = { home: 'home', history: 'history', exercises: 'exercises', profile: 'profile' };
      if (tabMap[tab]) navigateTo(tabMap[tab]);
    });
  });

  // Handle ?auth=success redirect from magic link
  const params = new URLSearchParams(window.location.search);
  const authParam = params.get('auth');
  if (authParam) {
    // Clear the URL param
    window.history.replaceState({}, '', window.location.pathname);
    if (authParam === 'success') {
      // Auth succeeded — check session and do full sync
      checkSession().then(() => {
        if (isAuthenticated()) {
          pullAndMerge().then(() => {
            navigateTo('profile');
            updateHeader();
          });
        }
      });
    }
  } else {
    // Normal boot — check session in background, sync if authenticated
    checkSession().then(() => {
      if (isAuthenticated()) {
        pullAndMerge().then(() => updateHeader());
      }
    });
  }

  navigateTo('home');
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
