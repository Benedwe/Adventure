import React from 'react';
import './App.css';
import AuthDemo from './AuthDemo';
import Leaderboard from './Leaderboard';
import Game from './Game';

function App() {
  return (
    <div className="App">
      <AuthDemo />
      <Game />
      <Leaderboard />
    </div>
  );
}

export default App;
