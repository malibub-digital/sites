import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { processCmsPublishRequest } from './publishHandler.js';
import { hashSha256 } from '../utils/auth.js';

const TEST_DIR = path.join(process.cwd(), 'temp_test_cms_publish');

describe('processCmsPublishRequest API Handler', () => {
  let validToken: string;

  beforeEach(async () => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    validToken = await hashSha256('admin123');
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('rejects unauthenticated publish request', async () => {
    const req = new Request('http://localhost/api/cms/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await processCmsPublishRequest(req, { projectRoot: TEST_DIR, gitEnabled: true, gitBranch: 'main' });
    expect(res.status).toBe(401);
  });

  it('returns 400 if git publication is disabled', async () => {
    const req = new Request('http://localhost/api/cms/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
    });

    const res = await processCmsPublishRequest(req, { projectRoot: TEST_DIR, gitEnabled: false, gitBranch: 'main' });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('CMS_GIT_ENABLED=false');
  });

  it('returns 400 if target branch is missing', async () => {
    const req = new Request('http://localhost/api/cms/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
    });

    const res = await processCmsPublishRequest(req, { projectRoot: TEST_DIR, gitEnabled: true, gitBranch: '' });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('CMS_GIT_BRANCH');
  });

  it('correctly resolves repository root when projectRoot is nested template folder', async () => {
    const templateSubdir = path.join(TEST_DIR, 'template');
    fs.mkdirSync(templateSubdir, { recursive: true });
    fs.writeFileSync(path.join(templateSubdir, 'site.config.json'), JSON.stringify({ name: 'test' }), 'utf-8');

    const req = new Request('http://localhost/api/cms/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
    });

    const res = await processCmsPublishRequest(req, {
      projectRoot: templateSubdir,
      gitEnabled: true,
      gitBranch: 'main',
      gitToken: 'fake_token',
      gitOwner: 'test_owner',
      gitRepo: 'test_repo',
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('GitHubProvider');
  });
});

