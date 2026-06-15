import { ENABLED_SCHOOL_LEVELS, OP, getAllowedOperations } from '../config.js';
import { state } from '../state.js';
import { loadLeaderboard, loadSurvieLeaderboard } from '../storage.js';
import { getSchoolLevelDisplayParts, getSchoolLevelLabel, t } from '../i18n.js';

function renderSchoolLevelButtonLabel(level) {
  const { icon, text } = getSchoolLevelDisplayParts(level);
  const iconHtml = icon
    ? `<span class="school-level-btn-icon" aria-hidden="true">${icon}</span>`
    : '<span class="school-level-btn-icon school-level-btn-icon--empty" aria-hidden="true"></span>';
  return `${iconHtml}<span class="school-level-btn-text">${text}</span>`;
}

export function renderSchoolLevelOptions() {
  if (!state.elements.schoolLevelRow) return;
  const controlsLocked = Boolean(state.elements.modeMenuCloseBtn?.disabled);
  state.elements.schoolLevelRow.innerHTML = ENABLED_SCHOOL_LEVELS
    .map(level => `<button class="school-level-btn${level === state.currentSchoolLevel ? ' active' : ''}" data-level="${level}" type="button" aria-label="${t('schoolLevel.label')} : ${getSchoolLevelLabel(level)}"${controlsLocked ? ' disabled' : ''}>${renderSchoolLevelButtonLabel(level)}</button>`)
    .join('');
}

function updateActiveSchoolLevel() {
  if (!state.elements.activeSchoolLevel) return;
  const levelLabel = getSchoolLevelLabel(state.currentSchoolLevel);
  state.elements.activeSchoolLevel.textContent = levelLabel;
  state.elements.activeSchoolLevel.setAttribute('aria-label', `${t('schoolLevel.label')} : ${levelLabel}`);
}

export function syncSchoolLevelUi() {
  renderSchoolLevelOptions();
  updateActiveSchoolLevel();
  updateModeOpAvailability();
}

export function updateModeOpAvailability() {
  const allowedOps = getAllowedOperations(state.currentSchoolLevel);
  if (!state.elements.modeOpRow) return;
  state.elements.modeOpRow.querySelectorAll('.mode-op-item').forEach((btn) => {
    const op = btn.dataset.op;
    if (!op) return;
    if (op === OP.MIX) {
      btn.disabled = allowedOps.length < 2;
      return;
    }
    btn.disabled = !allowedOps.includes(op);
  });
}

export function renderLeaderboard(entries) {
  state.elements.leaderboardBody.innerHTML = entries.map((e, i) => `
    <tr class="${i === 0 ? 'leaderboard-rank-1' : ''}">
      <td>${i + 1}</td>
      <td>${e.name}</td>
      <td>${e.score}</td>
    </tr>
  `).join('');
}

export function renderClassementLevelSelector() {
  if (!state.elements.classementLevelSelector) return;
  state.elements.classementLevelSelector.innerHTML = ENABLED_SCHOOL_LEVELS.map(level => `
    <button class="classement-level-btn${level === state.classementLevel ? ' active' : ''}"
      data-level="${level}" type="button">
      ${renderSchoolLevelButtonLabel(level)}
    </button>
  `).join('');
}

export function setClassementLevel(level) {
  state.classementLevel = level;
  renderClassementLevelSelector();
  renderLeaderboardPanel();
  renderSurvieLeaderboardPanel();
}

export function renderLeaderboardPanel() {
  const entries = loadLeaderboard(state.classementLevel);
  const levelLabel = getSchoolLevelLabel(state.classementLevel);
  if (entries.length === 0) {
    state.elements.leaderboardPanel.hidden = true;
  } else {
    state.elements.leaderboardPanelBody.innerHTML = entries.map((e, i) => `
      <tr class="${i === 0 ? 'leaderboard-rank-1' : ''}">
        <td>${i + 1}</td>
        <td>${e.name}</td>
        <td>${e.score}</td>
      </tr>
    `).join('');
    state.elements.leaderboardPanel.querySelector('.leaderboard-panel-title').textContent =
      `${t('leaderboard.panel.defiMix')} • ${levelLabel}`;
    state.elements.leaderboardPanel.hidden = false;
  }
  updateLeaderboardEmptyHint();
}

export function renderSurvieLeaderboardPanel() {
  const entries = loadSurvieLeaderboard(state.classementLevel);
  const levelLabel = getSchoolLevelLabel(state.classementLevel);
  if (entries.length === 0) {
    state.elements.survieLeaderboardPanel.hidden = true;
  } else {
    state.elements.survieLeaderboardPanelBody.innerHTML = entries.map((e, i) => `
      <tr class="${i === 0 ? 'leaderboard-rank-1' : ''}">
        <td>${i + 1}</td>
        <td>${e.name}</td>
        <td>${e.score}</td>
      </tr>
    `).join('');
    state.elements.survieLeaderboardPanel.querySelector('.leaderboard-panel-title').textContent =
      `${t('leaderboard.panel.survieMix')} • ${levelLabel}`;
    state.elements.survieLeaderboardPanel.hidden = false;
  }
  updateLeaderboardEmptyHint();
}

function updateLeaderboardEmptyHint() {
  if (!state.elements.leaderboardEmptyHint) return;
  const empty = state.elements.leaderboardPanel.hidden && state.elements.survieLeaderboardPanel.hidden;
  state.elements.leaderboardEmptyHint.textContent = t('leaderboard.emptyHint', { level: getSchoolLevelLabel(state.classementLevel) });
  state.elements.leaderboardEmptyHint.hidden = !empty;
}
