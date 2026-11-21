/**
 * Keep the app shell on the pixels the user can actually see.
 *
 * Installed iOS home-screen apps (viewport-fit=cover) report a viewport
 * that is short by the status bar or the home indicator. The shell then
 * starts under the clock and stops early, which hides the top buttons and
 * leaves a strip under the tab bar. Safari can also park the visual
 * viewport below y=0 when the toolbars collapse, which shifts the whole
 * page up by the same amount.
 */

const SHORTFALL_LIMIT = 80;
const KEYBOARD_GAP = 140;

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * @param {{
 *   visualHeight?: number,
 *   innerHeight?: number,
 *   screenHeight?: number,
 *   offsetTop?: number,
 *   standalone?: boolean,
 *   ios?: boolean,
 * }} metrics
 * @returns {{ height: number, offset: number }}
 */
export function resolveAppViewport(metrics) {
  const visual = positive(metrics.visualHeight);
  const inner = positive(metrics.innerHeight);
  const screen = positive(metrics.screenHeight);
  const visible = visual || inner || screen;
  const offset = Math.max(0, Math.round(Number(metrics.offsetTop) || 0));

  if (!(metrics.ios && metrics.standalone)) {
    return { height: Math.round(visible), offset };
  }

  // The keyboard shrinks the visual viewport and leaves innerHeight tall.
  // A status-bar gap is much smaller than this, so it still gets filled below.
  if (visual && inner - visual > KEYBOARD_GAP) {
    return { height: Math.round(visual), offset };
  }

  const measured = Math.max(visual, inner) || visible;
  const missing = screen > measured ? screen - measured : 0;
  if (missing > 0 && missing <= SHORTFALL_LIMIT) {
    return { height: Math.round(measured + missing), offset };
  }
  return { height: Math.round(measured), offset };
}

function isIOS() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export function initViewport() {
  const root = document.documentElement;

  const apply = () => {
    const vv = window.visualViewport;
    const next = resolveAppViewport({
      visualHeight: vv ? vv.height : window.innerHeight,
      innerHeight: window.innerHeight,
      screenHeight: window.screen.height,
      offsetTop: vv ? vv.offsetTop : 0,
      standalone: isStandalone(),
      ios: isIOS(),
    });
    root.style.setProperty('--app-height', `${next.height}px`);
    root.style.setProperty('--vv-offset', `${next.offset}px`);
  };

  apply();
  window.visualViewport?.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('scroll', apply);
  window.addEventListener('orientationchange', apply);
  window.addEventListener('pageshow', apply);
}
