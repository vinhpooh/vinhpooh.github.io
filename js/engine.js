// js/engine.js — Génération de questions, timer, score, streak

import {
  OP,
  WEIGHTS,
  TIME_LIMIT,
  MAX_PTS,
  getAllowedOperations,
  getSchoolLevelProfile,
  getSchoolLevelTimeLimit,
} from './config.js';
import { state } from './state.js';

// ─── Utilitaires ──────────────────────────────────────────────────────────────
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick    = (arr) => arr[randInt(0, arr.length - 1)];

export function weightedPick(weights) {
  const total = weights.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const { op, w } of weights) { r -= w; if (r <= 0) return op; }
  return weights[weights.length - 1].op;
}

function weightedPickByOpMap(allowedOps, weightsByOp) {
  const weighted = allowedOps.map((op) => ({ op, w: Number(weightsByOp?.[op]) || 1 }));
  return weightedPick(weighted);
}

// ─── Modèle de modes : `${intent}_${op}` ──────────────────────────────────────
export const modeIntent = (mode) => {
  const rawIntent = (mode || '').split('_')[0];
  return rawIntent === 'sprint' ? 'defi' : rawIntent;
};
export const modeOp      = (mode) => (mode || '').split('_')[1];

export const isDefiMode = (mode) => modeIntent(mode) === 'defi';
export const isSurvieMode = (mode) => modeIntent(mode) === 'survie';
export const isLibreMode  = (mode) => modeIntent(mode) === 'libre';
export const isMixOp     = (mode) => modeOp(mode) === 'mix';

export function getCurrentTimeLimit() {
  const raw = Number(state.currentTimeLimit);
  return Number.isFinite(raw) && raw > 0 ? raw : TIME_LIMIT;
}

// ─── Générateur de questions ──────────────────────────────────────────────────
function generateAddQuestion(config) {
  const min = Number.isFinite(config?.min) ? config.min : 0;
  const max = Number.isFinite(config?.max) ? config.max : 50;
  const maxResult = Number.isFinite(config?.maxResult) ? config.maxResult : null;
  if (maxResult !== null) {
    const x = randInt(min, Math.min(max, maxResult));
    const yMax = Math.min(max, maxResult - x);
    const y = randInt(min, Math.max(min, yMax));
    return { op: OP.ADD, text: `${x} + ${y} = ?`, answer: x + y };
  }
  const x = randInt(min, max);
  const y = randInt(min, max);
  return { op: OP.ADD, text: `${x} + ${y} = ?`, answer: x + y };
}

function generateSubQuestion(config) {
  const min = Number.isFinite(config?.min) ? config.min : 0;
  const max = Number.isFinite(config?.max) ? config.max : 50;
  const nonNegative = config?.nonNegative !== false;
  const x = randInt(min, max);
  const y = nonNegative ? randInt(min, x) : randInt(min, max);
  return { op: OP.SUB, text: `${x} − ${y} = ?`, answer: x - y };
}

const POSED_PROFILES = {
  primary_cp:  { add: { min: 10, max: 99 },    sub: { min: 10, max: 99, nonNegative: true }, mul: { topMin: 10, topMax: 99, bottomMin: 10, bottomMax: 19 } },
  primary_ce1: { add: { min: 20, max: 199 },   sub: { min: 20, max: 199, nonNegative: true }, mul: { topMin: 20, topMax: 199, bottomMin: 10, bottomMax: 29 } },
  primary_ce2: { add: { min: 100, max: 999 },  sub: { min: 100, max: 999, nonNegative: true }, mul: { topMin: 100, topMax: 999, bottomMin: 12, bottomMax: 49 } },
  primary_cm1: { add: { min: 100, max: 1999 }, sub: { min: 100, max: 1999, nonNegative: true }, mul: { topMin: 100, topMax: 1999, bottomMin: 12, bottomMax: 69 } },
  primary_cm2: { add: { min: 100, max: 2999 }, sub: { min: 100, max: 2999, nonNegative: true }, mul: { topMin: 100, topMax: 2999, bottomMin: 12, bottomMax: 99 } },
};

