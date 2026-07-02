import React from 'react';
import { useEffect, useState, useRef } from 'react'; 
import './MonsterStyles.css'; // 🌟 Tuodaan monsterin tyylit erillisestä CSS-tiedostosta

export default function GamePlay({
  activeSession,
  monsterHp,
  diceResult,
  isRolling,
  combatLogs,
  combatInitiative,
  currentTurn,
  handleRepairWeapon,
  handleCombatTurn
}) {
  const [showMonsterReveal, setShowMonsterReveal] = useState(false);
  const logEndRef = useRef(null); // 🌟 Luodaan ankkuri lokilaatikon pohjalle

  // Näytä paljastusanimaatio vain kun TÄTÄ nimenomaista hirviötä ei ole vielä
  // paljastettu tässä selainistunnossa - ei siis enää joka sivun päivityksellä.
  // Kun peliin lisätään liikkuminen/tarina, uusi hirviö saa oman nimen/luokan,
  // jolloin animaatio käynnistyy taas normaalisti.
  useEffect(() => {
    const monsterKey = activeSession?.currentMonsterName || 'Varjohahmo';
    const alreadyRevealed = sessionStorage.getItem('ikimetsa_revealed_monster');

    if (alreadyRevealed === monsterKey) {
      setShowMonsterReveal(false);
      return;
    }

    setShowMonsterReveal(true);
    sessionStorage.setItem('ikimetsa_revealed_monster', monsterKey);
    const revealTimer = setTimeout(() => setShowMonsterReveal(false), 2550);

    return () => clearTimeout(revealTimer);
  }, [activeSession?.currentMonsterName, activeSession?.currentMonsterCssClass]);

  // 🌟 Automaattinen skrollaus: aina kun uusia lokeja tulee, hypätään pehmeästi pohjaan
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs]);

  const monsterName = activeSession.currentMonsterName || 'Varjohahmo';
  const monsterCssClass = activeSession.currentMonsterCssClass || 'varjohahmo';
  const monsterRevealClass = `${monsterCssClass}-scare`;
  const monsterCardClass = `${monsterCssClass}-card`;

  return (
    <div className="game-play-screen">
      {showMonsterReveal && (
        <div className={`jumpscare-overlay ${monsterRevealClass}`}>
          <div className={`monster-reveal-card ${monsterCardClass}`}>
            <div className="monster-jumpscare-face" aria-hidden="true">
              <div className="monster-eye eye-left"></div>
              <div className="monster-eye eye-right"></div>
              <div className="monster-mouth"></div>
              <div className="monster-brow brow-left"></div>
              <div className="monster-brow brow-right"></div>
              <div className="monster-drip drip-1"></div>
              <div className="monster-drip drip-2"></div>
              <div className="monster-drip drip-3"></div>
            </div>
          </div>
        </div>
      )}

      {/* YLÄPALKKI */}
      <div className="player-status-bar">
        <div className="status-item">
          <span>Hahmo:</span> <strong>{activeSession.characterType} (Taso {activeSession.stats.level || 1})</strong>
        </div>
        <div className="status-item">
          <span>Kunto:</span> <strong className={activeSession.stats.hp < 15 ? 'low-hp' : ''}>{activeSession.stats.hp} / {activeSession.stats.maxHp} HP</strong>
        </div>
        <div className="status-item">
          <span>Kokemus:</span> <strong>{activeSession.stats.xp || 0} / {(activeSession.stats.level || 1) * 100} XP</strong>
        </div>
        <div className="status-item">
          <span>Ase:</span> <strong>{activeSession.inventory[0]?.name} ({activeSession.inventory[0]?.durability}/{activeSession.inventory[0]?.maxDurability})</strong>
          {activeSession.inventory[0]?.durability < activeSession.inventory[0]?.maxDurability && (activeSession.repairPoints >= 2) && (
            <button className="repair-mini-btn" onClick={handleRepairWeapon}>
              🔧 Korjaa (2pts)
            </button>
          )}
        </div>
        {/* 🌟 PÄIVITETTY: "Pisteet" on nyt "Korjauspisteet" */}
        <div className="status-item"><span>Korjauspisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong></div>
      </div>

      <div className="combat-arena">
        {monsterHp > 0 ? (
          <div className={`monster-box monster-box-${monsterCssClass}`}>
            <h3 className="monster-title">Vastustaja: {monsterName} (Taso {activeSession.currentMonsterLevel || 1})</h3>
            <p>Hirviön kunto: <strong>{monsterHp} HP</strong></p>
          </div>
        ) : (
          <div className={`monster-box dead monster-box-${monsterCssClass}`}>
            <h3>{monsterName} on voitettu!</h3>
          </div>
        )}

        {diceResult !== null && (
          <div className="dice-row">
            <div className={`d20-visual-dice ${isRolling ? 'spinning' : 'stopped'}`}>
              <span>{diceResult}</span>
            </div>
          </div>
        )}

        {/* TAPAHTUMALOKI */}
        <div className="log-box">
          {combatLogs.length === 0 && !isRolling ? (
            <p className="story-text-small">Polku katkeaa edessäsi risteyskohtaan. Puista kuuluu outoa korahtelua...</p>
          ) : (
            combatLogs.map((log, index) => <p key={index} className="log-line">{log}</p>)
          )}
          {/* 🌟 TÄMÄ ANKKURI VETÄÄ SKROLLAUKSEN AINA TÄHÄN ALAREUNAAN */}
          <div ref={logEndRef} />
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
  );
}