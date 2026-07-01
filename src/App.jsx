import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="game-container">
      {!gameStarted ? (
        <div className="intro-screen">
          <div className="fog-overlay"></div>
          <h1 className="game-title">IKIMETSÄ</h1>
          <p className="intro-text animate-text-1">Musta sumu nieli kaiken takanasi...</p>
          <p className="intro-text animate-text-2">Ainoa pakotie on edessäsi häämöttävä synkkä korpi.</p>
          <p className="intro-text animate-text-3">Metsä odottaa. Astutko sisään?</p>
          
          <button className="start-btn" onClick={() => setGameStarted(true)}>
            Astu Ikimetsään
          </button>
        </div>
      ) : (
        <div className="game-play-screen">
          <h2>Peli on alkanut... Olet puiden saartama.</h2>
        </div>
      )}
    </div>
  );
}