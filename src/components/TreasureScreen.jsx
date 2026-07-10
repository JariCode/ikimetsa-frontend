import React, { useEffect } from 'react';
import './TreasureStyles.css';
import discoveryRiserSfx from '../assets/audio/sfx/u_1pruylktlg-riser-7-130957.mp3';
import mysteryMusic from '../assets/audio/music/leberch-mystery-secret-255437.mp3';

export default function TreasureScreen({ activeSession, onContinue }) {

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