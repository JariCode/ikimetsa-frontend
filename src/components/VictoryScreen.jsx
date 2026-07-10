import React, { useEffect } from 'react';
import './VictoryStyles.css';
import victoryMusic from '../assets/audio/music/openmindaudio-fantasy-cinematic-background-epic-journey-469170.mp3';

export default function VictoryScreen({ activeSession, handleLogout }) {

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
        
        <div className="victory-scroll-window">
          <div className="victory-scroll-content">
            <h1 className="victory-title">IKIMETSÄ ON VAPAA</h1>
            <p className="victory-text">Kirottujen Velho on lyöty. Hänen purppurainen loitsutulensa sammuu koristen.</p>
            <p className="victory-text">Ilma, joka oli vuosisatoja täynnä kalmanhajua ja ruttoa, muuttuu hetkessä puhtaaksi.</p>
            <p className="victory-text">Sakea usva vetäytyy puiden ympäriltä, ja mustat kuuset saavat vihdoin valoa.</p>
            <p className="victory-text">Olet selvinnyt läpi mustan veden, ruttohautojen ja synkimmän sydänmetsän.</p>
            <p className="victory-text">Uljas {activeSession?.characterType || 'seikkailija'} muistetaan ikuisesti sankarina, joka toi auringon takaisin.</p>

           <div className="victory-music-credits">
              <p className="victory-music-credits-title">Musiikki ja äänitehosteet</p>

              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Fantasy Cinematic Background – Epic Journey"</span>
                <span className="victory-music-credit-source">OpenMindAudio</span>
              </p>
              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Rise Of The Zombies"</span>
                <span className="victory-music-credit-source">Emmraan</span>
              </p>
              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Horror Horror"</span>
                <span className="victory-music-credit-source">everything_is_dead</span>
              </p>
              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Scary - Horror"</span>
                <span className="victory-music-credit-source">everything_is_dead</span>
              </p>
              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Elemental Magic Spell Impact Outgoing"</span>
                <span className="victory-music-credit-source">RescopicSound</span>
              </p>
              <p className="victory-music-credit">
                <span className="victory-music-credit-name">"Riser (7)"</span>
                <span className="victory-music-credit-source">u_1pruylktlg</span>
              </p>

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

        {/* NAPPI ON TÄYSIN ERILLÄÄN IKKUNASTA, EI LIUKU EIKÄ PEITY */}
        <button className="victory-exit-btn" onClick={handleLogout}>
          Palaa alkuun & Kirjaudu ulos 🚪
        </button>

      </div>
    </div>
  );
}