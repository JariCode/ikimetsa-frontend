import React, { useEffect, useState } from 'react';
import './VictoryStyles.css';
import victoryMusic from '../assets/audio/music/openmindaudio-fantasy-cinematic-background-epic-journey-469170.mp3';

export default function VictoryScreen({ activeSession, handleLogout }) {
  // 🦋 Rullausteksti kestää 50s (victoryScrollText-animaatio). Sen päätyttyä
  // koko laatikko nousee ja häipyy (jatkaa samaa ylöspäin-liikettä kuin teksti),
  // ja vasta sen jälkeen ilmestyy luontokohtaus perhosineen ja lintuineen.
  const [phase, setPhase] = useState('scrolling'); // 'scrolling' | 'exiting' | 'nature'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exiting'), 42000);
    const t2 = setTimeout(() => setPhase('nature'), 43000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // 🎵 Voitto-/lopputekstimusiikki - alkaa kun ruutu ilmestyy, häipyy pois
  // kun poistutaan (uloskirjautuminen tyhjentää koko sovelluksen tilan).
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(victoryMusic)
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
    <div className="victory-screen-wrapper">
      {/* ☀️ Aurinkoinen, elävä tausta seikkailun päätteeksi */}
      <div className="sunny-forest-bg">
        <div className="bright-sun"></div>
        <div className="sun-ray r1"></div>
        <div className="sun-ray r2"></div>
        <div className="sunny-leaf sl1"></div>
        <div className="sunny-leaf sl2"></div>
        <div className="sunny-leaf sl3"></div>
      </div>

      {/* TÄMÄ KEHYSLOOTA PITÄÄ NYT SISÄLLÄÄN SEKÄ IKKUNAN ETTA NAPIN */}
      <div className="victory-main-container">
        
        {phase !== 'nature' ? (
          <div className={`victory-scroll-window ${phase === 'exiting' ? 'victory-scroll-window-exit' : ''}`}>
            <div className="victory-scroll-content">
              <h1 className="victory-title">IKIMETSÄ ON VAPAA</h1>
              <p className="victory-text">Kirottujen Velho on lyöty. Hänen purppurainen loitsutulensa sammuu koristen.</p>
              <p className="victory-text">Ilma, joka oli vuosisatoja täynnä kalmanhajua ja ruttoa, muuttuu hetkessä puhtaaksi.</p>
              <p className="victory-text">Sakea usva vetäytyy puiden ympäriltä, ja mustat kuuset saavat vihdoin valoa.</p>
              <p className="victory-text">Olet selvinnyt läpi mustan veden, ruttohautojen ja synkimmän sydänmetsän.</p>
              <p className="victory-text">Uljas {activeSession?.characterType || 'seikkailija'} muistetaan ikuisesti sankarina, joka toi auringon takaisin.</p>

              <div className="victory-music-credits">
                <p className="victory-music-credits-title">Musiikki ja äänitehosteet</p>

                <ul className="victory-music-list">
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Fantasy Cinematic Background – Epic Journey"</span>
                    <span className="victory-music-credit-source">OpenMindAudio</span>
                  </li>
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Rise Of The Zombies"</span>
                    <span className="victory-music-credit-source">Emmraan</span>
                  </li>
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Horror Horror"</span>
                    <span className="victory-music-credit-source">everything_is_dead</span>
                  </li>
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Scary - Horror"</span>
                    <span className="victory-music-credit-source">everything_is_dead</span>
                  </li>
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Elemental Magic Spell Impact Outgoing"</span>
                    <span className="victory-music-credit-source">RescopicSound</span>
                  </li>
                  <li className="victory-music-credit">
                    <span className="victory-music-credit-name">"Riser (7)"</span>
                    <span className="victory-music-credit-source">u_1pruylktlg</span>
                  </li>
                </ul>

                <p className="victory-music-credits-footer">Kaikki äänet ja musiikki: Pixabay</p>
              </div>

              <div className="victory-credits">
                <h2 className="victory-credits-title">IKIMETSÄ</h2>

                <p className="victory-credits-name">JariCode</p>
                <p className="victory-credits-role">Tarina, suunnittelu, koodi ja ulkoasu</p>

                <p className="victory-credits-published">Julkaistu 2026</p>

                <a className="victory-credits-link" href="https://jaricode.fi/" target="_blank" rel="noopener noreferrer">
                  https://jaricode.fi
                </a>
              </div>

              <p className="victory-thanks">KIITOS PELAAMISESTA!</p>
            </div>
          </div>
        ) : (
          <div className="victory-nature-scene">
            <div className="victory-butterfly vb1"></div>
            <div className="victory-butterfly vb2"></div>
            <div className="victory-butterfly vb3"></div>
            <div className="victory-butterfly vb4"></div>
            <div className="victory-bird vbird1"></div>
            <div className="victory-bird vbird2"></div>
            <div className="victory-bird vbird3"></div>
          </div>
        )}

        {/* NAPPI NÄYTETÄÄN NYT VASTA KUN LUONTOKOHTAUS ILMESTYY (phase === 'nature') */}
        {phase === 'nature' && (
          <button className="victory-exit-btn" onClick={handleLogout}>
            Palaa alkuun & Kirjaudu ulos 🚪
          </button>
        )}

      </div>
    </div>
  );
}