import { persistentMap } from '@nanostores/persistent';
import { atom } from 'nanostores';
import type { CmsSaveOperation } from '../schemas/index.js';

export type CmsStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export const cmsDraftStore = persistentMap<Record<string, string>>('ml_cms_drafts:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cmsSavedStore = persistentMap<Record<string, string>>('ml_cms_saved:', {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cmsOperationsStore = atom<CmsSaveOperation[]>([]);

export const cmsStatusStore = atom<CmsStatus>('idle');

export function updateDraft(bindPath: string, value: string) {
  cmsDraftStore.setKey(bindPath, value);
  cmsStatusStore.set('dirty');
}

export function removeDraft(bindPath: string) {
  cmsDraftStore.setKey(bindPath, undefined as any);
  checkIdleState();
}

export function clearDrafts() {
  cmsDraftStore.set({});
  checkIdleState();
}

export function addOperation(op: CmsSaveOperation) {
  const current = cmsOperationsStore.get();
  cmsOperationsStore.set([...current, op]);
  cmsStatusStore.set('dirty');
}

export function addArrayItem(arrayPath: string, defaultData?: Record<string, any>) {
  addOperation({ type: 'ADD_ARRAY_ITEM', arrayPath, defaultData });
}

export function deleteArrayItem(arrayPath: string, index: number) {
  addOperation({ type: 'DELETE_ARRAY_ITEM', arrayPath, index });
}

export function reorderArrayItem(arrayPath: string, fromIndex: number, toIndex: number) {
  addOperation({ type: 'REORDER_ARRAY_ITEM', arrayPath, fromIndex, toIndex });
}

export function createContentFile(
  collection: string,
  slug: string,
  frontmatter: Record<string, any>,
  content?: string
) {
  addOperation({ type: 'CREATE_CONTENT_FILE', collection, slug, frontmatter, content });
}

export function deleteContentFile(collection: string, slug: string) {
  addOperation({ type: 'DELETE_CONTENT_FILE', collection, slug });
}

export function removeOperation(index: number) {
  const current = cmsOperationsStore.get();
  if (index >= 0 && index < current.length) {
    const updated = [...current];
    updated.splice(index, 1);
    cmsOperationsStore.set(updated);
    checkIdleState();
  }
}

export function clearOperations() {
  cmsOperationsStore.set([]);
  checkIdleState();
}

export function addSavedChanges(savedDrafts: Record<string, string>) {
  const current = cmsSavedStore.get();
  cmsSavedStore.set({ ...current, ...savedDrafts });
  cmsStatusStore.set('saved');
}

export function removeSaved(bindPath: string) {
  cmsSavedStore.setKey(bindPath, undefined as any);
  checkIdleState();
}

export function clearSavedChanges() {
  cmsSavedStore.set({});
  checkIdleState();
}

export function resetAllCmsState() {
  cmsDraftStore.set({});
  cmsSavedStore.set({});
  cmsOperationsStore.set([]);
  cmsStatusStore.set('idle');
}

function checkIdleState() {
  const currentDrafts = cmsDraftStore.get();
  const currentSaved = cmsSavedStore.get();
  const currentOps = cmsOperationsStore.get();
  if (
    Object.keys(currentDrafts).length === 0 &&
    Object.keys(currentSaved).length === 0 &&
    currentOps.length === 0
  ) {
    cmsStatusStore.set('idle');
  }
}


