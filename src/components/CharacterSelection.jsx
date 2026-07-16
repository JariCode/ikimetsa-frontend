import React, { useEffect } from 'react';
import characterSelectMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

// 🎭 Ikonit haetaan nimen perusteella - ei enää ase-/työkalujohteisia, koska
// pelkkä ternaari (2 hahmoa) ei enää riitä nyt kun hahmoja on neljä.
const CHAR_ICONS = {
  'Metsästäjä': '🔪',   // Vanha puukko
  'Mekaanikko': '🔧',   // Raskas jakoavain
  'Varas': '🗡️',        // Heittoveitset
  'Bodari': '🏋️'        // Käsipaino
};

export default function CharacterSelection({ characterClasses, selectCharacter }) {
  // 🎵 Sama tausta jatkuu hahmonvalinnasta - loppuu (häivyttäen) kun
  // hahmo valitaan ja siirrytään peliin/liikkumisruutuun.
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(characterSelectMusic)
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
    <div className="character-selection-screen">
      <h2 className="section-title">Valitse Selviytyjä</h2>
      <div className="character-cards">
        {characterClasses.map((char) => (
          <div key={char._id} className="char-card" onClick={() => selectCharacter(char.name)}>
            <div className="char-portrait-placeholder">
              {CHAR_ICONS[char.name] || '❓'}
            </div>
            <h3>{char.name}</h3>
            <p className="char-desc">{char.description}</p>
            <ul className="char-stats">
              <li><strong>Elämä:</strong> {char.baseHp} HP</li>
              <li><strong>Aloitusase:</strong> {char.startingWeapon?.name} ({char.startingWeapon?.maxDurability}/{char.startingWeapon?.maxDurability})</li>
              <li><strong>Nopeus:</strong> {parseInt(char.initiativeBonus) >= 0 ? '+' : ''}{char.initiativeBonus}</li>
              <li><strong>Väistö:</strong> {char.baseDefense}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}