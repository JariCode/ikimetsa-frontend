import React from 'react';

// Kuoleman jälkeinen hautakiviruutu - hahmo on kaatunut, palataan viimeisimpään tallennuspisteeseen.
// Sama rullaava tarinatyyli kuin IntroScreenissä ja MovementScreenin alkutarinassa.
export default function GraveScreen({ activeSession, onContinue }) {
  const checkpoint = activeSession?.checkpoint || { xp: 0, level: 1 };

  return (
    <div className="grave-screen">
      <h1 className="game-title grave-title">IKIMETSÄ</h1>
      <h2 className="grave-subtitle intro-welcome-back">Olet kaatunut! Yritä uudelleen.</h2>

      <div className="grave-visual" aria-hidden="true">
        <div className="grave-mist"></div>
        <div className="grave-mound"></div>
        <div className="gravestone"></div>
      </div>

      <div className="intro-scroll-window grave-scroll-window">
        <div className="intro-scroll-content grave-scroll-content">
          <p className="intro-text">Olet kaatunut Ikimetsän pimeyteen...</p>
          <p className="intro-text">Pimeys nieli sinut ennen kuin ehdit väistää.</p>
          <p className="intro-text">Mutta Ikimetsä ei päästä saalistaan niin helposti.</p>
          <p className="intro-text">Sielusi herää uudelleen tallennuspisteeltä.</p>
          <p className="intro-text">{`Taipaleesi jatkuu tasolta ${checkpoint.level} (${checkpoint.xp} XP).`}</p>
          <p className="intro-text">Kaikki tämän jälkeen kertynyt on kadonnut pimeyteen.</p>
        </div>
      </div>

      <div className="action-buttons">
        <button className="attack-btn grave-btn" onClick={onContinue}>
          Nouse haudastasi
        </button>
      </div>
    </div>
  );
}