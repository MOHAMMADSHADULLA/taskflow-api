const request = require('supertest');
const app = require('../src/app');

async function signupAndLogin(email) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'supersecret123', name: 'Test User' });
  return res.body.accessToken;
}

describe('Projects', () => {
  let tokenA;
  let tokenB;
  let projectId;

  beforeAll(async () => {
    tokenA = await signupAndLogin('owner-a@example.com');
    tokenB = await signupAndLogin('owner-b@example.com');
  });

  test('creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Website Revamp', description: 'Q4 redesign' });
    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Website Revamp');
    projectId = res.body.project.id;
  });

  test('rejects a project with no name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'no name here' });
    expect(res.status).toBe(422);
  });

  test('owner can list their own projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.projects.length).toBeGreaterThanOrEqual(1);
  });

  test('a different user does not see project A\'s projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.projects.find((p) => p.id === projectId)).toBeUndefined();
  });

  test('a different user cannot fetch project A by id (403)', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  test('owner can update their project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Website Revamp v2' });
    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe('Website Revamp v2');
  });

  test('unknown project id returns 404', async () => {
    const res = await request(app)
      .get('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });

  test('owner can delete their project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(204);
  });
});
