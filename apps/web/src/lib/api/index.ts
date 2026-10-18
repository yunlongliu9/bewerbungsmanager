export { ApiError } from './errors';
import { createApiClient } from './client';
export { createApiClient } from './client';
export type { AccessTokenProvider, ApiClient, ApiClientOptions } from './client';
export * from './types';

export const browserApiClient = createApiClient({
  baseUrl: '/api',
  getAccessToken: () => null,
});
