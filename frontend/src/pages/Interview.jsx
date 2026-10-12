import { useEffect, useState } from 'react';
import { api } from '../api';

const Bar = ({ label, v }) => (
  <div className="text-xs"><div className="flex justify-between"><span>{label}</span><span>{v}</span></div>
    <div className="h-1.5 rounded bg-slate-200 dark:bg-slate-700"><div className="h-1.5 rounded bg-indigo-500" style={{ width: `${v}%` }} /></div></div>
);
const FeedbackCard = ({ fb }) => (
  <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
    <p className="text-2xl font-bold text-indigo-600">{fb.score}/100 <span className="text-xs font-normal text-slate-500">({fb.source})</span></p>
    <div className="grid grid-cols-3 gap-3"><Bar label="Relevance" v={fb.relevance} /><Bar label="Clarity" v={fb.clarity} /><Bar label="Structure" v={fb.structure} /></div>
    {fb.strengths.length > 0 && <div><b className="text-green-600">Strengths</b><ul className="list-disc pl-5">{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
    {fb.improvements.length > 0 && <div><b className="text-amber-600">To improve</b><ul className="list-disc pl-5">{fb.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
    <div><b>Suggested approach</b><p className="whitespace-pre-wrap">{fb.suggestion}</p></div>
    {fb.source.startsWith('rule') && <p className="text-xs text-slate-500">Rule-based estimate of coverage, clarity and structure. It cannot judge technical correctness. Add a Gemini API key on the backend for AI feedback.</p>}
  </div>
);

export default function Interview() {
  const [form, setForm] = useState({ type: 'technical', role: 'general', level: 'student', count: 5 });
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [fb, setFb] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const done = session?.status === 'completed';

  const loadHistory = () => api('/interview').then((d) => setHistory(d.sessions)).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const start = async () => {
    setErr(''); setBusy(true);
    try { const d = await api('/interview/start', { method: 'POST', body: { ...form, count: Number(form.count) } }); setSession(d.session); setIdx(0); setAnswer(''); setFb(null); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const d = await api(`/interview/${session._id}/answer`, { method: 'POST', body: { index: idx, answer } });
      setFb(d.feedback);
      setSession((s) => ({ ...s, questions: s.questions.map((q, i) => (i === idx ? { ...q, answer, feedback: d.feedback } : q)) }));
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const next = async () => {
    if (idx + 1 < session.questions.length) { setIdx(idx + 1); setAnswer(''); setFb(null); return; }
    try { const d = await api(`/interview/${session._id}/finish`, { method: 'POST' }); setSession(d.session); loadHistory(); } catch (e) { setErr(e.message); }
  };
  const open = async (id) => { try { const d = await api(`/interview/${id}`); setSession(d.session); } catch (e) { setErr(e.message); } };
  const reset = () => { setSession(null); setFb(null); setAnswer(''); };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Mock interview</h1>
      {err && <p role="alert" className="text-red-600">{err}</p>}

      {!session && (
        <>
          <div className="card space-y-3">
            <p className="text-sm text-slate-500">Text-based practice, one question at a time. Voice recording is not part of this version.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Type<select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="technical">Technical</option><option value="hr">HR</option><option value="behavioral">Behavioral</option></select></label>
              <label className="text-sm">Role<input className="input" list="roles" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /><datalist id="roles"><option value="general" /><option value="java developer" /><option value="web developer" /></datalist></label>
              <label className="text-sm">Level<select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}><option value="student">Student</option><option value="fresher">Fresher</option><option value="experienced">Experienced</option></select></label>
              <label className="text-sm">Questions<select className="input" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })}>{[3, 5, 8, 10].map((n) => <option key={n}>{n}</option>)}</select></label>
            </div>
            <button className="btn" onClick={start} disabled={busy}>{busy ? 'Starting...' : 'Start interview'}</button>
          </div>
          <div className="card"><h2 className="mb-2 font-semibold">Previous interviews</h2>
            {history.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : <ul className="space-y-1 text-sm">{history.map((h) => (
              <li key={h._id} className="flex justify-between"><span className="capitalize">{h.type} · {h.role} · {new Date(h.createdAt).toLocaleDateString()}</span>
                {h.status === 'completed' ? <button className="text-indigo-600" onClick={() => open(h._id)}>{h.overall}/100 · view</button> : <span className="text-slate-400">unfinished</span>}</li>))}</ul>}</div>
        </>
      )}

      {session && !done && (
        <div className="card">
          <p className="text-xs text-slate-500">Question {idx + 1} of {session.questions.length}</p>
          <p className="my-2 text-lg font-medium">{session.questions[idx].text}</p>
          <textarea className="input" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!fb} placeholder="Type your answer here..." maxLength={3000} />
          {!fb ? <button className="btn mt-3" onClick={submit} disabled={busy || !answer.trim()}>{busy ? 'Evaluating...' : 'Submit answer'}</button>
            : <><FeedbackCard fb={fb} /><button className="btn mt-3" onClick={next}>{idx + 1 < session.questions.length ? 'Next question' : 'Finish & see report'}</button></>}
        </div>
      )}

      {done && (
        <div className="space-y-4">
          <div className="card"><p className="text-sm text-slate-500 capitalize">{session.type} interview · {session.role}</p><p className="text-3xl font-bold text-indigo-600">{session.overall}/100</p>
            <p className="text-xs text-slate-500">Average of answered questions.</p></div>
          {session.questions.map((q, i) => (
            <div key={i} className="card"><p className="font-medium">{i + 1}. {q.text}</p>
              {q.feedback ? <><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{q.answer}</p><FeedbackCard fb={q.feedback} /></> : <p className="text-sm text-slate-400">Not answered</p>}</div>))}
          <button className="btn" onClick={reset}>Back</button>
        </div>
      )}
    </div>
  );
}
