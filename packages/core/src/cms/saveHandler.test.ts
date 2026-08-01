import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { processCmsSaveRequest } from '../src/cms/saveHandler.js';
import { hashSha256 } from '../src/utils/auth.js';

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

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR });
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

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR });
    expect(res.status).toBe(422);
  });

  it('saves site.config.json modifications successfully', async () => {
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

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR });
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

    const res = await processCmsSaveRequest(req, { projectRoot: TEST_DIR });
    expect(res.status).toBe(200);

    const updatedMd = fs.readFileSync(path.join(TEST_DIR, 'test-page.md'), 'utf-8');
    expect(updatedMd).toContain('title: Titre MD Modifié');
    expect(updatedMd).toContain('Contenu Markdown mis à jour');
  });
});
