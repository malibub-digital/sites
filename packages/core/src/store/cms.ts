import { persistentMap } from '@nanostores/persistent';
import { atom } from 'nanostores';

export type CmsStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export const cmsDraftStore = persistentMap<Record<string, string>>('ml_cms_drafts:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cmsStatusStore = atom<CmsStatus>('idle');

export function updateDraft(bindPath: string, value: string) {
  cmsDraftStore.setKey(bindPath, value);
  cmsStatusStore.set('dirty');
}

export function removeDraft(bindPath: string) {
  cmsDraftStore.removeKey(bindPath);
  const current = cmsDraftStore.get();
  if (Object.keys(current).length === 0) {
    cmsStatusStore.set('idle');
  }
}

export function clearDrafts() {
  cmsDraftStore.set({});
  cmsStatusStore.set('idle');
}
