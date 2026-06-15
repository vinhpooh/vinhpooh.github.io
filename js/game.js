// js/game.js — Orchestration de la session : modes, questions, soumission, fin

import { OP, NEXT_DELAY, getAllowedOperations } from './config.js';
import { state } from './state.js';
import {
  isLibreMode, isDefiMode, isSurvieMode, generateQuestion, modeIntent, modeOp,
  startTimer, stopTimer, snapshotPoints, syncTimeLimitFromSchoolLevel,
  addPoints, resetScore, updateStreak, resetStreak,
  setTimeoutHandler,
} from './engine.js';
import {
  getDefiQuestionTotal,
  buildAnswerOutcome,
  buildTimeoutOutcome,
  getFinalScoreForMode,
  shouldLogSessionScore,
} from './game-domain.js';
import {
  clearInputBuffer, setInputLocked, showGameArea, hideGameArea,
  updateScoreVisibility, clearFeedback, showFeedback,
  renderLeaderboard, renderLeaderboardPanel, renderSurvieLeaderboardPanel,
  updateTabVisibility, updateModeBadge, updateTriggerVisibility, setGameActive,
  closeModeMenu,
} from './ui.js';
import { updatePlayerDisplay, showProfilePicker, getActivePlayerLabel, getActivePlayerName, canPersistProfileData } from './player.js';
import { loadLeaderboard, saveToLeaderboard, loadSurvieLeaderboard, saveToSurvie, logProfileSession } from './storage.js';
import { getSchoolLevelLabel, t } from './i18n.js';

let posedInputState = null;
const MAX_QUESTION_RETRY = 300;

function isPosedQuestion(question = state.currentQ) {
  return question?.render === 'posed';
}

function isPosedMulQuestion(question = state.currentQ) {
  return isPosedQuestion(question) && question?.op === OP.MUL;
}

function getPosedWidth(question) {
  if (isPosedMulQuestion(question)) {
    const topLen = String(question?.top ?? '').length;
    const answerLen = String(question?.answer ?? '').length;
    return Math.max(answerLen, topLen + 2, 4);
  }
  return Math.max(
    String(question?.top ?? '').length,
    String(question?.bottom ?? '').length,
    String(question?.answer ?? '').length,
    2,
  );
}

function getPaddedDigits(value, width) {
  const chars = String(value ?? '').split('');
  const pad = Math.max(0, width - chars.length);
  return Array.from({ length: pad }, () => '').concat(chars);
}

function getMulPhaseForLane(lane) {
  if (lane === 'pp2' || lane === 'rm2') return 'pp2';
  if (lane === 'final' || lane === 'rs') return 'sum';
  return 'pp1';
}

function getMulResultLaneForPhase(phase) {
  if (phase === 'sum') return 'final';
  if (phase === 'pp2') return 'pp2';
  return 'pp1';
}

function getMulCarryLaneForPhase(phase) {
  if (phase === 'sum') return 'rs';
  if (phase === 'pp2') return 'rm2';
  return 'rm1';
}

function isCarryLane(lane) {
  return lane === 'carry' || lane === 'rm1' || lane === 'rm2' || lane === 'rs';
}

function isResultLane(lane) {
  return lane === 'result' || lane === 'pp1' || lane === 'pp2' || lane === 'final';
}

function resolveColumnForLane(lane, requestedCol) {
  if (!posedInputState) return null;
  const width = posedInputState.width;
  let col = Math.max(0, Math.min(width - 1, requestedCol));

  if (isCarryLane(lane) && col === 0) col = 1;

  if (col >= width) return null;
  if (isCarryLane(lane) && width <= 1) return null;
  return col;
}

function setMulPhase(phase) {
  if (!posedInputState || posedInputState.kind !== 'mul') return;
  const order = { pp1: 1, pp2: 2, sum: 3 };
  const current = order[posedInputState.mulPhase] || 1;
  const next = order[phase] || 1;
  if (next > current) posedInputState.mulPhase = phase;
}

