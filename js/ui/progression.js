import { INTENT, OP, PROGRESS_BADGES, SCHOOL_LEVEL, tiersForTerrain } from '../config.js';
import { modeIntent, modeOp } from '../engine.js';
import { state } from '../state.js';
import { loadProfileSessionHistory } from '../storage.js';
import { getSchoolLevelLabel, t } from '../i18n.js';

const ALL_TYPES = [
  { id: 'mental', labelKey: 'progression.type.mental' },
  { id: 'posed', labelKey: 'progression.type.posed' },
];

const ALL_OPS = [
  { id: OP.MIX, emoji: '➕➖✖️➗', labelKey: 'progression.op.mix' },
  { id: OP.ADD, emoji: '➕', labelKey: 'progression.op.add' },
  { id: OP.SUB, emoji: '➖', labelKey: 'progression.op.sub' },
  { id: OP.MUL, emoji: '✖️', labelKey: 'progression.op.mul' },
  { id: OP.DIV, emoji: '➗', labelKey: 'progression.op.div' },
];

const ALL_INTENTS = [
  { id: INTENT.DEFI, labelKey: 'progression.intent.defi' },
  { id: INTENT.SURVIE, labelKey: 'progression.intent.survie' },
];

const PROGRESSION_LEVELS = [
  SCHOOL_LEVEL.PRIMARY_CP,
  SCHOOL_LEVEL.PRIMARY_CE1,
  SCHOOL_LEVEL.PRIMARY_CE2,
  SCHOOL_LEVEL.PRIMARY_CM1,
  SCHOOL_LEVEL.PRIMARY_CM2,
];

function progressionTierIndex(score, tiers) {
  let idx = -1;
  for (let i = 0; i < tiers.length; i++) {
    if (score >= tiers[i]) idx = i; else break;
  }
  return idx;
}

function getProgressionHistory() {
  if (!state.activeProfileId) return [];
  return loadProfileSessionHistory(state.activeProfileId)
    .filter((entry) => entry.schoolLevel)
    .filter((entry) => {
      const intent = modeIntent(entry.mode);
      return intent === INTENT.DEFI || intent === INTENT.SURVIE;
    });
}

function matchesSelection(entry, selection) {
  if (!entry) return false;
  if (selection.type && entry.gameType !== selection.type) return false;
  if (selection.op && modeOp(entry.mode) !== selection.op) return false;
  if (selection.intent && modeIntent(entry.mode) !== selection.intent) return false;
  if (selection.level && entry.schoolLevel !== selection.level) return false;
  return true;
}

function hasDataForOption(history, selection, dimension, optionId) {
  const candidate = { ...selection, [dimension]: optionId };
  return history.some((entry) => matchesSelection(entry, candidate));
}

function computeAvailability(history, selection) {
  return {
    type: Object.fromEntries(ALL_TYPES.map((item) => [item.id, hasDataForOption(history, selection, 'type', item.id)])),
    op: Object.fromEntries(ALL_OPS.map((item) => [item.id, hasDataForOption(history, selection, 'op', item.id)])),
    intent: Object.fromEntries(ALL_INTENTS.map((item) => [item.id, hasDataForOption(history, selection, 'intent', item.id)])),
    level: Object.fromEntries(PROGRESSION_LEVELS.map((level) => [level, hasDataForOption(history, selection, 'level', level)])),
  };
}

function syncProgressionSelection(history) {
  const selection = {
    type: state.progressionType,
    op: state.progressionOp,
    intent: state.progressionIntent,
    level: state.progressionLevel,
  };

  if (!ALL_TYPES.some((item) => item.id === selection.type)) selection.type = 'mental';
  if (!ALL_OPS.some((item) => item.id === selection.op)) selection.op = OP.MIX;
  if (selection.intent === INTENT.LIBRE) selection.intent = INTENT.DEFI;
  if (!ALL_INTENTS.some((item) => item.id === selection.intent)) selection.intent = INTENT.DEFI;
  if (!PROGRESSION_LEVELS.includes(selection.level)) {
    selection.level = PROGRESSION_LEVELS.includes(state.currentSchoolLevel)
      ? state.currentSchoolLevel
      : PROGRESSION_LEVELS[0];
  }

  const availability = computeAvailability(history, selection);

  state.progressionType = selection.type;
  state.progressionOp = selection.op;
  state.progressionIntent = selection.intent;
  state.progressionLevel = selection.level;

  return { selection, availability };
}

