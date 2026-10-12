import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

const CATS = { quantitative: 'Quantitative', logical: 'Logical Reasoning', verbal: 'Verbal Ability', data_interpretation: 'Data Interpretation', technical: 'Technical (CS Fundamentals)' };

export default function Aptitude() {
  const [cat, setCat] = useState(null);
  const [qs, setQs] = useState([]);
  const [ans, setAns] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(0);
  const started = useRef(0);
  const [topics, setTopics] = useState([]);
  const [sel, setSel] = useState({ category: 'quantitative', topic: '', difficulty: '', count: 10 });

  const loadHistory = () => api('/aptitude/history').then((d) => setHistory(d.attempts)).catch(() => {});
  useEffect(() => { loadHistory(); api('/aptitude/topics').then((d) => setTopics(d.topics)).catch(() => {}); }, []);

  const start = async () => {
    setErr(''); setResult(null); setAns({});
    try {
      const p = new URLSearchParams({ category: sel.category, count: sel.count });
      if (sel.topic) p.set('topic', sel.topic);
      if (sel.difficulty) p.set('difficulty', sel.difficulty);
      const d = await api(`/aptitude/questions?${p}`);
      if (!d.questions.length) return setErr('No questions match these filters. Try "All topics" or another difficulty.');
      setCat(sel.category); setQs(d.questions); started.current = Date.now(); setLeft(d.questions.length * 60);
    } catch (e) { setErr(e.message); }
  };

  const submit = async () => {
    try {
      const body = { category: cat, durationSec: Math.round((Date.now() - started.current) / 1000), answers: qs.map((q) => ({ questionId: q._id, selected: ans[q._id] ?? null })) };
      setResult(await api('/aptitude/submit', { method: 'POST', body })); setQs([]); loadHistory();
    } catch (e) { setErr(e.message); }
  };

  useEffect(() => {
    if (!qs.length) return;
    if (left <= 0) { submit(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, qs.length]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Aptitude assessment</h1>
      {err && <p role="alert" className="text-red-600">{err}</p>}

      {!qs.length && !result && (
        <div className="card space-y-3">
          <p className="text-sm text-slate-500">Random questions, 1 minute each. Scores are calculated from your actual answers.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Category<select className="input" value={sel.category} onChange={(e) => setSel({ ...sel, category: e.target.value, topic: '' })}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="text-sm">Topic<select className="input" value={sel.topic} onChange={(e) => setSel({ ...sel, topic: e.target.value })}><option value="">All topics</option>{topics.filter((t) => t.category === sel.category).map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.count})</option>)}</select></label>
            <label className="text-sm">Difficulty<select className="input" value={sel.difficulty} onChange={(e) => setSel({ ...sel, difficulty: e.target.value })}><option value="">Any</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
            <label className="text-sm">Number of questions<select className="input" value={sel.count} onChange={(e) => setSel({ ...sel, count: Number(e.target.value) })}>{[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          <button className="btn" onClick={start}>Start test</button>
        </div>)}

      {qs.length > 0 && (
        <div className="space-y-4">
          <p className="text-right font-mono text-sm">Time left: {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
          {qs.map((q, i) => (
            <div key={q._id} className="card"><p className="font-medium">{i + 1}. {q.question}</p><p className="mb-2 text-xs text-slate-500">{q.topic} · {q.difficulty}</p>
              {q.options.map((o, j) => (<label key={j} className="flex items-center gap-2 py-1 text-sm"><input type="radio" name={q._id} checked={ans[q._id] === j} onChange={() => setAns({ ...ans, [q._id]: j })} />{o}</label>))}</div>))}
          <button className="btn" onClick={submit}>Submit test</button>
        </div>)}

      {result && (
        <div className="space-y-4">
          <div className="card"><p className="text-3xl font-bold text-indigo-600">{result.score}/{result.total} ({result.percentage}%)</p></div>
          {result.review.map((r, i) => (
            <div key={i} className="card text-sm"><p className="font-medium">{i + 1}. {r.text}</p>
              <p className={r.correct ? 'text-green-600' : 'text-red-600'}>Your answer: {r.selected === null ? 'Not answered' : r.options[r.selected]}</p>
              {!r.correct && <p className="text-green-600">Correct: {r.options[r.correctIndex]}</p>}
              <p className="text-slate-500">{r.explanation}</p></div>))}
          <button className="btn" onClick={() => { setResult(null); setCat(null); }}>Take another</button>
        </div>)}

      <div className="card"><h2 className="mb-2 font-semibold">History</h2>
        {history.length === 0 ? <p className="text-sm text-slate-500">No attempts yet.</p> :
          <ul className="space-y-1 text-sm">{history.map((h) => <li key={h._id} className="flex justify-between"><span>{CATS[h.category]}</span><span>{h.score}/{h.total} · {new Date(h.createdAt).toLocaleDateString()}</span></li>)}</ul>}</div>
    </div>
  );
}
