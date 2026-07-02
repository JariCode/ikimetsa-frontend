import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [characterClasses, setCharacterClasses] = useState([]); 
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState('');
  
  // Taistelun ja noppien tilat
  const [combatLogs, setCombatLogs] = useState([]);
  const [monsterHp, setMonsterHp] = useState(25);
  const [isShaking, setIsShaking] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  
  // 🎲 Aloitteen ja aidon vuoroperäisyyden tilat
  const [combatInitiative, setCombatInitiative] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);

  const testUserId = "660d1a2b3c456e687a9b7c0d"; 

  // Haetaan hahmoluokat aidosti backendistä
  useEffect(() => {
    if (gameStarted && characterClasses.length === 0) {
      fetch(`${import.meta.env.VITE_API_URL}/api/game/classes`)
        .then(res => {
          if (!res.ok) throw new Error('Hahmoluokkien haku epäonnistui palvelimelta.');
          return res.json();
        })
        .then(data => setCharacterClasses(data))
        .catch(err => setError(err.message));
    }
  }, [gameStarted]);

  // Hahmon valinta aidolla backend-kutsulla
  const selectCharacter = async (className) => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, characterClassName: className })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Hahmon valinta epäonnistui palvelimella.');
      setActiveSession(data);
      setCombatInitiative(null);
      setCurrentTurn(null);
      setMonsterHp(25);
      setCombatLogs([]);
    } catch (err) { 
      setError(err.message);
    }
  };

  // 🔧 Aseen korjausfunktio backend-yhteydellä
  const handleRepairWeapon = async () => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/repair-weapon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Korjaus epäonnistui.');
      
      setActiveSession(data.session);
    } catch (err) {
      setError(err.message);
    }
  };

  // Taisteluvuoro aidolla backend-kutsulla ja aidolla vuoroperäisellä draamalla
  const handleCombatTurn = async () => {
    if (isRolling || monsterHp <= 0) return;

    setIsRolling(true);
    setDiceResult(null);
    setCombatLogs([]); 

    // 🎲 Noppa pyörii visuaalisesti frontissa odottaessaan backendin vastausta
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 20) + 1);
    }, 60);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/combat/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: testUserId, 
          action: 'hyokkaa', 
          currentMonsterHp: monsterHp,
          hasInitiative: combatInitiative,
          currentTurn: currentTurn
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Taisteluvuoro epäonnistui.');

      // Lukitaan uudet vuorotiedot taustalle talteen välittömästi ennen animaatiota
      setCombatInitiative(data.initiativeWinner);
      setCurrentTurn(data.nextTurn);
      const nextMonsterHp = data.monsterHp;

      // Odotetaan 1 sekunti jotta pyörintä tuntuu hyvältä
      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);

        // Lukitaan nopanheiton aito tulos (jos oli jokin noppaheitto lokissa)
        const foundRoll = data.combatLog.find(l => l.includes('Heitit') || l.includes('heittää'))?.match(/\d+/)?.[0];
        setDiceResult(foundRoll ? parseInt(foundRoll) : 12);

        // Päivitetään lokilaatikkoon tasan tämän vuoron tapahtumat
        setCombatLogs(data.combatLog);
        
        // Päivitetään elämäpisteet
        setMonsterHp(nextMonsterHp);

        // Ruudun tärähdys osumista
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        // Päivitetään pelaajan HP, aseen kunto sekä kertyneet pisteet
        setActiveSession(prev => ({
          ...prev,
          repairPoints: data.repairPoints !== undefined ? data.repairPoints : prev.repairPoints,
          stats: { ...prev.stats, hp: data.playerHp },
          inventory: [{ ...prev.inventory[0], durability: data.weaponDurability }]
        }));

        // Jos hirviö kuoli, nollataan vuorot seuraavaa matsia varten
        if (nextMonsterHp <= 0) {
          setCombatInitiative(null);
          setCurrentTurn(null);
        }

      }, 1000);

    } catch (err) { 
      clearInterval(interval);
      setIsRolling(false);
      setError('Yhteys palvelimeen katkesi kesken taistelun.');
      console.error(err);
    }
  };

  return (
    <div className={`game-container ${isShaking ? 'screen-hit-shake' : ''}`}>
      
      {/* 🌙 PUHDAS TAUSTA */}
      <div className="dark-forest-bg">
        <div className="blood-moon"></div>
        <div className="fog-layer layer-1"></div>
        <div className="fog-layer layer-2"></div>
      </div>

      {/* YLEINEN VIRHETEKSTI */}
      {error && <div className="global-error-popup">⚠️ {error}</div>}

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
          <h2 className="section-title">Valitse Selviytyjä</h2>
          
          <div className="character-cards">
            {characterClasses.map((char) => (
              <div key={char._id} className="char-card" onClick={() => selectCharacter(char.name)}>
                <div className="char-portrait-placeholder">
                  {char.name === 'Metsästäjä' ? '🏹' : '🔧'}
                </div>
                <h3>{char.name}</h3>
                <p className="char-desc">{char.description}</p>
                <ul className="char-stats">
                  <li><strong>Elämä:</strong> {char.baseHp} HP</li>
                  <li><strong>Aloitusase:</strong> {char.startingWeapon?.name}</li>
                  <li><strong>Aloitebonus:</strong> +{char.initiativeBonus}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VAIHE 3: PELIRUUTU */}
      {activeSession && (
        <div className="game-play-screen">
          <div className="player-status-bar">
            <div className="status-item"><span>Hahmo:</span> <strong>{activeSession.characterType}</strong></div>
            <div className="status-item"><span>Kunto:</span> <strong className={activeSession.stats.hp < 15 ? 'low-hp' : ''}>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong></div>
            <div className="status-item">
              <span>Ase:</span> <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability})</strong>
              {activeSession.inventory[0]?.durability < activeSession.inventory[0]?.maxDurability && (activeSession.repairPoints >= 2) && (
                <button className="repair-mini-btn" onClick={handleRepairWeapon}>
                  🔧 Korjaa (2pts)
                </button>
              )}
            </div>
            <div className="status-item"><span>Pisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong></div>
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

            {/* 🎲 VISUAALINEN NOPPA */}
            {diceResult !== null && (
              <div className="dice-row">
                <div className={`d20-visual-dice ${isRolling ? 'spinning' : 'stopped'}`}>
                  <span>{diceResult}</span>
                </div>
              </div>
            )}

            <div className="log-box">
              {combatLogs.length === 0 ? (
                <p className="story-text-small">Polku katkeaa edessäsi risteyskohtaan. Puista kuuluu outoa korahtelua...</p>
              ) : (
                combatLogs.map((log, index) => <p key={index} className="log-line">{log}</p>)
              )}
            </div>

            {monsterHp > 0 && activeSession.stats.hp > 0 && (
              <div className="action-buttons">
                <button className="attack-btn" onClick={handleCombatTurn} disabled={isRolling}>
                  {isRolling ? 'Heitetään...' : 
                   !combatInitiative ? 'Määritä aloite ja aloita taistelu' : 
                   currentTurn === 'pelaaja' ? 'Sinun vuorosi: Hyökkää!' : 'Hirviön vuoro: Odota iskua...'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}