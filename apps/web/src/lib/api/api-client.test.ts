import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('typed API client', () => {
  it('adds an authorization header to private requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      getAccessToken: async () => 'test-token',
    });

    await client.companies.list({ page: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/companies?page=1',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer test-token');
  });

  it('serializes only defined query values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      getAccessToken: () => null,
    });

    await client.applications.list({
      page: 2,
      status: 'APPLIED',
      companyId: undefined,
      search: 'backend engineer',
    });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('status=APPLIED');
    expect(url).toContain('search=backend+engineer');
    expect(url).not.toContain('companyId');
  });

  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [500, 'INTERNAL_SERVER_ERROR'],
  ])('maps %i responses to ApiError', async (status, expectedError) => {
    const body = {
      statusCode: status,
      message: expectedError,
      error: expectedError,
      path: '/companies',
      timestamp: '2026-10-18T00:00:00.000Z',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, status)));

    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      getAccessToken: () => null,
    });

    await expect(client.companies.list()).rejects.toMatchObject({
      name: 'ApiError',
      status,
      message: expectedError,
    });
  });
});
