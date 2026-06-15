// js/i18n.js — Internationalisation FR/EN

import { saveLanguage, loadLanguage } from './storage.js';

const LANG_FR = 'fr';
const LANG_EN = 'en';

const LANG_DISPLAY_NAMES = {
  fr: '🇫🇷 Français',
  en: '🇬🇧 English',
};

const OP_LABELS = {
  fr: { mix: '➕➖✖️➗ Mix', add: '➕ Addition', sub: '➖ Soustraction', mul: '✖️ Multiplication', div: '➗ Division' },
  en: { mix: '➕➖✖️➗ Mix', add: '➕ Addition', sub: '➖ Subtraction', mul: '✖️ Multiplication', div: '➗ Division' },
};

const TYPE_LABELS = {
  fr: { mental: '🧠 Mental', posed: '📝 Posé' },
  en: { mental: '🧠 Mental', posed: '📝 Written' },
};

const OP_SHORT_LABELS = {
  fr: { mix: 'Mix', add: '➕ Add', sub: '➖ Sous', mul: '✖️ Mult', div: '➗ Div' },
  en: { mix: 'Mix', add: '➕ Add', sub: '➖ Sub',  mul: '✖️ Mult', div: '➗ Div' },
};

const INTENT_LABELS = {
  fr: { defi: '🎯 Défi', survie: '⚡ Survie', libre: '🟢 Libre' },
  en: { defi: '🎯 Challenge', survie: '⚡ Survival', libre: '🟢 Free' },
};

const MODE_LABELS = {
  fr: {
    defi_mix: '➕➖✖️➗ Mix · 🎯 Défi',
    defi_add: '➕ Add. · 🎯 Défi',
    defi_sub: '➖ Soust. · 🎯 Défi',
    defi_mul: '✖️ Mult. · 🎯 Défi',
    defi_div: '➗ Div. · 🎯 Défi',
    survie_mix: '➕➖✖️➗ Mix · ⚡ Survie',
    survie_add: '➕ Add. · ⚡ Survie',
    survie_sub: '➖ Soust. · ⚡ Survie',
    survie_mul: '✖️ Mult. · ⚡ Survie',
    survie_div: '➗ Div. · ⚡ Survie',
    libre_mix: '➕➖✖️➗ Mix · 🟢 Libre',
    libre_add: '➕ Add. · 🟢 Libre',
    libre_sub: '➖ Soust. · 🟢 Libre',
    libre_mul: '✖️ Mult. · 🟢 Libre',
    libre_div: '➗ Div. · 🟢 Libre',
  },
  en: {
    defi_mix: '➕➖✖️➗ Mix · 🎯 Challenge',
    defi_add: '➕ Add. · 🎯 Challenge',
    defi_sub: '➖ Sub. · 🎯 Challenge',
    defi_mul: '✖️ Mult. · 🎯 Challenge',
    defi_div: '➗ Div. · 🎯 Challenge',
    survie_mix: '➕➖✖️➗ Mix · ⚡ Survival',
    survie_add: '➕ Add. · ⚡ Survival',
    survie_sub: '➖ Sub. · ⚡ Survival',
    survie_mul: '✖️ Mult. · ⚡ Survival',
    survie_div: '➗ Div. · ⚡ Survival',
    libre_mix: '➕➖✖️➗ Mix · 🟢 Free Play',
    libre_add: '➕ Add. · 🟢 Free Play',
    libre_sub: '➖ Sub. · 🟢 Free Play',
    libre_mul: '✖️ Mult. · 🟢 Free Play',
    libre_div: '➗ Div. · 🟢 Free Play',
  },
};

const SCHOOL_LEVEL_LABELS = {
  fr: {
    primary_cp: '🌱 CP',
    primary_ce1: '🌿 CE1',
    primary_ce2: '🌼 CE2',
    primary_cm1: '🌻 CM1',
    primary_cm2: '🌞 CM2',
    middle_6e: '6e',
    middle_5e: '5e',
    middle_4e: '4e',
    middle_3e: '3e',
  },
  en: {
    primary_cp: '🌱 Grade 1',
    primary_ce1: '🌿 Grade 2',
    primary_ce2: '🌼 Grade 3',
    primary_cm1: '🌻 Grade 4',
    primary_cm2: '🌞 Grade 5',
    middle_6e: '6th',
    middle_5e: '7th',
    middle_4e: '8th',
    middle_3e: '9th',
  },
};