function resetPosedInputState() {
  posedInputState = null;
  state.elements.question.classList.remove('question-text--posed');
  state.elements.answerDisplay.hidden = false;
  if (state.elements.posedActions) state.elements.posedActions.hidden = true;
  if (state.elements.posedActions) {
    state.elements.posedActions.querySelectorAll('.posed-action-btn').forEach((btn) => {
      btn.classList.remove('is-active');
    });
  }
}

function syncPosedBuffer() {
  if (!posedInputState) return;
  const resultLane = posedInputState.kind === 'mul' ? 'final' : 'result';
  const digits = posedInputState.lanes[resultLane] || [];
  const raw = digits.slice().reverse().join('').replace(/^0+(?=\d)/, '');
  state.inputBuffer = raw;
  state.elements.input.value = raw;
}

function syncPosedActionSelection() {
  if (!state.elements.posedActions || !posedInputState) return;
  const carryActive = isCarryLane(posedInputState.activeLane);
  const resultActive = isResultLane(posedInputState.activeLane);
  state.elements.posedActions.querySelectorAll('.posed-action-btn').forEach((btn) => {
    if (btn.dataset.action === 'posed-mode-result') {
      btn.classList.toggle('is-active', resultActive);
    } else if (btn.dataset.action === 'posed-mode-carry') {
      btn.classList.toggle('is-active', carryActive);
    } else {
      btn.classList.remove('is-active');
    }
  });
}

function setPosedActiveCell(lane, col) {
  if (!posedInputState) return;
  if (!posedInputState.lanes[lane]) return;
  if (posedInputState.kind === 'mul') setMulPhase(getMulPhaseForLane(lane));
  const safeCol = resolveColumnForLane(lane, col);
  if (safeCol === null) return;
  posedInputState.activeLane = lane;
  posedInputState.activeCol = safeCol;
  renderPosedBoard(state.currentQ);
}

function renderPosedBoard(question) {
  if (!posedInputState || !question) return;
  const width = posedInputState.width;
  const cols = `repeat(${width}, minmax(0, 1fr))`;
  const topDigits = getPaddedDigits(question.top, width);
  const bottomDigits = getPaddedDigits(question.bottom, width);
  const lanes = posedInputState.lanes;

  const cellsHtml = (digits, { lane = null, readonlyCols = [] } = {}) => digits.map((digit, idx) => {
    if (!lane) return `<span class="posed-cell">${digit || '&nbsp;'}</span>`;
    const col = width - 1 - idx;
    const readOnly = readonlyCols.includes(col);
    const active = col === posedInputState.activeCol && lane === posedInputState.activeLane ? ' active' : '';
    const empty = digit === '' ? ' empty' : '';
    const value = digit === '' ? (readOnly ? '&nbsp;' : '·') : digit;
    if (readOnly) return `<span class="posed-cell posed-cell--readonly${empty}">${value}</span>`;
    return `<span class="posed-cell${active}${empty}" data-posed-cell="1" data-lane="${lane}" data-col="${col}" role="button" tabindex="0">${value}</span>`;
  }).join('');

  const laneDigits = (lane) => (lanes[lane] || []).slice().reverse();

  state.elements.question.classList.add('question-text--posed');
  if (posedInputState.kind === 'mul') {
    const activePhase = getMulPhaseForLane(posedInputState.activeLane);
    const showRm1 = activePhase === 'pp1';
    const showRm2 = activePhase === 'pp2';
    const showRs = activePhase === 'sum';
    state.elements.question.innerHTML = `
      <div class="posed-board">
        ${showRm1 ? `
        <div class="posed-row posed-row--carry">
          <span class="posed-sign posed-sign--carry">.</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('rm1'), { lane: 'rm1', readonlyCols: [0] })}</div>
        </div>
        ` : ''}
        ${showRm2 ? `
        <div class="posed-row posed-row--carry posed-row--carry-rm2">
          <span class="posed-sign posed-sign--carry">.</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('rm2'), { lane: 'rm2', readonlyCols: [0] })}</div>
        </div>
        ` : ''}
        <div class="posed-row">
          <span class="posed-sign">&nbsp;</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(topDigits)}</div>
        </div>
        <div class="posed-row">
          <span class="posed-sign">${question.operator || '×'}</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(bottomDigits)}</div>
        </div>
        <div class="posed-separator"></div>
        ${showRs ? `
        <div class="posed-row posed-row--carry">
          <span class="posed-sign posed-sign--carry">.</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('rs'), { lane: 'rs', readonlyCols: [0] })}</div>
        </div>
        ` : ''}
        <div class="posed-row">
          <span class="posed-sign">&nbsp;</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('pp1'), { lane: 'pp1' })}</div>
        </div>
        <div class="posed-row">
          <span class="posed-sign">+</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('pp2'), { lane: 'pp2' })}</div>
        </div>
        <div class="posed-separator"></div>
        <div class="posed-row posed-row--result">
          <span class="posed-sign">=</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('final'), { lane: 'final' })}</div>
        </div>
      </div>
    `;
  } else {
    state.elements.question.innerHTML = `
      <div class="posed-board">
        <div class="posed-row posed-row--carry">
          <span class="posed-sign posed-sign--carry">.</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('carry'), { lane: 'carry', readonlyCols: [0] })}</div>
        </div>
        <div class="posed-row">
          <span class="posed-sign">&nbsp;</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(topDigits)}</div>
        </div>
        <div class="posed-row">
          <span class="posed-sign">${question.operator || '+'}</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(bottomDigits)}</div>
        </div>
        <div class="posed-separator"></div>
        <div class="posed-row posed-row--result">
          <span class="posed-sign">=</span>
          <div class="posed-cells" style="grid-template-columns:${cols}">${cellsHtml(laneDigits('result'), { lane: 'result' })}</div>
        </div>
      </div>
    `;
  }
  syncPosedActionSelection();
}

