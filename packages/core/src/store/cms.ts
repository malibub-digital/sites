import { persistentMap } from '@nanostores/persistent';
import { atom } from 'nanostores';

export type CmsStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export const cmsDraftStore = persistentMap<Record<string, string>>('ml_cms_drafts:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cmsSavedStore = persistentMap<Record<string, string>>('ml_cms_saved:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cmsStatusStore = atom<CmsStatus>('idle');

export function updateDraft(bindPath: string, value: string) {
  cmsDraftStore.setKey(bindPath, value);
  cmsStatusStore.set('dirty');
}

export function removeDraft(bindPath: string) {
  cmsDraftStore.setKey(bindPath, undefined as any);
  const current = cmsDraftStore.get();
  if (Object.keys(current).length === 0 && Object.keys(cmsSavedStore.get()).length === 0) {
    cmsStatusStore.set('idle');
  }
}

export function clearDrafts() {
  cmsDraftStore.set({});
  if (Object.keys(cmsSavedStore.get()).length === 0) {
    cmsStatusStore.set('idle');
  }
}

export function addSavedChanges(savedDrafts: Record<string, string>) {
  const current = cmsSavedStore.get();
  cmsSavedStore.set({ ...current, ...savedDrafts });
  cmsStatusStore.set('saved');
}

export function removeSaved(bindPath: string) {
  cmsSavedStore.setKey(bindPath, undefined as any);
  const currentSaved = cmsSavedStore.get();
  const currentDrafts = cmsDraftStore.get();
  if (Object.keys(currentSaved).length === 0 && Object.keys(currentDrafts).length === 0) {
    cmsStatusStore.set('idle');
  }
}

export function clearSavedChanges() {
  cmsSavedStore.set({});
  const currentDrafts = cmsDraftStore.get();
  if (Object.keys(currentDrafts).length === 0) {
    cmsStatusStore.set('idle');
  }
}