const CHEERS = {
  fr: ['Excellent ! 🌟', 'Bravo ! 🎉', 'Super ! 🚀', 'Fantastique ! 🎊', 'Parfait ! ⭐', 'Génial ! 🏆', 'Incroyable ! 🔥'],
  en: ['Excellent! 🌟', 'Great job! 🎉', 'Awesome! 🚀', 'Fantastic! 🎊', 'Perfect! ⭐', 'Amazing! 🏆', 'Incredible! 🔥'],
};

const OOPS = {
  fr: ['Continue ! 💪', 'Presque ! 😊', 'La prochaine fois ! 🌈', 'Tu vas y arriver ! 🤗', 'Pas de problème ! 😄', 'Essaie encore ! 👍'],
  en: ['Keep going! 💪', 'Almost! 😊', 'Next time! 🌈', 'You can do it! 🤗', 'No worries! 😄', 'Try again! 👍'],
};

const MESSAGES = {
  fr: {
    'meta.title': '🧮 Jeu de Maths',
    'header.title': '🧮 Jeu de Maths',
    'tabs.play': 'Jouer',
    'tabs.progress': 'Progression',
    'tabs.leaderboard': 'Classement',
    'mode.whatToPractice': 'Quoi réviser ?',
    'mode.back': '‹ Retour',
    'mode.intent.defi': '🎯 Défi <span class="mode-sub">chronométré · noté</span>',
    'mode.intent.survie': '⚡ Survie <span class="mode-sub">sans faute · bats ton record</span>',
    'mode.intent.libre': '🟢 Libre <span class="mode-sub">libre · sans limite</span>',
    'mode.section.type': 'Type de jeu',
    'mode.section.op': 'Opération',
    'mode.section.intent': 'Mode',
    'mode.section.level': 'Niveau scolaire',
    'mode.config.title': 'Configuration',
    'mode.summary.aria': 'Configuration active',
    'mode.done': '✅ Terminé',
    'mode.type.mental': 'Mental',
    'mode.type.posed': 'Posé',
    'posed.action.modeResult': '🎯 Résultat',
    'posed.action.modeCarry': '⬆️ Retenue',
    'posed.action.clearCell': '⌫ Effacer case',
    'posed.action.clearAll': '🧽 Vider ardoise',
    'score.label': 'Score',
    'score.streak': '🔥 Série',
    'answer.placeholder': 'Ta réponse…',
    'button.start': '▶️ Démarrer',
    'button.stop': '🛑 Arrêter',
    'end.title': 'Partie terminée !',
    'end.sub.defi': '{total} questions répondues',
    'end.sub.survie': 'Survie terminée',
    'end.label.defi': 'Score final',
    'end.label.survie': 'Meilleure série',
    'button.playAgain': '🔁 Rejouer',
    'leaderboard.title.competition': '🏆 Classement Compétition',
    'leaderboard.title.defiMix': '🏆 Classement Meilleur Défi Mix',
    'leaderboard.title.survieMix': '⚡ Classement Meilleure Survie Mix',
    'leaderboard.panel.defiMix': '🏆 Meilleur 🎯 Défi • ➕➖✖️➗ Mix',
    'leaderboard.panel.survieMix': '🏆 Meilleure ⚡ Survie • ➕➖✖️➗ Mix',
    'leaderboard.col.name': 'Prénom',
    'leaderboard.col.survie': 'Série',
    'leaderboard.emptyHint': 'Aucun score enregistré pour le niveau {level}. Termine une partie en Défi Mix ou Survie Mix avec un profil pour alimenter ce classement. 🎮',
    'progression.group.defi': '🎯 Défi',
    'progression.group.survie': '⚡ Survie',
    'progression.empty.noProfile': 'La progression est disponible uniquement pour les profils. Choisis un profil pour afficher tes statistiques. 👤',
    'progression.empty.noGame': 'Aucune partie enregistrée sur ce terrain. Termine au moins une partie Défi ou Survie pour afficher la progression. 🚀',
    'progression.kpi.best.score': 'Meilleur score',
    'progression.kpi.best.streak': 'Meilleure série',
    'progression.kpi.games.one': 'Partie jouée',
    'progression.kpi.games.many': 'Parties jouées',
    'progression.next.unlock': 'Encore {remaining} pour débloquer {badge}',
    'progression.max': '👑 Palier maximum atteint ! Bravo !',
    'progression.chart.aria': 'Historique de tes dernières parties',
    'progression.trophy.title': 'Atteins {value}',
    'progression.selector.type': 'Type',
    'progression.selector.op': 'Opération',
    'progression.selector.intent': 'Mode de jeu',
    'progression.selector.level': 'Niveau',
    'progression.type.mental': '🧠 Mental',
    'progression.type.posed': '📝 Posé',
    'progression.op.mix': 'Mix',
    'progression.op.add': 'Addition',
    'progression.op.sub': 'Soustraction',
    'progression.op.mul': 'Multiplication',
    'progression.op.div': 'Division',
    'progression.intent.defi': '🎯 Défi',
    'progression.intent.survie': '⚡ Survie',
    'progression.intent.libre': '🟢 Libre',
    'progression.empty.bannerNoData': 'ℹ️ Pas encore de données pour cette combinaison.',
    'progression.empty.goalTitle': '🎯 Premier objectif',
    'progression.empty.goalHint': 'Termine 1 partie pour débloquer cette progression.',
    'progression.empty.goalTarget': 'Cible : {type} · {op} · {intent} · {level}',
    'progression.empty.goalAction': '▶️ Démarrer avec ces paramètres',
    'progression.empty.noLevel': 'Aucune partie à ce niveau. Joue une partie pour voir ta progression ! 🚀',
    'feedback.timeout': 'Temps écoulé !',
    'feedback.yourAnswer': 'Votre réponse',
    'feedback.correctAnswer': 'Correct',
    'feedback.points': '+{value} points !',
    'feedback.penalty': '−{value} points',
    'feedback.survieStreak': '⚡ Survie ×{streak}',
    'profile.guest': 'Invité',
    'profile.choose': 'Choisir un profil',
    'profile.label.guest': '🕶️ Invité',
    'profile.label.choose': '👤 Choisir un profil',
    'profile.empty': 'Aucun profil pour le moment.',
    'profile.lastBadge': 'dernier profil',
    'profile.modal.title': '👥 Qui joue ?',
    'profile.modal.hint': 'Choisis un profil, crée-en un, ou joue en invité.',
    'profile.modal.languageLabel': 'Langue',
    'profile.modal.language.fr': '🇫🇷 Français',
    'profile.modal.language.en': '🇬🇧 English',
    'profile.new': '➕ Nouveau profil',
    'profile.guestBtn': '👤 Jouer en invité',
    'profile.create.title': '✨ Créer un profil',
    'profile.create.hint': 'Écris ton prénom et choisis ton animal',
    'profile.create.placeholder': 'Prénom (1 à 20 caractères)',
    'profile.create.error.required': 'Le prénom doit contenir au moins 1 caractère.',
    'profile.create.error.taken': 'Ce prénom est déjà utilisé par un autre profil.',
    'profile.create.error.failed': 'Impossible de créer ce profil.',
    'profile.create.confirm': '▶️ Créer et jouer',
    'profile.back': '↩️ Retour',
    'profile.edit.title': '✏️ Modifier le profil',
    'profile.edit.hint': 'Change ton prénom ou choisis un autre animal',
    'profile.edit.error.required': 'Le prénom doit contenir au moins 1 caractère.',
    'profile.edit.error.taken': 'Ce prénom est déjà utilisé par un autre profil.',
    'profile.edit.error.failed': "Impossible d'enregistrer ce profil.",
    'profile.edit.confirm': '💾 Enregistrer',
    'profile.delete': '🗑️ Supprimer ce profil',
    'profile.delete.warning': '⚠️ Supprimer définitivement ce profil et tous ses scores ?',
    'profile.delete.confirm': '🗑️ Oui, supprimer',
    'profile.delete.cancel': 'Annuler',
    'schoolLevel.label': 'Niveau scolaire',
    'settings.title': '⚙️ Paramètres',
    'settings.section.general': '🌐 Général · cet appareil',
    'settings.section.personal': '👤 Personnel · {who}',
    'settings.label.theme': 'Thème',
    'settings.theme.light': '☀️ Clair',
    'settings.theme.dark': '🌙 Sombre',
    'settings.label.language': 'Langue',
    'settings.language.fr': '🇫🇷 Français',
    'settings.language.en': '🇬🇧 English',
    'settings.label.board': 'Classement global',
    'settings.board.hint': 'Le nettoyage conserve seulement les scores liés à un profil existant.',
    'settings.board.placeholder': 'Code de validation',
    'settings.board.clean': '🗑️ Nettoyer le classement',
    'settings.label.layout': 'Disposition du pavé numérique',
    'settings.layout.pc': 'PC',
    'settings.layout.mobile': 'Mobile',
    'settings.close': 'Fermer',
    'settings.reset.wrong': 'Code incorrect. Nettoyage annulé.',
    'settings.reset.done': 'Nettoyage effectué : {defi} score(s) Défi et {survie} score(s) Survie conservés.',
  },
  en: {
    'meta.title': '🧮 Math Game',
    'header.title': '🧮 Math Game',
    'tabs.play': 'Play',
    'tabs.progress': 'Progress',
    'tabs.leaderboard': 'Leaderboard',
    'mode.whatToPractice': 'What do you want to practice?',
    'mode.back': '‹ Back',
    'mode.intent.defi': '🎯 Challenge <span class="mode-sub">timed · scored</span>',
    'mode.intent.survie': '⚡ Survival <span class="mode-sub">no mistakes · beat your record</span>',
    'mode.intent.libre': '🟢 Free Play <span class="mode-sub">free · no limits</span>',
    'mode.section.type': 'Game type',
    'mode.section.op': 'Operation',
    'mode.section.intent': 'Mode',
    'mode.section.level': 'School level',
    'mode.config.title': 'Configuration',
    'mode.summary.aria': 'Active configuration',
    'mode.done': '✅ Done',
    'mode.type.mental': 'Mental',
    'mode.type.posed': 'Written',
    'posed.action.modeResult': '🎯 Result',
    'posed.action.modeCarry': '⬆️ Carry',
    'posed.action.clearCell': '⌫ Clear cell',
    'posed.action.clearAll': '🧽 Clear board',
    'score.label': 'Score',
    'score.streak': '🔥 Streak',
    'answer.placeholder': 'Your answer…',
    'button.start': '▶️ Start',
    'button.stop': '🛑 Stop',
    'end.title': 'Game over!',
    'end.sub.defi': '{total} questions answered',
    'end.sub.survie': 'Survival ended',
    'end.label.defi': 'Final score',
    'end.label.survie': 'Best streak',
    'button.playAgain': '🔁 Play again',
    'leaderboard.title.competition': '🏆 Competition Leaderboard',
    'leaderboard.title.defiMix': '🏆 Best Mix Challenge Leaderboard',
    'leaderboard.title.survieMix': '⚡ Best Mix Survival Leaderboard',
    'leaderboard.panel.defiMix': '🏆 Best 🎯 Challenge • ➕➖✖️➗ Mix',
    'leaderboard.panel.survieMix': '🏆 Best ⚡ Survival • ➕➖✖️➗ Mix',
    'leaderboard.col.name': 'Name',
    'leaderboard.col.survie': 'Streak',
    'leaderboard.emptyHint': 'No score saved yet for {level}. Finish a Mix Challenge or Mix Survival game with a profile to fill this leaderboard. 🎮',
    'progression.group.defi': '🎯 Challenge',
    'progression.group.survie': '⚡ Survival',
    'progression.empty.noProfile': 'Progress is available for profiles only. Pick a profile to display your stats. 👤',
    'progression.empty.noGame': 'No game recorded on this terrain yet. Finish at least one Challenge or Survival game to display progress. 🚀',
    'progression.kpi.best.score': 'Best score',
    'progression.kpi.best.streak': 'Best streak',
    'progression.kpi.games.one': 'Game played',
    'progression.kpi.games.many': 'Games played',
    'progression.next.unlock': '{remaining} more to unlock {badge}',
    'progression.max': '👑 Maximum tier reached! Great job!',
    'progression.chart.aria': 'History of your last games',
    'progression.trophy.title': 'Reach {value}',
    'progression.selector.type': 'Type',
    'progression.selector.op': 'Operation',
    'progression.selector.intent': 'Game mode',
    'progression.selector.level': 'Level',
    'progression.type.mental': '🧠 Mental',
    'progression.type.posed': '📝 Written',
    'progression.op.mix': 'Mix',
    'progression.op.add': 'Addition',
    'progression.op.sub': 'Subtraction',
    'progression.op.mul': 'Multiplication',
    'progression.op.div': 'Division',
    'progression.intent.defi': '🎯 Challenge',
    'progression.intent.survie': '⚡ Survival',
    'progression.intent.libre': '🟢 Free Play',
    'progression.empty.bannerNoData': 'ℹ️ No data yet for this combination.',
    'progression.empty.goalTitle': '🎯 First objective',
    'progression.empty.goalHint': 'Finish 1 game to unlock this progression.',
    'progression.empty.goalTarget': 'Target: {type} · {op} · {intent} · {level}',
    'progression.empty.goalAction': '▶️ Start with these settings',
    'progression.empty.noLevel': 'No game at this level yet. Play a game to see your progress! 🚀',
    'feedback.timeout': 'Time is up!',
    'feedback.yourAnswer': 'Your answer',
    'feedback.correctAnswer': 'Correct',
    'feedback.points': '+{value} points!',
    'feedback.penalty': '−{value} points',
    'feedback.survieStreak': '⚡ Survival ×{streak}',
    'profile.guest': 'Guest',
    'profile.choose': 'Choose a profile',
    'profile.label.guest': '🕶️ Guest',
    'profile.label.choose': '👤 Choose a profile',
    'profile.empty': 'No profile yet.',
    'profile.lastBadge': 'last profile',
    'profile.modal.title': '👥 Who is playing?',
    'profile.modal.hint': 'Choose a profile, create one, or play as guest.',
    'profile.modal.languageLabel': 'Language',
    'profile.modal.language.fr': '🇫🇷 French',
    'profile.modal.language.en': '🇬🇧 English',
    'profile.new': '➕ New profile',
    'profile.guestBtn': '👤 Play as guest',
    'profile.create.title': '✨ Create profile',
    'profile.create.hint': 'Write your name and pick your animal',
    'profile.create.placeholder': 'First name (1 to 20 characters)',
    'profile.create.error.required': 'First name must contain at least 1 character.',
    'profile.create.error.taken': 'This name is already used by another profile.',
    'profile.create.error.failed': 'Unable to create this profile.',
    'profile.create.confirm': '▶️ Create and play',
    'profile.back': '↩️ Back',
    'profile.edit.title': '✏️ Edit profile',
    'profile.edit.hint': 'Change your name or pick another animal',
    'profile.edit.error.required': 'First name must contain at least 1 character.',
    'profile.edit.error.taken': 'This name is already used by another profile.',
    'profile.edit.error.failed': 'Unable to save this profile.',
    'profile.edit.confirm': '💾 Save',
    'profile.delete': '🗑️ Delete this profile',
    'profile.delete.warning': '⚠️ Delete this profile and all its scores permanently?',
    'profile.delete.confirm': '🗑️ Yes, delete',
    'profile.delete.cancel': 'Cancel',
    'schoolLevel.label': 'School level',
    'settings.title': '⚙️ Settings',
    'settings.section.general': '🌐 General · this device',
    'settings.section.personal': '👤 Personal · {who}',
    'settings.label.theme': 'Theme',
    'settings.theme.light': '☀️ Light',
    'settings.theme.dark': '🌙 Dark',
    'settings.label.language': 'Language',
    'settings.language.fr': '🇫🇷 French',
    'settings.language.en': '🇬🇧 English',
    'settings.label.board': 'Global leaderboard',
    'settings.board.hint': 'Cleanup keeps only scores linked to existing profiles.',
    'settings.board.placeholder': 'Validation code',
    'settings.board.clean': '🗑️ Clean leaderboard',
    'settings.label.layout': 'Numpad layout',
    'settings.layout.pc': 'PC',
    'settings.layout.mobile': 'Mobile',
    'settings.close': 'Close',
    'settings.reset.wrong': 'Wrong code. Cleanup canceled.',
    'settings.reset.done': 'Cleanup done: kept {defi} Challenge score(s) and {survie} Survival score(s).',
  },
};

