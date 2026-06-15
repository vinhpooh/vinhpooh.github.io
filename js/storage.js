// js/storage.js — Persistence des profils et classements dans localStorage

import {
  DEFAULT_SCHOOL_LEVEL,
  DEFI_MIX_BOARD_KEY,
  LEGACY_CHALLENGE_STORAGE_KEY,
  SURVIE_MIX_BOARD_KEY,
  normalizeSchoolLevel,
} from './config.js';

const PROFILES_KEY = 'profiles';
const ACTIVE_PROFILE_ID_KEY = 'activeProfileId';
const LEGACY_MIGRATION_PREFIX = 'profileLegacyMigrated_';
const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'language';
const GUEST_SCHOOL_LEVEL_KEY = 'guestSchoolLevel';
const LEGACY_GLOBAL_BOARD_KEY = 'mathLeaderboard';
const GLOBAL_BOARD_KEY = DEFI_MIX_BOARD_KEY;
const GLOBAL_MIGRATION_KEY = 'globalBoardsMigrated';
const HISTORY_MODE_MIGRATION_KEY = 'historyModesMigrated';
const SESSION_HISTORY_LIMIT = 200;

function getLegacyChallengeBoardStorageKey(mode) {
  return LEGACY_CHALLENGE_STORAGE_KEY[mode];
}

function sessionHistoryKey(profileId) {
  return `profile:${profileId}:sessionHistory`;
}

function safeParseArray(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Impossible de parser une valeur localStorage, fallback tableau vide.', error);
    return [];
  }
}

function cleanProfileName(name) {
  return name.trim().slice(0, 20);
}

function normalizeProfile(profile) {
  if (!profile || typeof profile.id !== 'string' || typeof profile.name !== 'string' || typeof profile.avatar !== 'string') {
    return null;
  }
  return {
    ...profile,
    keyboardLayout: profile.keyboardLayout === 'mobile' ? 'mobile' : 'pc',
    schoolLevel: normalizeSchoolLevel(profile.schoolLevel),
  };
}

export function loadProfiles() {
  const profiles = safeParseArray(localStorage.getItem(PROFILES_KEY));
  return profiles
    .map(normalizeProfile)
    .filter(Boolean);
}

export function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function isProfileNameTaken(name, excludeId = null) {
  const cleanName = cleanProfileName(name).toLowerCase();
  if (!cleanName) return false;
  return loadProfiles().some(p => p.id !== excludeId && p.name.trim().toLowerCase() === cleanName);
}