function getPosedProfile(level) {
  return POSED_PROFILES[level] || {
    add: { min: 100, max: 1999 },
    sub: { min: 100, max: 1999, nonNegative: true },
    mul: { topMin: 100, topMax: 1999, bottomMin: 12, bottomMax: 69 },
  };
}

function generatePosedAddQuestion(config) {
  const min = Number.isFinite(config?.min) ? config.min : 10;
  const max = Number.isFinite(config?.max) ? config.max : 999;
  const x = randInt(min, max);
  const y = randInt(min, max);
  return {
    op: OP.ADD,
    render: 'posed',
    top: x,
    bottom: y,
    operator: '+',
    text: `${x} + ${y} = ?`,
    answer: x + y,
  };
}

function generatePosedSubQuestion(config) {
  const min = Number.isFinite(config?.min) ? config.min : 10;
  const max = Number.isFinite(config?.max) ? config.max : 999;
  const nonNegative = config?.nonNegative !== false;
  const x = randInt(min, max);
  const y = nonNegative ? randInt(min, x) : randInt(min, max);
  return {
    op: OP.SUB,
    render: 'posed',
    top: x,
    bottom: y,
    operator: '−',
    text: `${x} − ${y} = ?`,
    answer: x - y,
  };
}

function generatePosedMulQuestion(config) {
  const topMin = Number.isFinite(config?.topMin) ? config.topMin : 10;
  const topMax = Number.isFinite(config?.topMax) ? config.topMax : 999;
  const bottomMin = Math.max(10, Number.isFinite(config?.bottomMin) ? config.bottomMin : 12);
  const bottomMax = Math.max(bottomMin, Number.isFinite(config?.bottomMax) ? config.bottomMax : 99);
  const top = randInt(topMin, topMax);
  const bottom = randInt(bottomMin, bottomMax);
  return {
    op: OP.MUL,
    render: 'posed',
    top,
    bottom,
    operator: '×',
    text: `${top} × ${bottom} = ?`,
    answer: top * bottom,
  };
}

function pickTableWithPriority(config, tables) {
  const priorityTables = Array.isArray(config?.tablesPriority)
    ? config.tablesPriority.filter((value) => tables.includes(value))
    : [];
  const prioritySet = new Set(priorityTables);
  const parsedWeight = Number(config?.priorityWeight);
  const priorityWeight = Number.isFinite(parsedWeight) && parsedWeight > 1 ? parsedWeight : 1;
  if (prioritySet.size === 0 || priorityWeight === 1) return pick(tables);
  return weightedPick(
    tables.map((table) => ({
      op: table,
      w: prioritySet.has(table) ? priorityWeight : 1,
    })),
  );
}

function generateMulQuestion(config) {
  const tables = Array.isArray(config?.tables) && config.tables.length > 0 ? config.tables : null;
  if (tables) {
    const x = pickTableWithPriority(config, tables);
    const y = randInt(Number(config?.factorMin) || 1, Number(config?.factorMax) || 10);
    return { op: OP.MUL, text: `${x} × ${y} = ?`, answer: x * y };
  }

  const aMin = Number(config?.aMin) || 0;
  const aMax = Number(config?.aMax) || 10;
  const bMin = Number(config?.bMin) || 0;
  const bMax = Number(config?.bMax) || 10;
  const x = randInt(aMin, aMax);
  const y = randInt(bMin, bMax);
  return { op: OP.MUL, text: `${x} × ${y} = ?`, answer: x * y };
}

function generateDivQuestion(config) {
  const divisorMin = Number(config?.divisorMin) || 1;
  const divisorMax = Number(config?.divisorMax) || 10;
  const quotientMin = Number(config?.quotientMin) || 0;
  const quotientMax = Number(config?.quotientMax) || 10;
  const y = randInt(divisorMin, divisorMax);
  const q = randInt(quotientMin, quotientMax);
  const x = q * y;
  return { op: OP.DIV, text: `${x} ÷ ${y} = ?`, answer: q };
}

