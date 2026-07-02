import React from 'react';

export default function IntroScreen({ setGameStarted }) {
  return (
    <div className="intro-screen">
      <h1 className="game-title">IKIMETSÄ</h1>
      <p className="intro-text animate-text-1">Musta sumu nieli kaiken takanasi...</p>
      <p className="intro-text animate-text-2">Metsän rajalla jokainen askel voi olla viimeinen.</p>
      <p className="intro-text animate-text-3">Vedä henkeä, kuuntele ja paina aloittaaksesi taival.</p>
      <button className="start-btn" onClick={() => setGameStarted(true)}>
        Aloita Taival
      </button>
    </div>
  );
}