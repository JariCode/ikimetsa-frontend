import React, { useEffect } from 'react';
import './CompanionStyles.css';
import discoveryRiserSfx from '../assets/audio/sfx/u_1pruylktlg-riser-7-130957.mp3';
import mysteryMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

export default function CompanionScreen({ activeSession, onContinue }) {

  // 🔊 Lyhyt riser-äänitehoste soi kerran heti ruudun ilmestyessä.
  useEffect(() => {
    const riser = new Audio(discoveryRiserSfx);
    riser.volume = 0.6;
    riser.play().catch(() => {});
  }, []);

  // 🎵 Mystinen taustamusiikki looppina - häipyy pois kun poistutaan.
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(mysteryMusic)
      .then((res) => res.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        if (cancelled) return;
        source = audioContext.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const fadeStep = gainNode.gain.value / 24;
      const fadeInterval = setInterval(() => {
        if (gainNode.gain.value - fadeStep <= 0) {
          gainNode.gain.value = 0;
          if (source) source.stop();
          audioContext.close();
          clearInterval(fadeInterval);
        } else {
          gainNode.gain.value -= fadeStep;
        }
      }, 50);
    };
  }, []);
  
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