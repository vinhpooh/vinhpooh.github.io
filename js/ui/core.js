import { modeIntent, modeOp, isLibreMode, isSurvieMode, pick } from '../engine.js';
import { isLibreIntentAvailableForGameType } from '../config.js';
import { state } from '../state.js';
import { getCheers, getIntentLabel, getOops, getOpLabel, getSchoolLevelLabel, getTypeLabel, t } from '../i18n.js';
import {
  renderClassementLevelSelector,
  renderLeaderboardPanel,
  renderSurvieLeaderboardPanel,
  updateModeOpAvailability,
} from './leaderboard.js';
import { renderProgressionPanel } from './progression.js';

export function updateAnswerDisplay() {
  if (state.inputBuffer === '') {
    state.elements.answerDisplay.textContent = t('answer.placeholder');
    state.elements.answerDisplay.classList.add('placeholder');
    state.elements.answerDisplay.classList.remove('active');
  } else {
    state.elements.answerDisplay.textContent = state.inputBuffer;
    state.elements.answerDisplay.classList.remove('placeholder');
  }
}

export function clearInputBuffer() {
  state.inputBuffer = '';
  state.elements.input.value = '';
  updateAnswerDisplay();
}

export function setInputLocked(isLocked) {
  state.elements.input.disabled = isLocked;
  state.elements.numpad.querySelectorAll('.numpad-btn').forEach(b => { b.disabled = isLocked; });
  if (state.elements.posedActions) {
    state.elements.posedActions.querySelectorAll('.posed-action-btn').forEach((b) => { b.disabled = isLocked; });
  }
  if (isLocked) {
    state.elements.answerDisplay.classList.remove('active');
  }
}

export function applyModeAccent() {
  const intent = modeIntent(state.currentMode);
  const area = state.elements.gamePlayArea;
  area.classList.remove('is-defi', 'is-survie', 'is-libre');
  area.classList.add(`is-${intent}`);
}

export function showGameArea() {
  applyModeAccent();
  state.elements.gamePlayArea.hidden = false;
  state.elements.timerTrack.hidden   = state.gameType === 'posed';
  if (state.elements.modeTriggerRow) state.elements.modeTriggerRow.hidden = true;
  state.elements.playerHeaderRow.hidden = true;
}

export function hideGameArea() {
  state.elements.gamePlayArea.hidden = true;
  state.elements.timerTrack.hidden   = true;
  if (state.elements.modeTriggerRow) state.elements.modeTriggerRow.hidden = false;
  state.elements.playerHeaderRow.hidden = false;
}

export function updateScoreVisibility() {
  const survie = isSurvieMode(state.currentMode);
  const libre  = isLibreMode(state.currentMode);
  const idle   = !state.sessionActive;
  state.elements.scoreCard.hidden = survie || libre || idle;
  state.elements.streakCard.hidden = !survie || idle;
}

function cheerBuddy() {
  const b = state.elements.buddy;
  if (!b) return;
  b.classList.remove('buddy--happy');
  void b.offsetWidth;
  b.classList.add('buddy--happy');
}

export function burstConfetti() {
  const layer = state.elements.confettiLayer;
  if (!layer) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  layer.hidden = false;
  layer.innerHTML = Array.from({ length: 12 }, (_, i) =>
    `<span class="confetti" style="--i:${i}"></span>`).join('');
  setTimeout(() => { layer.hidden = true; layer.innerHTML = ''; }, 900);
}

