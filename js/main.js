// js/main.js — Point d'entrée : event listeners et initialisation

import { MODE, buildModeFromSelection } from './config.js';
import { state } from './state.js';
import { modeIntent, modeOp } from './engine.js';
import {
  updateAnswerDisplay, setInputLocked, updateTabVisibility,
  renderLeaderboardPanel, renderSurvieLeaderboardPanel, renderClassementLevelSelector, setClassementLevel,
  renderProgressionPanel, selectProgressionType, selectProgressionOp, selectProgressionIntent, selectProgressionLevel, syncSchoolLevelUi,
  switchTab, openModeMenu, closeModeMenu, updateModeBadge, applyMenuConstraints,
} from './ui.js';
import { setActiveSchoolLevel, updatePlayerDisplay, showProfilePicker, initProfileFlow } from './player.js';
import { initSettings, refreshSettingsUi } from './settings.js';
import { migrateProfileBoardsToGlobal, migrateSessionHistoryModes, migrateSessionHistoryModesV2, migrateSessionHistoryModesV3, migrateSessionHistoryModesV4 } from './storage.js';
import { initI18n, registerLanguageChangeHandler } from './i18n.js';
import {
  ensureModeCompatibleWithSchoolLevel, startGame, submitAnswer, setMode, hideEndScreen, stopGameSession,
  handlePosedNumpadInput, handlePosedKeyboardInput, handlePosedBoardClick,
} from './game.js';

function handleNumpadClick(e) {
  const btn = e.target.closest('.numpad-btn, .posed-action-btn');
  if (!btn || btn.disabled) return;
  if (handlePosedNumpadInput({ digit: btn.dataset.digit, action: btn.dataset.action })) return;
  if (btn.dataset.digit !== undefined) {
    if (state.inputBuffer.length >= 6) return;
    state.inputBuffer += btn.dataset.digit;
    state.elements.input.value = state.inputBuffer;
    updateAnswerDisplay();
  } else if (btn.dataset.action === 'del') {
    state.inputBuffer = state.inputBuffer.slice(0, -1);
    state.elements.input.value = state.inputBuffer;
    updateAnswerDisplay();
  } else if (btn.dataset.action === 'ok') {
    submitAnswer();
  }
}

function handleKeyboardInput(e) {
  if (!state.elements.profileModalOverlay.hidden) return;
  if (!state.elements.settingsModalOverlay.hidden) return;
  if (state.locked) return;
  if (handlePosedKeyboardInput(e.key)) {
    if (e.key !== 'Enter') e.preventDefault();
    return;
  }
  if (e.key >= '0' && e.key <= '9') {
    if (state.inputBuffer.length < 6) {
      state.inputBuffer += e.key;
      state.elements.input.value = state.inputBuffer;
      updateAnswerDisplay();
    }
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    state.inputBuffer = state.inputBuffer.slice(0, -1);
    state.elements.input.value = state.inputBuffer;
    updateAnswerDisplay();
  } else if (e.key === 'Enter') {
    submitAnswer();
  }
}

// ─── Boutons principaux ───────────────────────────────────────────────────────
state.elements.numpad.addEventListener('click', handleNumpadClick);
if (state.elements.posedActions) state.elements.posedActions.addEventListener('click', handleNumpadClick);
state.elements.question.addEventListener('click', (e) => {
  if (state.locked) return;
  handlePosedBoardClick(e.target);
});
document.addEventListener('keydown', handleKeyboardInput);
state.elements.startBtn.addEventListener('click', () => startGame());

state.elements.stopBtn.addEventListener('click', () => {
  stopGameSession();
});

state.elements.playAgainBtn.addEventListener('click', () => {
  hideEndScreen();
  setMode(state.currentMode);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
});

// ─── Gestion profil ────────────────────────────────────────────────────────────
function onPlayerReady() {
  syncSchoolLevelUi();
  ensureModeCompatibleWithSchoolLevel();
  setMode(state.currentMode);
  if (state.pendingStart) {
    startGame();
  } else {
    state.elements.startBtn.hidden = false;
    state.elements.stopBtn.hidden  = true;
  }
  state.locked = false;
  setInputLocked(false);
  updateTabVisibility();
  renderLeaderboardPanel();
  renderSurvieLeaderboardPanel();
  renderProgressionPanel();
}

