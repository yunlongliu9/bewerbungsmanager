import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';

describe('Owner authentication boundary', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps the public health endpoint available', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it.each([
    ['GET', '/companies'],
    ['POST', '/companies'],
    ['GET', '/applications'],
    ['POST', '/applications'],
    ['GET', '/contacts'],
    ['POST', '/contacts'],
    ['GET', '/interviews'],
    ['POST', '/interviews'],
    ['GET', '/notes'],
    ['POST', '/notes'],
    ['GET', '/dashboard'],
  ])('denies unauthenticated %s %s', async (method, path) => {
    const response = await request(app.getHttpServer())[method.toLowerCase() as 'get' | 'post'](
      path,
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });
});