export function createProfile({ name, avatar, color, schoolLevel = DEFAULT_SCHOOL_LEVEL }) {
  const cleanName = cleanProfileName(name);
  if (!cleanName) return null;
  if (!avatar || !color) return null;
  if (isProfileNameTaken(cleanName)) return null;

  const profile = {
    id: `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    avatar,
    color,
    keyboardLayout: 'pc',
    schoolLevel: normalizeSchoolLevel(schoolLevel),
  };

  const profiles = loadProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile({ id, name, avatar, color }) {
  if (!id) return null;
  const cleanName = cleanProfileName(name);
  if (!cleanName) return null;
  if (!avatar || !color) return null;
  if (isProfileNameTaken(cleanName, id)) return null;

  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updated = { ...profiles[index], name: cleanName, avatar, color };
  profiles[index] = updated;
  saveProfiles(profiles);
  return updated;
}

export function updateProfileSchoolLevel(id, schoolLevel) {
  if (!id) return null;
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updated = { ...profiles[index], schoolLevel: normalizeSchoolLevel(schoolLevel) };
  profiles[index] = updated;
  saveProfiles(profiles);
  return updated;
}

export function deleteProfile(id) {
  if (!id) return false;
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === id);
  if (index === -1) return false;

  profiles.splice(index, 1);
  saveProfiles(profiles);

  localStorage.removeItem(sessionHistoryKey(id));
  localStorage.removeItem(`${LEGACY_MIGRATION_PREFIX}${id}`);
  if (getLastActiveProfileId() === id) {
    localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
  }
  return true;
}

export function setLastActiveProfileId(profileId) {
  if (!profileId) return;
  localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
}

export function getLastActiveProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function saveTheme(value) {
  localStorage.setItem(THEME_KEY, value === 'dark' ? 'dark' : 'light');
}

export function loadLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'fr';
}

export function saveLanguage(value) {
  localStorage.setItem(LANGUAGE_KEY, value === 'en' ? 'en' : 'fr');
}

export function loadGuestSchoolLevel() {
  return normalizeSchoolLevel(localStorage.getItem(GUEST_SCHOOL_LEVEL_KEY));
}

export function saveGuestSchoolLevel(level) {
  localStorage.setItem(GUEST_SCHOOL_LEVEL_KEY, normalizeSchoolLevel(level));
}

function getCurrentDateLocale() {
  return loadLanguage() === 'en' ? 'en-US' : 'fr-FR';
}

export function getProfileLayout(profile) {
  return profile && profile.keyboardLayout === 'mobile' ? 'mobile' : 'pc';
}

export function updateProfileLayout(id, layout) {
  if (!id) return false;
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === id);
  if (index === -1) return false;
  profiles[index] = { ...profiles[index], keyboardLayout: layout === 'mobile' ? 'mobile' : 'pc' };
  saveProfiles(profiles);
  return true;
}

function normalizeBoardEntry(entry) {
  if (!entry || typeof entry.score !== 'number') return null;
  return {
    ...entry,
    schoolLevel: normalizeSchoolLevel(entry.schoolLevel),
  };
}

function trimBoardBySchoolLevel(entries) {
  const byLevel = new Map();
  for (const entry of entries) {
    const normalized = normalizeBoardEntry(entry);
    if (!normalized) continue;
    const levelEntries = byLevel.get(normalized.schoolLevel) || [];
    levelEntries.push(normalized);
    byLevel.set(normalized.schoolLevel, levelEntries);
  }

  const trimmed = [];
  byLevel.forEach((levelEntries) => {
    levelEntries.sort((a, b) => b.score - a.score);
    trimmed.push(...levelEntries.slice(0, 5));
  });
  return trimmed;
}

export function loadLeaderboard(schoolLevel = DEFAULT_SCHOOL_LEVEL) {
  const level = normalizeSchoolLevel(schoolLevel);
  const entries = safeParseArray(localStorage.getItem(GLOBAL_BOARD_KEY))
    .map(normalizeBoardEntry)
    .filter(Boolean)
    .filter(entry => entry.schoolLevel === level)
    .sort((a, b) => b.score - a.score);
  return entries.slice(0, 5);
}

export function saveToLeaderboard(name, playerScore, profileId = null, schoolLevel = DEFAULT_SCHOOL_LEVEL) {
  const level = normalizeSchoolLevel(schoolLevel);
  const board = safeParseArray(localStorage.getItem(GLOBAL_BOARD_KEY))
    .map(normalizeBoardEntry)
    .filter(Boolean);
  const cleanName = cleanProfileName(name) || 'Anonyme';
  const linkedProfileId = typeof profileId === 'string' ? profileId : getLastActiveProfileId();
  board.push({
    name: cleanName,
    score: playerScore,
    date: new Date().toLocaleDateString(getCurrentDateLocale()),
    profileId: linkedProfileId,
    schoolLevel: level,
  });
  const trimmed = trimBoardBySchoolLevel(board);
  localStorage.setItem(GLOBAL_BOARD_KEY, JSON.stringify(trimmed));
  return loadLeaderboard(level);
}

export function loadSurvieLeaderboard(schoolLevel = DEFAULT_SCHOOL_LEVEL) {
  const level = normalizeSchoolLevel(schoolLevel);
  const entries = safeParseArray(localStorage.getItem(SURVIE_MIX_BOARD_KEY))
    .map(normalizeBoardEntry)
    .filter(Boolean)
    .filter(entry => entry.schoolLevel === level)
    .sort((a, b) => b.score - a.score);
  return entries.slice(0, 5);
}

export function saveToSurvie(name, streak, profileId = null, schoolLevel = DEFAULT_SCHOOL_LEVEL) {
  const level = normalizeSchoolLevel(schoolLevel);
  const board = safeParseArray(localStorage.getItem(SURVIE_MIX_BOARD_KEY))
    .map(normalizeBoardEntry)
    .filter(Boolean);
  const cleanName = cleanProfileName(name) || 'Anonyme';
  const linkedProfileId = typeof profileId === 'string' ? profileId : getLastActiveProfileId();
  board.push({
    name: cleanName,
    score: streak,
    date: new Date().toLocaleDateString(getCurrentDateLocale()),
    profileId: linkedProfileId,
    schoolLevel: level,
  });
  const trimmed = trimBoardBySchoolLevel(board);
  localStorage.setItem(SURVIE_MIX_BOARD_KEY, JSON.stringify(trimmed));
  return loadSurvieLeaderboard(level);
}

function cleanupBoardByExistingProfiles(entries, existingProfileIds) {
  const kept = entries
    .map(normalizeBoardEntry)
    .filter((entry) =>
      entry
      && typeof entry.profileId === 'string'
      && existingProfileIds.has(entry.profileId)
    );
  return trimBoardBySchoolLevel(kept);
}

export function resetGlobalLeaderboardsKeepingExistingProfiles() {
  const existingProfileIds = new Set(loadProfiles().map(p => p.id));
  const cleanedDefi = cleanupBoardByExistingProfiles(
    safeParseArray(localStorage.getItem(GLOBAL_BOARD_KEY)),
    existingProfileIds,
  );
  const cleanedSurvie = cleanupBoardByExistingProfiles(
    safeParseArray(localStorage.getItem(SURVIE_MIX_BOARD_KEY)),
    existingProfileIds,
  );

  localStorage.setItem(GLOBAL_BOARD_KEY, JSON.stringify(cleanedDefi));
  localStorage.setItem(SURVIE_MIX_BOARD_KEY, JSON.stringify(cleanedSurvie));

  return {
    keptDefi: cleanedDefi.length,
    keptSurvie: cleanedSurvie.length,
  };
}

function dedupeEntries(entries) {
  const seen = new Set();
  const deduped = [];
  entries.forEach((entry) => {
    const normalized = normalizeBoardEntry(entry);
    if (!normalized) return;
    const key = `${normalized.name}|${normalized.score}|${normalized.date}|${normalized.schoolLevel}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(normalized);
  });
  return deduped;
}

