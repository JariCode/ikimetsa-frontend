import React from 'react';
import './TreasureStyles.css';

export default function TreasureScreen({ activeSession, onContinue }) {
  const repairBonus = activeSession?.currentArea?.treasureEvent?.repairPointsBonus || 5;
  const hpBonus = activeSession?.currentArea?.treasureEvent?.maxHpBonus || 10;
  const discoveryText = activeSession?.currentArea?.treasureEvent?.discoveryText
    || 'Jokin kelluu hiljaa aaltojen mukana lautan vieressä.';

  const discoverySentences = discoveryText
    .split(/(?<=[.!?])\s+|\n/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="treasure-screen">
      <h1 className="game-title treasure-title">IKIMETSÄ</h1>

      <div className="treasure-visual" aria-hidden="true">
        <div className="treasure-water"></div>
        <div className="treasure-ripple ripple-1"></div>
        <div className="treasure-ripple ripple-2"></div>
        <div className="treasure-pouch">
          <div className="pouch-body"></div>
          <div className="pouch-neck"></div>
          <div className="pouch-glow"></div>
        </div>
      </div>

      <h3 className="treasure-heading">Löysit haltijoiden pussin</h3>

      <div className="intro-scroll-window treasure-scroll-window">
        <div className="intro-scroll-content treasure-scroll-content">
          {discoverySentences.map((sentence, i) => (
            <p className="intro-text" key={i}>{sentence}</p>
          ))}
          <p className="intro-text">Avaat hopealangan ja katsot sisään.</p>
          <p className="intro-text">Pussista löytyy {repairBonus} korjauspistettä työkaluillesi.</p>
          <p className="intro-text">Sekä haltijoiden loihtimaa ravintoa, </p>
          <p className="intro-text">joka lisää {hpBonus} elinvoimaa pysyvästi.</p>
        </div>
      </div>

      <button className="start-btn start-btn-continue" onClick={onContinue}>
        Jatka matkaa vahvistuneena
      </button>
    </div>
  );
}