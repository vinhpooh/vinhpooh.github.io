// js/game-domain.js — Règles métier pures pour les rounds de jeu

import { DEFI_MIX_TOTAL, DEFI_OP_TOTAL, TIMEOUT_PENALTY } from './config.js';
import { isMixOp, isDefiMode, isSurvieMode } from './engine.js';

export function getDefiQuestionTotal(mode) {
  return isMixOp(mode) ? DEFI_MIX_TOTAL : DEFI_OP_TOTAL;
}

export function buildAnswerOutcome({ mode, isCorrect, userAnswer, points }) {
  if (isCorrect) {
    if (isDefiMode(mode)) {
      return {
        pointsDelta: points,
        streakUpdate: null,
        feedback: { type: 'correct', pts: points, intent: 'defi' },
        nextAction: 'next',
      };
    }
    if (isSurvieMode(mode)) {
      return {
        pointsDelta: 0,
        streakUpdate: 'increment',
        feedback: { type: 'correct', intent: 'survie' },
        nextAction: 'next',
      };
    }
    return {
      pointsDelta: 0,
      streakUpdate: null,
      feedback: { type: 'correct', intent: 'libre' },
      nextAction: 'next',
    };
  }

  if (isDefiMode(mode)) {
    return {
      pointsDelta: -points,
      streakUpdate: null,
      feedback: { type: 'wrong', penalty: points, userAnswer, intent: 'defi' },
      nextAction: 'next',
    };
  }
  if (isSurvieMode(mode)) {
    return {
      pointsDelta: 0,
      streakUpdate: null,
      feedback: { type: 'wrong', penalty: 0, userAnswer, intent: 'survie' },
      nextAction: 'end-survie',
    };
  }
  return {
    pointsDelta: 0,
    streakUpdate: null,
    feedback: { type: 'wrong', penalty: 0, userAnswer, intent: 'libre' },
    nextAction: 'next',
  };
}

export function buildTimeoutOutcome(mode) {
  if (isDefiMode(mode)) {
    return {
      pointsDelta: -TIMEOUT_PENALTY,
      streakUpdate: null,
      feedback: { type: 'timeout', penalty: TIMEOUT_PENALTY, intent: 'defi' },
      nextAction: 'next',
    };
  }
  if (isSurvieMode(mode)) {
    return {
      pointsDelta: 0,
      streakUpdate: null,
      feedback: { type: 'timeout', penalty: 0, intent: 'survie' },
      nextAction: 'end-survie',
    };
  }
  return {
    pointsDelta: 0,
    streakUpdate: null,
    feedback: { type: 'timeout', penalty: 0, intent: 'libre' },
    nextAction: 'next',
  };
}

export function getFinalScoreForMode(mode, { score, streak }) {
  return isSurvieMode(mode) ? streak : score;
}

export function shouldLogSessionScore(mode) {
  return isDefiMode(mode) || isSurvieMode(mode);
}