let currentLanguage = LANG_FR;
let languageChangeHandler = null;

function normalizeLanguage(lang) {
  return lang === LANG_EN ? LANG_EN : LANG_FR;
}

function formatMessage(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (params[key] ?? `{${key}}`));
}

export function t(key, params = null) {
  const dict = MESSAGES[currentLanguage] || MESSAGES.fr;
  const fallback = MESSAGES.fr[key] || key;
  const value = dict[key] || fallback;
  return formatMessage(value, params);
}

export function getLanguage() {
  return currentLanguage;
}

export function getTypeLabel(type) {
  return TYPE_LABELS[currentLanguage]?.[type] || type;
}

export function getOpLabel(op) {
  return OP_LABELS[currentLanguage]?.[op] || op;
}

export function getOpShortLabel(op) {
  return OP_SHORT_LABELS[currentLanguage]?.[op] || op;
}

export function getIntentLabel(intent) {
  return INTENT_LABELS[currentLanguage]?.[intent] || intent;
}

export function getSchoolLevelLabel(level) {
  return SCHOOL_LEVEL_LABELS[currentLanguage][level] || level;
}

export function getSchoolLevelDisplayParts(level) {
  const label = getSchoolLevelLabel(level);
  if (typeof label !== 'string') return { icon: '', text: String(level || '') };
  const match = label.match(/^(\S+)\s+(.+)$/u);
  if (!match) return { icon: '', text: label };
  return { icon: match[1], text: match[2] };
}

