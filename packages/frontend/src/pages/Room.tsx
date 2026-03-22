import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import StudyRoom from '../components/StudyRoom';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('gm_username') || '');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [activeRoomId, setActiveRoomId] = useState(roomId || null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      toast.error('Enter a username first');
      return;
    }
    setIsCreating(true);
    try {
      const res = await axios.post<{ roomId: string }>('/api/rooms', { createdBy: username });
      const newRoomId: string = res.data.roomId;
      localStorage.setItem('gm_username', username);
      setActiveRoomId(newRoomId);
      navigate(`/room/${newRoomId}`);
      toast.success(`Room created! ID: ${newRoomId}`);
    } catch {
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      toast.error('Enter a username first');
      return;
    }
    if (!joinRoomId.trim()) {
      toast.error('Enter a room ID');
      return;
    }
    localStorage.setItem('gm_username', username);
    setActiveRoomId(joinRoomId.trim());
    navigate(`/room/${joinRoomId.trim()}`);
  };

  if (activeRoomId && username) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Study Room</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">Room ID:</span>
              <code className="text-sm text-blue-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {activeRoomId}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeRoomId).catch(() => {});
                  toast.success('Room ID copied!');
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveRoomId(null);
              navigate('/room');
            }}
            className="btn-secondary text-sm"
          >
            Leave Room
          </button>
        </div>
        <StudyRoom roomId={activeRoomId} username={username} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Study Rooms</h1>
      <p className="text-slate-400 text-sm">
        Collaborate with others in real-time. Share a room ID to analyze positions together.
      </p>

      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Your Username</h2>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username..."
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Create a New Room</h2>
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="btn-primary w-full"
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Join an Existing Room</h2>
        <input
          type="text"
          value={joinRoomId}
          onChange={e => setJoinRoomId(e.target.value)}
          placeholder="Enter room ID..."
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
        />
        <button onClick={handleJoinRoom} className="btn-secondary w-full">
          Join Room
        </button>
      </div>
    </div>
  );
}
