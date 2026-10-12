import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await (isLogin ? login({ email: form.email, password: form.password }) : register(form)); nav('/'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-indigo-600">Placemap AI</h1>
        <p className="text-sm text-slate-500">{isLogin ? 'Sign in to continue' : 'Create your student account'}</p>
        {!isLogin && <div><label className="text-sm" htmlFor="name">Name</label><input id="name" className="input" value={form.name} onChange={set('name')} required /></div>}
        <div><label className="text-sm" htmlFor="email">Email</label><input id="email" type="email" className="input" value={form.email} onChange={set('email')} required /></div>
        <div><label className="text-sm" htmlFor="pw">Password</label><input id="pw" type="password" className="input" value={form.password} onChange={set('password')} required />
          {!isLogin && <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>}</div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Please wait...' : isLogin ? 'Login' : 'Register'}</button>
        <p className="text-center text-sm">{isLogin ? <>No account? <Link className="text-indigo-600" to="/register">Register</Link></> : <>Have an account? <Link className="text-indigo-600" to="/login">Login</Link></>}</p>
      </form>
    </div>
  );
}
