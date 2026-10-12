import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, extractSkills } from '../src/services/ats.js';
import { scoreAttempt } from '../src/services/scoring.js';

const resume = { personal: { name: 'A', email: 'a@x.com', summary: 'Java developer' }, education: [{ school: 'X' }],
  skills: ['Java', 'SQL', 'C++'], projects: [{ name: 'App', description: 'Built REST API with Spring Boot', tech: 'Java' }] };

test('extractSkills handles c++ and does not match "c" inside words', () => {
  assert.deepEqual(extractSkills('We use C++ and Docker'), ['c++', 'docker']);
  assert.ok(!extractSkills('excellent').includes('c'));
});
test('analyze finds matched and missing skills', () => {
  const r = analyze(resume, 'Need Java, SQL, Docker and React');
  assert.deepEqual(r.matched.sort(), ['java', 'sql']);
  assert.deepEqual(r.missing.sort(), ['docker', 'react']);
  assert.equal(r.keywordMatch, 50);
  assert.equal(r.score, Math.round(0.7 * 50 + 0.3 * 100));
});
test('analyze with no known skills returns null score, not fake number', () => {
  assert.equal(analyze(resume, 'Looking for a great person to join us').score, null);
});
test('scoreAttempt scores from real answers, ignores duplicates and unknown ids', () => {
  const qs = [{ _id: '1', options: ['a', 'b'], answerIndex: 1, question: 'q', topic: 't', difficulty: 'easy' },
              { _id: '2', options: ['a', 'b'], answerIndex: 0, question: 'q', topic: 't', difficulty: 'easy' }];
  const r = scoreAttempt(qs, [{ questionId: '1', selected: 1 }, { questionId: '1', selected: 0 }, { questionId: '2', selected: 1 }, { questionId: '9', selected: 0 }]);
  assert.equal(r.total, 2); assert.equal(r.score, 1);
});
test('scoreAttempt treats out-of-range selection as unanswered', () => {
  const r = scoreAttempt([{ _id: '1', options: ['a', 'b'], answerIndex: 1 }], [{ questionId: '1', selected: 7 }]);
  assert.equal(r.score, 0); assert.equal(r.review[0].selected, null);
});