function aggregateProfileBoards(suffix) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('profile:') && key.endsWith(`:${suffix}`)) {
      entries.push(...safeParseArray(localStorage.getItem(key)));
    }
  }
  return entries;
}

export function migrateProfileBoardsToGlobal() {
  if (localStorage.getItem(GLOBAL_MIGRATION_KEY) === '1') return;

  const competition = dedupeEntries([
    ...safeParseArray(localStorage.getItem(GLOBAL_BOARD_KEY)),
    ...safeParseArray(localStorage.getItem(LEGACY_GLOBAL_BOARD_KEY)),
    ...aggregateProfileBoards('mathLeaderboard'),
  ]);
  competition.sort((a, b) => b.score - a.score);
  if (competition.length > 0) {
    localStorage.setItem(GLOBAL_BOARD_KEY, JSON.stringify(competition.slice(0, 5)));
  }

  for (const mode of Object.keys(LEGACY_CHALLENGE_STORAGE_KEY)) {
    const key = getLegacyChallengeBoardStorageKey(mode);
    const merged = dedupeEntries([
      ...safeParseArray(localStorage.getItem(key)),
      ...aggregateProfileBoards(key),
    ]);
    merged.sort((a, b) => b.score - a.score);
    if (merged.length > 0) {
      localStorage.setItem(key, JSON.stringify(merged.slice(0, 5)));
    }
  }

  localStorage.setItem(GLOBAL_MIGRATION_KEY, '1');
}

// Remappe les anciens identifiants de mode dans les historiques de progression
// (competition → defi_mix, challenge_<op> → defi_<op>). Idempotent.
const HISTORY_MODE_MAP = {
  competition:   'defi_mix',
  challenge_add: 'defi_add',
  challenge_sub: 'defi_sub',
  challenge_mul: 'defi_mul',
  challenge_div: 'defi_div',
};

export function migrateSessionHistoryModes() {
  if (localStorage.getItem(HISTORY_MODE_MIGRATION_KEY) === '1') return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('profile:') || !key.endsWith(':sessionHistory')) continue;
    const entries = safeParseArray(localStorage.getItem(key));
    let changed = false;
    const remapped = entries.map(e => {
      if (e && HISTORY_MODE_MAP[e.mode]) {
        changed = true;
        return { ...e, mode: HISTORY_MODE_MAP[e.mode] };
      }
      return e;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(remapped));
  }

  localStorage.setItem(HISTORY_MODE_MIGRATION_KEY, '1');
}

// Remappe les identifiants de mode v2 (defi/serie/train → defi/survie/libre).
// Migre également la clé serieLeaderboard_mix → survieLeaderboard_mix. Idempotent.
const HISTORY_MODE_MIGRATION_KEY_V2 = 'historyModesMigrated_v2';
const HISTORY_MODE_MAP_V2 = {
  defi_mix:  'defi_mix',  defi_add:  'defi_add',  defi_sub:  'defi_sub',
  defi_mul:  'defi_mul',  defi_div:  'defi_div',
  serie_mix: 'survie_mix',  serie_add: 'survie_add',  serie_sub: 'survie_sub',
  serie_mul: 'survie_mul',  serie_div: 'survie_div',
  train_add: 'libre_add',   train_sub: 'libre_sub',
  train_mul: 'libre_mul',   train_div: 'libre_div',
};

