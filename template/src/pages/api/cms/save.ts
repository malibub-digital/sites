import type { APIRoute } from 'astro';
import { processCmsSaveRequest } from '@malihub/sites-core';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  return await processCmsSaveRequest(request);
};
