import React from 'react';
import './App.css';
import AuthDemo from './AuthDemo';
import Leaderboard from './Leaderboard';
import Game from './Game';
import { Analytics } from '@vercel/analytics/react'; 

function App() {
  return (
    <div className="App">
      <AuthDemo />
      <Game />
      <Leaderboard />
      <Analytics /> {/* Enables Vercel Analytics */}
    </div>
  );
}

export default App;
