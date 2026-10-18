import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';
import { cleanDatabase, prisma } from '../helpers/database.js';

const OWNER_USERNAME = 'viende';
const OWNER_PASSWORD = 'correct-horse-battery-staple';

function sessionCookie(response: Response): string {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = cookies?.find((value) => value.startsWith('bewerbungsmanager_session='));

  if (!cookie) {
    throw new Error('Session cookie was not set');
  }

  return cookie.split(';')[0] ?? '';
}

describe('Single-owner authentication', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.OWNER_BOOTSTRAP_SECRET = 'test-bootstrap-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    delete process.env.OWNER_BOOTSTRAP_SECRET;
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('bootstraps a single owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      username: OWNER_USERNAME,
    });
    expect(response.body.passwordHash).toBeUndefined();

    const duplicate = await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: 'second-owner', password: OWNER_PASSWORD });

    expect(duplicate.status).toBe(409);
  });

  it('rejects invalid login with a generic message', async () => {
    await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: OWNER_USERNAME,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid username or password');
  });

  it('logs in and checks the session', async () => {
    await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    const login = await request(app.getHttpServer()).post('/auth/login').send({
      username: OWNER_USERNAME,
      password: OWNER_PASSWORD,
    });

    expect(login.status).toBe(201);
    expect(login.headers['set-cookie']?.toString()).toContain('HttpOnly');
    expect(login.headers['set-cookie']?.toString()).toContain('SameSite=Strict');

    const cookie = sessionCookie(login);
    const session = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie);

    expect(session.status).toBe(200);
    expect(session.body.owner.username).toBe(OWNER_USERNAME);
  });

  it('allows authenticated reads and enforces CSRF on mutations', async () => {
    await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    const login = await request(app.getHttpServer()).post('/auth/login').send({
      username: OWNER_USERNAME,
      password: OWNER_PASSWORD,
    });
    const cookie = sessionCookie(login);

    const read = await request(app.getHttpServer()).get('/companies').set('Cookie', cookie);
    expect(read.status).toBe(200);

    const missingOrigin = await request(app.getHttpServer())
      .post('/companies')
      .set('Cookie', cookie)
      .send({ name: 'No Origin GmbH' });

    expect(missingOrigin.status).toBe(403);
    expect(missingOrigin.body.message).toBe('Origin header required');

    const validOrigin = await request(app.getHttpServer())
      .post('/companies')
      .set('Cookie', cookie)
      .set('Host', 'localhost')
      .set('Origin', 'http://localhost')
      .send({ name: 'Origin GmbH' });

    expect(validOrigin.status).toBe(201);

    const proxiedOrigin = await request(app.getHttpServer())
      .post('/companies')
      .set('Cookie', cookie)
      .set('Host', 'localhost:3000')
      .set('Origin', 'http://localhost:3001')
      .send({ name: 'Proxied Origin GmbH' });

    expect(proxiedOrigin.status).toBe(201);
  });

  it('logs out and revokes the session', async () => {
    await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    const login = await request(app.getHttpServer()).post('/auth/login').send({
      username: OWNER_USERNAME,
      password: OWNER_PASSWORD,
    });
    const cookie = sessionCookie(login);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .set('Host', 'localhost')
      .set('Origin', 'http://localhost');

    expect(logout.status).toBe(201);

    const session = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie);
    expect(session.status).toBe(401);
  });

  it('rate limits repeated login attempts', async () => {
    await request(app.getHttpServer())
      .post('/auth/bootstrap')
      .set('x-bootstrap-secret', 'test-bootstrap-secret')
      .send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });

    let lastStatus = 0;

    for (let index = 0; index < 11; index += 1) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', '10.0.0.99')
        .send({ username: OWNER_USERNAME, password: 'wrong-password' });
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
