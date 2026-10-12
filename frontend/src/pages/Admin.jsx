import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const CATS = ['quantitative', 'logical', 'verbal', 'data_interpretation', 'technical'];
const blankA = { category: 'quantitative', topic: '', difficulty: 'easy', question: '', o1: '', o2: '', o3: '', o4: '', answerIndex: 0, explanation: '' };
const blankI = { type: 'technical', role: 'general', difficulty: 'easy', text: '', keywords: '' };

export default function Admin() {
  const { user } = useAuth();
  const canEdit = user.role === 'admin';
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [apt, setApt] = useState([]);
  const [intq, setIntq] = useState([]);
  const [fa, setFa] = useState(blankA);
  const [fi, setFi] = useState(blankI);
  const [msg, setMsg] = useState('');

  const run = async (fn) => { setMsg(''); try { await fn(); } catch (e) { setMsg(e.message); } };
  const loadStats = () => run(async () => setStats(await api('/admin/stats')));
  const loadUsers = () => run(async () => setUsers((await api(`/admin/users?search=${encodeURIComponent(search)}`)).users));
  const loadApt = () => run(async () => setApt((await api('/admin/aptitude')).items));
  const loadInt = () => run(async () => setIntq((await api('/admin/interview-questions')).items));
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'students') loadUsers(); if (tab === 'aptitude') loadApt(); if (tab === 'interview') loadInt(); }, [tab]);

  const toggle = (u) => run(async () => { await api(`/admin/users/${u._id}/active`, { method: 'PATCH', body: { isActive: !u.isActive } }); loadUsers(); });
  const addApt = (e) => { e.preventDefault(); run(async () => {
    const options = [fa.o1, fa.o2, fa.o3, fa.o4].map((s) => s.trim()).filter(Boolean);
    await api('/admin/aptitude', { method: 'POST', body: { category: fa.category, topic: fa.topic, difficulty: fa.difficulty, question: fa.question, options, answerIndex: Number(fa.answerIndex), explanation: fa.explanation || undefined } });
    setFa(blankA); setMsg('Question added.'); loadApt(); loadStats(); }); };
  const addInt = (e) => { e.preventDefault(); run(async () => {
    await api('/admin/interview-questions', { method: 'POST', body: { ...fi, keywords: fi.keywords.split(',').map((s) => s.trim()).filter(Boolean) } });
    setFi(blankI); setMsg('Question added.'); loadInt(); loadStats(); }); };
  const del = (path, reload) => { if (confirm('Delete this question?')) run(async () => { await api(path, { method: 'DELETE' }); reload(); loadStats(); }); };

  const tabs = ['overview', 'students', 'aptitude', 'interview'];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin dashboard {!canEdit && <span className="text-sm font-normal text-slate-500">(read-only)</span>}</h1>
      <div className="flex gap-2">{tabs.map((t) => <button key={t} className={tab === t ? 'btn' : 'btn-ghost'} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      {msg && <p role="status" className="text-sm text-indigo-600">{msg}</p>}

      {tab === 'overview' && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(stats).map(([k, v]) => (
          <div key={k} className="card"><p className="text-sm capitalize text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</p><p className="text-3xl font-bold">{v}</p></div>))}</div>)}

      {tab === 'students' && (
        <div className="card space-y-3">
          <div className="flex gap-2"><input className="input" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn" onClick={loadUsers}>Search</button></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th></tr></thead>
            <tbody>{users.map((u) => (<tr key={u._id} className="border-b border-slate-100 dark:border-slate-800"><td className="p-2">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>{u.role === 'student' && canEdit ? <button className="btn-ghost" onClick={() => toggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</button> : u.isActive ? 'Active' : 'Disabled'}</td></tr>))}</tbody></table></div>
        </div>)}

      {tab === 'aptitude' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {canEdit && <form onSubmit={addApt} className="card space-y-2">
            <h2 className="font-semibold">Add aptitude question</h2>
            <div className="grid grid-cols-3 gap-2">
              <select className="input" value={fa.category} onChange={(e) => setFa({ ...fa, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input className="input" placeholder="Topic" value={fa.topic} onChange={(e) => setFa({ ...fa, topic: e.target.value })} required />
              <select className="input" value={fa.difficulty} onChange={(e) => setFa({ ...fa, difficulty: e.target.value })}><option>easy</option><option>medium</option><option>hard</option></select></div>
            <textarea className="input" rows={2} placeholder="Question" value={fa.question} onChange={(e) => setFa({ ...fa, question: e.target.value })} required />
            {['o1', 'o2', 'o3', 'o4'].map((k, i) => <input key={k} className="input" placeholder={`Option ${i + 1}${i > 1 ? ' (optional)' : ''}`} value={fa[k]} onChange={(e) => setFa({ ...fa, [k]: e.target.value })} required={i < 2} />)}
            <label className="text-sm">Correct option<select className="input" value={fa.answerIndex} onChange={(e) => setFa({ ...fa, answerIndex: e.target.value })}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>Option {n + 1}</option>)}</select></label>
            <input className="input" placeholder="Explanation" value={fa.explanation} onChange={(e) => setFa({ ...fa, explanation: e.target.value })} />
            <button className="btn">Add question</button></form>}
          <div className="card max-h-[600px] overflow-y-auto"><h2 className="mb-2 font-semibold">Questions (latest 50)</h2>
            <ul className="space-y-2 text-sm">{apt.map((q) => (<li key={q._id} className="flex justify-between gap-2"><span><b>{q.category}</b> · {q.topic} · {q.difficulty}{q.isSample && ' · sample'}<br />{q.question}<br /><span className="text-green-600">Answer: {q.options[q.answerIndex]}</span></span>
              {canEdit && <button className="text-red-600" onClick={() => del(`/admin/aptitude/${q._id}`, loadApt)}>Delete</button>}</li>))}</ul></div>
        </div>)}

      {tab === 'interview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {canEdit && <form onSubmit={addInt} className="card space-y-2">
            <h2 className="font-semibold">Add interview question</h2>
            <div className="grid grid-cols-3 gap-2">
              <select className="input" value={fi.type} onChange={(e) => setFi({ ...fi, type: e.target.value })}><option>technical</option><option>hr</option><option>behavioral</option></select>
              <input className="input" placeholder="Role" value={fi.role} onChange={(e) => setFi({ ...fi, role: e.target.value })} />
              <select className="input" value={fi.difficulty} onChange={(e) => setFi({ ...fi, difficulty: e.target.value })}><option>easy</option><option>medium</option><option>hard</option></select></div>
            <textarea className="input" rows={3} placeholder="Question text" value={fi.text} onChange={(e) => setFi({ ...fi, text: e.target.value })} required />
            <input className="input" placeholder="Expected keywords, comma separated" value={fi.keywords} onChange={(e) => setFi({ ...fi, keywords: e.target.value })} />
            <button className="btn">Add question</button></form>}
          <div className="card max-h-[600px] overflow-y-auto"><h2 className="mb-2 font-semibold">Questions (latest 50)</h2>
            <ul className="space-y-2 text-sm">{intq.map((q) => (<li key={q._id} className="flex justify-between gap-2"><span><b>{q.type}</b> · {q.role}{q.isSample && ' · sample'}<br />{q.text}</span>
              {canEdit && <button className="text-red-600" onClick={() => del(`/admin/interview-questions/${q._id}`, loadInt)}>Delete</button>}</li>))}</ul></div>
        </div>)}
    </div>
  );
}
