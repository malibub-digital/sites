import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processCmsLockRequest, resetLockStore } from './lockHandler.js';
import { hashSha256 } from '../utils/auth.js';

describe('processCmsLockRequest API Handler', () => {
  let validToken: string;
  let otherToken: string;

  beforeEach(async () => {
    resetLockStore();
    validToken = await hashSha256('admin123');
    otherToken = await hashSha256('other_secret');
  });

  it('rejects unauthenticated lock request', async () => {
    const req = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId: 'site.config.json', action: 'acquire' }),
    });

    const res = await processCmsLockRequest(req);
    expect(res.status).toBe(401);
  });

  it('acquires lock successfully for a resource', async () => {
    const req = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'site.config.json', action: 'acquire', holderName: 'Moussa K.' }),
    });

    const res = await processCmsLockRequest(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isLocked).toBe(true);
    expect(body.isOwner).toBe(true);
  });

  it('blocks another admin when resource is locked (HTTP 423 Locked)', async () => {
    // Admin 1 acquire lock
    const req1 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'services/passeport.md', action: 'acquire', holderName: 'Moussa' }),
    });
    await processCmsLockRequest(req1);

    // Admin 2 tries to acquire lock on same resource
    const req2 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`,
      },
      body: JSON.stringify({ resourceId: 'services/passeport.md', action: 'acquire', holderName: 'Fatoumata' }),
    });

    const res2 = await processCmsLockRequest(req2, { adminSecret: 'other_secret' });
    expect(res2.status).toBe(423);

    const body2 = await res2.json();
    expect(body2.success).toBe(false);
    expect(body2.isLocked).toBe(true);
    expect(body2.holderName).toBe('Moussa');
  });

  it('allows editing a DIFFERENT resource concurrently', async () => {
    // Admin 1 locks resource A
    const req1 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'services/passeport.md', action: 'acquire' }),
    });
    await processCmsLockRequest(req1);

    // Admin 2 locks resource B (blog article)
    const req2 = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`,
      },
      body: JSON.stringify({ resourceId: 'blog/nouvel-article.md', action: 'acquire' }),
    });

    const res2 = await processCmsLockRequest(req2, { adminSecret: 'other_secret' });
    expect(res2.status).toBe(200);

    const body2 = await res2.json();
    expect(body2.success).toBe(true);
  });

  it('releases lock cleanly', async () => {
    const reqAcquire = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'site.config.json', action: 'acquire' }),
    });
    await processCmsLockRequest(reqAcquire);

    const reqRelease = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'site.config.json', action: 'release' }),
    });

    const resRelease = await processCmsLockRequest(reqRelease);
    expect(resRelease.status).toBe(200);

    // Verify it is unlocked
    const reqCheck = new Request('http://localhost/api/cms/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ resourceId: 'site.config.json', action: 'check' }),
    });
    const resCheck = await processCmsLockRequest(reqCheck);
    const bodyCheck = await resCheck.json();
    expect(bodyCheck.isLocked).toBe(false);
  });
});