export function showFeedback({ type, pts = 0, penalty = 0, userAnswer = null, intent = 'defi' }) {
  const fb = state.elements.feedback;
  fb.className = 'feedback-box show';
  const noPoints = intent === 'libre';

  switch (type) {
    case 'correct': {
      fb.classList.add('correct');
      cheerBuddy();
      const ptsCls = pts > 80 ? 'great' : pts > 50 ? 'good' : '';
      if (pts > 80 && intent === 'defi') state.elements.question.classList.add('celebrate');
      let ptsLine = '';
      let starsLine = '';
      if (intent === 'defi') {
        const stars = pts > 80 ? 3 : pts > 50 ? 2 : 1;
        starsLine = `<div class="feed-stars">${'★'.repeat(stars)}<span class="feed-stars-dim">${'★'.repeat(3 - stars)}</span></div>`;
        ptsLine = `<div class="feed-pts ${ptsCls}">${t('feedback.points', { value: pts })}</div>`;
        if (pts > 80) burstConfetti();
      } else if (intent === 'survie') {
        if (state.streak > 0) state.elements.question.classList.add('celebrate');
        const lvl = state.streak >= 10 ? 3 : state.streak >= 5 ? 2 : 1;
        ptsLine = `<div class="feed-pts great survie-${lvl}">${t('feedback.survieStreak', { streak: state.streak })}</div>`;
      }
      fb.innerHTML = `
        <span class="feed-icon">✅</span>
        <div class="feed-msg">${pick(getCheers())}</div>
        ${starsLine}
        ${ptsLine}
      `;
      break;
    }
    case 'wrong': {
      fb.classList.add('wrong');
      const q = state.currentQ.text.replace(' = ?', '');
      const userPart = userAnswer !== null ? `${t('feedback.yourAnswer')} : <strong>${userAnswer}</strong> ❌&nbsp;&nbsp;` : '';
      const penaltyLine = (!noPoints && penalty > 0)
        ? `<div class="feed-pts penalty">${t('feedback.penalty', { value: penalty })}</div>`
        : '';
      fb.innerHTML = `
        <span class="feed-icon">❌</span>
      <div class="feed-msg">${pick(getOops())}</div>
      <div class="feed-detail">${q} = ?&nbsp;&nbsp;${userPart}${t('feedback.correctAnswer')} : <strong>${state.currentQ.answer}</strong></div>
        ${penaltyLine}
      `;
      break;
    }
    case 'timeout': {
      fb.classList.add('wrong');
      const q = state.currentQ.text.replace(' = ?', '');
      const penaltyLine = (!noPoints && penalty > 0)
        ? `<div class="feed-pts penalty">${t('feedback.penalty', { value: penalty })}</div>`
        : '';
      fb.innerHTML = `
        <span class="feed-icon">⏰</span>
      <div class="feed-msg">${t('feedback.timeout')}</div>
        <div class="feed-detail">${q} = <strong>${state.currentQ.answer}</strong></div>
        ${penaltyLine}
      `;
      break;
    }
  }
}

export function clearFeedback() {
  state.elements.feedback.className = 'feedback-box';
  state.elements.feedback.innerHTML = '';
}

export function switchTab(tabId) {
  state.elements.tabJouer.classList.toggle('active', tabId === 'jouer');
  state.elements.tabClassement.classList.toggle('active', tabId === 'classement');
  state.elements.tabProgression.classList.toggle('active', tabId === 'progression');
  state.elements.panelJouer.hidden = tabId !== 'jouer';
  state.elements.panelClassement.hidden = tabId !== 'classement';
  state.elements.panelProgression.hidden = tabId !== 'progression';
  if (tabId === 'classement') {
    state.classementLevel = state.currentSchoolLevel;
    renderClassementLevelSelector();
    renderLeaderboardPanel();
    renderSurvieLeaderboardPanel();
  } else if (tabId === 'progression') {
    renderProgressionPanel();
  }
}

export function updateTabVisibility() {
  state.elements.tabBar.hidden = state.sessionActive && !isLibreMode(state.currentMode);
  state.elements.tabProgression.hidden = state.isGuestSession;
  if (state.isGuestSession && state.elements.tabProgression.classList.contains('active')) {
    switchTab('jouer');
  }
}

