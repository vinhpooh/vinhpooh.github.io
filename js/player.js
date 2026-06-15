// js/player.js — Gestion des profils (picker, création, invité, affichage)

import { state } from './state.js';
import { stopTimer } from './engine.js';
import { setInputLocked } from './ui.js';
import { applyKeyboardLayout } from './settings.js';
import { DEFAULT_SCHOOL_LEVEL, normalizeSchoolLevel } from './config.js';
import {
  loadProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  isProfileNameTaken,
  setLastActiveProfileId,
  getLastActiveProfileId,
  getProfileLayout,
  loadGuestSchoolLevel,
  saveGuestSchoolLevel,
  updateProfileSchoolLevel,
} from './storage.js';
import { t } from './i18n.js';

let editingProfileId = null;

const PROFILE_AVATAR_OPTIONS = [
  { avatar: '🦊', color: '#f97316' },
  { avatar: '🐼', color: '#334155' },
  { avatar: '🐸', color: '#22c55e' },
  { avatar: '🐳', color: '#0ea5e9' },
  { avatar: '🦄', color: '#a855f7' },
  { avatar: '🐯', color: '#f59e0b' },
  { avatar: '🐶', color: '#f97316' },
  { avatar: '🐱', color: '#f43f5e' },
  { avatar: '🐰', color: '#ec4899' },
  { avatar: '🐹', color: '#f59e0b' },
  { avatar: '🐭', color: '#64748b' },
  { avatar: '🐮', color: '#475569' },
  { avatar: '🐷', color: '#fb7185' },
  { avatar: '🐵', color: '#92400e' },
  { avatar: '🐨', color: '#6b7280' },
  { avatar: '🐧', color: '#0f172a' },
  { avatar: '🦆', color: '#f59e0b' },
  { avatar: '🐤', color: '#eab308' },
  { avatar: '🐣', color: '#facc15' },
  { avatar: '🐢', color: '#16a34a' },
  { avatar: '🐙', color: '#db2777' },
  { avatar: '🦋', color: '#8b5cf6' },
  { avatar: '🐞', color: '#dc2626' },
  { avatar: '🐟', color: '#0284c7' },
  { avatar: '🐻', color: '#92400e' },
  { avatar: '🐺', color: '#374151' },
  { avatar: '🦁', color: '#f59e0b' },
  { avatar: '🦓', color: '#1f2937' },
];

function renderAvatarOptions(gridElement, activeAvatar = null) {
  if (!gridElement) return;
  const defaultAvatar = PROFILE_AVATAR_OPTIONS[0]?.avatar || '';
  const targetAvatar = activeAvatar || defaultAvatar;
  gridElement.innerHTML = PROFILE_AVATAR_OPTIONS.map((option) => {
    const active = option.avatar === targetAvatar ? ' active' : '';
    return `<button class="avatar-option${active}" type="button" data-avatar="${option.avatar}" data-color="${option.color}" aria-label="Avatar ${option.avatar}">${option.avatar}</button>`;
  }).join('');

  if (!gridElement.querySelector('.avatar-option.active')) {
    const first = gridElement.querySelector('.avatar-option');
    if (first) first.classList.add('active');
  }
}

function getSelectedAvatarButton(gridElement) {
  return gridElement.querySelector('.avatar-option.active');
}

function extractProfileDraft(nameInputElement, avatarGridElement) {
  const name = nameInputElement.value.trim().slice(0, 20);
  const avatarBtn = getSelectedAvatarButton(avatarGridElement);
  return {
    name,
    avatar: avatarBtn ? avatarBtn.dataset.avatar : '',
    color: avatarBtn ? avatarBtn.dataset.color : '',
  };
}

function showProfileFormError(errorElement, translationKey) {
  errorElement.textContent = t(translationKey);
  errorElement.hidden = false;
}

function renderProfileList() {
  if (state.profiles.length === 0) {
    state.elements.profileList.innerHTML = `<p class="profile-empty">${t('profile.empty')}</p>`;
    return;
  }

  const lastActiveProfileId = getLastActiveProfileId();
  state.elements.profileList.innerHTML = state.profiles.map((profile) => {
    const isLast = profile.id === lastActiveProfileId;
    return `
      <div class="profile-card-row">
        <button class="profile-card ${isLast ? 'profile-card--last' : ''}" data-profile-id="${profile.id}" type="button">
          <span class="profile-avatar">${profile.avatar}</span>
          <span class="profile-name">${profile.name}</span>
          ${isLast ? `<span class="profile-last-badge">${t('profile.lastBadge')}</span>` : ''}
        </button>
        <button class="profile-edit-btn" data-edit-profile-id="${profile.id}" type="button" aria-label="Modifier ${profile.name}">✏️</button>
      </div>
    `;
  }).join('');
}

