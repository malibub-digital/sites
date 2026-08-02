import { describe, it, expect, beforeEach } from 'vitest';
import {
  cmsDraftStore,
  cmsSavedStore,
  cmsOperationsStore,
  cmsStatusStore,
  updateDraft,
  removeDraft,
  clearDrafts,
  addOperation,
  removeOperation,
  clearOperations,
  addSavedChanges,
  removeSaved,
  clearSavedChanges,
  resetAllCmsState,
} from './cms.js';

describe('CMS Store', () => {
  beforeEach(() => {
    clearDrafts();
    clearSavedChanges();
    clearOperations();
  });

  it('updates draft and status correctly', () => {
    updateDraft('hero.title', 'New Title');
    expect(cmsDraftStore.get()).toEqual({ 'hero.title': 'New Title' });
    expect(cmsStatusStore.get()).toBe('dirty');
  });

  it('removes a draft and updates status when empty', () => {
    updateDraft('hero.title', 'New Title');
    removeDraft('hero.title');
    expect(cmsDraftStore.get()).toEqual({});
    expect(cmsStatusStore.get()).toBe('idle');
  });

  it('handles saved changes store independently from drafts', () => {
    updateDraft('hero.title', 'New Title');
    addSavedChanges({ 'hero.title': 'New Title' });
    clearDrafts();

    expect(cmsDraftStore.get()).toEqual({});
    expect(cmsSavedStore.get()).toEqual({ 'hero.title': 'New Title' });
    expect(cmsStatusStore.get()).toBe('saved');
  });

  it('removes single saved item and clears saved changes', () => {
    addSavedChanges({ 'hero.title': 'Saved Title', 'siteConfig.title': 'Site Title' });
    removeSaved('hero.title');
    expect(cmsSavedStore.get()).toEqual({ 'siteConfig.title': 'Site Title' });

    clearSavedChanges();
    expect(cmsSavedStore.get()).toEqual({});
    expect(cmsStatusStore.get()).toBe('idle');
  });

  it('resets both drafts and saved state with resetAllCmsState', () => {
    updateDraft('hero.title', 'Draft Title');
    addSavedChanges({ 'siteConfig.title': 'Saved Site Title' });
    resetAllCmsState();

    expect(cmsDraftStore.get()).toEqual({});
    expect(cmsSavedStore.get()).toEqual({});
    expect(cmsStatusStore.get()).toBe('idle');
  });

  it('manages operations store correctly', () => {
    addOperation({ type: 'ADD_ARRAY_ITEM', arrayPath: 'siteConfig.faq', defaultData: { question: 'Q' } });
    expect(cmsOperationsStore.get()).toHaveLength(1);
    expect(cmsStatusStore.get()).toBe('dirty');

    removeOperation(0);
    expect(cmsOperationsStore.get()).toHaveLength(0);

    addOperation({ type: 'DELETE_CONTENT_FILE', collection: 'actualites', slug: 'art' });
    clearOperations();
    expect(cmsOperationsStore.get()).toHaveLength(0);
    expect(cmsStatusStore.get()).toBe('idle');
  });
});