function renderFilterRow({ label, buttons, rowClass = '', pillsClass = '' }) {
  return `
    <div class="prog-selector-row${rowClass ? ` ${rowClass}` : ''}">
      <span class="prog-selector-label">${label}</span>
      <div class="prog-pills-row${pillsClass ? ` ${pillsClass}` : ''}">
        ${buttons.join('')}
      </div>
    </div>
  `;
}

function renderPillClass(baseClass, active, hasData) {
  return `prog-pill ${baseClass}${active ? ' active' : ''}${hasData ? '' : ' prog-pill--no-data'}`;
}

export function renderProgressionTerrains(history = getProgressionHistory()) {
  const { selection, availability } = syncProgressionSelection(history);

  const typeRow = renderFilterRow({
    label: t('progression.selector.type'),
    buttons: ALL_TYPES.map((item) => {
      const hasData = availability.type[item.id];
      const cls = renderPillClass('prog-pill--type', selection.type === item.id, hasData);
      return `<button class="${cls}" data-prog-type="${item.id}" type="button">${t(item.labelKey)}</button>`;
    }),
  });

  const opRow = renderFilterRow({
    label: t('progression.selector.op'),
    buttons: ALL_OPS.map((item) => {
      const hasData = availability.op[item.id];
      const aria = t(item.labelKey);
      const cls = renderPillClass('prog-pill--op', selection.op === item.id, hasData);
      const isMix = item.id === OP.MIX;
      const iconHtml = isMix
        ? '<span class="prog-pill-mix-icon" aria-hidden="true"><span>➕</span><span>➖</span><span>✖️</span><span>➗</span></span>'
        : `<span class="prog-pill-emoji">${item.emoji}</span>`;
      return `<button class="${cls}${isMix ? ' prog-pill--op-mix' : ''}" data-prog-op="${item.id}" type="button" title="${aria}" aria-label="${aria}">${iconHtml}</button>`;
    }),
  });

  const intentRow = renderFilterRow({
    label: t('progression.selector.intent'),
    buttons: ALL_INTENTS.map((item) => {
      const hasData = availability.intent[item.id];
      const cls = renderPillClass('prog-pill--intent', selection.intent === item.id, hasData);
      return `<button class="${cls}" data-prog-intent="${item.id}" type="button">${t(item.labelKey)}</button>`;
    }),
  });

  const levelRow = renderFilterRow({
    label: t('progression.selector.level'),
    rowClass: 'prog-selector-row--level',
    pillsClass: 'prog-pills-row--level',
    buttons: PROGRESSION_LEVELS.map((level) => {
      const hasData = availability.level[level];
      const cls = renderPillClass('prog-pill--level', selection.level === level, hasData);
      return `<button class="${cls}" data-prog-level="${level}" type="button">${getSchoolLevelLabel(level)}</button>`;
    }),
  });

  state.elements.progressionTerrains.innerHTML = typeRow + opRow + intentRow + levelRow;
}

export function selectProgressionType(type) {
  state.progressionType = type;
  renderProgressionPanel();
}

export function selectProgressionOp(op) {
  state.progressionOp = op;
  renderProgressionPanel();
}

export function selectProgressionIntent(intent) {
  state.progressionIntent = intent;
  renderProgressionPanel();
}

export function selectProgressionLevel(level) {
  state.progressionLevel = level;
  renderProgressionPanel();
}

function buildTierLine(tiers, tierIdx, { ghost = false } = {}) {
  return `<div class="prog-trophies-line">${
    PROGRESS_BADGES.map((badge, i) => {
      const unlocked = !ghost && i <= tierIdx;
      const current = !ghost && i === tierIdx;
      const next = !ghost && (i === tierIdx + 1 || (tierIdx < 0 && i === 0));
      const stateClass = ghost
        ? 'is-ghost'
        : (current ? 'is-current' : (next ? 'is-next' : (unlocked ? 'is-unlocked' : 'is-locked')));
      const mark = ghost ? '' : ((current || unlocked) ? '✓' : '');
      const threshold = tiers[i];
      const label = typeof threshold === 'number'
        ? t('progression.trophy.title', { value: threshold })
        : '';
      const link = i < PROGRESS_BADGES.length - 1
        ? `<span class="prog-tier-link${unlocked ? ' is-unlocked' : ''}" aria-hidden="true"></span>`
        : '';
      return `
        <div class="prog-tier-step">
          <span class="prog-tier ${stateClass}" title="${label}">
            <span class="prog-tier-badge">${badge}</span>
            <span class="prog-tier-mark">${mark}</span>
          </span>
          ${link}
        </div>
      `;
    }).join('')
  }</div>`;
}