export function generateQuestion() {
  if (state.gameType === 'posed') {
    const allowedOps = getAllowedOperations(state.currentSchoolLevel);
    const posedAllowed = [OP.ADD, OP.SUB, OP.MUL].filter((op) => allowedOps.includes(op));
    const safeAllowed = posedAllowed.length > 0 ? posedAllowed : [OP.ADD];
    const posedProfile = getPosedProfile(state.currentSchoolLevel);
    const requestedOp = isMixOp(state.currentMode)
      ? weightedPickByOpMap(safeAllowed, { [OP.ADD]: 45, [OP.SUB]: 30, [OP.MUL]: 25 })
      : modeOp(state.currentMode);
    const op = safeAllowed.includes(requestedOp) ? requestedOp : safeAllowed[0];

    switch (op) {
      case OP.MUL: return generatePosedMulQuestion(posedProfile.mul);
      case OP.SUB: return generatePosedSubQuestion(posedProfile.sub);
      case OP.ADD:
      default: return generatePosedAddQuestion(posedProfile.add);
    }
  }

  const allowedOps = getAllowedOperations(state.currentSchoolLevel);
  const profile = getSchoolLevelProfile(state.currentSchoolLevel);
  const requestedOp = isMixOp(state.currentMode)
    ? weightedPickByOpMap(allowedOps, profile.mixWeights || Object.fromEntries(WEIGHTS.map(({ op, w }) => [op, w])))
    : modeOp(state.currentMode);
  const op = allowedOps.includes(requestedOp) ? requestedOp : allowedOps[0];

  switch (op) {
    case OP.ADD: return generateAddQuestion(profile.add);
    case OP.SUB: return generateSubQuestion(profile.sub);
    case OP.MUL: return generateMulQuestion(profile.mul);
    case OP.DIV: return generateDivQuestion(profile.div);
  }
  return generateAddQuestion(profile.add);
}

export function syncTimeLimitFromSchoolLevel() {
  state.currentTimeLimit = getSchoolLevelTimeLimit(state.currentSchoolLevel);
  return getCurrentTimeLimit();
}

// ─── Timer ────────────────────────────────────────────────────────────────────
export function startTimer() { state.startTime = performance.now(); cancelAnimationFrame(state.rafId); tick(); }
export function stopTimer()  { cancelAnimationFrame(state.rafId); }
export function getElapsedSeconds() { return (performance.now() - state.startTime) / 1000; }

export function snapshotPoints() {
  const limit = getCurrentTimeLimit();
  return Math.max(0, Math.round((1 - getElapsedSeconds() / limit) * MAX_PTS));
}

// Callback enregistré par game.js pour éviter la dépendance circulaire
let _onTimeout = null;
export function setTimeoutHandler(fn) { _onTimeout = fn; }

export function tick() {
  const timeLimit = getCurrentTimeLimit();
  const elapsed  = getElapsedSeconds();
  const fraction = Math.max(0, 1 - elapsed / timeLimit);
  const pts      = Math.max(0, Math.round(fraction * MAX_PTS));
  state.elements.bar.style.width = `${fraction * 100}%`;
  state.elements.bar.classList.toggle('is-yellow', pts >= 33 && pts < 66);
  state.elements.bar.classList.toggle('is-red',    pts < 33);
  if (elapsed >= timeLimit) { if (!state.locked && _onTimeout) _onTimeout(); return; }
  state.rafId = requestAnimationFrame(tick);
}

// ─── Score ────────────────────────────────────────────────────────────────────
export function addPoints(pts) {
  state.score += pts;
  state.elements.score.textContent = state.score;
  state.elements.score.classList.remove('bump');
  void state.elements.score.offsetWidth;
  state.elements.score.classList.add('bump');
}

export function resetScore() { state.score = 0; state.elements.score.textContent = 0; }

// ─── Streak ───────────────────────────────────────────────────────────────────
export function resetStreak() {
  state.streak = 0;
  state.elements.currentStreak.textContent = 0;
}

export function updateStreak(success) {
  if (success) {
    state.streak++;
  } else {
    state.streak = 0;
  }
  state.elements.currentStreak.textContent = state.streak;
  state.elements.currentStreak.classList.remove('bump');
  void state.elements.currentStreak.offsetWidth;
  state.elements.currentStreak.classList.add('bump');
}
