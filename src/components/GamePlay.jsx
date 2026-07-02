import React from 'react';

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
  return (
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

        {diceResult !== null && (
          <div className="dice-row">
            <div className={`d20-visual-dice ${isRolling ? 'spinning' : 'stopped'}`}>
              <span>{diceResult}</span>
            </div>
          </div>
        )}

        <div className="log-box">
          {combatLogs.length === 0 && !isRolling ? (
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
  );
}