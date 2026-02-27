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

  try {
    renderFn(container, data);
  } catch (err) {
    console.error(`Failed to render screen: ${screen}`, err);
    container.innerHTML = `
      <div class="screen">
        <div class="card" style="margin-top: 24px;">
          <div class="h3" style="margin-bottom: 8px;">Something went wrong</div>
          <div class="text-secondary" style="margin-bottom: 12px;">We hit an error while opening this screen.</div>
          <button class="btn btn-primary" data-action="router-recover">Back to Interview Setup</button>
        </div>
      </div>
    `;
    container.onclick = (e) => {
      const action = e.target.closest('[data-action]');
      if (action?.dataset.action === 'router-recover') {
        navigateTo('interview-setup');
      }
    };
    document.querySelector('.header').style.display = '';
    document.querySelector('.bottom-nav').style.display = '';
    return;
  }

  if (headerUpdateFn) headerUpdateFn();
  updateNav(screen);

  const hideChrome = ['active-workout', 'workout-complete', 'scenario-practice', 'interview-practice'].includes(screen);
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
    'scenarios': 'scenarios',
    'scenario-detail': 'scenarios',
    'scenario-practice': null,
    'interview-setup': 'interview-setup',
    'interview-practice': null,
    'interview-drill': 'interview-setup',
    'interview-upload': 'interview-setup',
    'interview-history': 'interview-setup',
  };

  const activeTab = screenToTab[screen] || 'home';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === activeTab);
  });
}
