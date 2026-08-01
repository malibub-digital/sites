import type { APIRoute } from 'astro';
import { processCmsLockRequest } from '@malihub/sites-core';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  return await processCmsLockRequest(request);
};
