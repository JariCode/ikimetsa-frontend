import React from 'react';
import { useEffect, useState } from 'react'; 
import './MonsterStyles.css';
import GameLogComponent from './GameLogComponent';

export default function GamePlay({
  activeSession,
  monsterHp,
  diceResult,
  isRolling,
  gameLogs,
  onAddLog,
  combatInitiative,
  currentTurn,
  handleRepairWeapon,
  handleCombatTurn
}) {
  const [showMonsterReveal, setShowMonsterReveal] = useState(false);

  useEffect(() => {
    if (monsterHp <= 0) {
      setShowMonsterReveal(false);
      return;
    }

    // 🛡️ TARKISTUS: sama per-hirviö sessionStorage-periaate kuin veriroiskeessa/kuolemaefektissä.
    // gameLogs ei enää käy tähän, koska se on jaettu koko pelin läpi eikä nollaudu taistelun alkaessa.
    const monsterKey = activeSession?.currentMonsterName || 'Varjohahmo';
    const alreadyShown = sessionStorage.getItem('ikimetsa_monster_reveal_shown');
    if (alreadyShown === monsterKey || combatInitiative) {
      setShowMonsterReveal(false);
      return;
    }

    setShowMonsterReveal(true);
    sessionStorage.setItem('ikimetsa_monster_reveal_shown', monsterKey);
    const revealTimer = setTimeout(() => setShowMonsterReveal(false), 2550);

    return () => clearTimeout(revealTimer);
  }, [activeSession?.currentMonsterName]);

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
        <div className="status-item"><span>Korjauspisteet:</span> <strong>{activeSession.repairPoints || 0} Pts</strong></div>
      </div>

      <div className="combat-arena">
        <div className={`monster-box monster-box-${monsterCssClass}`}>
          <h3 className="monster-title">Vastustaja: {monsterName} (Taso {activeSession.currentMonsterLevel || 1})</h3>
          <p>Hirviön kunto: <strong>{monsterHp} HP</strong></p>
        </div>

        {diceResult !== null && (
          <div className="dice-row">
            <div className={`d20-visual-dice ${isRolling ? 'spinning' : 'stopped'}`}>
              <span>{diceResult}</span>
            </div>
          </div>
        )}

        {/* JAETTU TAPAHTUMALOKI LAATIKKO */}
        <GameLogComponent logs={gameLogs} />

        <div className="action-buttons">
          <button className="attack-btn" onClick={handleCombatTurn} disabled={isRolling}>
            {isRolling ? 'Heitetään...' : 
             !combatInitiative ? 'Määritä aloite ja aloita taistelu' : 
             currentTurn === 'pelaaja' ? 'Sinun vuorosi: Hyökkää!' : 'Hirviön vuoro: Odota iskua...'}
          </button>
        </div>
      </div>
    </div>
  );
}