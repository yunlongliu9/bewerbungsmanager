import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as ApiErrorBody).message;
    return Array.isArray(message) ? message.join(', ') : message;
  }

  return `Request failed with status ${status}`;
}