function initPosedInputState(question) {
  const width = getPosedWidth(question);
  if (isPosedMulQuestion(question)) {
    posedInputState = {
      kind: 'mul',
      width,
      mulPhase: 'pp1',
      activeLane: 'pp1',
      activeCol: 0,
      lanes: {
        rm1: Array.from({ length: width }, () => ''),
        rm2: Array.from({ length: width }, () => ''),
        rs: Array.from({ length: width }, () => ''),
        pp1: Array.from({ length: width }, () => ''),
        pp2: Array.from({ length: width }, () => ''),
        final: Array.from({ length: width }, () => ''),
      },
    };
  } else {
    posedInputState = {
      kind: 'addsub',
      width,
      activeLane: 'result',
      activeCol: 0,
      lanes: {
        result: Array.from({ length: width }, () => ''),
        carry: Array.from({ length: width }, () => ''),
      },
    };
  }
  state.elements.answerDisplay.hidden = true;
  if (state.elements.posedActions) state.elements.posedActions.hidden = false;
  syncPosedBuffer();
  renderPosedBoard(question);
}

function commitPosedDigit(digit) {
  if (!posedInputState || !/^\d$/.test(digit)) return;
  const lane = posedInputState.activeLane;
  const col = resolveColumnForLane(lane, posedInputState.activeCol);
  if (col === null) return;
  posedInputState.lanes[lane][col] = digit;

  if (posedInputState.kind === 'mul') {
    setMulPhase(getMulPhaseForLane(lane));
    if (lane === 'rm1') {
      posedInputState.activeLane = 'pp1';
      posedInputState.activeCol = resolveColumnForLane('pp1', col) ?? col;
    } else if (lane === 'rm2') {
      posedInputState.activeLane = 'pp2';
      posedInputState.activeCol = resolveColumnForLane('pp2', col) ?? col;
    } else if (lane === 'rs') {
      posedInputState.activeLane = 'final';
      posedInputState.activeCol = resolveColumnForLane('final', col) ?? col;
    } else {
      posedInputState.activeCol = Math.min(posedInputState.width - 1, col + 1);
    }
  } else if (lane === 'carry') {
    posedInputState.activeLane = 'result';
    posedInputState.activeCol = resolveColumnForLane('result', col) ?? col;
  } else {
    posedInputState.activeCol = Math.min(posedInputState.width - 1, col + 1);
  }
  syncPosedBuffer();
  renderPosedBoard(state.currentQ);
}

