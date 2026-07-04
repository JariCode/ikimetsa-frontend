import React from 'react';
import './CompanionStyles.css';

export default function CompanionScreen({ activeSession, onContinue }) {
  const companionName = activeSession?.companionName || 'Tuntematon vaeltaja';
  const discoveryText = activeSession?.currentArea?.companionEvent?.discoveryText
    || 'Löydät jonkun eksyneen vaeltajan seitin peitosta. Hän on yhä elossa.';

  // 📖 Pilkotaan backendistä tuleva teksti lauseiksi, koska sen pituutta ei
  // voi hallita etukäteen - jokainen lause omana rivinään mahtuu aina samaan
  // liukuvaan tekstinauhaan kuin muissakin tarinaruuduissa (nuotio, hauta).
  const discoverySentences = discoveryText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

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
        <div className="intro-scroll-content companion-scroll-content">
          {discoverySentences.map((sentence, i) => (
            <p className="intro-text" key={i}>{sentence}</p>
          ))}
          <p className="intro-text">Vapautat {companionName}:n seitistä varovasti.</p>
          <p className="intro-text">"Kiitos", hän kuiskaa käheästi.</p>
          <p className="intro-text">"En unohda tätä. Taistelen rinnallasi loppuun asti."</p>
        </div>
      </div>

      <button className="start-btn start-btn-continue" onClick={onContinue}>
        Jatka matkaa yhdessä
      </button>
    </div>
  );
}