export function getCheers() {
  return CHEERS[currentLanguage];
}

export function getOops() {
  return OOPS[currentLanguage];
}

function setText(selector, key, params = null) {
  const el = document.querySelector(selector);
  if (el) el.textContent = t(key, params);
}

function setHtml(selector, key) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = t(key);
}

export function applyI18n() {
  document.title = t('meta.title');
  document.documentElement.lang = currentLanguage;

  setText('.game-title-row h1', 'header.title');
  setText('#tab-jouer .tab-label', 'tabs.play');
  setText('#tab-progression .tab-label', 'tabs.progress');
  setText('#tab-classement .tab-label', 'tabs.leaderboard');
  setText('#mode-section-type-label', 'mode.section.type');
  setText('#mode-section-op-label', 'mode.section.op');
  setText('#mode-section-intent-label', 'mode.section.intent');
  setText('#mode-section-level-label', 'mode.section.level');
  setText('#mode-menu-close-btn', 'mode.done');
  setText('[data-action="posed-mode-result"]', 'posed.action.modeResult');
  setText('[data-action="posed-mode-carry"]', 'posed.action.modeCarry');
  setText('[data-action="posed-clear-cell"]', 'posed.action.clearCell');
  setText('[data-action="posed-clear-all"]', 'posed.action.clearAll');
  setText('#start-btn', 'button.start');
  setText('#stop-btn', 'button.stop');
  setText('.end-title', 'end.title');
  setText('#play-again-btn', 'button.playAgain');
  setText('#settings-title', 'settings.title');
  setText('#settings-close-btn', 'settings.close');

  const scoreLabel = document.querySelector('#score-card .score-label');
  if (scoreLabel) scoreLabel.textContent = t('score.label');
  const streakLabel = document.querySelector('#streak-card .score-label');
  if (streakLabel) streakLabel.textContent = t('score.streak');
  const answer = document.getElementById('answer-display');
  if (answer && answer.classList.contains('placeholder')) answer.textContent = t('answer.placeholder');
  const modeSummaryTags = document.getElementById('mode-summary-tags');
  if (modeSummaryTags) modeSummaryTags.setAttribute('aria-label', t('mode.summary.aria'));

  const typeItems = document.querySelectorAll('.mode-type-item[data-type]');
  typeItems.forEach((btn) => {
    const name = btn.querySelector('.mode-type-name');
    if (name) name.textContent = t(`mode.type.${btn.dataset.type}`);
  });

  const intentItems = document.querySelectorAll('.mode-intent-item[data-intent]');
  intentItems.forEach((btn) => {
    const name = btn.querySelector('.mode-intent-name');
    if (name) name.textContent = INTENT_LABELS[currentLanguage]?.[btn.dataset.intent] || btn.dataset.intent;
  });

  const opButtons = document.querySelectorAll('.mode-op-item[data-op]');
  opButtons.forEach((btn) => {
    const name = btn.querySelector('.mode-op-name');
    if (!name) return;
    const rawLabel = OP_SHORT_LABELS[currentLanguage]?.[btn.dataset.op] || btn.dataset.op;
    name.textContent = btn.dataset.op === 'mix'
      ? rawLabel.replace(/^\S+\s+/, '')
      : rawLabel;
  });

  const leaderboardNameHeaders = document.querySelectorAll('#panel-classement thead tr th:nth-child(2), #leaderboard-section thead tr th:nth-child(2)');
  leaderboardNameHeaders.forEach((th) => { th.textContent = t('leaderboard.col.name'); });
  const survieHeader = document.querySelector('#survie-leaderboard-panel thead tr th:nth-child(3)');
  if (survieHeader) survieHeader.textContent = t('leaderboard.col.survie');

  setText('#profile-picker-title', 'profile.modal.title');
  const pickerHint = document.querySelector('#profile-picker-view .modal-hint');
  if (pickerHint) pickerHint.textContent = t('profile.modal.hint');
  setText('#profile-language-label', 'profile.modal.languageLabel');
  const profileLangFr = document.querySelector('[data-profile-language-choice="fr"]');
  const profileLangEn = document.querySelector('[data-profile-language-choice="en"]');
  if (profileLangFr) profileLangFr.textContent = LANG_DISPLAY_NAMES.fr;
  if (profileLangEn) profileLangEn.textContent = LANG_DISPLAY_NAMES.en;
  setText('#profile-new-btn', 'profile.new');
  setText('#profile-guest-btn', 'profile.guestBtn');
  const createTitle = document.querySelector('#profile-create-view .modal-title');
  if (createTitle) createTitle.textContent = t('profile.create.title');
  const createHint = document.querySelector('#profile-create-view .modal-hint');
  if (createHint) createHint.textContent = t('profile.create.hint');
  const createInput = document.getElementById('profile-name-input');
  if (createInput) createInput.placeholder = t('profile.create.placeholder');
  setText('#profile-create-error', 'profile.create.error.required');
  setText('#profile-create-confirm-btn', 'profile.create.confirm');
  setText('#profile-create-cancel-btn', 'profile.back');

  const editTitle = document.querySelector('#profile-edit-view .modal-title');
  if (editTitle) editTitle.textContent = t('profile.edit.title');
  const editHint = document.querySelector('#profile-edit-view .modal-hint');
  if (editHint) editHint.textContent = t('profile.edit.hint');
  const editInput = document.getElementById('profile-edit-name-input');
  if (editInput) editInput.placeholder = t('profile.create.placeholder');
  setText('#profile-edit-error', 'profile.edit.error.required');
  setText('#profile-edit-confirm-btn', 'profile.edit.confirm');
  setText('#profile-edit-cancel-btn', 'profile.back');
  setText('#profile-delete-btn', 'profile.delete');
  setText('.profile-delete-warning', 'profile.delete.warning');
  setText('#profile-delete-confirm-btn', 'profile.delete.confirm');
  setText('#profile-delete-cancel-btn', 'profile.delete.cancel');

  const settingsSectionTitles = document.querySelectorAll('.settings-section-title');
  if (settingsSectionTitles[0]) settingsSectionTitles[0].textContent = t('settings.section.general');
  const themeLabel = document.querySelector('#theme-options')?.parentElement?.querySelector('.settings-label');
  if (themeLabel) themeLabel.textContent = t('settings.label.theme');
  const themeLight = document.querySelector('[data-theme-choice="light"]');
  if (themeLight) themeLight.textContent = t('settings.theme.light');
  const themeDark = document.querySelector('[data-theme-choice="dark"]');
  if (themeDark) themeDark.textContent = t('settings.theme.dark');
  const boardLabel = document.querySelector('.settings-group-danger .settings-label');
  if (boardLabel) boardLabel.textContent = t('settings.label.board');
  const boardHint = document.querySelector('.settings-danger-hint');
  if (boardHint) boardHint.textContent = t('settings.board.hint');
  const boardInput = document.getElementById('leaderboard-reset-code-input');
  if (boardInput) boardInput.placeholder = t('settings.board.placeholder');
  const boardBtn = document.getElementById('leaderboard-reset-btn');
  if (boardBtn) boardBtn.textContent = t('settings.board.clean');
  const layoutLabel = document.querySelector('#layout-options')?.parentElement?.querySelector('.settings-label');
  if (layoutLabel) layoutLabel.textContent = t('settings.label.layout');
  const layoutPc = document.querySelector('[data-layout-choice="pc"]');
  if (layoutPc) {
    layoutPc.innerHTML = '<span class="layout-icon layout-icon--pc" aria-hidden="true"><span class="layout-icon-row"><span class="layout-icon-cell">7</span><span class="layout-icon-cell">8</span><span class="layout-icon-cell">9</span></span><span class="layout-icon-row"><span class="layout-icon-cell">4</span><span class="layout-icon-cell">5</span><span class="layout-icon-cell">6</span></span><span class="layout-icon-row"><span class="layout-icon-cell">1</span><span class="layout-icon-cell">2</span><span class="layout-icon-cell">3</span></span><span class="layout-icon-row"><span class="layout-icon-cell">⌫</span><span class="layout-icon-cell">0</span><span class="layout-icon-cell">✓</span></span></span><span class="settings-option-label"></span>';
    const label = layoutPc.querySelector('.settings-option-label');
    if (label) label.textContent = t('settings.layout.pc');
  }
  const layoutMobile = document.querySelector('[data-layout-choice="mobile"]');
  if (layoutMobile) {
    layoutMobile.innerHTML = '<span class="layout-icon layout-icon--mobile" aria-hidden="true"><span class="layout-icon-row"><span class="layout-icon-cell">1</span><span class="layout-icon-cell">2</span><span class="layout-icon-cell">3</span></span><span class="layout-icon-row"><span class="layout-icon-cell">4</span><span class="layout-icon-cell">5</span><span class="layout-icon-cell">6</span></span><span class="layout-icon-row"><span class="layout-icon-cell">7</span><span class="layout-icon-cell">8</span><span class="layout-icon-cell">9</span></span><span class="layout-icon-row"><span class="layout-icon-cell">⌫</span><span class="layout-icon-cell">0</span><span class="layout-icon-cell">✓</span></span></span><span class="settings-option-label"></span>';
    const label = layoutMobile.querySelector('.settings-option-label');
    if (label) label.textContent = t('settings.layout.mobile');
  }

  const languageBtn = document.getElementById('language-btn');
  if (languageBtn) {
    languageBtn.textContent = currentLanguage === LANG_EN ? '🇬🇧' : '🇫🇷';
    languageBtn.title = t('settings.label.language');
    languageBtn.setAttribute('aria-label', t('settings.label.language'));
  }

  const langFr = document.querySelector('[data-language-choice="fr"]');
  const langEn = document.querySelector('[data-language-choice="en"]');
  if (langFr) langFr.textContent = LANG_DISPLAY_NAMES.fr;
  if (langEn) langEn.textContent = LANG_DISPLAY_NAMES.en;

  const schoolLevelRow = document.getElementById('school-level-row');
  if (schoolLevelRow) schoolLevelRow.setAttribute('aria-label', t('schoolLevel.label'));

}

export function setLanguage(lang, persist = true) {
  const next = normalizeLanguage(lang);
  currentLanguage = next;
  if (persist) saveLanguage(next);
  applyI18n();
  if (typeof languageChangeHandler === 'function') languageChangeHandler(next);
}

export function registerLanguageChangeHandler(handler) {
  languageChangeHandler = handler;
}

export function initI18n() {
  currentLanguage = normalizeLanguage(loadLanguage());
  applyI18n();
}
