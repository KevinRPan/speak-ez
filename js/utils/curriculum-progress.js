/**
 * Curriculum Progress — checks graduation criteria against session history
 */

import { CURRICULUM_UNITS, FINITE_UNITS } from '../data/curriculum.js';

const GRADUATED_KEY = 'graduatedCourses';

/**
 * Get map of { unitId: { graduated: bool, progress: 0-1, graduatedAt: isoString|null } }
 * for all finite courses.
 */
export function getCurriculumProgress(history) {
  const graduated = getGraduatedMap();

  return FINITE_UNITS.map(unit => {
    const alreadyGraduated = graduated[unit.id];
    if (alreadyGraduated) {
      return {
        unit,
        graduated: true,
        progress: 1,
        graduatedAt: alreadyGraduated.graduatedAt,
      };
    }

    const progress = unit.graduation.progress(history);
    const isGraduating = unit.graduation.check(history);

    if (isGraduating) {
      // Mark as graduated and persist
      markGraduated(unit.id);
      return {
        unit,
        graduated: true,
        progress: 1,
        graduatedAt: new Date().toISOString(),
      };
    }

    return {
      unit,
      graduated: false,
      progress,
      graduatedAt: null,
    };
  });
}

/**
 * Get the current "active" course — the first non-graduated finite unit.
 * If all finite units are graduated, returns null (show evergreen suggestion instead).
 */
export function getActiveCourse(history) {
  const progress = getCurriculumProgress(history);
  return progress.find(p => !p.graduated) || null;
}

/**
 * Get all graduated unit IDs.
 */
export function getGraduatedIds() {
  return Object.keys(getGraduatedMap());
}

function getGraduatedMap() {
  try {
    return JSON.parse(localStorage.getItem(GRADUATED_KEY) || '{}');
  } catch {
    return {};
  }
}

function markGraduated(unitId) {
  const map = getGraduatedMap();
  if (!map[unitId]) {
    map[unitId] = { graduatedAt: new Date().toISOString() };
    localStorage.setItem(GRADUATED_KEY, JSON.stringify(map));
  }
}

/**
 * Reset graduation data (for testing / profile reset).
 */
export function resetCurriculumProgress() {
  localStorage.removeItem(GRADUATED_KEY);
}
