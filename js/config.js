// js/config.js — Constantes, enums, labels et messages du jeu

export const TIME_LIMIT      = 30;
export const MAX_PTS         = 100;
export const NEXT_DELAY      = 1500;
export const DEFI_MIX_TOTAL = 20;
export const DEFI_OP_TOTAL  = 10;
export const TIMEOUT_PENALTY = 20;

// Intentions de jeu et opérations. Un mode = `${intent}_${op}`.
export const INTENT = { DEFI: 'defi', SURVIE: 'survie', LIBRE: 'libre' };
export const OP     = { MIX: 'mix', ADD: 'add', SUB: 'sub', MUL: 'mul', DIV: 'div' };
export const SCHOOL_LEVEL = {
  PRIMARY_CP: 'primary_cp',
  PRIMARY_CE1: 'primary_ce1',
  PRIMARY_CE2: 'primary_ce2',
  PRIMARY_CM1: 'primary_cm1',
  PRIMARY_CM2: 'primary_cm2',
  MIDDLE_6E: 'middle_6e',
  MIDDLE_5E: 'middle_5e',
  MIDDLE_4E: 'middle_4e',
  MIDDLE_3E: 'middle_3e',
};
export const DEFAULT_SCHOOL_LEVEL = SCHOOL_LEVEL.PRIMARY_CP;

export const MODE = {
  DEFI_MIX: 'defi_mix',
  DEFI_ADD: 'defi_add',
  DEFI_SUB: 'defi_sub',
  DEFI_MUL: 'defi_mul',
  DEFI_DIV: 'defi_div',
  SURVIE_MIX: 'survie_mix',
  SURVIE_ADD: 'survie_add',
  SURVIE_SUB: 'survie_sub',
  SURVIE_MUL: 'survie_mul',
  SURVIE_DIV: 'survie_div',
  LIBRE_MIX:  'libre_mix',
  LIBRE_ADD:  'libre_add',
  LIBRE_SUB:  'libre_sub',
  LIBRE_MUL:  'libre_mul',
  LIBRE_DIV:  'libre_div',
};

export function isLibreIntentAvailableForGameType(gameType) {
  return gameType === 'mental' || gameType === 'posed';
}

export function resolveIntentForSelection(intent, { gameType } = {}) {
  if (intent !== INTENT.LIBRE) return intent;
  return isLibreIntentAvailableForGameType(gameType) ? INTENT.LIBRE : INTENT.DEFI;
}

export function buildModeFromSelection({ intent, op, gameType } = {}) {
  const safeIntent = resolveIntentForSelection(intent || INTENT.DEFI, { gameType });
  const safeOp = op || OP.MIX;
  return `${safeIntent}_${safeOp}`;
}

// Classements généraux (Mix uniquement)
export const DEFI_MIX_BOARD_KEY = 'defiLeaderboard_mix';
export const SURVIE_MIX_BOARD_KEY = 'survieLeaderboard_mix';

// Anciennes clés de classement par opération — conservées pour la migration historique.
export const LEGACY_CHALLENGE_STORAGE_KEY = {
  challenge_add: 'challengeLeaderboard_add',
  challenge_sub: 'challengeLeaderboard_sub',
  challenge_mul: 'challengeLeaderboard_mul',
  challenge_div: 'challengeLeaderboard_div',
};

export const OP_SHORT = { mix: 'Mix', add: '➕', sub: '➖', mul: '✖️', div: '➗' };

export const PROGRESS_BADGES = ['🌟', '🥉', '🥈', '🥇', '🏅', '🏆', '💎', '👑'];

export const PROGRESS_TIERS = {
  mix:    [250, 450, 650, 850, 1050, 1350, 1600, 1850],
  op:     [130, 220, 320, 430, 530, 680, 790, 900],
  survie: [5, 8, 12, 15, 18, 24, 29, 35],
};

export function tiersForTerrain(terrain) {
  if (terrain.startsWith('survie_')) return PROGRESS_TIERS.survie;
  if (terrain === 'defi_mix') return PROGRESS_TIERS.mix;
  return PROGRESS_TIERS.op;
}

