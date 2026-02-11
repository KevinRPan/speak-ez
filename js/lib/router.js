/**
 * Router — direct navigation without CustomEvent indirection.
 *
 * Screens import `navigateTo` and call it directly.
 * app.js calls `initRouter` once at startup to register the screen map.
 */

let screens = {};
let currentScreen = null;
let headerUpdateFn = null;
let cleanupFns = {};

export function initRouter({ screenMap, onHeaderUpdate, cleanups }) {
  screens = screenMap;
  headerUpdateFn = onHeaderUpdate || null;
  cleanupFns = cleanups || {};
}

export function navigateTo(screen, data = {}) {
  const renderFn = screens[screen];
  if (!renderFn) {
    console.error(`Unknown screen: ${screen}`);
    return;
  }

  // Cleanup previous screen if needed
  if (currentScreen && cleanupFns[currentScreen]) {
    cleanupFns[currentScreen]();
  }

  currentScreen = screen;

  const container = document.querySelector('.screen-container');
  container.scrollTop = 0;
  container.innerHTML = '';
  container.onclick = null;

  renderFn(container, data);

  if (headerUpdateFn) headerUpdateFn();
  updateNav(screen);

  const hideChrome = ['active-workout', 'workout-complete'].includes(screen);
  document.querySelector('.header').style.display = hideChrome ? 'none' : '';
  document.querySelector('.bottom-nav').style.display = hideChrome ? 'none' : '';
}

function updateNav(screen) {
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