function clearPosedDigit() {
  if (!posedInputState) return;
  const lane = posedInputState.activeLane;
  const col = resolveColumnForLane(lane, posedInputState.activeCol);
  if (col === null) return;
  posedInputState.lanes[lane][col] = '';
  syncPosedBuffer();
  renderPosedBoard(state.currentQ);
}

function clearPosedBoard() {
  if (!posedInputState) return;
  Object.keys(posedInputState.lanes).forEach((lane) => {
    posedInputState.lanes[lane] = posedInputState.lanes[lane].map(() => '');
  });
  if (posedInputState.kind === 'mul') {
    posedInputState.mulPhase = 'pp1';
    posedInputState.activeLane = 'pp1';
  } else {
    posedInputState.activeLane = 'result';
  }
  posedInputState.activeCol = 0;
  syncPosedBuffer();
  renderPosedBoard(state.currentQ);
}

function movePosedColumn(delta) {
  if (!posedInputState) return;
  const next = posedInputState.activeCol + delta;
  const clamped = Math.max(0, Math.min(posedInputState.width - 1, next));
  const safeCol = resolveColumnForLane(posedInputState.activeLane, clamped);
  posedInputState.activeCol = safeCol === null ? posedInputState.activeCol : safeCol;
  renderPosedBoard(state.currentQ);
}

export function handlePosedNumpadInput({ digit = null, action = null } = {}) {
  if (!isPosedQuestion()) return false;
  if (digit !== null) {
    commitPosedDigit(digit);
    return true;
  }
  if (action === 'del') {
    clearPosedDigit();
    return true;
  }
  if (action === 'posed-mode-result') {
    const currentPhase = posedInputState?.kind === 'mul'
      ? getMulPhaseForLane(posedInputState.activeLane)
      : null;
    const lane = posedInputState?.kind === 'mul'
      ? getMulResultLaneForPhase(currentPhase)
      : 'result';
    setPosedActiveCell(lane, posedInputState?.activeCol ?? 0);
    return true;
  }
  if (action === 'posed-mode-carry') {
    const currentPhase = posedInputState?.kind === 'mul'
      ? getMulPhaseForLane(posedInputState.activeLane)
      : null;
    const lane = posedInputState?.kind === 'mul'
      ? getMulCarryLaneForPhase(currentPhase)
      : 'carry';
    setPosedActiveCell(lane, posedInputState?.activeCol ?? 0);
    return true;
  }
  if (action === 'posed-clear-cell') {
    clearPosedDigit();
    return true;
  }
  if (action === 'posed-clear-all') {
    clearPosedBoard();
    return true;
  }
  return false;
}

export function handlePosedKeyboardInput(key) {
  if (!isPosedQuestion()) return false;
  if (/^\d$/.test(key)) {
    commitPosedDigit(key);
    return true;
  }
  if (key === 'Backspace') {
    clearPosedDigit();
    return true;
  }
  if (key === 'ArrowLeft') {
    movePosedColumn(1);
    return true;
  }
  if (key === 'ArrowRight') {
    movePosedColumn(-1);
    return true;
  }
  if (key === 'ArrowUp') {
    const lane = posedInputState?.kind === 'mul'
      ? getMulCarryLaneForPhase(getMulPhaseForLane(posedInputState.activeLane))
      : 'carry';
    setPosedActiveCell(lane, posedInputState?.activeCol ?? 0);
    return true;
  }
  if (key === 'ArrowDown') {
    const lane = posedInputState?.kind === 'mul'
      ? getMulResultLaneForPhase(getMulPhaseForLane(posedInputState.activeLane))
      : 'result';
    setPosedActiveCell(lane, posedInputState?.activeCol ?? 0);
    return true;
  }
  return false;
}

