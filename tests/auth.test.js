const request = require('supertest');
const app = require('../src/app');

const user = {
  email: 'jane@example.com',
  password: 'supersecret123',
  name: 'Jane Doe',
};

describe('Auth', () => {
  test('signup creates a user and returns a token pair', async () => {
    const res = await request(app).post('/api/auth/signup').send(user);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test('signup rejects a duplicate email', async () => {
    const res = await request(app).post('/api/auth/signup').send(user);
    expect(res.status).toBe(409);
  });

  test('signup rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@example.com', password: '123', name: 'Short' });
    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  test('login succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('refresh rotates the token and old refresh token stops working', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    const { refreshToken } = loginRes.body;

    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();

    const reuseRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(reuseRes.status).toBe(401);
  });

  test('a protected route rejects requests with no token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
