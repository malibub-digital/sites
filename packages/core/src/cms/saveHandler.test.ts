import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { processCmsSaveRequest } from './saveHandler.js';
import { hashSha256 } from '../utils/auth.js';

const TEST_DIR = path.join(process.cwd(), 'temp_test_cms');

describe('processCmsSaveRequest API Handler', () => {
  let validToken: string;

  beforeEach(async () => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    validToken = await hashSha256('admin123');

    fs.writeFileSync(
      path.join(TEST_DIR, 'site.config.json'),
      JSON.stringify({ title: 'Titre initial', institution: 'Mali' }, null, 2),
      'utf-8'
    );

    fs.writeFileSync(
      path.join(TEST_DIR, 'test-page.md'),
      `---\ntitle: Titre MD Initial\ncategory: General\n---\nContenu Markdown initial`,
      'utf-8'
    );
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('rejects unauthenticated request', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drafts: { 'siteConfig.title': 'Nouveau Titre' } }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(res.status).toBe(401);
  });

  it('rejects invalid payload schema', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ drafts: 'invalid-drafts-format' }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(res.status).toBe(422);
  });

  it('saves site.config.json modifications successfully without git', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        drafts: {
          'siteConfig.title': 'Nouveau Titre Officiel',
        },
      }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.updatedFiles).toContain('site.config.json');

    const updatedConfig = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'site.config.json'), 'utf-8'));
    expect(updatedConfig.title).toBe('Nouveau Titre Officiel');
  });

  it('saves Markdown frontmatter and content modifications with gray-matter', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        drafts: {
          'test-page.md::title': 'Titre MD Modifié',
          'test-page.md::content': 'Contenu Markdown mis à jour',
        },
      }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(res.status).toBe(200);

    const updatedMd = fs.readFileSync(path.join(TEST_DIR, 'test-page.md'), 'utf-8');
    expect(updatedMd).toContain('title: Titre MD Modifié');
    expect(updatedMd).toContain('Contenu Markdown mis à jour');
  });

  it('saves modifications locally and returns success status', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        drafts: {
          'siteConfig.title': 'Titre Sauvegardé',
        },
      }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('mis à jour localement');
  });

  it('executes array operations (add, delete, reorder) on site.config.json', async () => {
    const req = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        operations: [
          { type: 'ADD_ARRAY_ITEM', arrayPath: 'siteConfig.faq', defaultData: { question: 'Q1', answer: 'A1' } },
          { type: 'ADD_ARRAY_ITEM', arrayPath: 'siteConfig.faq', defaultData: { question: 'Q2', answer: 'A2' } },
          { type: 'ADD_ARRAY_ITEM', arrayPath: 'siteConfig.faq', defaultData: { question: 'Q3', answer: 'A3' } },
          { type: 'DELETE_ARRAY_ITEM', arrayPath: 'siteConfig.faq', index: 0 },
          { type: 'REORDER_ARRAY_ITEM', arrayPath: 'siteConfig.faq', fromIndex: 0, toIndex: 1 },
        ],
      }),
    });

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(res.status).toBe(200);

    const updatedConfig = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'site.config.json'), 'utf-8'));
    expect(updatedConfig.faq).toHaveLength(2);
    expect(updatedConfig.faq[0].question).toBe('Q3');
    expect(updatedConfig.faq[1].question).toBe('Q2');
  });

  it('creates and deletes content Markdown files correctly', async () => {
    const createReq = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        operations: [
          {
            type: 'CREATE_CONTENT_FILE',
            collection: 'actualites',
            slug: 'nouvel-article',
            frontmatter: { title: 'Nouvel Article', category: 'Politique' },
            content: 'Corps de la nouvelle actualité.',
          },
        ],
      }),
    });

    const createRes = await processCmsSaveRequest(createReq, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(createRes.status).toBe(200);

    const createdFilePath = path.join(TEST_DIR, 'src', 'content', 'actualites', 'nouvel-article.md');
    expect(fs.existsSync(createdFilePath)).toBe(true);
    const createdContent = fs.readFileSync(createdFilePath, 'utf-8');
    expect(createdContent).toContain('title: Nouvel Article');
    expect(createdContent).toContain('Corps de la nouvelle actualité.');

    const deleteReq = new Request('http://localhost/api/cms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        operations: [
          {
            type: 'DELETE_CONTENT_FILE',
            collection: 'actualites',
            slug: 'nouvel-article',
          },
        ],
      }),
    });

    const deleteRes = await processCmsSaveRequest(deleteReq, { projectRoot: TEST_DIR, gitEnabled: false });
    expect(deleteRes.status).toBe(200);
    expect(fs.existsSync(createdFilePath)).toBe(false);
  });
});
