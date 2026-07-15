import React, { useEffect } from 'react';
import introMusic from '../assets/audio/music/everything_is_dead-horror-horror-558813.mp3';

// Pidempi tarina. Rivit rullaavat intro-scroll-windowin sisällä,
// joka näyttää aina vain kolme riviä kerrallaan - vanhat rivit
// katoavat ylös ja uudet ilmestyvät alhaalta, kuten lopputekstit.
const STORY_LINES = [
  'Kaikki alkoi, kun Kirottujen Velho nousi valtaan pimeydessä.',
  'Hän kadehti elävien valoa ja himoitsi ikuista elämää.',
  'Sielu kerrallaan hän kirosi maan ja kutsui pimeän esiin.',
  'Viime yönä kotikyläsi paloi purppuraisessa loitsutulessa.',
  'Savu peitti taivaan, huudot hukkuivat liekkeihin.',
  'Velhon varjopalvojat ajoivat sinut kohti synkkää rajaa.',
  'Juoksit etkä uskaltanut katsoa taaksesi.',
  'Jäljellä oli enää paikka, jonne kukaan ei mene vapaaehtoisesti.',
  'Ikimetsä, metsä jonka Velho itse on kironnut.',
  'Sen puut vaistoavat lihan ja veren tuoksun.',
  'Varjoissa liikkuu jotain, mikä ei ole enää elossa.',
  'Eikä silti täysin kuollutkaan.',
  'Astuit sisään, ja portti sulkeutui takanasi.',
  'Nyt ainoa tie on läpi mätänevän pimeyden.',
  'Mutta jos selviät, löydät Velhon syvimmästä onkalosta.',
  'Ja silloin, vasta silloin, saat vihdoin kostaa.',
  'Vedä henkeä, kuuntele metsän kuiskausta...',
];

export default function IntroScreen({ hasSavedSession, onStart }) {
  // 🎵 Intro-musiikki alkaa heti kun IntroScreen aukeaa
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(audioContext.destination);

    let source;
    let cancelled = false;

    fetch(introMusic)
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

      // Suljetaan AudioContext ja lopetetaan musiikki sulavasti
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
    <>
      {/* 🔥 Purppurainen loitsutuli nousee hitaasti tarinan taustalle. */}
      <div className="spell-fire-bg" aria-hidden="true">
        <div className="spell-fire-glow"></div>
        <div className="spell-flame sf1"></div>
        <div className="spell-flame sf2"></div>
        <div className="spell-flame sf3"></div>
        <div className="spell-flame sf4"></div>
        <div className="spell-flame sf5"></div>
        <div className="spell-ember se1"></div>
        <div className="spell-ember se2"></div>
        <div className="spell-ember se3"></div>
        <div className="spell-ember se4"></div>
        <div className="spell-ember se5"></div>
        <div className="spell-ember se6"></div>
      </div>

      <div className="intro-screen">
        <h1 className="game-title">IKIMETSÄ</h1>

      {hasSavedSession ? (
        // Jatkava pelaaja: ei pitkää tarinaa uudelleen, vain lyhyt tervehdys
        <p className="intro-welcome-back">
          Metsä muistaa askeleesi. Taipaleesi jatkuu siitä, mihin se jäi.
        </p>
      ) : (
        // Uusi pelaaja: koko tarina rullaa 3 rivin ikkunassa
        <div className="intro-scroll-window">
          <div className="intro-scroll-content">
            {STORY_LINES.map((line, index) => (
              <p key={index} className="intro-text">{line}</p>
            ))}
          </div>
        </div>
      )}

      <button
        className={hasSavedSession ? 'start-btn start-btn-continue' : 'start-btn start-btn-story'}
        onClick={onStart}
      >
       {hasSavedSession ? 'Jatka taivalta' : 'Aloita Taival'}
      </button>
      </div>
    </>
  );
}