import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused';
process.env.JWT_SECRET = 'x'.repeat(40);
const { ruleBasedFeedback } = await import('../src/services/interviewFeedback.js');
const { aptitudeSchema } = await import('../src/controllers/adminController.js');
const { interviewSamples } = await import('../scripts/sampleInterview.js');

const q = { type: 'technical', keywords: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction'] };
test('good answer scores higher than a one-word answer', () => {
  const good = 'OOP has four pillars. Encapsulation hides data inside a class, inheritance lets one class reuse another, polymorphism allows one interface with many forms, and abstraction hides complexity. For example, in my project I used inheritance for vehicles. Overall these make code reusable.';
  const a = ruleBasedFeedback(q, good), b = ruleBasedFeedback(q, 'classes');
  assert.ok(a.score > b.score + 30, `${a.score} vs ${b.score}`);
  assert.equal(a.relevance, 100);
  assert.match(a.source, /rule-based/);
});
test('missing keywords are reported', () => {
  const r = ruleBasedFeedback(q, 'Encapsulation is hiding data because it protects state.');
  assert.ok(r.improvements.some((i) => i.includes('inheritance')));
});
test('behavioral answers are checked for STAR parts', () => {
  const r = ruleBasedFeedback({ type: 'behavioral', keywords: [] }, 'In my college project the situation was tight. My task was to build the login. I decided to split the work and implemented it. The result was a 30% faster release and I learned planning.');
  assert.equal(r.structure, 100);
});
test('scores stay within 0-100', () => {
  const r = ruleBasedFeedback(q, 'x'.repeat(10));
  for (const k of ['score', 'relevance', 'clarity', 'structure']) assert.ok(r[k] >= 0 && r[k] <= 100);
});
test('admin aptitude schema rejects out-of-range answerIndex', () => {
  const bad = { category: 'verbal', topic: 'Grammar', question: 'Pick one?', options: ['a', 'b'], answerIndex: 5 };
  assert.equal(aptitudeSchema.safeParse(bad).success, false);
  assert.equal(aptitudeSchema.safeParse({ ...bad, answerIndex: 1 }).success, true);
});
test('interview sample bank covers all three types', () => {
  assert.deepEqual([...new Set(interviewSamples.map((s) => s.type))].sort(), ['behavioral', 'hr', 'technical']);
});
