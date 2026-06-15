// js/settings.js — Modale de réglages unifiée (thème global + layout par profil)

import { state } from './state.js';
import { loadTheme, saveTheme, updateProfileLayout, resetGlobalLeaderboardsKeepingExistingProfiles } from './storage.js';
import { renderLeaderboardPanel, renderSurvieLeaderboardPanel } from './ui.js';
import { getLanguage, setLanguage, t } from './i18n.js';

const LEADERBOARD_RESET_CODE = '2026';

export function applyTheme(theme) {
  const value = theme === 'dark' ? 'dark' : 'light';
  state.theme = value;
  if (value === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function applyKeyboardLayout(layout) {
  const value = layout === 'mobile' ? 'mobile' : 'pc';
  state.keyboardLayout = value;
  state.elements.numpad.classList.toggle('numpad--mobile', value === 'mobile');
}

function renderThemeOptions() {
  state.elements.themeOptions.querySelectorAll('.settings-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeChoice === state.theme);
  });
}

function renderLayoutOptions() {
  state.elements.layoutOptions.querySelectorAll('.settings-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layoutChoice === state.keyboardLayout);
  });
}

function renderPersonalLabel() {
  let who = `👤 ${t('profile.guest')}`;
  if (!state.isGuestSession && state.activeProfile) {
    const avatar = state.activeProfile.avatar || '👤';
    const name = state.activeProfile.name || t('profile.choose');
    who = `${avatar} ${name}`;
  } else if (!state.isGuestSession) {
    who = `👤 ${t('profile.choose')}`;
  }
  state.elements.settingsPersonalLabel.textContent = t('settings.section.personal', { who });
}

function openSettingsModal() {
  renderThemeOptions();
  renderLayoutOptions();
  renderPersonalLabel();
  state.elements.leaderboardResetCodeInput.value = '';
  state.elements.leaderboardResetMessage.hidden = true;
  state.elements.leaderboardResetMessage.textContent = '';
  state.elements.leaderboardResetMessage.className = 'settings-reset-message';
  state.elements.settingsModalOverlay.hidden = false;
}

function closeSettingsModal() {
  state.elements.settingsModalOverlay.hidden = true;
}

function renderLanguageOptions() {
  const active = getLanguage();
  if (state.elements.languageMenu) {
    state.elements.languageMenu.querySelectorAll('.language-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.languageChoice === active);
    });
  }
  if (state.elements.profileLanguageOptions) {
    state.elements.profileLanguageOptions.querySelectorAll('.profile-language-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.profileLanguageChoice === active);
    });
  }
}

export function refreshSettingsUi() {
  renderThemeOptions();
  renderLayoutOptions();
  renderPersonalLabel();
  renderLanguageOptions();
}

function toggleLanguageMenu() {
  const opening = state.elements.languageMenu.hidden;
  state.elements.languageMenu.hidden = !opening;
  if (opening) renderLanguageOptions();
}

function closeLanguageMenu() {
  state.elements.languageMenu.hidden = true;
}

function showResetMessage(message, isError) {
  state.elements.leaderboardResetMessage.hidden = false;
  state.elements.leaderboardResetMessage.textContent = message;
  state.elements.leaderboardResetMessage.className = isError
    ? 'settings-reset-message settings-reset-message--error'
    : 'settings-reset-message settings-reset-message--success';
}

export function initSettings() {
  applyTheme(loadTheme());
  applyKeyboardLayout('pc');

  state.elements.settingsBtn.addEventListener('click', openSettingsModal);
  state.elements.settingsCloseBtn.addEventListener('click', closeSettingsModal);
  state.elements.settingsModalOverlay.addEventListener('click', (e) => {
    if (e.target === state.elements.settingsModalOverlay) closeSettingsModal();
  });

  state.elements.languageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLanguageMenu();
  });

  state.elements.languageMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('.language-option');
    if (!btn) return;
    setLanguage(btn.dataset.languageChoice);
    renderLanguageOptions();
    closeLanguageMenu();
  });

  if (state.elements.profileLanguageOptions) {
    state.elements.profileLanguageOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.profile-language-option');
      if (!btn) return;
      setLanguage(btn.dataset.profileLanguageChoice);
      renderLanguageOptions();
    });
  }

  document.addEventListener('click', (e) => {
    if (!state.elements.languageSwitch.contains(e.target)) closeLanguageMenu();
  });

  state.elements.themeOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-option');
    if (!btn) return;
    applyTheme(btn.dataset.themeChoice);
    saveTheme(state.theme);
    renderThemeOptions();
  });

  state.elements.layoutOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-option');
    if (!btn) return;
    applyKeyboardLayout(btn.dataset.layoutChoice);
    if (!state.isGuestSession && state.activeProfileId) {
      updateProfileLayout(state.activeProfileId, state.keyboardLayout);
      if (state.activeProfile) state.activeProfile.keyboardLayout = state.keyboardLayout;
    }
    renderLayoutOptions();
  });

  state.elements.leaderboardResetBtn.addEventListener('click', () => {
    const enteredCode = state.elements.leaderboardResetCodeInput.value.trim();
    if (enteredCode !== LEADERBOARD_RESET_CODE) {
      showResetMessage(t('settings.reset.wrong'), true);
      return;
    }

    const result = resetGlobalLeaderboardsKeepingExistingProfiles();
    renderLeaderboardPanel();
    renderSurvieLeaderboardPanel();
    state.elements.leaderboardResetCodeInput.value = '';
    showResetMessage(t('settings.reset.done', { defi: result.keptDefi, survie: result.keptSurvie }), false);
  });

  renderLanguageOptions();
}
