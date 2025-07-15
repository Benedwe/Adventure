import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { saveScore } from './saveScore';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const LEVELS = [
  { name: 'Easy', min: 1, max: 10, ops: ['+'] },
  { name: 'Medium', min: 1, max: 20, ops: ['+', '-'] },
  { name: 'Hard', min: 1, max: 50, ops: ['+', '-', '*', '/'] },
];
const BADGE_ICONS = {
  'Hot Streak (3 games with 8+)': '🔥',
  'New High Score!': '🏆',
  'Consistent Performer': '📈',
  'First Game': '🎉',
  'Comeback Kid': '🔄',
  'Persistence': '💪',
};
const BADGE_COLORS = {
  'Hot Streak (3 games with 8+)': '#ff9800',
  'New High Score!': '#ffd700',
  'Consistent Performer': '#4caf50',
  'First Game': '#2196f3',
  'Comeback Kid': '#9c27b0',
  'Persistence': '#795548',
};
const ACHIEVEMENT_ICONS = {
  'Perfect Score!': '🌟',
  'Math Master': '🧠',
  'Math Apprentice': '📚',
  'Challenge Accepted': '⛰️',
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(level) {
  const { min, max, ops } = LEVELS[level];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  switch (op) {
    case '+':
      a = getRandomInt(min, max);
      b = getRandomInt(min, max);
      answer = a + b;
      break;
    case '-':
      a = getRandomInt(min, max);
      b = getRandomInt(min, a); // ensure non-negative
      answer = a - b;
      break;
    case '*':
      a = getRandomInt(min, Math.sqrt(max));
      b = getRandomInt(min, Math.sqrt(max));
      answer = a * b;
      break;
    case '/':
      b = getRandomInt(min, Math.sqrt(max));
      answer = getRandomInt(min, Math.sqrt(max));
      a = b * answer;
      break;
    default:
      a = b = answer = 0;
  }
  return { question: `${a} ${op} ${b}`, answer };
}

function getAchievements(score, total, level) {
  const achievements = [];
  if (score === total) achievements.push('Perfect Score!');
  if (score >= total * 0.8) achievements.push('Math Master');
  if (score >= total * 0.5) achievements.push('Math Apprentice');
  if (level === 2 && score >= total * 0.7) achievements.push('Challenge Accepted');
  return achievements;
}

function getBadges(history, score, total) {
  const badges = [];
  // First game badge
  if (history.length === 0) badges.push('First Game');
  // Streak badge: 3+ games with score >= 8
  const streak = history.slice(0, 3).every(h => h.score >= 8);
  if (streak && history.length >= 3) badges.push('Hot Streak (3 games with 8+)');
  // High score badge
  if (score === Math.max(...history.map(h => h.score), score)) badges.push('New High Score!');
  // Consistency badge
  if (history.length >= 5 && history.slice(0, 5).every(h => h.score >= total * 0.7)) badges.push('Consistent Performer');
  // Comeback Kid: score is higher than previous game
  if (history.length > 0 && score > history[0].score) badges.push('Comeback Kid');
  // Persistence: 10+ games played
  if (history.length >= 9) badges.push('Persistence');
  return badges;
}

async function fetchUserHistory(uid) {
  const q = query(
    collection(db, 'scores'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
}

export default function Game() {
  const [level, setLevel] = useState(0);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQ, setCurrentQ] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionNum, setQuestionNum] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [animate, setAnimate] = useState(false);
  const totalQuestions = 10;
  const resultRef = useRef(null);

  useEffect(() => {
    if (auth.currentUser) {
      setLoadingHistory(true);
      fetchUserHistory(auth.currentUser.uid).then(h => {
        setHistory(h);
        setLoadingHistory(false);
      });
    }
  }, [showResult, started]);

  useEffect(() => {
    if (showResult) {
      // Confetti animation on game complete
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1200);
    }
  }, [showResult]);

  const startGame = () => {
    setScore(0);
    setQuestionNum(0);
    setStarted(true);
    setShowResult(false);
    setAchievements([]);
    setBadges([]);
    setCurrentQ(generateQuestion(level));
    setUserAnswer('');
  };

  const handleAnswer = (e) => {
    e.preventDefault();
    if (!currentQ) return;
    if (parseInt(userAnswer, 10) === currentQ.answer) {
      setScore(s => s + 1);
    }
    if (questionNum + 1 < totalQuestions) {
      setQuestionNum(q => q + 1);
      setCurrentQ(generateQuestion(level));
      setUserAnswer('');
    } else {
      // Game over
      const finalScore = score + (parseInt(userAnswer, 10) === currentQ.answer ? 1 : 0);
      const ach = getAchievements(finalScore, totalQuestions, level);
      setAchievements(ach);
      setShowResult(true);
      setStarted(false);
      saveFinalScore(finalScore);
      if (auth.currentUser) {
        fetchUserHistory(auth.currentUser.uid).then(h => {
          setHistory(h);
          setBadges(getBadges(h, finalScore, totalQuestions));
        });
      }
    }
  };

  const saveFinalScore = async (finalScore) => {
    setSaving(true);
    try {
      await saveScore(finalScore);
    } catch (err) {
      // Optionally show error
    }
    setSaving(false);
  };

  if (!auth.currentUser) {
    return <div style={{ margin: 20, color: 'red' }}>Please log in to play the game.</div>;
  }

  if (!started && !showResult) {
    return (
      <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, border: '2px solid #1976d2', borderRadius: 16, background: '#f5faff', boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ color: '#1976d2', marginBottom: 16 }}>Start Math Game</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600 }}>Level: </label>
          <select value={level} onChange={e => setLevel(Number(e.target.value))} style={{ padding: 4, borderRadius: 4, border: '1px solid #1976d2' }}>
            {LEVELS.map((l, i) => <option key={l.name} value={i}>{l.name}</option>)}
          </select>
        </div>
        <button onClick={startGame} style={{ background: '#1976d2', color: 'white', padding: '8px 24px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16 }}>Start</button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div ref={resultRef} style={{ maxWidth: 440, margin: '2rem auto', padding: 24, border: '2px solid #388e3c', borderRadius: 16, background: '#f9fff5', boxShadow: '0 2px 8px #0001', position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ color: '#388e3c', marginBottom: 8, transition: 'transform 0.5s', transform: animate ? 'scale(1.1)' : 'scale(1)' }}>Game Complete!</h2>
        <p style={{ fontSize: 18, marginBottom: 8, transition: 'color 0.5s', color: animate ? '#1976d2' : '#333' }}>Your score: <b>{score}</b> / {totalQuestions}</p>
        <div style={{ marginBottom: 12 }}>
          <b>Achievements:</b>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {achievements.length === 0 && <li style={{ color: '#888' }}>None</li>}
            {achievements.map((a, i) => (
              <li key={a} style={{ fontSize: 18, margin: '4px 0', opacity: animate ? 0.2 : 1, animation: animate ? `popIn 0.5s ${0.2 + i * 0.15}s forwards` : 'none' }}>
                <span style={{ marginRight: 8 }}>{ACHIEVEMENT_ICONS[a] || '🏅'}</span>{a}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 12 }}>
          <b>Badges:</b>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {badges.length === 0 && <li style={{ color: '#888' }}>None</li>}
            {badges.map((b, i) => (
              <li key={b} style={{ background: BADGE_COLORS[b] || '#eee', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: 16, opacity: animate ? 0.2 : 1, animation: animate ? `popIn 0.5s ${0.5 + i * 0.15}s forwards` : 'none' }}>
                <span style={{ marginRight: 6 }}>{BADGE_ICONS[b] || '🏅'}</span>{b}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 12 }}>
          <b>Your Recent Scores:</b>
          {loadingHistory ? <p>Loading...</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.length === 0 && <li style={{ color: '#888' }}>No history yet.</li>}
              {history.map((h, i) => (
                <li key={i} style={{ fontSize: 15, margin: '2px 0', color: '#333' }}>Score: {h.score} <span style={{ color: '#888', fontSize: 13 }}>({h.createdAt && h.createdAt.toDate ? h.createdAt.toDate().toLocaleString() : 'Unknown'})</span></li>
              ))}
            </ul>
          )}
        </div>
        {saving ? <p>Saving score...</p> : <button onClick={startGame} style={{ background: '#388e3c', color: 'white', padding: '8px 24px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16 }}>Play Again</button>}
        <style>{`
          @keyframes popIn {
            0% { opacity: 0.2; transform: scale(0.7); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, border: '2px solid #1976d2', borderRadius: 16, background: '#f5faff', boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ color: '#1976d2' }}>Level: {LEVELS[level].name}</h2>
      <p style={{ fontWeight: 600 }}>Score: {score} / {totalQuestions}</p>
      <p>Question {questionNum + 1} of {totalQuestions}</p>
      <form onSubmit={handleAnswer}>
        <div style={{ fontSize: 28, margin: '16px 0', color: '#333' }}>{currentQ ? currentQ.question : ''}</div>
        <input
          type="number"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 8, fontSize: 18, padding: 6, borderRadius: 6, border: '1px solid #1976d2' }}
        />
        <button type="submit" style={{ background: '#1976d2', color: 'white', padding: '8px 24px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16 }}>Submit</button>
      </form>
    </div>
  );
} 