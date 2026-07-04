import React from 'react';
import './CompanionStyles.css';

export default function CompanionScreen({ activeSession, onContinue }) {
  const companionName = activeSession?.companionName || 'Tuntematon vaeltaja';
  const discoveryText = activeSession?.currentArea?.companionEvent?.discoveryText
    || 'Löydät jonkun eksyneen vaeltajan seitin peitosta. Hän on yhä elossa.';

  return (
    <div className="companion-screen">
      <h1 className="game-title companion-title">IKIMETSÄ</h1>

      <div className="companion-visual" aria-hidden="true">
        <div className="companion-web"></div>
        <div className="companion-figure">
          <div className="companion-head"></div>
          <div className="companion-body"></div>
          <div className="companion-wrap w1"></div>
          <div className="companion-wrap w2"></div>
          <div className="companion-wrap w3"></div>
        </div>
      </div>

      <h3 className="companion-heading">Löysit matkakumppanin: {companionName}</h3>

      <div className="intro-scroll-window companion-scroll-window">
        <div className="intro-scroll-content" style={{ animationDuration: '18s' }}>
          <p className="intro-text">{discoveryText}</p>
          <p className="intro-text">Vapautat {companionName}:n seitistä varovasti.</p>
          <p className="intro-text">"Kiitos", hän kuiskaa käheästi. "En unohda tätä. Taistelen rinnallasi loppuun asti."</p>
        </div>
      </div>

      <button className="start-btn start-btn-continue" onClick={onContinue}>
        Jatka matkaa yhdessä
      </button>
    </div>
  );
}