state.elements.changePlayerBtn.addEventListener('click', () => showProfilePicker());
state.elements.schoolLevelRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.school-level-btn');
  if (!btn || !btn.dataset.level || btn.disabled) return;
  e.stopPropagation();
  setActiveSchoolLevel(btn.dataset.level);
  syncSchoolLevelUi();
  ensureModeCompatibleWithSchoolLevel();
  setMode(state.currentMode, { keepMenuOpen: !state.elements.modeMenu.hidden });
  renderLeaderboardPanel();
  renderSurvieLeaderboardPanel();
  renderProgressionPanel();
});

// ─── Onglets ──────────────────────────────────────────────────────────────────
state.elements.tabJouer.addEventListener('click', () => switchTab('jouer'));
state.elements.tabClassement.addEventListener('click', () => switchTab('classement'));
state.elements.tabProgression.addEventListener('click', () => switchTab('progression'));

state.elements.classementLevelSelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.classement-level-btn');
  if (btn && btn.dataset.level) setClassementLevel(btn.dataset.level);
});

state.elements.progressionTerrains.addEventListener('click', (e) => {
  const pill = e.target.closest('.prog-pill');
  if (!pill) return;
  if (pill.dataset.progType)   selectProgressionType(pill.dataset.progType);
  else if (pill.dataset.progOp)     selectProgressionOp(pill.dataset.progOp);
  else if (pill.dataset.progIntent) selectProgressionIntent(pill.dataset.progIntent);
  else if (pill.dataset.progLevel)  selectProgressionLevel(pill.dataset.progLevel);
});

state.elements.progressionBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-prog-start]');
  if (!btn) return;
  const op = state.progressionOp || 'mix';
  const intent = state.progressionIntent || 'defi';

  state.gameType = state.progressionType === 'posed' ? 'posed' : 'mental';
  setActiveSchoolLevel(state.progressionLevel || state.currentSchoolLevel);
  syncSchoolLevelUi();
  ensureModeCompatibleWithSchoolLevel();
  setMode(buildModeFromSelection({ intent, op, gameType: state.gameType }));
  switchTab('jouer');
  startGame();
});

// ─── Menu de mode (3 sections) ────────────────────────────────────────────────
state.elements.modeSummaryTags.addEventListener('click', (e) => {
  const tag = e.target.closest('.mode-summary-tag-btn');
  if (!tag || tag.disabled) return;
  openModeMenu({ focusSection: tag.dataset.focusSection || null });
});

state.elements.modeDrawerBackdrop.addEventListener('click', closeModeMenu);
state.elements.modeMenuCloseBtn.addEventListener('click', closeModeMenu);

document.addEventListener('click', (e) => {
  if (!state.elements.modeTrigger.contains(e.target)) closeModeMenu();
});

state.elements.modeMenu.addEventListener('click', (e) => {
  // Clic type
  const typeBtn = e.target.closest('.mode-type-item');
  if (typeBtn && !typeBtn.disabled) {
    state.gameType = typeBtn.dataset.type;
    applyMenuConstraints();
    setMode(state.currentMode, { keepMenuOpen: true });
    return;
  }

  // Clic op
  const opBtn = e.target.closest('.mode-op-item');
  if (opBtn && !opBtn.disabled) {
    const op = opBtn.dataset.op;
    const intent = modeIntent(state.currentMode) || 'defi';
    setMode(buildModeFromSelection({ intent, op, gameType: state.gameType }), { keepMenuOpen: true });
    return;
  }

  // Clic intent
  const intentBtn = e.target.closest('.mode-intent-item');
  if (intentBtn && !intentBtn.disabled) {
    const op = modeOp(state.currentMode) || 'mix';
    setMode(buildModeFromSelection({ intent: intentBtn.dataset.intent, op, gameType: state.gameType }), { keepMenuOpen: true });
    return;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
migrateProfileBoardsToGlobal();
migrateSessionHistoryModes();
migrateSessionHistoryModesV2();
migrateSessionHistoryModesV3();
migrateSessionHistoryModesV4();
initI18n();
registerLanguageChangeHandler(() => {
  updateAnswerDisplay();
  updatePlayerDisplay();
  syncSchoolLevelUi();
  updateModeBadge(state.currentMode);
  renderLeaderboardPanel();
  renderSurvieLeaderboardPanel();
  renderProgressionPanel();
  refreshSettingsUi();
});
initSettings();
syncSchoolLevelUi();
renderClassementLevelSelector();
renderLeaderboardPanel();
renderSurvieLeaderboardPanel();
renderProgressionPanel();
setMode(MODE.DEFI_MIX);
initProfileFlow(onPlayerReady);
