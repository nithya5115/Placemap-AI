import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractText } from '../src/services/resumeParser.js';
import { analyze, extractSkills } from '../src/services/ats.js';
import { samples } from '../scripts/sampleQuestions.js';

const f = (n) => fs.readFileSync(new URL('./fixtures/' + n, import.meta.url));

test('reads text from DOCX', async () => assert.match(await extractText(f('sample.docx'), 'r.docx'), /Spring Boot/));
test('reads text from PDF', async () => assert.match(await extractText(f('sample.pdf'), 'r.pdf'), /Java developer/));
test('rejects a text file renamed to .pdf', async () =>
  assert.rejects(() => extractText(Buffer.from('hello world, I am not a pdf at all'), 'evil.pdf'), /genuine PDF or DOCX/));
test('rejects unsupported extension', async () => assert.rejects(() => extractText(f('sample.docx'), 'r.txt'), /genuine PDF or DOCX/));
test('uploaded-text resume is analysed with completeness heuristics', async () => {
  const text = await extractText(f('sample.docx'), 'r.docx');
  const r = analyze({ rawText: text, skills: extractSkills(text) }, 'Need Java, Docker and SQL');
  assert.deepEqual(r.matched.sort(), ['java', 'sql']);
  assert.deepEqual(r.missing, ['docker']);
  assert.equal(r.completeness, 100);
});
test('question bank is valid', () => {
  assert.ok(samples.length >= 60);
  for (const q of samples) {
    assert.ok(q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length, q.question);
    assert.equal(new Set(q.options).size, q.options.length, 'duplicate options: ' + q.question);
  }
  assert.deepEqual([...new Set(samples.map((q) => q.category))].sort(), ['data_interpretation', 'logical', 'quantitative', 'technical', 'verbal']);
});