function renderNoDataState(selection) {
  const typeLabel = t(`progression.type.${selection.type}`);
  const opConfig = ALL_OPS.find((item) => item.id === selection.op);
  const opLabel = selection.op === OP.MIX && opConfig
    ? `${opConfig.emoji} ${t(opConfig.labelKey)}`
    : t(`progression.op.${selection.op}`);
  const intentLabel = t(`progression.intent.${selection.intent}`);
  const levelLabel = getSchoolLevelLabel(selection.level);

  const banner = `<div class="prog-empty-banner">${t('progression.empty.bannerNoData')}</div>`;
  const objective = `<div class="prog-objective-card">
      <div class="prog-objective-title">${t('progression.empty.goalTitle')}</div>
      <div class="prog-objective-text">${t('progression.empty.goalHint')}</div>
      <div class="prog-objective-target">${t('progression.empty.goalTarget', { type: typeLabel, op: opLabel, intent: intentLabel, level: levelLabel })}</div>
      <button class="btn prog-objective-action" data-prog-start="1" type="button">${t('progression.empty.goalAction')}</button>
    </div>`;
  return banner + objective;
}

export function renderProgressionPanel() {
  const body = state.elements.progressionBody;

  if (state.isGuestSession || !state.activeProfileId) {
    renderProgressionTerrains([]);
    body.innerHTML = `<p class="progression-empty">${t('progression.empty.noProfile')}</p>`;
    return;
  }

  const history = getProgressionHistory();
  const { selection } = syncProgressionSelection(history);
  renderProgressionTerrains(history);

  if (!selection.level) {
    body.innerHTML = `<p class="progression-empty">${t('progression.empty.noGame')}</p>`;
    return;
  }

  const terrain = `${selection.intent}_${selection.op}`;
  const terrainHistory = history.filter((entry) =>
    entry.gameType === selection.type
    && entry.schoolLevel === selection.level
    && entry.mode === terrain);

  if (terrainHistory.length === 0) {
    body.innerHTML = renderNoDataState(selection);
    return;
  }

  const scores = terrainHistory.map((entry) => entry.score);
  const best = Math.max(...scores);
  const tiers = tiersForTerrain(terrain);
  const tierIdx = progressionTierIndex(best, tiers);
  const currentBadge = tierIdx >= 0 ? PROGRESS_BADGES[tierIdx] : '🔰';
  const bestLabelKey = selection.intent === INTENT.SURVIE
    ? 'progression.kpi.best.streak'
    : 'progression.kpi.best.score';
  const gamesLabelKey = scores.length === 1
    ? 'progression.kpi.games.one'
    : 'progression.kpi.games.many';

  const kpi = `<div class="progression-kpis">
      <div class="progression-kpi">
        <span class="prog-kpi-label">${t(bestLabelKey)}</span>
        <span class="prog-kpi-value">${currentBadge} ${best}</span>
      </div>
      <div class="progression-kpi">
        <span class="prog-kpi-label">${t(gamesLabelKey)}</span>
        <span class="prog-kpi-value">${scores.length}</span>
      </div>
    </div>`;

  const galleryHtml = buildTierLine(tiers, tierIdx);

  let badgeHtml;
  if (tierIdx < tiers.length - 1) {
    const nextVal = tiers[tierIdx + 1];
    const floorVal = tierIdx >= 0 ? tiers[tierIdx] : 0;
    const pct = Math.max(0, Math.min(100, Math.round(((best - floorVal) / (nextVal - floorVal)) * 100)));
    const remaining = nextVal - best;
    badgeHtml = `<div class="progression-badge">
        <div class="prog-next">${t('progression.next.unlock', { remaining, badge: PROGRESS_BADGES[tierIdx + 1] })}</div>
        <div class="prog-bar"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
        <div class="prog-bar-caption">${best} / ${nextVal}</div>
      </div>`;
  } else {
    badgeHtml = `<div class="progression-badge"><div class="prog-next">${t('progression.max')}</div></div>`;
  }

  body.innerHTML = kpi + galleryHtml + badgeHtml;
}