function showPickerView() {
  state.elements.profileCreateView.hidden = true;
  state.elements.profileEditView.hidden = true;
  state.elements.profilePickerView.hidden = false;
  state.elements.profileCreateError.hidden = true;
  renderProfileList();
}

function showCreateView() {
  state.elements.profilePickerView.hidden = true;
  state.elements.profileEditView.hidden = true;
  state.elements.profileCreateView.hidden = false;
  state.elements.profileCreateError.hidden = true;
  state.elements.profileNameInput.value = '';
  renderAvatarOptions(state.elements.avatarGrid);
  setTimeout(() => state.elements.profileNameInput.focus(), 60);
}

function showEditView(profileId) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;
  editingProfileId = profile.id;

  state.elements.profilePickerView.hidden = true;
  state.elements.profileCreateView.hidden = true;
  state.elements.profileEditView.hidden = false;
  state.elements.profileEditError.hidden = true;
  state.elements.profileDeleteConfirm.hidden = true;
  state.elements.profileEditNameInput.value = profile.name;
  renderAvatarOptions(state.elements.avatarGridEdit, profile.avatar);

  setTimeout(() => state.elements.profileEditNameInput.focus(), 60);
}

function applyActiveProfile(profile) {
  state.activeProfile = profile;
  state.activeProfileId = profile.id;
  state.currentSchoolLevel = normalizeSchoolLevel(profile.schoolLevel);
  state.isGuestSession = false;
  state.sessionPlayerSelected = true;
  setLastActiveProfileId(profile.id);
  applyKeyboardLayout(getProfileLayout(profile));
}

function applyGuestSession() {
  state.activeProfile = null;
  state.activeProfileId = null;
  state.currentSchoolLevel = loadGuestSchoolLevel();
  state.isGuestSession = true;
  state.sessionPlayerSelected = true;
  applyKeyboardLayout('pc');
}

export function getActiveSchoolLevel() {
  return normalizeSchoolLevel(state.currentSchoolLevel || DEFAULT_SCHOOL_LEVEL);
}

export function setActiveSchoolLevel(level) {
  const normalized = normalizeSchoolLevel(level);
  state.currentSchoolLevel = normalized;
  if (state.isGuestSession || !state.activeProfileId) {
    saveGuestSchoolLevel(normalized);
    return normalized;
  }

  const updated = updateProfileSchoolLevel(state.activeProfileId, normalized);
  if (updated) {
    state.activeProfile = updated;
  }
  return normalized;
}

function selectProfile(profileId, onPlayerReady) {
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return;
  applyActiveProfile(profile);
  hideProfilePicker();
  updatePlayerDisplay();
  if (onPlayerReady) onPlayerReady();
}

function createProfileAndSelect(onPlayerReady) {
  const { name, avatar, color } = extractProfileDraft(state.elements.profileNameInput, state.elements.avatarGrid);

  if (!name) {
    showProfileFormError(state.elements.profileCreateError, 'profile.create.error.required');
    return;
  }

  if (isProfileNameTaken(name)) {
    showProfileFormError(state.elements.profileCreateError, 'profile.create.error.taken');
    return;
  }

  const profile = createProfile({ name, avatar, color });
  if (!profile) {
    showProfileFormError(state.elements.profileCreateError, 'profile.create.error.failed');
    return;
  }

  state.profiles = loadProfiles();
  selectProfile(profile.id, onPlayerReady);
}

function saveProfileEdit() {
  if (!editingProfileId) return;
  const { name, avatar, color } = extractProfileDraft(state.elements.profileEditNameInput, state.elements.avatarGridEdit);

  if (!name) {
    showProfileFormError(state.elements.profileEditError, 'profile.edit.error.required');
    return;
  }

  if (isProfileNameTaken(name, editingProfileId)) {
    showProfileFormError(state.elements.profileEditError, 'profile.edit.error.taken');
    return;
  }

  const updated = updateProfile({ id: editingProfileId, name, avatar, color });
  if (!updated) {
    showProfileFormError(state.elements.profileEditError, 'profile.edit.error.failed');
    return;
  }

  state.profiles = loadProfiles();
  if (state.activeProfileId === updated.id) {
    state.activeProfile = updated;
    updatePlayerDisplay();
  }

  editingProfileId = null;
  showPickerView();
}

function deleteEditingProfile() {
  if (!editingProfileId) return;
  const wasActive = state.activeProfileId === editingProfileId;

  deleteProfile(editingProfileId);
  state.profiles = loadProfiles();

  if (wasActive) {
    state.activeProfile = null;
    state.activeProfileId = null;
    state.isGuestSession = false;
    state.sessionPlayerSelected = false;
    applyKeyboardLayout('pc');
    updatePlayerDisplay();
  }

  editingProfileId = null;
  showPickerView();
}

