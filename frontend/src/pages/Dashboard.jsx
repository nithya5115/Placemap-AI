import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const Stat = ({ label, value }) => <div className="card"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>;

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/dashboard').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p role="alert" className="text-red-600">{err}</p>;
  if (!d) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Welcome, {user.name}</h1><p className="text-slate-500">All numbers below come from your saved activity.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Resumes created" value={d.resumes} />
        <Stat label="Aptitude tests completed" value={d.aptitudeTests} />
        <Stat label="Average aptitude score" value={d.averageScore === null ? '—' : `${d.averageScore}%`} />
        <Stat label="Mock interviews completed" value={d.interviewsCompleted} />
        <Stat label="Average interview score" value={d.interviewAverage === null ? '—' : `${d.interviewAverage}/100`} />
        <Stat label="Applications tracked" value={d.applications} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Topic-wise accuracy</h2>
          {d.topicAccuracy.length === 0 ? <p className="text-sm text-slate-500">No data yet. <Link className="text-indigo-600" to="/aptitude">Take an aptitude test</Link>.</p> :
            <ResponsiveContainer width="100%" height={240}><BarChart data={d.topicAccuracy}><XAxis dataKey="topic" fontSize={11} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>}
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Weak areas (below 60%)</h2>
          {d.weakAreas.length === 0 ? <p className="text-sm text-slate-500">None detected yet.</p> :
            <ul className="space-y-2 text-sm">{d.weakAreas.map((w) => <li key={w.topic} className="flex justify-between"><span>{w.topic}</span><span className="text-red-600">{w.accuracy}%</span></li>)}</ul>}
          <h2 className="mb-3 mt-6 font-semibold">Recent activity</h2>
          {d.activities.length === 0 ? <p className="text-sm text-slate-500">Nothing yet.</p> :
            <ul className="space-y-1 text-sm">{d.activities.map((a) => <li key={a._id}>{a.label} <span className="text-slate-400">· {new Date(a.createdAt).toLocaleDateString()}</span></li>)}</ul>}
        </div>
      </div>
    </div>
  );
}
