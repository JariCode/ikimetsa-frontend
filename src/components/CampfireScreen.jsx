import React, { useEffect } from 'react';
import campfireMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

// Voiton jälkeinen leirinuotioruutu - hahmo lepää, korjaa aseensa ja jatkaa matkaa.
// Sama rullaava tarinatyyli kuin IntroScreenissä ja MovementScreenin alkutarinassa.
export default function CampfireScreen({ onContinue }) {
  // 🎵 Sama musiikki - alkaa kun Nuotioruutu ilmestyy, häipyy pois kun
  // poistutaan (onContinue vie takaisin liikkumisruutuun).
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(campfireMusic)
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
  
  return (
    <div className="campfire-screen">
      <h1 className="game-title campfire-title">IKIMETSÄ</h1>
      <h2 className="campfire-subtitle intro-welcome-back">Voitit! Lepää hetki.</h2>

      <div className="campfire-visual" aria-hidden="true">
        <div className="campfire-glow"></div>
        <div className="logs"></div>
        <div className="flame flame-outer"></div>
        <div className="flame flame-inner"></div>
      </div>

      <div className="intro-scroll-window campfire-scroll-window">
        <div className="intro-scroll-content campfire-scroll-content">
          <p className="intro-text">Nuotio räiskyy hiljaa pimeässä.</p>
          <p className="intro-text">Vaara on hetkeksi ohi.</p>
          <p className="intro-text">Verinen taistelu on takanapäin.</p>
          <p className="intro-text">Nuotion lämpö palauttaa voimasi ja parantaa haavasi.</p>
          <p className="intro-text">Korjaat aseesi hiljaisessa keskittymisessä.</p>
          <p className="intro-text">Pian on aika jatkaa syvemmälle pimeyteen.</p>
        </div>
      </div>

      <div className="action-buttons">
        <button className="start-btn start-btn-continue" onClick={onContinue}>
          Jatka taivalta
        </button>
      </div>
    </div>
  );
}