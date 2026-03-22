import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Room from './pages/Room';
import History from './pages/History';

function NavBar() {
  const location = useLocation();
  
  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-blue-600 text-white'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center gap-6">
      <div className="flex items-center gap-2 mr-6">
        <span className="text-2xl">♟</span>
        <span className="text-xl font-bold text-slate-100">Grandmaster.io</span>
      </div>
      <Link to="/" className={linkClass('/')}>Analysis</Link>
      <Link to="/history" className={linkClass('/history')}>Game Vault</Link>
      <Link to="/room" className={linkClass('/room')}>Study Room</Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room" element={<Room />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
        }}
      />
    </BrowserRouter>
  );
}
