import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused';
process.env.JWT_SECRET = 'x'.repeat(40);

const { default: app } = await import('../src/app.js');
const { signToken } = await import('../src/middleware/auth.js');

let server, base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
after(() => server.close());

const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health check works', async () => {
  assert.equal((await fetch(base + '/api/health')).status, 200);
});
test('register rejects weak password', async () => {
  assert.equal((await post('/api/auth/register', { name: 'Ann', email: 'ann@x.com', password: 'short' })).status, 400);
});
test('register rejects invalid email', async () => {
  assert.equal((await post('/api/auth/register', { name: 'Ann', email: 'nope', password: 'Passw0rdOK' })).status, 400);
});
test('register schema strips a self-assigned admin role', async () => {
  const { registerSchema } = await import('../src/controllers/authController.js');
  const out = registerSchema.parse({ name: 'Ann', email: 'a@x.com', password: 'Passw0rdOK', role: 'admin' });
  assert.equal(out.role, undefined);
});
test('protected route without token -> 401', async () => {
  assert.equal((await fetch(base + '/api/auth/me')).status, 401);
});
test('garbage token -> 401', async () => {
  assert.equal((await fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer abc' } })).status, 401);
});
test('student token cannot access admin route -> 403', async () => {
  const t = signToken({ _id: '507f1f77bcf86cd799439011', role: 'student' });
  assert.equal((await fetch(base + '/api/admin/ping', { headers: { Authorization: `Bearer ${t}` } })).status, 403);
});
test('admin token can access admin route -> 200', async () => {
  const t = signToken({ _id: '507f1f77bcf86cd799439011', role: 'admin' });
  assert.equal((await fetch(base + '/api/admin/ping', { headers: { Authorization: `Bearer ${t}` } })).status, 200);
});
test('unknown route -> 404 JSON', async () => {
  assert.equal((await fetch(base + '/api/nothing')).status, 404);
});
test('student cannot reach admin stats/users/question routes -> 403', async () => {
  const t = signToken({ _id: '507f1f77bcf86cd799439011', role: 'student' });
  for (const p of ['/api/admin/stats', '/api/admin/users', '/api/admin/aptitude']) {
    assert.equal((await fetch(base + p, { headers: { Authorization: `Bearer ${t}` } })).status, 403, p);
  }
});
test('interview routes require login', async () => {
  assert.equal((await fetch(base + '/api/interview')).status, 401);
});
