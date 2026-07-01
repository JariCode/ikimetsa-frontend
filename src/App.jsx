import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');

  // Väliaikainen testi-id ennen kuin kirjautuminen liitetään tähän
  const testUserId = "660d1a2b3c4d5e6f7a8b9c0d"; 

  const selectCharacter = async (type) => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/start-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      userId: testUserId,
      characterType: type
    })
  });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Hahmon valinta epäonnistui');
      }

      // Tallennetaan saatu pelitila Reactin muistiin
      setActiveSession(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="game-container">
      <div className="fog-overlay"></div>

      {/* VAIHE 1: ALKURUUTU */}
      {!gameStarted && !activeSession && (
        <div className="intro-screen">
          <h1 className="game-title">IKIMETSÄ</h1>
          <p className="intro-text animate-text-1">Musta sumu nieli kaiken takanasi...</p>
          <p className="intro-text animate-text-2">Ainoa pakotie on edessäsi häämöttävä synkkä korpi.</p>
          <p className="intro-text animate-text-3">Metsä odottaa. Astutko sisään?</p>
          
          <button className="start-btn" onClick={() => setGameStarted(true)}>
            Astu Ikimetsään
          </button>
        </div>
      )}

      {/* VAIHE 2: HAHMON VALINTA */}
      {gameStarted && !activeSession && (
        <div className="character-selection-screen">
          <h2>Valitse Selviytyjä</h2>
          {error && <p className="error-text">{error}</p>}
          
          <div className="character-cards">
            {/* Kortti 1: Metsästäjä */}
            <div className="char-card" onClick={() => selectCharacter('Metsästäjä')}>
              <h3>Metsästäjä</h3>
              <p className="char-desc">Tuntee metsän polut ja liikkuu varjoissa nopeasti.</p>
              <ul className="char-stats">
                <li>Elämä: 40 HP</li>
                <li>Aloitusase: Vanha puukko</li>
                <li>Etu: Korkea ketteryys taisteluissa</li>
              </ul>
            </div>

            {/* Kortti 2: Mekaanikko */}
            <div className="char-card" onClick={() => selectCharacter('Mekaanikko')}>
              <h3>Mekaanikko</h3>
              <p className="char-desc">Kaupunkiolento, jolla on mukanaan raskaat työkalut.</p>
              <ul className="char-stats">
                <li>Elämä: 55 HP</li>
                <li>Aloitusase: Raskas jakoavain</li>
                <li>Etu: Osaa korjata rikkinäisiä aseita halvemmalla</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VAIHE 3: ITSE PELI ALKAA */}
      {activeSession && (
        <div className="game-play-screen">
          <h2>Olet astunut Ikimetsään</h2>
          <div className="player-status-bar">
            <p>Hahmo: <strong>{activeSession.characterType}</strong></p>
            <p>Kunto: <strong>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong></p>
            <p>Ase: <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability})</strong></p>
          </div>
          <p className="story-text">Polku katkeaa edessäsi risteyskohtaan. Puista kuuluu outoa korahtelua...</p>
          {/* Tähän rakennetaan seuraavassa vaiheessa liikkuminen ja taistelunapit */}
        </div>
      )}
    </div>
  );
}