function highlightActiveSelections() {
  const op = modeOp(state.currentMode);
  const intent = modeIntent(state.currentMode);

  state.elements.modeMenu.querySelectorAll('.mode-type-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.gameType);
  });
  if (state.elements.modeOpRow) {
    state.elements.modeOpRow.querySelectorAll('.mode-op-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });
  }
  if (state.elements.modeIntentRow) {
    state.elements.modeIntentRow.querySelectorAll('.mode-intent-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.intent === intent);
    });
  }
}

function updateModeSummaryTags(mode) {
  const op = modeOp(mode) || 'mix';
  const intent = modeIntent(mode) || 'defi';
  if (state.elements.modeSummaryType) state.elements.modeSummaryType.textContent = getTypeLabel(state.gameType);
  if (state.elements.modeSummaryIntent) state.elements.modeSummaryIntent.textContent = getIntentLabel(intent);
  if (state.elements.modeSummaryOp) state.elements.modeSummaryOp.textContent = getOpLabel(op);
  if (state.elements.modeSummaryLevel) state.elements.modeSummaryLevel.textContent = getSchoolLevelLabel(state.currentSchoolLevel);
}

export function applyMenuConstraints() {
  if (!state.elements.modeIntentRow) return;
  const defiBtn = state.elements.modeIntentRow.querySelector('[data-intent="defi"]');
  const libreBtn = state.elements.modeIntentRow.querySelector('[data-intent="libre"]');
  const survieBtn = state.elements.modeIntentRow.querySelector('[data-intent="survie"]');
  if (defiBtn) defiBtn.disabled = false;
  if (survieBtn) survieBtn.disabled = false;
  if (libreBtn) libreBtn.disabled = !isLibreIntentAvailableForGameType(state.gameType);
}

function focusMenuSection(section) {
  const allSections = [
    state.elements.modeMenuSectionType,
    state.elements.modeMenuSectionOp,
    state.elements.modeMenuSectionIntent,
    state.elements.modeMenuSectionLevel,
  ].filter(Boolean);
  allSections.forEach((el) => el.classList.remove('mode-menu-section--focus'));

  const sectionMap = {
    type: state.elements.modeMenuSectionType,
    op: state.elements.modeMenuSectionOp,
    intent: state.elements.modeMenuSectionIntent,
    level: state.elements.modeMenuSectionLevel,
  };
  const target = sectionMap[section];
  if (!target) return;

  target.classList.add('mode-menu-section--focus');
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => target.classList.remove('mode-menu-section--focus'), 1200);
}

export function openModeMenu({ focusSection = null } = {}) {
  state.elements.modeMenu.hidden = false;
  state.elements.modeDrawerBackdrop.hidden = false;
  updateModeOpAvailability();
  applyMenuConstraints();
  highlightActiveSelections();
  if (focusSection) focusMenuSection(focusSection);
}

export function closeModeMenu() {
  state.elements.modeMenu.hidden = true;
  state.elements.modeDrawerBackdrop.hidden = true;
}

export function updateModeBadge(mode) {
  updateModeSummaryTags(mode);
  highlightActiveSelections();
  applyMenuConstraints();
}

export function updateTriggerVisibility() {
  const frozen = state.gameInProgress && !isLibreMode(state.currentMode);
  if (state.elements.modeSummaryTags) {
    state.elements.modeSummaryTags.querySelectorAll('.mode-summary-tag-btn').forEach((btn) => {
      btn.disabled = frozen;
    });
  }
  if (state.elements.schoolLevelRow) {
    state.elements.schoolLevelRow.querySelectorAll('.school-level-btn').forEach((btn) => { btn.disabled = frozen; });
  }
  if (state.elements.modeMenuCloseBtn) state.elements.modeMenuCloseBtn.disabled = frozen;
  state.elements.modeTrigger.classList.toggle('mode-trigger--frozen', frozen);
}

export function setGameActive(active) {
  if (!active) {
    renderLeaderboardPanel();
    renderSurvieLeaderboardPanel();
  }
  updateTriggerVisibility();
}
