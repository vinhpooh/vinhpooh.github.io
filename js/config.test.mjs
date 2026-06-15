import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModeFromSelection,
  isLibreIntentAvailableForGameType,
  resolveIntentForSelection,
} from './config.js';

test('isLibreIntentAvailableForGameType autorise mental et pose', () => {
  assert.equal(isLibreIntentAvailableForGameType('mental'), true);
  assert.equal(isLibreIntentAvailableForGameType('posed'), true);
  assert.equal(isLibreIntentAvailableForGameType('unknown'), false);
});

test('buildModeFromSelection conserve libre avec mix pour les types supportes', () => {
  assert.equal(
    buildModeFromSelection({ intent: 'libre', op: 'mix', gameType: 'mental' }),
    'libre_mix',
  );
  assert.equal(
    buildModeFromSelection({ intent: 'libre', op: 'mix', gameType: 'posed' }),
    'libre_mix',
  );
});

test('resolveIntentForSelection replie libre vers defi pour type non supporte', () => {
  assert.equal(resolveIntentForSelection('libre', { gameType: 'unknown' }), 'defi');
  assert.equal(resolveIntentForSelection('defi', { gameType: 'unknown' }), 'defi');
});