export function handlePosedBoardClick(target) {
  if (!isPosedQuestion() || !target) return false;
  const cell = target.closest?.('[data-posed-cell="1"]');
  if (!cell) return false;
  const col = Number(cell.dataset.col);
  if (!Number.isFinite(col)) return false;
  setPosedActiveCell(cell.dataset.lane, col);
  return true;
}

// ─── Mode ─────────────────────────────────────────────────────────────────────
export function lockModeBtns(lock) {
  document.querySelectorAll('.mode-type-item, .mode-op-item, .mode-intent-item, .mode-summary-tag-btn').forEach(b => { b.disabled = lock; });
  if (state.elements.modeMenuCloseBtn) state.elements.modeMenuCloseBtn.disabled = lock;
  if (state.elements.schoolLevelRow) state.elements.schoolLevelRow.querySelectorAll('.school-level-btn').forEach((btn) => { btn.disabled = lock; });
}

export function ensureModeCompatibleWithSchoolLevel() {
  const allowedOps = getAllowedOperations(state.currentSchoolLevel);
  const currentIntent = modeIntent(state.currentMode);
  const currentOp = modeOp(state.currentMode);
  if (state.gameType === 'posed' && ![OP.MIX, OP.ADD, OP.SUB, OP.MUL].includes(currentOp)) {
    state.currentMode = `${currentIntent}_${OP.ADD}`;
    return;
  }
  const mixNotAllowed = currentOp === 'mix' && allowedOps.length < 2;
  const opNotAllowed = currentOp !== 'mix' && !allowedOps.includes(currentOp);
  if (!mixNotAllowed && !opNotAllowed) return;
  state.currentMode = `${currentIntent}_${allowedOps[0]}`;
}

function renderCurrentQuestion(question) {
  if (isPosedQuestion(question)) {
    initPosedInputState(question);
    return;
  }
  resetPosedInputState();
  state.elements.question.textContent = question?.text || '';
}

function setStartStopButtons({ showStart, showStop }) {
  state.elements.startBtn.hidden = !showStart;
  state.elements.stopBtn.hidden = !showStop;
}

function buildQuestionFingerprint(question) {
  if (!question) return '';
  if (question.render === 'posed') {
    return ['posed', question.op, question.top, question.bottom, question.operator].join('|');
  }
  return ['mental', question.op, question.text, question.answer].join('|');
}

function drawUniqueQuestionForRound() {
  if (!(state.roundQuestionFingerprints instanceof Set)) {
    state.roundQuestionFingerprints = new Set();
  }

  let candidate = null;
  for (let attempt = 0; attempt < MAX_QUESTION_RETRY; attempt++) {
    candidate = generateQuestion();
    const fingerprint = buildQuestionFingerprint(candidate);
    if (state.roundQuestionFingerprints.has(fingerprint)) continue;
    state.roundQuestionFingerprints.add(fingerprint);
    return candidate;
  }

  state.roundQuestionFingerprints.clear();
  if (!candidate) candidate = generateQuestion();
  state.roundQuestionFingerprints.add(buildQuestionFingerprint(candidate));
  return candidate;
}

export function setMode(mode, { keepMenuOpen = false } = {}) {
  if (state.gameInProgress) return;
  resetPosedInputState();
  state.sessionActive = false;
  state.currentMode = mode;
  ensureModeCompatibleWithSchoolLevel();
  updateModeBadge(state.currentMode);
  if (!keepMenuOpen) closeModeMenu();
  state.elements.counter.hidden = !isDefiMode(state.currentMode);

  stopTimer();
  clearFeedback();
  hideGameArea();
  updatePlayerDisplay();
  setStartStopButtons({ showStart: true, showStop: false });

  updateScoreVisibility();
  updateTabVisibility();
  updateTriggerVisibility();
}