export const SCHOOL_LEVEL_PROFILES = {
  [SCHOOL_LEVEL.PRIMARY_CP]: {
    enabled: true,
    operationsAllowed: [OP.ADD, OP.SUB],
    mixWeights: { [OP.ADD]: 70, [OP.SUB]: 30 },
    add: { min: 0, max: 10, maxResult: 20 },
    sub: { min: 0, max: 10, nonNegative: true },
  },
  [SCHOOL_LEVEL.PRIMARY_CE1]: {
    enabled: true,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL],
    mixWeights: { [OP.ADD]: 45, [OP.SUB]: 35, [OP.MUL]: 20 },
    add: { min: 0, max: 20, maxResult: 40 },
    sub: { min: 0, max: 20, nonNegative: true },
    mul: { tables: [2, 3, 4, 5], factorMin: 1, factorMax: 10 },
  },
  [SCHOOL_LEVEL.PRIMARY_CE2]: {
    enabled: true,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    mixWeights: { [OP.ADD]: 30, [OP.SUB]: 25, [OP.MUL]: 30, [OP.DIV]: 15 },
    add: { min: 0, max: 100, maxResult: 100 },
    sub: { min: 0, max: 100, nonNegative: true },
    mul: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      tablesPriority: [6, 7, 8, 9],
      priorityWeight: 3,
      factorMin: 1,
      factorMax: 10,
    },
    div: { divisorMin: 2, divisorMax: 10, quotientMin: 1, quotientMax: 10, exactOnly: true },
  },
  [SCHOOL_LEVEL.PRIMARY_CM1]: {
    enabled: true,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    mixWeights: { [OP.ADD]: 30, [OP.SUB]: 25, [OP.MUL]: 30, [OP.DIV]: 15 },
    add: { min: 0, max: 100, maxResult: 100 },
    sub: { min: 0, max: 100, nonNegative: true },
    mul: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      tablesPriority: [6, 7, 8, 9],
      priorityWeight: 4,
      factorMin: 1,
      factorMax: 10,
    },
    div: { divisorMin: 2, divisorMax: 10, quotientMin: 1, quotientMax: 10, exactOnly: true },
    timePerQuestionSec: 20,
  },
  [SCHOOL_LEVEL.PRIMARY_CM2]: {
    enabled: true,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    mixWeights: { [OP.ADD]: 30, [OP.SUB]: 25, [OP.MUL]: 30, [OP.DIV]: 15 },
    add: { min: 0, max: 100, maxResult: 100 },
    sub: { min: 0, max: 100, nonNegative: true },
    mul: {
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      tablesPriority: [6, 7, 8, 9],
      priorityWeight: 5,
      factorMin: 1,
      factorMax: 10,
    },
    div: { divisorMin: 2, divisorMax: 10, quotientMin: 1, quotientMax: 10, exactOnly: true },
    timePerQuestionSec: 10,
  },
  [SCHOOL_LEVEL.MIDDLE_6E]: {
    enabled: false,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    placeholders: { fractions: true, decimals: true },
  },
  [SCHOOL_LEVEL.MIDDLE_5E]: {
    enabled: false,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    placeholders: { fractions: true, decimals: true, relativeNumbers: true },
  },
  [SCHOOL_LEVEL.MIDDLE_4E]: {
    enabled: false,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    placeholders: { fractions: true, relativeNumbers: true, powers: true },
  },
  [SCHOOL_LEVEL.MIDDLE_3E]: {
    enabled: false,
    operationsAllowed: [OP.ADD, OP.SUB, OP.MUL, OP.DIV],
    placeholders: { algebraPrep: true, operationPriority: true, relativeNumbers: true },
  },
};

export const ENABLED_SCHOOL_LEVELS = Object.entries(SCHOOL_LEVEL_PROFILES)
  .filter(([, profile]) => !!profile.enabled)
  .map(([level]) => level);

export function normalizeSchoolLevel(level) {
  if (typeof level !== 'string') return DEFAULT_SCHOOL_LEVEL;
  return SCHOOL_LEVEL_PROFILES[level] ? level : DEFAULT_SCHOOL_LEVEL;
}

export function getSchoolLevelProfile(level) {
  const normalized = normalizeSchoolLevel(level);
  return SCHOOL_LEVEL_PROFILES[normalized] || SCHOOL_LEVEL_PROFILES[DEFAULT_SCHOOL_LEVEL];
}

export function getAllowedOperations(level) {
  const profile = getSchoolLevelProfile(level);
  return Array.isArray(profile.operationsAllowed)
    ? profile.operationsAllowed
    : [OP.ADD, OP.SUB];
}

export function getSchoolLevelTimeLimit(level) {
  const profile = getSchoolLevelProfile(level);
  return typeof profile.timePerQuestionSec === 'number' ? profile.timePerQuestionSec : TIME_LIMIT;
}

export const WEIGHTS = [
  { op: OP.MUL, w: 50 },
  { op: OP.ADD, w: 20 },
  { op: OP.SUB, w: 15 },
  { op: OP.DIV, w: 15 },
];
