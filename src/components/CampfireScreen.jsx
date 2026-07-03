import React from 'react';

// Voiton jälkeinen leirinuotioruutu - hahmo lepää, korjaa aseensa ja jatkaa matkaa.
// Sama rullaava tarinatyyli kuin IntroScreenissä ja MovementScreenin alkutarinassa.
export default function CampfireScreen({ onContinue }) {
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