// ─── Démarrage ────────────────────────────────────────────────────────────────
export function startGame() {
  if (!state.sessionPlayerSelected) {
    state.pendingStart = true;
    showProfilePicker();
    return;
  }

  if (isLibreMode(state.currentMode)) {
    state.pendingStart = false;
    setStartStopButtons({ showStart: false, showStop: true });
    startSession();
    return;
  }
  startActiveGameSession();
}

function startActiveGameSession() {
  state.pendingStart = false;
  state.gameInProgress = true;
  lockModeBtns(true);
  setGameActive(true);
  setStartStopButtons({ showStart: false, showStop: true });
  startSession();
}

export function stopGameSession() {
  resetPosedInputState();
  state.gameInProgress = false;
  state.sessionActive = false;
  stopTimer();
  state.locked = true;
  setInputLocked(true);
  setGameActive(false);
  clearFeedback();
  hideGameArea();
  hideEndScreen();
  lockModeBtns(false);
  setStartStopButtons({ showStart: true, showStop: false });
  updatePlayerDisplay();
  updateTabVisibility();
  updateTriggerVisibility();
}

// ─── Session ──────────────────────────────────────────────────────────────────
export function startSession() {
  closeModeMenu();
  state.sessionActive = true;
  updateTabVisibility();
  updatePlayerDisplay();
  state.roundQuestionFingerprints = new Set();
  resetScore();
  clearInputBuffer();
  if (isSurvieMode(state.currentMode)) resetStreak();
  state.questionNumber = 0;
  hideEndScreen();
  stopTimer();
  showGameArea();
  updateScoreVisibility();
  nextQuestion();
}

// ─── Questions ────────────────────────────────────────────────────────────────
export function nextQuestion() {
  ensureModeCompatibleWithSchoolLevel();
  const isDefi = isDefiMode(state.currentMode);
  const total = getDefiQuestionTotal(state.currentMode);

  if (isDefi && state.questionNumber >= total) {
    showEndScreen();
    return;
  }

  clearFeedback();
  resetPosedInputState();
  state.locked = false;
  setInputLocked(false);
  clearInputBuffer();
  state.elements.question.classList.remove('celebrate', 'pop');

  state.questionNumber++;

  if (isDefi) {
    state.elements.counter.textContent = `${state.questionNumber} / ${total}`;
    state.elements.counter.hidden = false;
  } else {
    state.elements.counter.hidden = true;
  }

  state.currentQ = drawUniqueQuestionForRound();
  renderCurrentQuestion(state.currentQ);

  void state.elements.question.offsetWidth;
  state.elements.question.classList.add('pop');

  if (state.gameType === 'posed') {
    stopTimer();
    state.elements.bar.style.width = '100%';
    state.elements.bar.classList.remove('is-yellow', 'is-red');
  } else {
    syncTimeLimitFromSchoolLevel();
    startTimer();
  }
}

// ─── Soumission ───────────────────────────────────────────────────────────────
export function submitAnswer() {
  if (state.locked) return;
  const raw = state.elements.input.value.trim();
  if (raw === '') return;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) return;

  const pts = snapshotPoints();
  state.locked = true;
  stopTimer();
  setInputLocked(true);

  const outcome = buildAnswerOutcome({
    mode: state.currentMode,
    isCorrect: parsed === state.currentQ.answer,
    userAnswer: parsed,
    points: pts,
  });
  applyRoundOutcome(outcome);
}

// ─── Timeout (enregistré dans engine) ────────────────────────────────────────
function handleTimeout() {
  state.locked = true;
  setInputLocked(true);
  applyRoundOutcome(buildTimeoutOutcome(state.currentMode));
}
setTimeoutHandler(handleTimeout);

