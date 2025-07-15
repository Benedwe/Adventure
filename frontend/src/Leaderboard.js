import React, { useEffect, useState } from 'react';
import { auth } from './firebase';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('You must be logged in to view the leaderboard.');
          setLoading(false);
          return;
        }
        const idToken = await user.getIdToken();
        const res = await fetch('http://localhost:3001/leaderboard', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await res.json();
        setLeaderboard(data);
      } catch (err) {
        setError('Failed to fetch leaderboard');
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Global Leaderboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <ol style={{ paddingLeft: 20 }}>
          {leaderboard.map((entry, idx) => (
            <li key={entry.id} style={{ marginBottom: 8 }}>
              <strong>#{idx + 1}</strong> {entry.displayName || entry.email || 'Anonymous'} — <span style={{ color: '#4285F4' }}>{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
} 