import { useEffect, useState } from 'react';
import { api } from '../api';

const STATUSES = ['saved', 'applied', 'in_progress', 'interview', 'offer', 'rejected'];

export default function Jobs() {
  const [form, setForm] = useState({ title: '', company: '', text: '' });
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [err, setErr] = useState('');
  const load = () => Promise.all([api('/jobs'), api('/jobs/applications')]).then(([j, a]) => { setJobs(j.jobs); setApps(a.applications); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const addJob = async (e) => { e.preventDefault(); setErr(''); try { await api('/jobs', { method: 'POST', body: form }); setForm({ title: '', company: '', text: '' }); load(); } catch (x) { setErr(x.message); } };
  const track = async (jobId) => { try { await api('/jobs/applications', { method: 'POST', body: { jobId, status: 'applied' } }); load(); } catch (x) { setErr(x.message); } };
  const setStatus = async (id, status) => { try { await api(`/jobs/applications/${id}`, { method: 'PATCH', body: { status } }); load(); } catch (x) { setErr(x.message); } };
  const trackedIds = new Set(apps.map((a) => a.job?._id));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={addJob} className="card space-y-3">
        <h1 className="text-xl font-bold">Save a job description</h1>
        <p className="text-xs text-slate-500">Add jobs manually. This app does not show live job listings.</p>
        <input className="input" placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <textarea className="input" rows={6} placeholder="Paste description (min 20 characters)" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
        <button className="btn">Save & extract skills</button>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      </form>
      <div className="space-y-6">
        <div className="card"><h2 className="mb-2 font-semibold">Saved jobs</h2>
          {jobs.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : <ul className="space-y-2 text-sm">{jobs.map((j) => (
            <li key={j._id} className="flex items-start justify-between gap-2"><span><b>{j.title}</b> {j.company && `· ${j.company}`}<br /><span className="text-slate-500">Skills: {j.skills.join(', ') || 'none detected'}</span></span>
              {!trackedIds.has(j._id) && <button className="btn-ghost shrink-0" onClick={() => track(j._id)}>Track</button>}</li>))}</ul>}</div>
        <div className="card"><h2 className="mb-2 font-semibold">Applications</h2>
          {apps.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : <ul className="space-y-2 text-sm">{apps.map((a) => (
            <li key={a._id} className="flex items-center justify-between"><span>{a.job?.title}</span>
              <select className="input w-36" value={a.status} onChange={(e) => setStatus(a._id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></li>))}</ul>}</div>
      </div>
    </div>
  );
}