function applyRoundOutcome(outcome) {
  if (outcome.streakUpdate === 'increment') {
    updateStreak(true);
  }

  if (outcome.pointsDelta > 0) {
    addPoints(outcome.pointsDelta);
  } else if (outcome.pointsDelta < 0) {
    state.score = Math.max(0, state.score + outcome.pointsDelta);
    state.elements.score.textContent = state.score;
  }

  showFeedback(outcome.feedback);
  setTimeout(outcome.nextAction === 'end-survie' ? endSurvie : nextQuestion, NEXT_DELAY);
}

// La survie s'arrête à la première erreur / timeout : on retient la longueur atteinte.
function endSurvie() {
  state.score = state.streak;
  showEndScreen();
}

// ─── Fin de partie ────────────────────────────────────────────────────────────
export function autoSaveBoards(finalScore) {
  if (!canPersistProfileData()) return;
  const mode = state.currentMode;

  if (mode === 'defi_mix') {
    saveMixedModeEndgameResult({
      finalScore,
      loadBoard: () => loadLeaderboard(state.currentSchoolLevel),
      saveBoard: () => saveToLeaderboard(getActivePlayerName(), finalScore, state.activeProfileId, state.currentSchoolLevel),
      titleKey: 'leaderboard.title.defiMix',
      refreshPanel: renderLeaderboardPanel,
    });
  } else if (mode === 'survie_mix') {
    saveMixedModeEndgameResult({
      finalScore,
      loadBoard: () => loadSurvieLeaderboard(state.currentSchoolLevel),
      saveBoard: () => saveToSurvie(getActivePlayerName(), finalScore, state.activeProfileId, state.currentSchoolLevel),
      titleKey: 'leaderboard.title.survieMix',
      refreshPanel: renderSurvieLeaderboardPanel,
    });
  }
}

function saveMixedModeEndgameResult({ finalScore, loadBoard, saveBoard, titleKey, refreshPanel }) {
  const board = loadBoard();
  const wouldRank = board.length < 5 || finalScore > board[board.length - 1].score;
  if (!wouldRank) return;

  const top5 = saveBoard();
  state.elements.leaderboardSectionTitle.textContent = `${t(titleKey)} · ${getSchoolLevelLabel(state.currentSchoolLevel)}`;
  renderLeaderboard(top5);
  refreshPanel();
  state.elements.leaderboardSection.hidden = false;
}

export function showEndScreen() {
  state.gameInProgress = false;
  state.sessionActive  = false;
  lockModeBtns(false);
  setGameActive(false);
  updateTabVisibility();
  updatePlayerDisplay();
  stopTimer();
  state.locked = true;
  setInputLocked(true);
  setStartStopButtons({ showStart: false, showStop: false });

  const mode = state.currentMode;
  const survie = isSurvieMode(mode);
  const finalScore = getFinalScoreForMode(mode, { score: state.score, streak: state.streak });

  state.elements.endScoreValue.textContent = finalScore;
  state.elements.leaderboardSection.hidden = true;

  if (survie) {
    state.elements.endLabel.textContent = t('end.label.survie');
  } else {
    state.elements.endLabel.textContent = t('end.label.defi');
  }

  const logged = shouldLogSessionScore(mode);
  if (logged) {
    state.elements.endPlayerNameValue.textContent = getActivePlayerLabel();
    state.elements.endPlayerNameSection.hidden = false;
    autoSaveBoards(finalScore);
    if (canPersistProfileData()) {
      logProfileSession(state.activeProfileId, {
        date: new Date().toISOString().slice(0, 10),
        mode,
        score: finalScore,
        schoolLevel: state.currentSchoolLevel,
        gameType: state.gameType,
      });
    }
  } else {
    state.elements.endPlayerNameSection.hidden = true;
  }

  state.elements.endScreen.hidden = false;
  state.elements.endScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function hideEndScreen() {
  state.elements.endScreen.hidden = true;
  state.elements.endPlayerNameSection.hidden = true;
  state.elements.leaderboardSection.hidden = true;
  state.locked = false;
  setInputLocked(false);
}