export function getActivePlayerName() {
  if (state.isGuestSession) return t('profile.guest');
  return state.activeProfile ? state.activeProfile.name : t('profile.choose');
}

export function getActiveAvatarIcon() {
  if (state.isGuestSession) return '👤';
  if (state.activeProfile) return state.activeProfile.avatar;
  return '👤';
}

function getActivePlayerText() {
  if (state.isGuestSession) return t('profile.guest');
  if (state.activeProfile) return state.activeProfile.name;
  return t('profile.choose');
}

export function getActivePlayerLabel() {
  if (state.isGuestSession) return `${getActiveAvatarIcon()} ${t('profile.guest')}`;
  if (state.activeProfile) return `${state.activeProfile.avatar} ${state.activeProfile.name}`;
  return t('profile.label.choose');
}

export function canPersistProfileData() {
  return !state.isGuestSession && !!state.activeProfileId;
}

export function updatePlayerDisplay() {
  const iconSpan = document.createElement('span');
  iconSpan.className = 'player-avatar-icon';
  iconSpan.textContent = getActiveAvatarIcon();

  state.elements.playerDisplayName.innerHTML = '';
  state.elements.playerDisplayName.appendChild(iconSpan);
  state.elements.playerDisplayName.appendChild(document.createTextNode(' ' + getActivePlayerText()));
  state.elements.playerDisplayName.classList.toggle('player-display-name--idle', !state.sessionActive);

  state.elements.changePlayerBtn.hidden = state.sessionActive;
  state.elements.changePlayerBtn.disabled = state.gameInProgress;
  state.elements.changePlayerBtn.classList.toggle('btn--disabled', state.gameInProgress);
  state.elements.changePlayerBtn.classList.toggle('blinking', !state.sessionActive && !state.gameInProgress);

  if (state.elements.buddyIcon) state.elements.buddyIcon.textContent = getActiveAvatarIcon();
  if (state.elements.buddyName) state.elements.buddyName.textContent = getActivePlayerText();
}

export function showProfilePicker() {
  stopTimer();
  state.locked = true;
  setInputLocked(true);
  state.elements.endScreen.hidden = true;
  showPickerView();
  state.elements.profileModalOverlay.hidden = false;
}

export function hideProfilePicker() {
  state.elements.profileModalOverlay.hidden = true;
}

export function initProfileFlow(onPlayerReady) {
  state.profiles = loadProfiles();
  renderAvatarOptions(state.elements.avatarGrid);
  renderAvatarOptions(state.elements.avatarGridEdit);
  updatePlayerDisplay();

  state.elements.profileList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.profile-edit-btn');
    if (editBtn) {
      showEditView(editBtn.dataset.editProfileId);
      return;
    }
    const card = e.target.closest('.profile-card');
    if (!card) return;
    selectProfile(card.dataset.profileId, onPlayerReady);
  });

  state.elements.profileNewBtn.addEventListener('click', showCreateView);
  state.elements.profileCreateCancelBtn.addEventListener('click', showPickerView);
  state.elements.profileEditCancelBtn.addEventListener('click', () => {
    editingProfileId = null;
    showPickerView();
  });

  state.elements.profileDeleteBtn.addEventListener('click', () => {
    state.elements.profileDeleteConfirm.hidden = false;
  });
  state.elements.profileDeleteCancelBtn.addEventListener('click', () => {
    state.elements.profileDeleteConfirm.hidden = true;
  });
  state.elements.profileDeleteConfirmBtn.addEventListener('click', deleteEditingProfile);
  state.elements.profileGuestBtn.addEventListener('click', () => {
    applyGuestSession();
    hideProfilePicker();
    updatePlayerDisplay();
    if (onPlayerReady) onPlayerReady();
  });

  state.elements.avatarGrid.addEventListener('click', (e) => {
    const option = e.target.closest('.avatar-option');
    if (!option) return;
    state.elements.avatarGrid.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('active'));
    option.classList.add('active');
  });

  state.elements.avatarGridEdit.addEventListener('click', (e) => {
    const option = e.target.closest('.avatar-option');
    if (!option) return;
    state.elements.avatarGridEdit.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('active'));
    option.classList.add('active');
  });

  state.elements.profileCreateConfirmBtn.addEventListener('click', () => createProfileAndSelect(onPlayerReady));
  state.elements.profileNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createProfileAndSelect(onPlayerReady);
  });

  state.elements.profileEditConfirmBtn.addEventListener('click', saveProfileEdit);
  state.elements.profileEditNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveProfileEdit();
  });

  showProfilePicker();
}