export function migrateSessionHistoryModesV2() {
  if (localStorage.getItem(HISTORY_MODE_MIGRATION_KEY_V2) === '1') return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('profile:') || !key.endsWith(':sessionHistory')) continue;
    const entries = safeParseArray(localStorage.getItem(key));
    let changed = false;
    const remapped = entries.map(e => {
      if (e && HISTORY_MODE_MAP_V2[e.mode]) {
        changed = true;
        return { ...e, mode: HISTORY_MODE_MAP_V2[e.mode] };
      }
      return e;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(remapped));
  }

  // Migrer le classement Survie si l'ancienne clé existe et la nouvelle est vide.
  const legacySerie = safeParseArray(localStorage.getItem('serieLeaderboard_mix'));
  const currentSurvie = safeParseArray(localStorage.getItem(SURVIE_MIX_BOARD_KEY));
  if (legacySerie.length > 0 && currentSurvie.length === 0) {
    localStorage.setItem(SURVIE_MIX_BOARD_KEY, JSON.stringify(legacySerie));
  }

  localStorage.setItem(HISTORY_MODE_MIGRATION_KEY_V2, '1');
}

// Remappe les identifiants v3 (sprint_* → defi_*). Idempotent.
const HISTORY_MODE_MIGRATION_KEY_V3 = 'historyModesMigrated_v3';
const HISTORY_MODE_MAP_V3 = {
  sprint_mix: 'defi_mix',
  sprint_add: 'defi_add',
  sprint_sub: 'defi_sub',
  sprint_mul: 'defi_mul',
  sprint_div: 'defi_div',
};

function normalizeStoredMode(mode) {
  if (typeof mode !== 'string') return mode;
  if (mode.startsWith('defi_')) return mode;
  if (mode.startsWith('chrono_')) return `defi_${mode.slice('chrono_'.length)}`;
  return HISTORY_MODE_MAP_V3[mode] || mode;
}

export function migrateSessionHistoryModesV3() {
  if (localStorage.getItem(HISTORY_MODE_MIGRATION_KEY_V3) === '1') return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('profile:') || !key.endsWith(':sessionHistory')) continue;
    const entries = safeParseArray(localStorage.getItem(key));
    let changed = false;
    const remapped = entries.map(e => {
      if (e && HISTORY_MODE_MAP_V3[e.mode]) {
        changed = true;
        return { ...e, mode: HISTORY_MODE_MAP_V3[e.mode] };
      }
      return e;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(remapped));
  }

  localStorage.setItem(HISTORY_MODE_MIGRATION_KEY_V3, '1');
}

const HISTORY_MODE_MIGRATION_KEY_V4 = 'historyModesMigrated_v4';
const HISTORY_MODE_MAP_V4 = {
  chrono_mix: 'defi_mix',
  chrono_add: 'defi_add',
  chrono_sub: 'defi_sub',
  chrono_mul: 'defi_mul',
  chrono_div: 'defi_div',
};

export function migrateSessionHistoryModesV4() {
  if (localStorage.getItem(HISTORY_MODE_MIGRATION_KEY_V4) === '1') return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('profile:') || !key.endsWith(':sessionHistory')) continue;
    const entries = safeParseArray(localStorage.getItem(key));
    let changed = false;
    const remapped = entries.map((entry) => {
      if (entry && HISTORY_MODE_MAP_V4[entry.mode]) {
        changed = true;
        return { ...entry, mode: HISTORY_MODE_MAP_V4[entry.mode] };
      }
      return entry;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(remapped));
  }

  const legacyDefiBoard = safeParseArray(localStorage.getItem(LEGACY_GLOBAL_BOARD_KEY));
  const currentDefiBoard = safeParseArray(localStorage.getItem(GLOBAL_BOARD_KEY));
  if (legacyDefiBoard.length > 0 && currentDefiBoard.length === 0) {
    localStorage.setItem(GLOBAL_BOARD_KEY, JSON.stringify(trimBoardBySchoolLevel(legacyDefiBoard)));
  }

  localStorage.setItem(HISTORY_MODE_MIGRATION_KEY_V4, '1');
}

export function loadProfileSessionHistory(profileId) {
  if (!profileId) return [];
  return safeParseArray(localStorage.getItem(sessionHistoryKey(profileId)))
    .map((entry) => {
      if (!entry || typeof entry.score !== 'number') return null;
      return {
        date: entry.date,
        mode: normalizeStoredMode(entry.mode),
        score: entry.score,
        schoolLevel: entry.schoolLevel || null,
        gameType: entry.gameType === 'posed' ? 'posed' : 'mental',
      };
    })
    .filter(Boolean);
}

export function logProfileSession(profileId, entry) {
  if (!profileId || !entry || typeof entry.score !== 'number') return [];
  const history = loadProfileSessionHistory(profileId);
  history.push({
    date: entry.date,
    mode: normalizeStoredMode(entry.mode),
    score: entry.score,
    schoolLevel: entry.schoolLevel || null,
    gameType: entry.gameType === 'posed' ? 'posed' : 'mental',
  });
  const trimmed = history.slice(-SESSION_HISTORY_LIMIT);
  localStorage.setItem(sessionHistoryKey(profileId), JSON.stringify(trimmed));
  return trimmed;
}
