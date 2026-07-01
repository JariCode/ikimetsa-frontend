import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [characterClasses, setCharacterClasses] = useState([]); // Tietokannan hahmoluokat
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');
  
  // Taistelun tilat
  const [combatLogs, setCombatLogs] = useState([]);
  const [monsterHp, setMonsterHp] = useState(25);
  const [isShaking, setIsShaking] = useState(false);

  // Väliaikainen testi-id ennen kuin kirjautuminen liitetään tähän
  const testUserId = "660d1a2b3c4d5e687a8b790d"; 

  // Haetaan hahmoluokat tietokannasta, kun pelaaja painaa "Astu Ikimetsään"
  useEffect(() => {
    if (gameStarted && characterClasses.length === 0) {
      fetch(`${import.meta.env.VITE_API_URL}/api/game/classes`)
        .then(res => {
          if (!res.ok) throw new Error('Yhteys palvelimeen epäonnistui');
          return res.json();
        })
        .then(data => setCharacterClasses(data))
        .catch(err => setError('Hahmoluokkien haku tietokannasta epäonnistui.'));
    }
  }, [gameStarted]);

  // Hahmon valinta ja pelitilan luonti tietokantaan
  const selectCharacter = async (className) => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: testUserId, 
          characterClassName: className
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Hahmon valinta epäonnistui');
      
      setActiveSession(data);
    } catch (err) { 
      setError(err.message); 
    }
  };

  // Taisteluvuoron suorittaminen nopanheitolla
  const handleCombatTurn = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/combat/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: testUserId, 
          action: 'hyokkaa',
          currentMonsterHp: monsterHp
        })
      });
      const data = await response.json();

      setCombatLogs(data.combatLog);
      setMonsterHp(data.monsterHp);
      
      setActiveSession(prev => ({
        ...prev,
        stats: { ...prev.stats, hp: data.playerHp },
        inventory: [{ ...prev.inventory[0], durability: data.weaponDurability }]
      }));

      // Laukaistaan ruudun tärähdys osumasta
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    } catch (err) { 
      console.error('Virhe taistelussa:', err); 
    }
  };

  return (
    <div className={`game-container ${isShaking ? 'screen-hit-shake' : ''}`}>
      <div className="fog-overlay"></div>

      {/* VAIHE 1: ALKURUUTU ANIMAATIOILLA */}
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
            {characterClasses.map((char) => (
              <div key={char._id} className="char-card" onClick={() => selectCharacter(char.name)}>
                <h3>{char.name}</h3>
                <p className="char-desc">{char.description}</p>
                <ul className="char-stats">
                  <li>Elämä: {char.baseHp} HP</li>
                  <li>Aloitusase: {char.startingWeapon?.name}</li>
                  <li>Aloitebonus: +{char.initiativeBonus}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VAIHE 3: PELIRUUTU JA TAISTELUAREENA */}
      {activeSession && (
        <div className="game-play-screen">
          <div className="player-status-bar">
            <div className="status-item">
              <span>Hahmo:</span> <strong>{activeSession.characterType}</strong>
            </div>
            <div className="status-item">
              <span>Kunto:</span> <strong className={activeSession.stats.hp < 15 ? 'low-hp' : ''}>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong>
            </div>
            <div className="status-item">
              <span>Ase:</span> <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability} Kestävyys)</strong>
            </div>
          </div>

          <div className="combat-arena">
            {monsterHp > 0 ? (
              <div className="monster-box">
                <h3 className="monster-title">Vastustaja: Varjohahmo</h3>
                <p>Hirviön kunto: <strong>{monsterHp} HP</strong></p>
              </div>
            ) : (
              <div className="monster-box dead">
                <h3>Varjohahmo on voitettu!</h3>
              </div>
            )}

            <div className="log-box">
              {combatLogs.length === 0 ? (
                <p className="story-text-small">Polku katkeaa edessäsi risteyskohtaan. Puista kuuluu outoa korahtelua...</p>
              ) : (
                combatLogs.map((log, index) => (
                  <p key={index} className="log-line">{log}</p>
                ))
              )}
            </div>

            {monsterHp > 0 && activeSession.stats.hp > 0 && (
              <div className="action-buttons">
                <button className="attack-btn" onClick={handleCombatTurn}>Nosta ase ja Hyökkää</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}