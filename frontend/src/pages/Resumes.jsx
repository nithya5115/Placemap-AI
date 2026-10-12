import { useEffect, useState } from 'react';
import { api } from '../api';

const blank = { title: '', name: '', email: '', summary: '', skills: '', degree: '', school: '', project: '' };
const toPayload = (f) => ({
  title: f.title, template: 'classic',
  data: {
    personal: { name: f.name, email: f.email, summary: f.summary },
    skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean),
    education: f.school || f.degree ? [{ school: f.school, degree: f.degree }] : [],
    projects: f.project ? [{ name: 'Project', description: f.project }] : [],
  },
});

export default function Resumes() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const [sel, setSel] = useState(null);
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [upMsg, setUpMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const load = () => api('/resumes').then((d) => setList(d.resumes)).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api('/resumes', { method: 'POST', body: toPayload(form) }); setForm(blank); setMsg('Resume saved.'); load(); }
    catch (err) { setMsg(err.message); }
  };
  const upload = async (e) => {
    e.preventDefault(); if (!file) return;
    setUploading(true); setUpMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const d = await api('/resumes/upload', { method: 'POST', body: fd });
      setUpMsg(`Uploaded. Detected skills: ${d.detectedSkills.join(', ') || 'none found'}. Select it below and click Analyze.`);
      setFile(null); setFileKey((k) => k + 1); load();
    } catch (err) { setUpMsg(err.message); } finally { setUploading(false); }
  };
  const del = async (id) => { if (confirm('Delete this resume?')) { await api(`/resumes/${id}`, { method: 'DELETE' }); if (sel === id) setSel(null); load(); } };
  const run = async () => {
    setMsg(''); setResult(null);
    try { setResult(await api(`/resumes/${sel}/analyze`, { method: 'POST', body: { jobDescription: jd } })); }
    catch (err) { setMsg(err.message); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="card space-y-3">
        <h1 className="text-xl font-bold">Upload your resume</h1>
        <p className="text-sm text-slate-500">PDF or DOCX, up to 3 MB. Text is read to match skills; the file itself is not stored. Scanned/image PDFs are not supported.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input key={fileKey} type="file" accept=".pdf,.docx" className="text-sm" onChange={(e) => setFile(e.target.files[0] || null)} />
          <button className="btn" disabled={!file || uploading}>{uploading ? 'Reading file...' : 'Upload & read'}</button>
        </div>
        {upMsg && <p role="status" className="text-sm text-indigo-600">{upMsg}</p>}
      </form>
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="card space-y-3">
        <h1 className="text-xl font-bold">New resume</h1>
        <input className="input" placeholder="Resume title (e.g. Java Developer)" value={form.title} onChange={set('title')} required />
        <div className="grid grid-cols-2 gap-3"><input className="input" placeholder="Full name" value={form.name} onChange={set('name')} /><input className="input" placeholder="Email" type="email" value={form.email} onChange={set('email')} /></div>
        <textarea className="input" rows={3} placeholder="Professional summary" value={form.summary} onChange={set('summary')} />
        <input className="input" placeholder="Skills, comma separated (Java, SQL, React)" value={form.skills} onChange={set('skills')} />
        <div className="grid grid-cols-2 gap-3"><input className="input" placeholder="College" value={form.school} onChange={set('school')} /><input className="input" placeholder="Degree" value={form.degree} onChange={set('degree')} /></div>
        <textarea className="input" rows={3} placeholder="Project description" value={form.project} onChange={set('project')} />
        <button className="btn">Save resume</button>
        {msg && <p role="status" className="text-sm text-indigo-600">{msg}</p>}
      </form>

      <div className="space-y-6">
        <div className="card">
          <h2 className="mb-3 font-semibold">My resumes</h2>
          {list.length === 0 ? <p className="text-sm text-slate-500">No resumes yet. Create your first one.</p> :
            <ul className="space-y-2">{list.map((r) => (
              <li key={r._id} className={`flex items-center justify-between rounded-lg border p-2 text-sm ${sel === r._id ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <span>{r.title} {r.source === 'upload' && <span className="ml-1 rounded bg-indigo-100 px-1.5 text-xs text-indigo-700">uploaded</span>}</span>
                <span className="space-x-2"><button className="btn-ghost" onClick={() => { setSel(r._id); setResult(null); }}>Analyze</button><button className="btn-ghost text-red-600" onClick={() => del(r._id)}>Delete</button></span>
              </li>))}</ul>}
        </div>
        {sel && (
          <div className="card space-y-3">
            <h2 className="font-semibold">Match against a job description</h2>
            <textarea className="input" rows={5} placeholder="Paste the full job description..." value={jd} onChange={(e) => setJd(e.target.value)} />
            <button className="btn" onClick={run} disabled={jd.trim().length < 20}>Analyze</button>
            {result && (
              <div className="space-y-2 text-sm">
                <p className="text-3xl font-bold text-indigo-600">{result.score === null ? 'N/A' : `${result.score}/100`}</p>
                <p className="text-xs text-slate-500">{result.disclaimer} Formula: 70% keyword match + 30% section completeness.</p>
                <p><b>Matched:</b> {result.matched.join(', ') || 'none'}</p>
                <p><b>Missing:</b> {result.missing.join(', ') || 'none'}</p>
                <ul className="list-disc pl-5">{result.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>)}
          </div>)}
      </div>
    </div>
    </div>
  );
}
