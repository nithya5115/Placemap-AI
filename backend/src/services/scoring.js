export function scoreAttempt(questions, answers) {
  const byId = new Map(questions.map((q) => [String(q._id), q]));
  const seen = new Set();
  const review = [];
  for (const a of answers) {
    const q = byId.get(String(a.questionId));
    if (!q || seen.has(String(q._id))) continue; // ignore unknown / duplicate ids
    seen.add(String(q._id));
    const selected = Number.isInteger(a.selected) && a.selected >= 0 && a.selected < q.options.length ? a.selected : null;
    review.push({ question: q._id, text: q.question, options: q.options, topic: q.topic, difficulty: q.difficulty,
      selected, correctIndex: q.answerIndex, correct: selected === q.answerIndex, explanation: q.explanation });
  }
  const score = review.filter((r) => r.correct).length;
  return { score, total: review.length, review };
}
