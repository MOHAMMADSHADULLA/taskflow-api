const request = require('supertest');
const app = require('../src/app');

async function signupAndLogin(email) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'supersecret123', name: 'Test User' });
  return res.body.accessToken;
}

describe('Tasks', () => {
  let token;
  let otherToken;
  let projectId;
  let taskId;

  beforeAll(async () => {
    token = await signupAndLogin('task-owner@example.com');
    otherToken = await signupAndLogin('task-outsider@example.com');

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mobile App Launch' });
    projectId = projectRes.body.project.id;
  });

  test('creates a task under a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Design onboarding flow', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Design onboarding flow');
    expect(res.body.task.status).toBe('todo');
    taskId = res.body.task.id;
  });

  test('rejects a task with an invalid status', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad task', status: 'not_a_real_status' });
    expect(res.status).toBe(422);
  });

  test('an outsider cannot create tasks in someone else\'s project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Sneaky task' });
    expect(res.status).toBe(403);
  });

  test('lists tasks for a project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBe(1);
  });

  test('updates a task status directly by task id', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });

  test('an outsider cannot fetch the task directly', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  test('deletes a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test('fetching the deleted task now 404s', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
