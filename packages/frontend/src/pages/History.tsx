import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import GameHistory from '../components/GameHistory';

export default function History() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem('gm_token'));
  const [showAuth, setShowAuth] = useState(!token);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };

      const res = await axios.post<{ token: string; user: { username: string } }>(endpoint, payload);
      const { token: newToken, user } = res.data;
      localStorage.setItem('gm_token', newToken);
      localStorage.setItem('gm_username', user.username);
      setToken(newToken);
      setShowAuth(false);
      toast.success(isLogin ? 'Signed in!' : 'Account created!');
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error || 'Authentication failed'
        : 'Authentication failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gm_token');
    localStorage.removeItem('gm_username');
    setToken(null);
    setShowAuth(true);
    toast.success('Signed out');
  };

  const handleLoadGame = (pgn: string) => {
    localStorage.setItem('gm_import_pgn', pgn);
    navigate('/');
    toast.success('Game loaded — go to Analysis to review it');
  };

  if (showAuth) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Game Vault</h1>
        <p className="text-slate-400 text-sm">Sign in to access your saved games and blunder analysis.</p>

        <div className="card p-6 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${isLogin ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-100'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-100'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && (
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Username"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            )}
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Game Vault</h1>
        <button onClick={handleLogout} className="btn-secondary text-sm">Sign Out</button>
      </div>
      <GameHistory token={token} onLoadGame={handleLoadGame} />
    </div>
  );
}
