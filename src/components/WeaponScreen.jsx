import React, { useEffect } from 'react';
import './WeaponStyles.css';
import discoveryRiserSfx from '../assets/audio/sfx/u_1pruylktlg-riser-7-130957.mp3';
import mysteryMusic from '../assets/audio/music/leberch-mystery-secret-255437.mp3';

export default function WeaponScreen({ activeSession, onContinue }) {

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
  
  const weaponName = activeSession?.inventory?.[0]?.name || 'Tuntematon ase';
  const isMachete = weaponName === 'Machete';
  const discoveryText = activeSession?.currentArea?.weaponEvent?.discoveryText
    || 'Löydät jotain terävää mullan alta.';

  const discoverySentences = discoveryText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="weapon-screen">
      <h1 className="game-title weapon-title">IKIMETSÄ</h1>

      <div className="weapon-visual" aria-hidden="true">
        <div className="weapon-mound"></div>
        {isMachete ? (
          <div className="weapon-machete">
            <div className="machete-handle"></div>
            <div className="machete-blade"></div>
            <div className="machete-glint"></div>
          </div>
        ) : (
          <div className="weapon-crowbar">
            <div className="crowbar-shaft"></div>
            <div className="crowbar-claw"></div>
          </div>
        )}
      </div>

      <h3 className="weapon-heading">Löysit uuden aseen: {weaponName}</h3>

      <div className="intro-scroll-window weapon-scroll-window">
        <div className="intro-scroll-content weapon-scroll-content">
          {discoverySentences.map((sentence, i) => (
            <p className="intro-text" key={i}>{sentence}</p>
          ))}
          <p className="intro-text">Punnitset {weaponName}:n painoa käsissäsi.</p>
          <p className="intro-text">Tämä tekee huomattavasti enemmän vahinkoa kuin vanha aseesi.</p>
        </div>
      </div>

      <button className="start-btn start-btn-continue" onClick={onContinue}>
        Jatka matkaa uuden aseesi kanssa
      </button>
    </div>
  );
}